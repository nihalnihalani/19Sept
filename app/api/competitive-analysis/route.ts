import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { detectProductCategory, generateSearchQuery, PRODUCT_CATEGORIES } from "@/lib/product-mapping";
import { ApifyService } from "@/lib/apify-service";
import { FactFluxService } from "@/lib/factflux-service";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Use real Apify service with your API key
const apifyService = new ApifyService();

// Helper function to generate social media URLs for competitors
function generateSocialMediaUrls(competitor: { name: string }, category: { name: string }): string[] {
  const competitorName = competitor.name.toLowerCase().replace(/\s+/g, '');
  
  // Generate common social media URL patterns
  const socialPlatforms = [
    `https://www.instagram.com/${competitorName}`,
    `https://www.twitter.com/${competitorName}`,
    `https://www.tiktok.com/@${competitorName}`,
    `https://www.facebook.com/${competitorName}`,
    `https://www.youtube.com/@${competitorName}`,
    `https://www.linkedin.com/company/${competitorName}`
  ];
  
  // Add category-specific search URLs
  const searchTerms = [
    `${competitor.name} ${category.name}`,
    `${competitor.name} ${category.name} ads`,
    `${competitor.name} ${category.name} marketing`
  ];
  
  searchTerms.forEach(term => {
    socialPlatforms.push(`https://www.instagram.com/explore/tags/${term.replace(/\s+/g, '')}`);
    socialPlatforms.push(`https://www.tiktok.com/search?q=${encodeURIComponent(term)}`);
  });
  
  return socialPlatforms;
}

