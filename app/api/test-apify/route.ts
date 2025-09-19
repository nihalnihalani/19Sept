import { NextResponse } from "next/server";
import { ApifyService } from "@/lib/apify-service";
import { detectProductCategory } from "@/lib/product-mapping";

// Test endpoint to verify Apify integration
export async function GET() {
  try {
    const apifyService = new ApifyService();
    
    // Test connection
    const isConnected = await apifyService.testConnection();
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: "Failed to connect to Apify API"
      }, { status: 500 });
    }

    // Test with a sample competitor
    const testCompetitor = {
      id: 'nike',
      name: 'Nike',
      website: 'https://www.nike.com',
      apifyActorId: 'nike-scraper',
      searchTerms: ['sports shoes', 'running shoes', 'sneakers'],
      productTypes: ['sports shoes', 'running shoes', 'sneakers']
    };

    const testQuery = 'running shoes';
    
    // Test scraping (this will use real Apify endpoints)
    const result = await apifyService.scrapeCompetitorAds(testCompetitor, testQuery);
    
    return NextResponse.json({
      success: true,
      message: "Apify integration is working!",
      connection: isConnected,
      testResult: {
        success: result.success,
        dataCount: result.data?.length || 0,
        platforms: result.data?.map(ad => ad.platform) || [],
        error: result.error
      },
      endpoints: {
        facebook: 'apify~facebook-ads-scraper',
        google: 'silva95gustavo~google-ads-scraper', 
        amazon: 'junglee~amazon-crawler'
      }
    });

  } catch (error) {
    console.error("Apify test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "Apify test failed"
    }, { status: 500 });
  }
}
