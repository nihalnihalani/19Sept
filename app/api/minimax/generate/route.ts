import { NextResponse } from "next/server";
import { MiniMaxService } from "@/lib/minimax-service";

export async function POST(req: Request) {
  console.log("🎬 Starting MiniMax video generation API...");
  
  try {
    const body = await req.json();
    const { prompt, model, duration, resolution, asyncMode } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required for video generation" },
        { status: 400 }
      );
    }

    console.log("📝 Video generation request:", {
      prompt: prompt.substring(0, 100) + "...",
      model,
      duration,
      resolution,
      asyncMode
    });

    const minimaxService = new MiniMaxService();
    
    const result = await minimaxService.generateVideo({
      prompt,
      model,
      duration,
      resolution,
      asyncMode
    });

    if (result.success) {
      console.log("✅ Video generated successfully");
      return NextResponse.json({
        success: true,
        videoUrl: result.videoUrl,
        taskId: result.taskId,
        status: result.status
      });
    } else {
      console.log("❌ Video generation failed:", result.error);
      return NextResponse.json(
        { 
          success: false,
          error: result.error || "Video generation failed"
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("💥 Error in MiniMax video generation API:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error during video generation"
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json(
      { error: "Task ID is required" },
      { status: 400 }
    );
  }

  try {
    console.log("🔍 Querying video status for task:", taskId);
    
    const minimaxService = new MiniMaxService();
    const result = await minimaxService.queryVideoStatus(taskId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        videoUrl: result.videoUrl,
        status: result.status
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || "Failed to query video status"
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("💥 Error querying video status:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error while querying video status"
      },
      { status: 500 }
    );
  }
}
