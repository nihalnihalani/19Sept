import { GoogleGenAI } from "@google/genai";
import { ApifyService } from "./apify-service";
import { FactFluxService } from "./factflux-service";
import { BrightDataService } from "./brightdata-service";
import { detectProductCategory, generateSearchQuery, CompetitorBrand, ScrapedAd, ProductCategory } from "./product-mapping";

// LlamaIndex imports - simplified for now
// import { VectorStoreIndex, Document, serviceContextFromDefaults } from "llamaindex";
// import { OpenAIEmbedding, OpenAI } from "llamaindex";

export interface CompetitiveInsight {
  id: string;
  type: 'pricing' | 'feature' | 'marketing' | 'positioning' | 'trend';
  title: string;
  description: string;
  source: string;
  confidence: number;
  relevance: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
  supportingEvidence: string[];
  metadata: {
    platform: string;
    brand: string;
    timestamp: string;
    engagement?: {
      likes: number;
      shares: number;
      comments: number;
    };
  };
}

export interface MarketTrend {
  id: string;
  trend: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  supportingData: string[];
  confidence: number;
}

export interface CompetitiveAnalysisResult {
  productCategory: ProductCategory;
  confidence: number;
  imageDescription: string;
  competitors: CompetitorBrand[];
  scrapedAds: ScrapedAd[];
  insights: CompetitiveInsight[];
  marketTrends: MarketTrend[];
  socialMediaAnalysis: any;
  competitiveImage: {
    imageBytes: string;
    mimeType: string;
  };
  summary: {
    totalCompetitorsAnalyzed: number;
    totalAdsScraped: number;
    averagePrice: number;
    topBrands: string[];
    keyInsights: string[];
    marketOpportunities: string[];
    competitiveGaps: string[];
  };
}

export class UnifiedCompetitiveAnalysisService {
  private gemini: GoogleGenAI | null = null;
  private apifyService: ApifyService;
  private factFluxService: FactFluxService;
  private brightDataService: BrightDataService;
  private vectorIndex: any = null; // Simplified for now

  constructor() {
    // Initialize Gemini AI
    if (process.env.GEMINI_API_KEY) {
      try {
        this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        console.log("✅ Gemini AI initialized successfully");
      } catch (error) {
        console.error("❌ Failed to initialize Gemini AI:", error);
        this.gemini = null;
      }
    } else {
      console.warn("⚠️ GEMINI_API_KEY not found, using mock data");
    }

    // Initialize services
    this.apifyService = new ApifyService();
    this.factFluxService = new FactFluxService();
    this.brightDataService = new BrightDataService();
  }

  /**
   * Initialize LlamaIndex vector store for document processing
   */
  private async initializeVectorStore(documents: any[]): Promise<void> {
    try {
      console.log("🔄 Initializing LlamaIndex vector store...");
      
      // For now, skip LlamaIndex initialization and use fallback
      console.log("⚠️ LlamaIndex initialization skipped, using fallback analysis");
      this.vectorIndex = null;
    } catch (error) {
      console.warn("⚠️ LlamaIndex initialization failed, using fallback analysis:", error);
      this.vectorIndex = null;
    }
  }

  /**
   * Process scraped data with LlamaIndex for advanced insights
   */
  private async processWithLlamaIndex(scrapedAds: ScrapedAd[], socialMediaData: any[]): Promise<{
    insights: CompetitiveInsight[];
    trends: MarketTrend[];
  }> {
    if (!this.vectorIndex) {
      console.log("🔄 LlamaIndex not available, using fallback analysis");
      return this.generateFallbackInsights(scrapedAds, socialMediaData);
    }

    try {
      console.log("🧠 Processing data with LlamaIndex...");
      
      // Create query engine
      const queryEngine = this.vectorIndex.asQueryEngine();
      
      // For now, skip LlamaIndex queries and use fallback
      console.log("⚠️ LlamaIndex queries skipped, using fallback analysis");
      
      return {
        insights: this.parseLlamaIndexInsights(""),
        trends: this.parseLlamaIndexTrends("")
      };
      
    } catch (error) {
      console.warn("⚠️ LlamaIndex processing failed, using fallback:", error);
      return this.generateFallbackInsights(scrapedAds, socialMediaData);
    }
  }

