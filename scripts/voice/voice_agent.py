import os
import asyncio
import base64
import io
import traceback
import json
from typing import Any, Dict

import cv2
import pyaudio
import PIL.Image
import mss

import argparse

from google import genai
from google.genai import types

FORMAT = pyaudio.paInt16
CHANNELS = 1
SEND_SAMPLE_RATE = 16000
RECEIVE_SAMPLE_RATE = 24000
CHUNK_SIZE = 1024

MODEL = "models/gemini-2.5-flash-preview-native-audio-dialog"

DEFAULT_MODE = "camera"

BASE_URL = os.environ.get("NEXT_PUBLIC_BASE_URL", "http://localhost:3000")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

client = genai.Client(
    http_options={"api_version": "v1beta"},
    api_key=GEMINI_API_KEY,
)

# Tools (kept as provided; only one wired into app for now)

tools = [
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="regenerate_image_for_demographic",
                description="Generate or re-generate the image for a specific demographic using the composed prompt.",
                parameters={
                    "type": "object",
                    "properties": {
                        "demographic": {
                            "type": "string",
                            "description": "The target demographic (e.g., 'young adults', 'elderly', 'children', 'professionals')",
                            "enum": [
                                "children",
                                "teenagers",
                                "young_adults",
                                "middle_aged",
                                "elderly",
                                "professionals",
                                "students",
                            ],
                        },
                        "prompt": {
                            "type": "string",
                            "description": "The base prompt to use for image generation",
                        },
                        "style": {
                            "type": "string",
                            "description": "The style of image to generate",
                            "enum": [
                                "realistic",
                                "cartoon",
                                "artistic",
                                "professional",
                                "casual",
                            ],
                        },
                        "context": {
                            "type": "string",
                            "description": "Additional context about the image purpose (e.g., 'marketing', 'educational', 'social media')",
                        },
                    },
                    "required": ["demographic", "prompt"],
                },
            ),
            # Other functions intentionally left unchanged for minimal edits
        ]
    ),
]

CONFIG = types.LiveConnectConfig(
    response_modalities=["AUDIO"],
    media_resolution="MEDIA_RESOLUTION_MEDIUM",
    speech_config=types.SpeechConfig(
        voice_config=types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Zephyr")
        )
    ),
    context_window_compression=types.ContextWindowCompressionConfig(
        trigger_tokens=25600,
        sliding_window=types.SlidingWindow(target_tokens=12800),
    ),
    tools=tools,
)

pya = pyaudio.PyAudio()


async def post_json(path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    import aiohttp

    url = f"{BASE_URL}{path}"
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload) as resp:
            try:
                data = await resp.json()
            except Exception:
                text = await resp.text()
                data = {"status": resp.status, "text": text}
            return data


async def handle_tool_call(name: str, args: Dict[str, Any], session_id: str) -> Dict[str, Any]:
    """Map tool calls from Gemini to our Next.js APIs. Return a small JSON back to the model."""
    if name == "regenerate_image_for_demographic":
        # Map to voice run of a single demographic item. We let the server orchestrate image gen.
        demographic_title = str(args.get("demographic") or "demographic").replace("_", " ")
        description_parts = []
        if args.get("prompt"):
            description_parts.append(str(args["prompt"]))
        if args.get("style"):
            description_parts.append(f"style: {args['style']}")
        if args.get("context"):
            description_parts.append(f"context: {args['context']}")
        description = "; ".join(description_parts) if description_parts else None

        payload = {
            "session": session_id,
            "demographics": [
                {
                    "title": demographic_title.title(),
                    "description": description,
                }
            ],
        }
        result = await post_json("/api/voice/run", payload)
        return {"ok": True, "called": name, "result": result}

    # Default: return no-op
    return {"ok": False, "called": name, "error": "Unsupported tool"}


