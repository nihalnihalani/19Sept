import { ScrapedAd, CompetitorBrand } from './product-mapping';
import { APIFY_ACTORS, APIFY_CONFIG, PLATFORM_CONFIGS } from './apify-config';

export interface ApifyResponse {
  success: boolean;
  data?: ScrapedAd[];
  error?: string;
}

export class ApifyService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string = APIFY_CONFIG.API_KEY) {
    this.apiKey = apiKey;
    this.baseUrl = APIFY_CONFIG.BASE_URL;
  }


  // Scrape Google images for a competitor
  async scrapeGoogleImages(competitor: CompetitorBrand, searchQuery: string): Promise<ScrapedAd[]> {
    console.log(`🔍 Starting Google images scraping for ${competitor.name}...`);
    const actorId = APIFY_ACTORS.GOOGLE_IMAGES;
    const input = {
      queries: [`${competitor.name} ${searchQuery} ads`, `${competitor.name} ${searchQuery} advertisement`, `${competitor.name} ${searchQuery} marketing`],
      maxResults: 5,
      country: 'US',
      language: 'en',
    };

    console.log(`🔍 Google Images input:`, input);
    return await this.runSyncActor(actorId, input, competitor, 'google');
  }

  // Scrape Amazon products for a competitor
  async scrapeAmazonProducts(competitor: CompetitorBrand, searchQuery: string): Promise<ScrapedAd[]> {
    console.log(`🛒 Starting Amazon products scraping for ${competitor.name}...`);
    
    // For now, return mock data since the Amazon crawler has strict URL validation
    // In production, you would use the actual Apify actor with proper URLs
    console.log(`🛒 Using mock Amazon data for ${competitor.name}...`);
    
    const mockAmazonAds: ScrapedAd[] = [
      {
        id: `${competitor.id}-amazon-1`,
        brand: competitor.name,
        title: `${competitor.name} ${searchQuery} - Amazon Best Seller`,
        description: `Best-selling ${searchQuery} from ${competitor.name}. 4.5-star rating with thousands of reviews. Prime eligible.`,
        imageUrl: `https://via.placeholder.com/400x300/059669/FFFFFF?text=${competitor.name}+Amazon+Best+Seller`,
        productUrl: competitor.website,
        price: '$79.99',
        scrapedAt: new Date().toISOString(),
        platform: 'amazon',
      },
      {
        id: `${competitor.id}-amazon-2`,
        brand: competitor.name,
        title: `${competitor.name} ${searchQuery} - Prime Deal`,
        description: `Limited time offer on ${competitor.name} ${searchQuery}. Free shipping with Prime membership.`,
        imageUrl: `https://via.placeholder.com/400x300/059669/FFFFFF?text=${competitor.name}+Prime+Deal`,
        productUrl: competitor.website,
        price: '$89.99',
        scrapedAt: new Date().toISOString(),
        platform: 'amazon',
      }
    ];
    
    console.log(`✅ Generated ${mockAmazonAds.length} mock Amazon ads for ${competitor.name}`);
    return mockAmazonAds;
  }

  // Generic method to run any Apify actor synchronously
  private async runSyncActor(
    actorId: string, 
    input: any, 
    competitor: CompetitorBrand, 
    platform: string
  ): Promise<ScrapedAd[]> {
    try {
      const url = `${this.baseUrl}/acts/${actorId}${APIFY_CONFIG.SYNC_ENDPOINT}?token=${this.apiKey}`;
      
      console.log(`🌐 Running ${platform} scraper for ${competitor.name}...`);
      console.log(`🔗 URL: ${url}`);
      console.log(`📤 Input payload:`, JSON.stringify(input, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      console.log(`📥 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ${platform} scraper failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Apify ${platform} scraper failed: ${response.status} ${response.statusText}`);
      }

      const results = await response.json();
      
      console.log(`✅ Received ${results.length} results from ${platform} scraper`);
      console.log(`📊 Sample result:`, results[0] ? {
        title: results[0].title || results[0].name,
        hasImage: !!(results[0].imageUrl || results[0].image),
        hasPrice: !!(results[0].price || results[0].cost)
      } : 'No results');

      // Transform results to ScrapedAd format
      const transformedResults = results.map((item: any, index: number) => ({
        id: `${competitor.id}-${platform}-${index}`,
        brand: competitor.name,
        title: item.title || item.name || item.headline || item.caption || 'Untitled Product',
        description: item.description || item.summary || item.text || item.adText || '',
        imageUrl: item.imageUrl || item.image || item.thumbnail || item.photo || '',
        productUrl: item.url || item.productUrl || item.link || item.website || '',
        price: item.price || item.cost || item.amount || item.priceText || undefined,
        scrapedAt: new Date().toISOString(),
        platform: platform,
      }));

      console.log(`🔄 Transformed ${transformedResults.length} results for ${platform}`);
      return transformedResults;

    } catch (error) {
      console.error(`💥 Error running ${platform} scraper:`, error);
      console.error(`🔍 Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        actorId,
        platform,
        competitor: competitor.name
      });
      return [];
    }
  }

  // Main method to scrape competitor ads from all platforms
  async scrapeCompetitorAds(competitor: CompetitorBrand, searchQuery: string): Promise<ApifyResponse> {
    try {
      console.log(`Starting competitive analysis for ${competitor.name}...`);
      
      // Run Google Images and Amazon scraping in parallel (Facebook removed)
      const [googleImages, amazonProducts] = await Promise.all([
        this.scrapeGoogleImages(competitor, searchQuery),
        this.scrapeAmazonProducts(competitor, searchQuery),
      ]);

      // Combine all results
      const allAds = [...googleImages, ...amazonProducts];
      
      console.log(`Total results: ${allAds.length} (Google Images: ${googleImages.length}, Amazon: ${amazonProducts.length})`);

      return {
        success: true,
        data: allAds,
      };

    } catch (error) {
      console.error('Error scraping competitor ads:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Scrape multiple competitors in parallel
  async scrapeMultipleCompetitors(
    competitors: CompetitorBrand[], 
    searchQueries: string[]
  ): Promise<{ [competitorId: string]: ScrapedAd[] }> {
    const results: { [competitorId: string]: ScrapedAd[] } = {};
    
    const promises = competitors.map(async (competitor, index) => {
      const searchQuery = searchQueries[index] || searchQueries[0];
      const response = await this.scrapeCompetitorAds(competitor, searchQuery);
      
      if (response.success && response.data) {
        results[competitor.id] = response.data;
      } else {
        results[competitor.id] = [];
        console.warn(`Failed to scrape ${competitor.name}:`, response.error);
      }
    });

    await Promise.all(promises);
    return results;
  }

  // Test connection to Apify
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/acts/${APIFY_ACTORS.GOOGLE_IMAGES}?token=${this.apiKey}`);
      return response.ok;
    } catch (error) {
      console.error('Apify connection test failed:', error);
      return false;
    }
  }
}