  /**
   * Parse LlamaIndex insights response
   */
  private parseLlamaIndexInsights(response: string): CompetitiveInsight[] {
    // Parse the response and extract structured insights
    const insights: CompetitiveInsight[] = [];
    
    // This is a simplified parser - in production, you'd use more sophisticated parsing
    const lines = response.split('\n').filter(line => line.trim());
    
    lines.forEach((line, index) => {
      if (line.includes('pricing') || line.includes('price')) {
        insights.push({
          id: `insight-${index}`,
          type: 'pricing',
          title: 'Pricing Strategy Insight',
          description: line,
          source: 'LlamaIndex Analysis',
          confidence: 0.8,
          relevance: 0.9,
          sentiment: 'neutral',
          category: 'pricing',
          supportingEvidence: [line],
          metadata: {
            platform: 'analysis',
            brand: 'multiple',
            timestamp: new Date().toISOString()
          }
        });
      }
    });
    
    return insights;
  }

  /**
   * Parse LlamaIndex trends response
   */
  private parseLlamaIndexTrends(response: string): MarketTrend[] {
    const trends: MarketTrend[] = [];
    
    const lines = response.split('\n').filter(line => line.trim());
    
    lines.forEach((line, index) => {
      if (line.length > 20) { // Filter out short lines
        trends.push({
          id: `trend-${index}`,
          trend: `Market Trend ${index + 1}`,
          description: line,
          impact: 'medium',
          timeframe: '6-12 months',
          supportingData: [line],
          confidence: 0.7
        });
      }
    });
    
    return trends;
  }

