import { NextResponse } from "next/server";
import { BrightDataService } from "@/lib/brightdata-service";

export async function POST(req: Request) {
  console.log("🔍 Starting Bright Data scraping...");
  
  try {
    const body = await req.json();
    const { url, platform, options = {} } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required for scraping" },
        { status: 400 }
      );
    }

    console.log("📝 Bright Data scraping request:", {
      url,
      platform: platform || 'auto-detect',
      options
    });

    const brightDataService = new BrightDataService();

    try {
      // Initialize Bright Data connection
      await brightDataService.initialize();

      // Scrape the URL
      const result = await brightDataService.scrapeSocialMediaPost(
        url, 
        platform || 'generic'
      );

      // Cleanup connection
      await brightDataService.cleanup();

      if (result.success) {
        console.log("✅ Bright Data scraping completed successfully");
        return NextResponse.json({
          success: true,
          data: result.data,
          metadata: {
            url: result.url,
            platform: result.platform,
            timestamp: result.timestamp
          }
        });
      } else {
        console.log("❌ Bright Data scraping failed:", result.error);
        return NextResponse.json(
          { 
            success: false,
            error: result.error || "Scraping failed"
          },
          { status: 500 }
        );
      }

    } catch (serviceError) {
      // Ensure cleanup even if scraping fails
      await brightDataService.cleanup();
      throw serviceError;
    }

  } catch (error) {
    console.error("💥 Error in Bright Data scraping:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Scraping failed"
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  const platform = searchParams.get('platform');

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    console.log(`🔍 Scraping URL: ${url}`);
    
    const brightDataService = new BrightDataService();

    try {
      await brightDataService.initialize();

      const result = await brightDataService.scrapeSocialMediaPost(
        url, 
        platform || 'generic'
      );

      await brightDataService.cleanup();

      if (result.success) {
        return NextResponse.json({
          success: true,
          data: result.data,
          metadata: {
            url: result.url,
            platform: result.platform,
            timestamp: result.timestamp
          }
        });
      } else {
        return NextResponse.json(
          { 
            success: false,
            error: result.error || "Scraping failed"
          },
          { status: 500 }
        );
      }

    } catch (serviceError) {
      await brightDataService.cleanup();
      throw serviceError;
    }

  } catch (error) {
    console.error("💥 Error in Bright Data scraping:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Scraping failed"
      },
      { status: 500 }
    );
  }
}
