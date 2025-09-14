import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini"; // supports vision input

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let imageUrl: string | null = null;
    let imageB64: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('image') as File | null;
      if (!file) return NextResponse.json({ error: 'image is required' }, { status: 400 });
      const buf = Buffer.from(await file.arrayBuffer());
      imageB64 = `data:${file.type || 'image/png'};base64,${buf.toString('base64')}`;
    } else {
      const body = await req.json();
      imageUrl = body?.imageUrl || null;
      if (!imageUrl) return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    if (!OPENAI_KEY) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: OPENAI_KEY });

    const messages: any[] = [
      {
        role: 'system',
        content: 'You are a world-class visual analyst. Extract concise, structured insights from images for marketing and cultural targeting.'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this image. Extract subjects, objects, styles, colors, composition, mood, brands/logos (if any), scene, cultural cues, demographic cues, and quality considerations. Return JSON.' },
          imageB64
            ? { type: 'input_image', image_url: imageB64 }
            : { type: 'input_image', image_url: imageUrl }
        ]
      }
    ];

    const resp = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 1200,
    });

    let content = resp.choices[0]?.message?.content || '{}';
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) content = fenced[1].trim();
    content = content.replace(/^```.*\n?/, '').replace(/```$/, '').trim();

    let json;
    try { json = JSON.parse(content); } catch { json = { raw: content }; }

    return NextResponse.json({ success: true, insights: json });
  } catch (e: any) {
    console.error('Vision analyze error:', e);
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
  }
}
