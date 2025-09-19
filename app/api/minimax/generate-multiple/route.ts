import { NextResponse } from "next/server";
import { MiniMaxService } from "@/lib/minimax-service";

export async function POST(req: Request) {
  console.log("🎬 Starting MiniMax multiple video generation API...");
  
  try {
    const body = await req.json();
    const { category, topBrands, customPrompts } = body;

    if (!category) {
      return NextResponse.json(
        { error: "Category is required for video generation" },
        { status: 400 }
      );
    }

    console.log("📝 Multiple video generation request:", {
      category,
      topBrands: topBrands || [],
      customPrompts: customPrompts || []
    });

    const minimaxService = new MiniMaxService();
    
    // Create video prompts based on competitive analysis
    let videoPrompts: string[];
    
    if (customPrompts && customPrompts.length > 0) {
      videoPrompts = customPrompts;
    } else {
      videoPrompts = minimaxService.createVideoPrompts(category, topBrands || []);
    }

    console.log("🎯 Generated video prompts:", videoPrompts);

    // Generate multiple videos in parallel
    const results = await minimaxService.generateMultipleVideos(videoPrompts);

    // Process results
    const successfulVideos = results
      .map((result, index) => ({
        id: `video-${index + 1}`,
        prompt: videoPrompts[index],
        success: result.success,
        videoUrl: result.videoUrl,
        error: result.error,
        style: `Video Style ${index + 1}`
      }))
      .filter(video => video.success);

    const failedVideos = results
      .map((result, index) => ({
        id: `video-${index + 1}`,
        prompt: videoPrompts[index],
        success: result.success,
        error: result.error,
        style: `Video Style ${index + 1}`
      }))
      .filter(video => !video.success);

    console.log(`✅ Generated ${successfulVideos.length} videos successfully`);
    if (failedVideos.length > 0) {
      console.log(`❌ ${failedVideos.length} videos failed to generate`);
    }

    return NextResponse.json({
      success: true,
      videos: successfulVideos,
      failedVideos: failedVideos,
      totalRequested: videoPrompts.length,
      totalGenerated: successfulVideos.length,
      totalFailed: failedVideos.length
    });

  } catch (error) {
    console.error("💥 Error in MiniMax multiple video generation API:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error during multiple video generation"
      },
      { status: 500 }
    );
  }
}
