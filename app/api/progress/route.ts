import { NextRequest } from "next/server";
import { getBus } from "@/lib/progress-bus";

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const session = searchParams.get('session') || 'default';
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Helper to send SSE event
      const send = (payload: any) => {
        const chunk = `data: ${JSON.stringify(payload)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      // Send initial hello
      send({ text: `SSE connected for session: ${session}` });

      // Subscribe to bus
      const unsubscribe = getBus().subscribe(session, {
        session,
        send: (msg) => send(msg),
      });

      // Heartbeat every 15s to keep connection alive
      const iv = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {}
      }, 15000);

      // Close handling
      const close = () => {
        try { clearInterval(iv); } catch {}
        try { unsubscribe(); } catch {}
        try { controller.close(); } catch {}
      };

      // Abort on client disconnect
      req.signal.addEventListener('abort', () => close());
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
