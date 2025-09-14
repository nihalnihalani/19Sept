import { NextResponse } from "next/server";
import { OpenAI } from "openai";

export const runtime = 'nodejs';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Shape we want to return to the client
interface DemographicOut {
  title?: string;
  city?: string;
  country?: string;
  description?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input: string = String(body?.input || '').trim();
    if (!input) {
      return NextResponse.json({ error: 'Missing input' }, { status: 400 });
    }

    // If OpenAI key exists, try LLM expansion
    if (OPENAI_KEY) {
      try {
        const openai = new OpenAI({ apiKey: OPENAI_KEY });
        const sys = `You are a marketing strategist. Given a short user planning text for an ad campaign with a list of regions/demographics, produce a concise JSON array of demographics with fields: title, city, country, description. Be specific, culturally-aware, and avoid redundant boilerplate. Keep 2-6 items maximum.`;
        const prompt = `User plan (raw):\n${input}\n\nReturn ONLY valid JSON array, like:\n[{"title":"Japan","city":"Tokyo","country":"Japan","description":"..."}]`;
        const resp = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 800,
        });
        let content = resp.choices?.[0]?.message?.content || '[]';
        content = content.trim();
        const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fenced?.[1]) content = fenced[1].trim();
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          const demographics: DemographicOut[] = parsed.map((d: any) => ({
            title: String(d?.title || d?.country || '').trim() || undefined,
            city: d?.city ? String(d.city).trim() : undefined,
            country: d?.country ? String(d.country).trim() : undefined,
            description: d?.description ? String(d.description).trim() : undefined,
          }));
          return NextResponse.json({ demographics });
        }
      } catch (e) {
        // fall through to heuristic parsing
      }
    }

    // Fallback: heuristic parse of lines
    const demographics = heuristicParse(input);
    return NextResponse.json({ demographics });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to expand' }, { status: 500 });
  }
}

function heuristicParse(input: string): DemographicOut[] {
  const lines = input
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .filter(l => !/^generate\s+ad\s+campaign\s+variants\s+for\s*:?/i.test(l))
    .filter(l => !/^plan\s*\+\s*run$/i.test(l))
    .filter(l => !/^plan\s+campaigns$/i.test(l));

  const out: DemographicOut[] = [];
  for (const raw of lines) {
    const line = raw.replace(/^\d+\.?\s*/, "");
    const detailsMatch = line.match(/<([^>]*)>/);
    let description = detailsMatch ? detailsMatch[1].trim() : "";
    let withoutDetails = line.replace(/<[^>]*>/g, "").trim();
    if (!description) {
      const afterParen = withoutDetails.match(/\)(.*)$/);
      if (afterParen?.[1]) description = afterParen[1].trim();
      withoutDetails = withoutDetails.replace(/\)(.*)$/, ")").trim();
    }
    const locMatch = withoutDetails.match(/^(.*?)\s*\(([^)]*)\)/);
    let title = withoutDetails;
    let city: string | undefined;
    let country: string | undefined;
    if (locMatch) {
      title = (locMatch[1] || '').trim() || 'Unknown';
      const parts = (locMatch[2] || '').split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length === 1) {
        city = parts[0];
        country = title;
      } else if (parts.length >= 2) {
        city = parts[0];
        country = parts[1];
      }
    } else {
      const basic = withoutDetails.replace(/[-–].*$/, '').trim();
      title = basic || 'Unknown';
      country = title;
    }
    out.push({ title, city, country, description });
  }
  return out.slice(0, 6);
}