class AudioLoop:
    def __init__(self, video_mode=DEFAULT_MODE):
        self.video_mode = video_mode

        self.audio_in_queue = None
        self.out_queue = None

        self.session = None

        self.send_text_task = None
        self.receive_audio_task = None
        self.play_audio_task = None

        self.session_id = f"voice_{os.getpid()}"

    async def send_text(self):
        while True:
            text = await asyncio.to_thread(
                input,
                "message > ",
            )
            if text.lower() == "q":
                break
            await self.session.send(input=text or ".", end_of_turn=True)

    def _get_frame(self, cap):
        ret, frame = cap.read()
        if not ret:
            return None
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = PIL.Image.fromarray(frame_rgb)
        img.thumbnail([1024, 1024])

        image_io = io.BytesIO()
        img.save(image_io, format="jpeg")
        image_io.seek(0)

        mime_type = "image/jpeg"
        image_bytes = image_io.read()
        return {"mime_type": mime_type, "data": base64.b64encode(image_bytes).decode()}

    async def get_frames(self):
        cap = await asyncio.to_thread(cv2.VideoCapture, 0)

        while True:
            frame = await asyncio.to_thread(self._get_frame, cap)
            if frame is None:
                break

            await asyncio.sleep(1.0)

            await self.out_queue.put(frame)

        cap.release()

    def _get_screen(self):
        sct = mss.mss()
        monitor = sct.monitors[0]

        i = sct.grab(monitor)

        mime_type = "image/jpeg"
        image_bytes = mss.tools.to_png(i.rgb, i.size)
        img = PIL.Image.open(io.BytesIO(image_bytes))

        image_io = io.BytesIO()
        img.save(image_io, format="jpeg")
        image_io.seek(0)

        image_bytes = image_io.read()
        return {"mime_type": mime_type, "data": base64.b64encode(image_bytes).decode()}

    async def get_screen(self):
        while True:
            frame = await asyncio.to_thread(self._get_screen)
            if frame is None:
                break

            await asyncio.sleep(1.0)

            await self.out_queue.put(frame)

    async def send_realtime(self):
        while True:
            msg = await self.out_queue.get()
            await self.session.send(input=msg)

    async def listen_audio(self):
        mic_info = pya.get_default_input_device_info()
        self.audio_stream = await asyncio.to_thread(
            pya.open,
            format=FORMAT,
            channels=CHANNELS,
            rate=SEND_SAMPLE_RATE,
            input=True,
            input_device_index=mic_info["index"],
            frames_per_buffer=CHUNK_SIZE,
        )
        if __debug__:
            kwargs = {"exception_on_overflow": False}
        else:
            kwargs = {}
        while True:
            data = await asyncio.to_thread(self.audio_stream.read, CHUNK_SIZE, **kwargs)
            await self.out_queue.put({"data": data, "mime_type": "audio/pcm"})

    async def receive_audio(self):
        "Background task to read from the websocket and handle model outputs including tool calls"
        while True:
            turn = self.session.receive()
            async for response in turn:
                # Tool/function calls
                if getattr(response, "function_call", None):
                    try:
                        fn = response.function_call
                        name = fn.name
                        args = fn.args if isinstance(fn.args, dict) else json.loads(fn.args or "{}")
                        result = await handle_tool_call(name, args, self.session_id)
                        await self.session.send(function_call=types.FunctionResponse(name=name, response=result))
                    except Exception as e:
                        print("[tool-error]", e)
                        continue

                # Audio data
                if data := getattr(response, "data", None):
                    self.audio_in_queue.put_nowait(data)
                    continue
                # Text output
                if text := getattr(response, "text", None):
                    print(text, end="")

            # If interrupted, clear pending audio
            while not self.audio_in_queue.empty():
                self.audio_in_queue.get_nowait()

    async def play_audio(self):
        stream = await asyncio.to_thread(
            pya.open,
            format=FORMAT,
            channels=CHANNELS,
            rate=RECEIVE_SAMPLE_RATE,
            output=True,
        )
        while True:
            bytestream = await self.audio_in_queue.get()
            await asyncio.to_thread(stream.write, bytestream)

    async def run(self):
        try:
            async with (
                client.aio.live.connect(model=MODEL, config=CONFIG) as session,
                asyncio.TaskGroup() as tg,
            ):
                self.session = session

                self.audio_in_queue = asyncio.Queue()
                self.out_queue = asyncio.Queue(maxsize=5)

                send_text_task = tg.create_task(self.send_text())
                tg.create_task(self.send_realtime())
                tg.create_task(self.listen_audio())
                if self.video_mode == "camera":
                    tg.create_task(self.get_frames())
                elif self.video_mode == "screen":
                    tg.create_task(self.get_screen())

                tg.create_task(self.receive_audio())
                tg.create_task(self.play_audio())

                await send_text_task
                raise asyncio.CancelledError("User requested exit")

        except asyncio.CancelledError:
            pass
        except Exception as EG:
            try:
                self.audio_stream.close()
            except Exception:
                pass
            traceback.print_exception(EG)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--mode",
        type=str,
        default=DEFAULT_MODE,
        help="pixels to stream from",
        choices=["camera", "screen", "none"],
    )
    args = parser.parse_args()
    main = AudioLoop(video_mode=args.mode)
    asyncio.run(main.run())
