import { NextResponse } from "next/server";
import { ApifyService } from "@/lib/apify-service";
import { PRODUCT_CATEGORIES } from "@/lib/product-mapping";

const apifyService = new ApifyService();

export async function GET(req: Request) {
  try {
    console.log("🚀 Starting Apify debug test...");

    // Test 1: Test connection
    console.log("🔗 Testing Apify connection...");
    const connectionTest = await apifyService.testConnection();
    console.log("Connection test result:", connectionTest);
    
    
    // Test 3: Test individual Google Images scraper
    console.log("🔍 Testing Google Images scraper...");
    const googleResult = await apifyService.scrapeGoogleImages(
      { id: 'nike', name: 'Nike', website: 'https://nike.com', apifyActorId: 'nike', searchTerms: ['shoes'], productTypes: ['shoes'] },
      'running shoes'
    );
    console.log("Google images scraped:", googleResult.length);

    // Test 4: Test individual Amazon scraper
    console.log("🛒 Testing Amazon scraper...");
    const amazonResult = await apifyService.scrapeAmazonProducts(
      { id: 'nike', name: 'Nike', website: 'https://nike.com', apifyActorId: 'nike', searchTerms: ['shoes'], productTypes: ['shoes'] },
      'running shoes'
    );
    console.log("Amazon result:", amazonResult.length);
    
    return NextResponse.json({
      success: true,
      debug: {
        connection: connectionTest,
        google: googleResult.length,
        amazon: amazonResult.length,
        total: googleResult.length + amazonResult.length
      },
      sampleAds: {
        google: googleResult.slice(0, 1),
        amazon: amazonResult.slice(0, 1)
      }
    });
    
  } catch (error) {
    console.error("💥 Debug failed:", error);
    return NextResponse.json({
      success: false,
      error: "Debug test failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
