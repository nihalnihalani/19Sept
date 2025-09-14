import { NextResponse } from "next/server";
import { getBus } from "@/lib/progress-bus";

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const session = String(body?.session || 'default');
    const message = String(body?.message || '').trim();
    if (!message) {
      return NextResponse.json({ ok: false, error: 'Empty message' }, { status: 400 });
    }
    getBus().publish(session, { text: message, ts: Date.now() });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to push' }, { status: 500 });
  }
}
