import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { qlooAPI } from "@/lib/qloo-api";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null;

interface CulturalIntelligenceRequest {
  city: string;
  country: string;
  businessType?: string;
  targetAudience?: string;
  analysisDepth: "basic" | "comprehensive" | "competitive";
  includeRealTimeData?: boolean;
}

export async function POST(req: Request) {
  try {
    const params: CulturalIntelligenceRequest = await req.json();

    const [qlooInsights] = await Promise.all([
      qlooAPI.getCulturalInsights(params.city, params.country),
    ]);

    const culturalAnalysis = await generateAdvancedCulturalAnalysis({
      ...params,
      data: {
        qlooBrands: qlooInsights.brands,
        qlooPlaces: qlooInsights.places,
        culturalMetrics: qlooInsights.cultural_metrics,
      },
    });

    return NextResponse.json({
      success: true,
      location: { city: params.city, country: params.country },
      analysis: culturalAnalysis,
      raw: {
        qloo: qlooInsights,
      },
    });
  } catch (error) {
    console.error("Cultural intelligence error:", error);
    return NextResponse.json(
      { error: "Failed to generate cultural intelligence" },
      { status: 500 }
    );
  }
}

async function generateAdvancedCulturalAnalysis(params: any) {
  if (!openai) {
    return generateFallbackAnalysis(params);
  }

  const prompt = `You are a cultural intelligence analyst. Analyze ${params.city}, ${params.country} for a ${params.businessType || 'business'} targeting ${params.targetAudience || 'general audience'}.
Raw Data:
- Qloo Brands: ${JSON.stringify(params.data.qlooBrands?.slice(0, 30) || [])}
- Qloo Places: ${JSON.stringify(params.data.qlooPlaces?.slice(0, 30) || [])}
- Cultural Metrics: ${JSON.stringify(params.data.culturalMetrics || {})}

Provide a concise JSON with keys: profile, aesthetics, communication, themes, demographics, brands.`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 3000,
    });

    let content = response.choices[0].message.content || "{}";
    content = content.trim();
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) content = fenced[1].trim();
    content = content.replace(/^```.*\n?/, "").replace(/```$/, "").trim();

    try {
      return JSON.parse(content);
    } catch {
      return generateFallbackAnalysis(params);
    }
  } catch (e) {
    console.error("OpenAI error:", e);
    return generateFallbackAnalysis(params);
  }
}

function generateFallbackAnalysis(params: any) {
  return {
    profile: {
      cultural_identity: `Dynamic cultural landscape in ${params.city}`,
      modernization_level: "Balanced traditional and modern values",
    },
    aesthetics: {
      visual_styles: ["Contemporary with local influences"],
    },
    communication: {
      tone_preferences: ["Professional yet friendly"],
    },
    themes: {
      lifestyle_aspirations: ["Quality of life", "Community connection"],
    },
    demographics: {
      primary_segments: ["Urban professionals", "Digital natives"],
    },
    brands: {
      loved_brands: (params.data?.qlooBrands || []).slice(0, 10).map((b: any) => b.name),
    },
  };
}
