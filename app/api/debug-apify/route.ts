import { NextResponse } from "next/server";
import { ApifyService } from "@/lib/apify-service";

export async function GET() {
  console.log("🔧 Debugging Apify integration...");
  
  try {
    const apifyService = new ApifyService();
    
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
    console.log("Google Images result:", googleResult.length, "ads");
    
    // Test 4: Test individual Amazon scraper
    console.log("🛒 Testing Amazon scraper...");
    const amazonResult = await apifyService.scrapeAmazonProducts(
      { id: 'nike', name: 'Nike', website: 'https://nike.com', apifyActorId: 'nike', searchTerms: ['shoes'], productTypes: ['shoes'] },
      'running shoes'
    );
    console.log("Amazon result:", amazonResult.length, "ads");
    
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
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
