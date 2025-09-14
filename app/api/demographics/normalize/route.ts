import { NextResponse } from "next/server";
import { OpenAI } from "openai";

export const runtime = 'nodejs';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

interface NormalizeBody {
  input: string;
  brandContext?: string; // e.g., "Pepsi, Coca-Cola"
}

export async function POST(req: Request) {
  try {
    const body: NormalizeBody = await req.json();
    const input = String(body?.input || '').trim();
    const brandCtx = String(body?.brandContext || '').trim();
    if (!input) return NextResponse.json({ error: 'Missing input' }, { status: 400 });

    // Try OpenAI first
    if (OPENAI_KEY) {
      try {
        const openai = new OpenAI({ apiKey: OPENAI_KEY });
        const sys = `You normalize spoken requests into a canonical campaign plan format and a structured list.
Return JSON with keys:
- formatted (string): exact text starting with 'Generate ad campaign variants for:' followed by numbered lines '1. Country (City) <descriptor>' etc.
- demographics (array): each with { title, city, country, description }.
Use culturally appropriate default cities: Japan->Tokyo, India->Bengaluru, Norway->Oslo, USA->NYC, UAE->Dubai, Brazil->São Paulo. Keep descriptions concise (<= 140 chars), brand-safe.
If brandContext provided, weave subtle brand-safe cues but DO NOT include brand names verbatim in 'formatted'.`;
        const user = `Input (spoken):\n${input}\n\nBrand context (optional): ${brandCtx || 'none'}\n\nReturn ONLY JSON with {formatted, demographics}.`;
        const resp = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: user },
          ],
          temperature: 0.3,
          max_tokens: 800,
        });
        let content = resp.choices?.[0]?.message?.content || '';
        content = content.trim();
        const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fenced?.[1]) content = fenced[1].trim();
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed.formatted === 'string' && Array.isArray(parsed.demographics)) {
          return NextResponse.json({ textFormatted: parsed.formatted, demographics: parsed.demographics });
        }
      } catch (e) {
        // fallthrough to heuristic
      }
    }

    // Heuristic fallback: try to detect countries and map defaults
    const lower = input.toLowerCase();
    const picks: Array<{ title: string; city: string; country: string; description: string; }> = [];
    const add = (title: string, city: string, desc: string) => picks.push({ title, city, country: title, description: desc });
    if (/japan|japanese/.test(lower)) add('Japan', 'Tokyo', 'tech-forward Gen Z, neon, anime/cyberpunk influences');
    if (/india|indian/.test(lower)) add('India', 'Bengaluru', 'college students, vibrant colors, festival mood');
    if (/norway|norwegian/.test(lower)) add('Norway', 'Oslo', 'eco-conscious millennials, minimal, nature aesthetics');
    if (picks.length === 0) {
      // default to three examples to avoid empty return
      add('Japan', 'Tokyo', 'tech-forward Gen Z, neon, anime/cyberpunk influences');
      add('India', 'Bengaluru', 'college students, vibrant colors, festival mood');
      add('Norway', 'Oslo', 'eco-conscious millennials, minimal, nature aesthetics');
    }
    const lines = picks.map((p, i) => `${i + 1}. ${p.title} (${p.city}) <${p.description}>`);
    const formatted = ['Generate ad campaign variants for:', ...lines].join('\n');
    return NextResponse.json({ textFormatted: formatted, demographics: picks });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to normalize' }, { status: 500 });
  }
}
