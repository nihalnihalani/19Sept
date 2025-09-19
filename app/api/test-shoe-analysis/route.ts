import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { detectProductCategory, PRODUCT_CATEGORIES, generateSearchQuery } from "@/lib/product-mapping";
import { ApifyService } from "@/lib/apify-service";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const apifyService = new ApifyService();

export async function GET() {
  console.log("🧪 Starting comprehensive shoe analysis test...");
  
  try {
    // Test 1: Product Detection
    console.log("🔍 Test 1: Product Detection");
    const testImageDescription = "A pair of white Nike running shoes with black swoosh logo, athletic footwear for sports and running";
    const testFileName = "nike-shoes.jpg";
    
    const productAnalysis = detectProductCategory(testImageDescription, testFileName);
    
    if (!productAnalysis) {
      return NextResponse.json({
        success: false,
        error: "Product detection failed",
        testResults: {
          detection: "FAILED",
          apify: "SKIPPED"
        }
      });
    }
    
    console.log("✅ Product detected:", productAnalysis.detectedCategory.name);
    console.log("📊 Competitors found:", productAnalysis.suggestedCompetitors.length);
    
    // Test 2: Apify Scraping
    console.log("🌐 Test 2: Apify Scraping");
    const searchQueries = productAnalysis.suggestedCompetitors.map(competitor => 
      generateSearchQuery(productAnalysis.detectedCategory, competitor)
    );
    
    console.log("🔍 Search queries generated:", searchQueries);
    
    const scrapedResults = await apifyService.scrapeMultipleCompetitors(
      productAnalysis.suggestedCompetitors,
      searchQueries
    );
    
    // Count results by platform
    const platformCounts = {
      facebook: 0,
      google: 0,
      amazon: 0,
      total: 0
    };
    
    Object.values(scrapedResults).forEach(ads => {
      ads.forEach(ad => {
        platformCounts[ad.platform || 'unknown']++;
        platformCounts.total++;
      });
    });
    
    console.log("📈 Scraping results:", platformCounts);
    
    // Test 3: Show the complete mapping
    const mappingInfo = {
      detectedCategory: {
        id: productAnalysis.detectedCategory.id,
        name: productAnalysis.detectedCategory.name,
        keywords: productAnalysis.detectedCategory.keywords.slice(0, 5) // Show first 5 keywords
      },
      competitors: productAnalysis.suggestedCompetitors.map(competitor => ({
        id: competitor.id,
        name: competitor.name,
        website: competitor.website,
        searchTerms: competitor.searchTerms,
        productTypes: competitor.productTypes
      })),
      searchQueries: searchQueries,
      scrapedAds: Object.values(scrapedResults).flat().slice(0, 3) // Show first 3 ads
    };
    
    return NextResponse.json({
      success: true,
      message: "Shoe analysis test completed successfully!",
      testResults: {
        detection: "PASSED",
        apify: platformCounts.total > 0 ? "PASSED" : "FAILED"
      },
      mapping: mappingInfo,
      stats: {
        confidence: productAnalysis.confidence,
        competitorsFound: productAnalysis.suggestedCompetitors.length,
        adsScraped: platformCounts.total,
        platformBreakdown: platformCounts
      }
    });
    
  } catch (error) {
    console.error("💥 Test failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      testResults: {
        detection: "ERROR",
        apify: "ERROR"
      }
    });
  }
}
