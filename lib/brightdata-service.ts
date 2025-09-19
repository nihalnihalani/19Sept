import { spawn } from 'child_process';
import { promisify } from 'util';

// Bright Data MCP service for web scraping and data extraction
export interface BrightDataConfig {
  apiToken: string;
  webUnlockerZone: string;
  browserZone: string;
  timeout: number;
}

export interface ScrapingResult {
  success: boolean;
  data?: any;
  error?: string;
  url: string;
  platform: string;
  timestamp: string;
}

export class BrightDataService {
  private config: BrightDataConfig;
  private mcpProcess: any;

  constructor() {
    this.config = {
      apiToken: process.env.BRIGHT_DATA_API_KEY || '987dbfc5a1017f6d5bb7deb3d2f70bb0464b0be01091bd767887d1f532363a73',
      webUnlockerZone: process.env.BRIGHT_DATA_WEB_UNLOCKER_ZONE || 'unblocker',
      browserZone: process.env.BRIGHT_DATA_BROWSER_ZONE || 'scraping_browser',
      timeout: parseInt(process.env.BRIGHT_DATA_TIMEOUT || '30000')
    };
  }

  /**
   * Initialize Bright Data MCP connection
   */
  async initialize(): Promise<void> {
    console.log('🔧 Initializing Bright Data MCP connection...');
    
    try {
      // Start MCP server process
      this.mcpProcess = spawn('npx', ['@brightdata/mcp'], {
        env: {
          ...process.env,
          API_TOKEN: this.config.apiToken,
          WEB_UNLOCKER_ZONE: this.config.webUnlockerZone,
          BROWSER_ZONE: this.config.browserZone
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Wait for MCP server to be ready
      await this.waitForMCPReady();
      console.log('✅ Bright Data MCP connection established');
    } catch (error) {
      console.error('❌ Failed to initialize Bright Data MCP:', error);
      throw error;
    }
  }

  /**
   * Wait for MCP server to be ready
   */
  private async waitForMCPReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MCP server startup timeout'));
      }, this.config.timeout);

      this.mcpProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        if (output.includes('MCP server ready') || output.includes('listening')) {
          clearTimeout(timeout);
          resolve();
        }
      });

      this.mcpProcess.stderr?.on('data', (data: Buffer) => {
        const error = data.toString();
        if (error.includes('error') || error.includes('failed')) {
          clearTimeout(timeout);
          reject(new Error(`MCP server error: ${error}`));
        }
      });
    });
  }

  /**
   * Scrape social media post data
   */
  async scrapeSocialMediaPost(url: string, platform: string): Promise<ScrapingResult> {
    console.log(`🔍 Scraping ${platform} post: ${url}`);

    try {
      let result: any;

      switch (platform) {
        case 'tiktok':
          result = await this.scrapeTikTokPost(url);
          break;
        case 'instagram':
          result = await this.scrapeInstagramPost(url);
          break;
        case 'twitter':
        case 'x':
          result = await this.scrapeTwitterPost(url);
          break;
        case 'facebook':
          result = await this.scrapeFacebookPost(url);
          break;
        case 'youtube':
          result = await this.scrapeYouTubePost(url);
          break;
        case 'linkedin':
          result = await this.scrapeLinkedInPost(url);
          break;
        default:
          result = await this.scrapeGenericPost(url);
      }

      return {
        success: true,
        data: result,
        url,
        platform,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Failed to scrape ${platform} post:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        url,
        platform,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Scrape TikTok post data
   */
  private async scrapeTikTokPost(url: string): Promise<any> {
    const command = {
      method: 'web_data_tiktok_posts',
      params: {
        urls: [url],
        include_comments: true,
        include_engagement: true
      }
    };

    return await this.executeMCPCommand(command);
  }

  /**
   * Scrape Instagram post data
   */
  private async scrapeInstagramPost(url: string): Promise<any> {
    const command = {
      method: 'scrape_as_markdown',
      params: {
        url,
        include_images: true,
        include_videos: true,
        include_engagement: true
      }
    };

    return await this.executeMCPCommand(command);
  }

  /**
   * Scrape Twitter/X post data
   */
  private async scrapeTwitterPost(url: string): Promise<any> {
    const command = {
      method: 'scrape_as_markdown',
      params: {
        url,
        include_images: true,
        include_videos: true,
        include_engagement: true
      }
    };

    return await this.executeMCPCommand(command);
  }

  /**
   * Scrape Facebook post data
   */
  private async scrapeFacebookPost(url: string): Promise<any> {
    const command = {
      method: 'scrape_as_markdown',
      params: {
        url,
        include_images: true,
        include_videos: true,
        include_engagement: true
      }
    };

    return await this.executeMCPCommand(command);
  }

  /**
   * Scrape YouTube post data
   */
  private async scrapeYouTubePost(url: string): Promise<any> {
    const command = {
      method: 'scrape_as_markdown',
      params: {
        url,
        include_videos: true,
        include_engagement: true,
        include_transcript: true
      }
    };

    return await this.executeMCPCommand(command);
  }

  /**
   * Scrape LinkedIn post data
   */
  private async scrapeLinkedInPost(url: string): Promise<any> {
    const command = {
      method: 'scrape_as_markdown',
      params: {
        url,
        include_images: true,
        include_videos: true,
        include_engagement: true
      }
    };

    return await this.executeMCPCommand(command);
  }

  /**
   * Scrape generic post data
   */
  private async scrapeGenericPost(url: string): Promise<any> {
    const command = {
      method: 'scrape_as_markdown',
      params: {
        url,
        include_images: true,
        include_videos: true,
        include_engagement: true
      }
    };

    return await this.executeMCPCommand(command);
  }

  /**
   * Execute MCP command
   */
  private async executeMCPCommand(command: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MCP command timeout'));
      }, this.config.timeout);

      // Send command to MCP server
      this.mcpProcess.stdin?.write(JSON.stringify(command) + '\n');

      // Listen for response
      this.mcpProcess.stdout?.on('data', (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString());
          clearTimeout(timeout);
          resolve(response);
        } catch (error) {
          // Continue listening for valid JSON
        }
      });

      this.mcpProcess.stderr?.on('data', (data: Buffer) => {
        const error = data.toString();
        clearTimeout(timeout);
        reject(new Error(`MCP command error: ${error}`));
      });
    });
  }

  /**
   * Search for competitor mentions across platforms
   */
  async searchCompetitorMentions(
    competitorName: string,
    platforms: string[] = ['twitter', 'instagram', 'tiktok', 'facebook']
  ): Promise<ScrapingResult[]> {
    console.log(`🔍 Searching for mentions of ${competitorName} across platforms...`);

    const results: ScrapingResult[] = [];

    for (const platform of platforms) {
      try {
        const searchResults = await this.searchPlatform(platform, competitorName);
        results.push(...searchResults);
      } catch (error) {
        console.error(`Error searching ${platform}:`, error);
      }
    }

    console.log(`✅ Found ${results.length} mentions across platforms`);
    return results;
  }

  /**
   * Search specific platform for mentions
   */
  private async searchPlatform(platform: string, query: string): Promise<ScrapingResult[]> {
    const command = {
      method: 'search_social_media',
      params: {
        platform,
        query,
        limit: 20,
        include_engagement: true
      }
    };

    try {
      const response = await this.executeMCPCommand(command);
      return response.results || [];
    } catch (error) {
      console.error(`Error searching ${platform}:`, error);
      return [];
    }
  }

  /**
   * Get trending topics for a category
   */
  async getTrendingTopics(category: string): Promise<string[]> {
    console.log(`📈 Getting trending topics for ${category}...`);

    const command = {
      method: 'get_trending_topics',
      params: {
        category,
        platforms: ['twitter', 'instagram', 'tiktok'],
        limit: 20
      }
    };

    try {
      const response = await this.executeMCPCommand(command);
      return response.topics || [];
    } catch (error) {
      console.error('Error getting trending topics:', error);
      return [];
    }
  }

  /**
   * Analyze engagement patterns
   */
  async analyzeEngagementPatterns(urls: string[]): Promise<any> {
    console.log(`📊 Analyzing engagement patterns for ${urls.length} posts...`);

    const results = [];

    for (const url of urls) {
      try {
        const result = await this.scrapeSocialMediaPost(url, 'generic');
        if (result.success) {
          results.push(result.data);
        }
      } catch (error) {
        console.error(`Error analyzing ${url}:`, error);
      }
    }

    return this.calculateEngagementMetrics(results);
  }

  /**
   * Calculate engagement metrics
   */
  private calculateEngagementMetrics(posts: any[]): any {
    if (posts.length === 0) return {};

    const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
    const totalShares = posts.reduce((sum, post) => sum + (post.shares || 0), 0);
    const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0);

    return {
      totalPosts: posts.length,
      averageLikes: Math.round(totalLikes / posts.length),
      averageShares: Math.round(totalShares / posts.length),
      averageComments: Math.round(totalComments / posts.length),
      totalEngagement: totalLikes + totalShares + totalComments,
      averageEngagement: Math.round((totalLikes + totalShares + totalComments) / posts.length)
    };
  }

  /**
   * Cleanup MCP connection
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Bright Data MCP connection...');
    
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
    
    console.log('✅ Bright Data MCP connection cleaned up');
  }
}
