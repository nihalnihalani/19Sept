import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { insertMedia } from "@/lib/database";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const uri: string | undefined = body?.uri || body?.file?.uri;
    const save: boolean = Boolean(body?.save);

    if (!uri) {
      return NextResponse.json({ error: "Missing file uri" }, { status: 400 });
    }

    const resp = await fetch(uri, {
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY as string,
        Accept: "*/*",
      },
      redirect: "follow",
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Upstream download failed: ${resp.status} ${resp.statusText}`,
          details: text,
        },
        { status: 502 }
      );
    }

    // If client requested saving, persist to disk and Neo4j, return JSON
    if (save) {
      const arrayBuffer = await resp.arrayBuffer();
      const mimeType = resp.headers.get("content-type") || "video/mp4";
      const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("ogg") ? "ogv" : "mp4";
      const fileName = `generated_video_${Date.now()}.${ext}`;
      const publicPath = path.join(process.cwd(), "public", fileName);
      const buffer = Buffer.from(arrayBuffer);
      await writeFile(publicPath, buffer);

      // Insert metadata into database (best-effort)
      let media: any = null;
      try {
        const id = `media-${Date.now()}`;
        media = await insertMedia({
          id,
          url: `/${fileName}`,
          type: 'video',
          title: "Generated Video",
          description: "Video generated via Veo API",
          size: buffer.length,
          tags: ["video", "generated", "veo"]
        });
      } catch (e) {
        console.error("Failed to insert video media into database:", e);
      }

      return NextResponse.json({
        url: `/${fileName}`,
        mimeType,
        size: buffer.length,
        media,
      });
    }

    // Default: stream the content through
    if (resp.body) {
      return new Response(resp.body, {
        status: 200,
        headers: {
          "Content-Type": resp.headers.get("content-type") || "video/mp4",
          "Content-Disposition": `inline; filename="veo3_video.mp4"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const arrayBuffer = await resp.arrayBuffer();
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": resp.headers.get("content-type") || "video/mp4",
        "Content-Disposition": `inline; filename="veo3_video.mp4"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("Error downloading video:", error);
    return NextResponse.json(
      { error: "Failed to download video" },
      { status: 500 }
    );
  }
}