  /**
   * Generate fallback insights when LlamaIndex is not available
   */
  private generateFallbackInsights(scrapedAds: ScrapedAd[], socialMediaData: any[]): {
    insights: CompetitiveInsight[];
    trends: MarketTrend[];
  } {
    console.log("🔄 Generating fallback insights...");
    
    const insights: CompetitiveInsight[] = [];
    const trends: MarketTrend[] = [];
    
    // Analyze pricing patterns
    const prices = scrapedAds
      .filter(ad => ad.price)
      .map(ad => parseFloat(ad.price?.replace(/[^0-9.]/g, '') || '0'))
      .filter(price => price > 0);
    
    if (prices.length > 0) {
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      insights.push({
        id: 'pricing-analysis',
        type: 'pricing',
        title: 'Market Pricing Analysis',
        description: `Average market price: $${avgPrice.toFixed(2)}, Range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`,
        source: 'Price Analysis',
        confidence: 0.9,
        relevance: 0.95,
        sentiment: 'neutral',
        category: 'pricing',
        supportingEvidence: [`Analyzed ${prices.length} products`],
        metadata: {
          platform: 'analysis',
          brand: 'multiple',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Analyze brand presence
    const brandCounts = scrapedAds.reduce((acc, ad) => {
      acc[ad.brand] = (acc[ad.brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topBrands = Object.entries(brandCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    if (topBrands.length > 0) {
      insights.push({
        id: 'brand-dominance',
        type: 'positioning',
        title: 'Brand Market Presence',
        description: `Top brands by ad volume: ${topBrands.map(([brand, count]) => `${brand} (${count})`).join(', ')}`,
        source: 'Ad Volume Analysis',
        confidence: 0.8,
        relevance: 0.85,
        sentiment: 'neutral',
        category: 'positioning',
        supportingEvidence: [`Analyzed ${scrapedAds.length} ads`],
        metadata: {
          platform: 'analysis',
          brand: 'multiple',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Generate market trends
    trends.push({
      id: 'digital-marketing-trend',
      trend: 'Digital Marketing Growth',
      description: 'Increased focus on digital advertising and social media presence',
      impact: 'high',
      timeframe: '6-12 months',
      supportingData: [`${scrapedAds.length} digital ads analyzed`],
      confidence: 0.8
    });
    
    return { insights, trends };
  }

  /**
   * Main competitive analysis method
   */
  async analyzeCompetitiveLandscape(imageFile: File): Promise<CompetitiveAnalysisResult> {
    console.log("🚀 Starting unified competitive analysis...");
    
    try {
      // Step 1: Image Analysis with Gemini
      console.log("📸 Analyzing product image...");
      const imageBuffer = await imageFile.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString("base64");
      const mimeType = imageFile.type || "image/png";
      
      if (!this.gemini) {
        throw new Error("Gemini AI not available");
      }
      
      const analysisPrompt = `Analyze this product image and provide a detailed description focusing on:
      1. Product type and category
      2. Brand identification
      3. Key features and characteristics
      4. Target market and positioning
      5. Visual design elements
      
      Be specific and detailed for competitive analysis purposes.`;
      
      const analysisResponse = await this.gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { text: analysisPrompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64,
            },
          },
        ],
      });
      
      const imageDescription = analysisResponse.candidates[0].content.parts[0].text;
      console.log("✅ Image analysis completed");
      
      // Step 2: Product Category Detection
      console.log("🔍 Detecting product category...");
      const productAnalysis = detectProductCategory(imageDescription, imageFile.name);
      
      if (!productAnalysis) {
        throw new Error("Failed to detect product category");
      }
      
      console.log(`✅ Product category detected: ${productAnalysis.detectedCategory.name}`);
      
      // Step 3: Competitor Data Scraping with Apify
      console.log("🌐 Scraping competitor data with Apify...");
      const searchQueries = productAnalysis.suggestedCompetitors.map(competitor => 
        generateSearchQuery(productAnalysis.detectedCategory, competitor)
      );
      
      const scrapedResults = await this.apifyService.scrapeMultipleCompetitors(
        productAnalysis.suggestedCompetitors,
        searchQueries
      );
      
      const allScrapedAds = Object.values(scrapedResults).flat();
      console.log(`✅ Scraped ${allScrapedAds.length} competitor ads`);
      
      // Step 4: Social Media Analysis with FactFlux
      console.log("📱 Analyzing social media with FactFlux...");
      let socialMediaAnalysis = null;
      
      try {
        const competitorUrls = productAnalysis.suggestedCompetitors.map(competitor => ({
          name: competitor.name,
          urls: this.generateSocialMediaUrls(competitor, productAnalysis.detectedCategory)
        }));
        
        const allUrls = competitorUrls.flatMap(comp => comp.urls);
        
        if (allUrls.length > 0) {
          socialMediaAnalysis = await this.factFluxService.runCompetitiveAnalysis(
            allUrls,
            productAnalysis.detectedCategory.name
          );
          console.log("✅ Social media analysis completed");
        }
      } catch (error) {
        console.warn("⚠️ Social media analysis failed:", error);
      }
      
      // Step 5: Bright Data Enhanced Scraping
      console.log("🔍 Enhanced scraping with Bright Data...");
      let brightDataResults: any[] = [];
      
      try {
        for (const competitor of productAnalysis.suggestedCompetitors.slice(0, 2)) { // Limit to 2 for performance
          // For now, skip Bright Data scraping
          console.log(`⚠️ Bright Data scraping skipped for ${competitor.name}`);
        }
        console.log(`✅ Bright Data scraping completed: ${brightDataResults.length} results`);
      } catch (error) {
        console.warn("⚠️ Bright Data scraping failed:", error);
      }
      
      // Step 6: LlamaIndex Processing
      console.log("🧠 Processing with LlamaIndex...");
      
      // Create documents for LlamaIndex (simplified)
      const documents = [
        { text: imageDescription, metadata: { type: 'image_analysis' } },
        ...allScrapedAds.map(ad => ({ 
          text: `${ad.title} ${ad.description}`, 
          metadata: { type: 'scraped_ad', brand: ad.brand, platform: ad.platform } 
        })),
        ...(socialMediaAnalysis?.posts || []).map((post: any) => ({ 
          text: post.content, 
          metadata: { type: 'social_media', platform: post.platform } 
        })),
        ...brightDataResults.map(result => ({ 
          text: JSON.stringify(result), 
          metadata: { type: 'brightdata', source: 'enhanced_scraping' } 
        }))
      ];
      
      await this.initializeVectorStore(documents);
      const { insights, trends } = await this.processWithLlamaIndex(allScrapedAds, socialMediaAnalysis?.posts || []);
      
      // Step 7: Generate Competitive Image
      console.log("🎨 Generating competitive image...");
      const competitiveImageResponse = await this.gemini.models.generateImages({
        model: "imagen-4.0-fast-generate-001",
        prompt: `Create a professional ${productAnalysis.detectedCategory.name} advertisement with modern design and clean background`,
        config: {
          aspectRatio: "16:9",
        },
      });
      
      const competitiveImage = competitiveImageResponse.generatedImages?.[0]?.image;
      if (!competitiveImage?.imageBytes) {
        throw new Error("Failed to generate competitive image");
      }
      
      // Step 8: Generate Summary
      const summary = this.generateSummary(
        productAnalysis.suggestedCompetitors,
        allScrapedAds,
        insights,
        trends
      );
      
      console.log("🎉 Unified competitive analysis completed!");
      
      return {
        productCategory: productAnalysis.detectedCategory,
        confidence: productAnalysis.confidence,
        imageDescription,
        competitors: productAnalysis.suggestedCompetitors,
        scrapedAds: allScrapedAds,
        insights,
        marketTrends: trends,
        socialMediaAnalysis,
        competitiveImage: {
          imageBytes: competitiveImage.imageBytes,
          mimeType: competitiveImage.mimeType || "image/png",
        },
        summary
      };
      
    } catch (error) {
      console.error("💥 Error in unified competitive analysis:", error);
      throw error;
    }
  }

  /**
   * Generate social media URLs for competitors
   */
  private generateSocialMediaUrls(competitor: CompetitorBrand, category: ProductCategory): string[] {
    const competitorName = competitor.name.toLowerCase().replace(/\s+/g, '');
    
    return [
      `https://www.instagram.com/${competitorName}`,
      `https://www.twitter.com/${competitorName}`,
      `https://www.tiktok.com/@${competitorName}`,
      `https://www.facebook.com/${competitorName}`,
      `https://www.youtube.com/@${competitorName}`,
      `https://www.linkedin.com/company/${competitorName}`
    ];
  }

  /**
   * Generate comprehensive summary
   */
  private generateSummary(
    competitors: CompetitorBrand[],
    scrapedAds: ScrapedAd[],
    insights: CompetitiveInsight[],
    trends: MarketTrend[]
  ) {
    const prices = scrapedAds
      .filter(ad => ad.price)
      .map(ad => parseFloat(ad.price?.replace(/[^0-9.]/g, '') || '0'))
      .filter(price => price > 0);
    
    const averagePrice = prices.length > 0 
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length 
      : 0;
    
    const topBrands = Array.from(new Set(scrapedAds.map(ad => ad.brand)));
    
    const keyInsights = insights
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(insight => insight.description);
    
    const marketOpportunities = trends
      .filter(trend => trend.impact === 'high')
      .map(trend => trend.description);
    
    const competitiveGaps = insights
      .filter(insight => insight.type === 'positioning' && insight.sentiment === 'negative')
      .map(insight => insight.description);
    
    return {
      totalCompetitorsAnalyzed: competitors.length,
      totalAdsScraped: scrapedAds.length,
      averagePrice,
      topBrands,
      keyInsights,
      marketOpportunities,
      competitiveGaps
    };
  }
}
