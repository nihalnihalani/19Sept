import { NextResponse } from "next/server";
import { FactFluxService } from "@/lib/factflux-service";
import { BrightDataService } from "@/lib/brightdata-service";

export async function POST(req: Request) {
  console.log("🔍 Starting FactFlux competitive analysis...");
  
  try {
    const body = await req.json();
    const { competitorUrls, category, searchTerms } = body;

    if (!competitorUrls || !Array.isArray(competitorUrls) || competitorUrls.length === 0) {
      return NextResponse.json(
        { error: "Competitor URLs array is required" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category is required for analysis" },
        { status: 400 }
      );
    }

    console.log("📝 FactFlux analysis request:", {
      competitorUrls: competitorUrls.length,
      category,
      searchTerms: searchTerms || []
    });

    // Initialize services
    const factFluxService = new FactFluxService();
    const brightDataService = new BrightDataService();

    try {
      // Initialize Bright Data connection
      await brightDataService.initialize();

      // Run comprehensive competitive analysis
      const analysis = await factFluxService.runCompetitiveAnalysis(competitorUrls, category);

      // Get additional trending topics if search terms provided
      const trendingTopics: string[] = [];
      if (searchTerms && searchTerms.length > 0) {
        for (const term of searchTerms) {
          const topics = await brightDataService.getTrendingTopics(term);
          trendingTopics.push(...topics);
        }
      }

      // Cleanup Bright Data connection
      await brightDataService.cleanup();

      console.log("✅ FactFlux analysis completed successfully");
      return NextResponse.json({
        success: true,
        analysis: {
          ...analysis,
          trendingTopics: [...new Set(trendingTopics)] // Remove duplicates
        }
      });

    } catch (serviceError) {
      // Ensure cleanup even if analysis fails
      await brightDataService.cleanup();
      throw serviceError;
    }

  } catch (error) {
    console.error("💥 Error in FactFlux analysis:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "FactFlux analysis failed"
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const competitor = searchParams.get('competitor');

  if (!category) {
    return NextResponse.json(
      { error: "Category parameter is required" },
      { status: 400 }
    );
  }

    try {
      console.log(`🔍 Getting FactFlux insights for ${category}${competitor ? ` and ${competitor}` : ''}`);
      
      const brightDataService = new BrightDataService();

    try {
      await brightDataService.initialize();

      // Search for competitor mentions if competitor specified
      const competitorMentions: Array<{ success: boolean; [key: string]: unknown }> = [];
      if (competitor) {
        const mentions = await brightDataService.searchCompetitorMentions(competitor);
        competitorMentions.push(...mentions.filter(m => m.success));
      }

      // Get trending topics for the category
      const trendingTopics = await brightDataService.getTrendingTopics(category);

      await brightDataService.cleanup();

      return NextResponse.json({
        success: true,
        insights: {
          category,
          competitor,
          trendingTopics,
          competitorMentions: competitorMentions.length,
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (serviceError) {
      await brightDataService.cleanup();
      throw serviceError;
    }

  } catch (error) {
    console.error("💥 Error getting FactFlux insights:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Failed to get insights"
      },
      { status: 500 }
    );
  }
}
