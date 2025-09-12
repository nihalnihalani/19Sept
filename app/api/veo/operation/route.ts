import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = body.name as string | undefined;

    if (!name) {
      return NextResponse.json(
        { error: "Missing operation name" },
        { status: 400 }
      );
    }

    // Some SDK versions accept just the name, others expect an operation object.
    // We'll pass the minimal required shape with a name.
    const fresh = await ai.operations.getVideosOperation({
      operation: { name } as unknown as never,
    });

    // Collect any URIs in the payload to simplify client handling
    function collectUris(obj: any, acc: string[] = []): string[] {
      if (!obj) return acc;
      if (typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj)) {
          if (k.toLowerCase() === 'uri' && typeof v === 'string') {
            acc.push(v);
          } else if (typeof v === 'object') {
            collectUris(v as any, acc);
          }
        }
      } else if (Array.isArray(obj)) {
        for (const v of obj) collectUris(v as any, acc);
      }
      return acc;
    }

    const uris = collectUris(fresh);
    return NextResponse.json({ ...fresh, uris });
  } catch (error) {
    console.error("Error polling operation:", error);
    return NextResponse.json(
      { error: "Failed to poll operation" },
      { status: 500 }
    );
  }
}