export async function POST(req: Request) {
  console.log("🚀 Starting competitive analysis request...");
  
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
    const prompt = (form.get("prompt") as string) || "";
    
    console.log("📁 Image file details:", {
      name: imageFile?.name,
      size: imageFile?.size,
      type: imageFile?.type,
      prompt: prompt
    });

    if (!imageFile) {
      console.log("❌ No image file provided");
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Convert image to base64 for Gemini analysis
    console.log("🔄 Converting image to base64...");
    const imageBuffer = await imageFile.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageFile.type || "image/png";
    console.log("✅ Image converted successfully. Size:", imageBase64.length, "characters");

    // Enhanced image analysis with Gemini
    console.log("🤖 Starting Gemini image analysis...");
    const analysisPrompt = `Analyze this image carefully and provide a detailed description of the product shown. Be very specific about:

    1. What type of product this is (shoes, sneakers, footwear, skincare, beauty products, beverages, drinks, etc.)
    2. The brand name if visible
    3. Key visual features and characteristics
    4. The style and design elements
    5. Any text or labels visible on the product
    6. The target audience this product appears to be for
    7. The product category (be very specific - is it athletic shoes, casual shoes, running shoes, beauty devices, skincare products, soft drinks, etc.)
    
    Focus on identifying the exact product type and category. If it's footwear, specify what kind (sneakers, boots, sandals, etc.). If it's beauty/skincare, specify what type of product. If it's a beverage, specify what kind of drink.
    
    Be very descriptive and include all relevant details that would help categorize this product.`;

    const analysisResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          text: analysisPrompt,
        },
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBase64,
          },
        },
      ],
    });

    const imageDescription = analysisResponse.candidates[0].content.parts[0].text;
    console.log("✅ Gemini analysis completed");
    console.log("📝 AI Analysis Result:", imageDescription);

    // Detect product category using our enhanced mapping system
    console.log("🔍 Starting product category detection...");
    let productAnalysis = detectProductCategory(imageDescription, imageFile.name);
    console.log("🎯 Initial detection result:", productAnalysis ? `${productAnalysis.detectedCategory.name} (${(productAnalysis.confidence * 100).toFixed(1)}%)` : "Failed");
    
    // Fallback detection if initial detection fails
    if (!productAnalysis) {
      console.log("⚠️ Initial detection failed, trying fallback detection...");
      
      // Try with a more general approach
      const fallbackAnalysis = detectProductCategory(
        `${imageDescription} product item merchandise goods`,
        imageFile.name
      );
      
      if (fallbackAnalysis) {
        productAnalysis = fallbackAnalysis;
        console.log("✅ Fallback detection successful:", fallbackAnalysis.detectedCategory.name, `(${(fallbackAnalysis.confidence * 100).toFixed(1)}%)`);
      } else {
        // Last resort - default to shoes if we can't detect anything
        console.log("🔄 All detection failed, defaulting to shoes category");
        productAnalysis = {
          detectedCategory: PRODUCT_CATEGORIES[0], // Default to shoes
          confidence: 0.3, // Low confidence
          suggestedCompetitors: PRODUCT_CATEGORIES[0].competitors,
          scrapedAds: []
        };
      }
    }
    
    console.log("🎯 Final product analysis:", {
      category: productAnalysis.detectedCategory.name,
      confidence: `${(productAnalysis.confidence * 100).toFixed(1)}%`,
      competitors: productAnalysis.suggestedCompetitors.length
    });

    // Generate search queries for each competitor
    console.log("🔍 Generating search queries for competitors...");
    const searchQueries = productAnalysis.suggestedCompetitors.map(competitor => 
      generateSearchQuery(productAnalysis.detectedCategory, competitor)
    );
    console.log("📝 Search queries:", searchQueries);

    // Scrape competitor ads
    console.log("🌐 Starting competitor data scraping...");
    console.log("📊 Competitors to analyze:", productAnalysis.suggestedCompetitors.map(c => c.name));
    
    const scrapedResults = await apifyService.scrapeMultipleCompetitors(
      productAnalysis.suggestedCompetitors,
      searchQueries
    );

    // Flatten all scraped ads
    const allScrapedAds = Object.values(scrapedResults).flat();
    productAnalysis.scrapedAds = allScrapedAds;
    
    console.log("📈 Scraping results summary:", {
      totalAds: allScrapedAds.length,
      byPlatform: {
        facebook: allScrapedAds.filter(ad => ad.platform === 'facebook').length,
        google: allScrapedAds.filter(ad => ad.platform === 'google').length,
        amazon: allScrapedAds.filter(ad => ad.platform === 'amazon').length
      }
    });

    // Enhanced competitive analysis with FactFlux
    console.log("🔍 Starting FactFlux social media analysis...");
    let factFluxAnalysis = null;
    
    try {
      const factFluxService = new FactFluxService();
      
      // Generate competitor social media URLs based on detected category
      const competitorUrls = productAnalysis.suggestedCompetitors.map(competitor => ({
        name: competitor.name,
        urls: generateSocialMediaUrls(competitor, productAnalysis.detectedCategory)
      }));

      // Flatten URLs for FactFlux analysis
      const allUrls = competitorUrls.flatMap(comp => comp.urls);
      
      if (allUrls.length > 0) {
        factFluxAnalysis = await factFluxService.runCompetitiveAnalysis(
          allUrls,
          productAnalysis.detectedCategory.name
        );
        console.log("✅ FactFlux analysis completed:", {
          posts: factFluxAnalysis.posts.length,
          insights: factFluxAnalysis.insights.length,
          confidence: factFluxAnalysis.confidence
        });
      }
    } catch (factFluxError) {
      console.warn("⚠️ FactFlux analysis failed, continuing with standard analysis:", factFluxError);
    }

    // Generate competitive product image using scraped references
    console.log("🎨 Starting competitive image generation...");
    
    // Use completely safe prompts to avoid Responsible AI issues
    const safeProductPrompts = {
      'shoes': [
        "Create a professional athletic shoe advertisement with modern design and clean background",
        "Generate a high-quality sneaker marketing image with studio lighting and professional composition",
        "Design a commercial footwear product photograph suitable for e-commerce and retail"
      ],
      'soft-drinks': [
        "Create a professional beverage advertisement with refreshing and clean aesthetic",
        "Generate a high-quality drink marketing image with professional lighting and modern design",
        "Design a commercial beverage product photograph suitable for retail and advertising"
      ],
      'skincare': [
        "Create a professional beauty product advertisement with elegant and clean design",
        "Generate a high-quality skincare marketing image with professional lighting and modern aesthetic",
        "Design a commercial beauty product photograph suitable for cosmetics and retail"
      ]
    };
    
    const categoryPrompts = safeProductPrompts[productAnalysis.detectedCategory.id as keyof typeof safeProductPrompts] || 
                           safeProductPrompts['shoes'];
    const safePrompt = categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];

    console.log("📝 Using safe competitive prompt:", safePrompt);
    
    const competitiveImageResponse = await ai.models.generateImages({
      model: "imagen-4.0-fast-generate-001",
      prompt: safePrompt,
      config: {
        aspectRatio: "16:9",
      },
    });

    const competitiveImage = competitiveImageResponse.generatedImages?.[0]?.image;
    
    if (!competitiveImage?.imageBytes) {
      console.log("❌ Failed to generate competitive image");
      return NextResponse.json(
        { error: "Failed to generate competitive image" },
        { status: 500 }
      );
    }
    
    console.log("✅ Competitive image generated successfully");

    // Return comprehensive analysis
    console.log("🎉 Analysis completed successfully! Returning results...");
    return NextResponse.json({
      success: true,
      analysis: {
        detectedCategory: productAnalysis.detectedCategory,
        confidence: productAnalysis.confidence,
        imageDescription: imageDescription,
        competitors: productAnalysis.suggestedCompetitors,
        scrapedAds: allScrapedAds,
        competitiveImage: {
          imageBytes: competitiveImage.imageBytes,
          mimeType: competitiveImage.mimeType || "image/png",
        },
        insights: {
          totalCompetitorsAnalyzed: productAnalysis.suggestedCompetitors.length,
          totalAdsScraped: allScrapedAds.length,
          averagePrice: allScrapedAds
            .filter(ad => ad.price)
            .reduce((sum, ad) => {
              const price = parseFloat(ad.price?.replace(/[^0-9.]/g, '') || '0');
              return sum + price;
            }, 0) / allScrapedAds.filter(ad => ad.price).length || 0,
          topBrands: [...new Set(allScrapedAds.map(ad => ad.brand))],
        },
        // Enhanced insights with FactFlux social media analysis
        socialMediaAnalysis: factFluxAnalysis ? {
          posts: factFluxAnalysis.posts,
          insights: factFluxAnalysis.insights,
          summary: factFluxAnalysis.summary,
          confidence: factFluxAnalysis.confidence,
          trendingTopics: factFluxAnalysis.summary.trendingTopics,
          competitorMentions: factFluxAnalysis.summary.competitorMentions
        } : null,
        detectionDetails: {
          initialDetection: productAnalysis.confidence > 0.5,
          fallbackUsed: productAnalysis.confidence <= 0.5,
          detectionScore: productAnalysis.confidence
        }
      }
    });

  } catch (error) {
    console.error("💥 Error in competitive analysis:", error);
    console.error("🔍 Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Check if it's a Responsible AI violation
    if (error instanceof Error && error.message.includes("Responsible AI practices")) {
      console.log("🚫 Competitive image generation blocked by Responsible AI");
      return NextResponse.json(
        { 
          error: "Image generation was blocked by content filters. The analysis completed but couldn't generate a competitive image.",
          details: "Please try with a different product image or contact support if this persists."
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to perform competitive analysis" },
      { status: 500 }
    );
  }
}
