import { NextResponse } from "next/server";
import { UnifiedCompetitiveAnalysisService } from "@/lib/unified-competitive-analysis";

// Initialize the unified competitive analysis service
const competitiveAnalysisService = new UnifiedCompetitiveAnalysisService();

export async function POST(req: Request) {
  console.log("🚀 Starting unified competitive analysis request...");
  
  try {
    const contentType = req.headers.get("content-type") || "";
    console.log("📋 Content-Type:", contentType);

    if (!contentType.includes("multipart/form-data")) {
      console.log("❌ Invalid content type");
      return NextResponse.json(
        { error: "Expected multipart/form-data" },
        { status: 400 }
      );
    }

    const form = await req.formData();
    const imageFile = form.get("imageFile") as File;
    
    console.log("📁 Image file details:", {
      name: imageFile?.name,
      size: imageFile?.size,
      type: imageFile?.type
    });

    if (!imageFile) {
      console.log("❌ No image file provided");
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Use the unified competitive analysis service
    console.log("🔄 Starting unified competitive analysis...");
    const result = await competitiveAnalysisService.analyzeCompetitiveLandscape(imageFile);
    
    console.log("🎉 Unified competitive analysis completed successfully!");
    
    return NextResponse.json({
      success: true,
      analysis: result
    });

  } catch (error) {
    console.error("💥 Error in unified competitive analysis:", error);
    console.error("🔍 Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: "Failed to perform competitive analysis",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