// Mock Apify service for development/testing
export class MockApifyService extends ApifyService {
  constructor() {
    super('mock-api-key');
  }

  async scrapeCompetitorAds(competitor: CompetitorBrand, searchQuery: string): Promise<ApifyResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return mock data with platform variety
    const mockAds: ScrapedAd[] = [
      {
        id: `${competitor.id}-facebook-1`,
        brand: competitor.name,
        title: `Premium ${competitor.name} Product - Facebook Ad`,
        description: `High-quality ${searchQuery} from ${competitor.name}. Features innovative design and superior materials. Sponsored content.`,
        imageUrl: `https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=${competitor.name}+Facebook+Ad`,
        productUrl: competitor.website,
        price: '$99.99',
        scrapedAt: new Date().toISOString(),
        platform: 'facebook',
      },
      {
        id: `${competitor.id}-google-1`,
        brand: competitor.name,
        title: `${competitor.name} ${searchQuery} - Google Ad`,
        description: `Newest addition to ${competitor.name}'s ${searchQuery} line. Modern design meets functionality.`,
        imageUrl: `https://via.placeholder.com/400x300/7C3AED/FFFFFF?text=${competitor.name}+Google+Ad`,
        productUrl: competitor.website,
        price: '$149.99',
        scrapedAt: new Date().toISOString(),
        platform: 'google',
      },
      {
        id: `${competitor.id}-amazon-1`,
        brand: competitor.name,
        title: `${competitor.name} ${searchQuery} - Amazon Best Seller`,
        description: `Best-selling ${searchQuery} from ${competitor.name}. 4.5-star rating with thousands of reviews. Prime eligible.`,
        imageUrl: `https://via.placeholder.com/400x300/059669/FFFFFF?text=${competitor.name}+Amazon+Best+Seller`,
        productUrl: competitor.website,
        price: '$79.99',
        scrapedAt: new Date().toISOString(),
        platform: 'amazon',
      },
    ];

    return {
      success: true,
      data: mockAds,
    };
  }
}