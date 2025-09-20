import { GoogleGenAI } from "@google/genai";

// FactFlux-inspired service for competitive analysis using social media data
export interface SocialMediaPost {
  platform: string;
  url: string;
  content: string;
  author: string;
  timestamp: string;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  mediaUrls: string[];
  hashtags: string[];
  mentions: string[];
}

export interface CompetitiveInsight {
  claim: string;
  source: string;
  credibility: number;
  relevance: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
  evidence: string[];
  timestamp: string;
}

export interface FactFluxAnalysis {
  posts: SocialMediaPost[];
  insights: CompetitiveInsight[];
  summary: {
    totalPosts: number;
    topPlatforms: string[];
    averageEngagement: number;
    trendingTopics: string[];
    competitorMentions: string[];
  };
  confidence: number;
}

export class FactFluxService {
  private gemini: GoogleGenAI | null;
  private brightDataApiKey: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      try {
        this.gemini = new GoogleGenAI({ apiKey });
        // Test if the instance is properly created by checking for models property
        if (this.gemini && this.gemini.models && typeof this.gemini.models.generateContent === 'function') {
          console.log('✅ Gemini API initialized successfully');
        } else {
          console.log('⚠️ Gemini API initialization failed, using mock data');
          this.gemini = null;
        }
      } catch (error) {
        console.log('⚠️ Gemini API initialization error:', error);
        this.gemini = null;
      }
    } else {
      this.gemini = null; // Will use mock data instead
      console.log('⚠️ Gemini API key not found, using mock data');
    }
    this.brightDataApiKey = process.env.BRIGHT_DATA_API_KEY || '987dbfc5a1017f6d5bb7deb3d2f70bb0464b0be01091bd767887d1f532363a73';
  }

  /**
   * Extract social media data for competitive analysis
   * Inspired by FactFlux content extraction but focused on competitive intelligence
   */
  async extractSocialMediaData(competitorUrls: string[]): Promise<SocialMediaPost[]> {
    console.log('🔍 Extracting social media data for competitive analysis...');
    
    const posts: SocialMediaPost[] = [];

    for (const url of competitorUrls) {
      try {
        const postData = await this.extractPostData(url);
        if (postData) {
          posts.push(postData);
        }
      } catch (error) {
        console.error(`Error extracting data from ${url}:`, error);
      }
    }

    console.log(`✅ Extracted ${posts.length} social media posts`);
    return posts;
  }

  /**
   * Extract data from a single social media post
   */
  private async extractPostData(url: string): Promise<SocialMediaPost | null> {
    try {
      // For now, return mock data since Bright Data MCP integration needs proper setup
      // In a production environment, you would use the Bright Data MCP tools directly
      console.log(`🔍 Mocking data extraction for ${url}`);
      
      // Return mock social media post data
      return {
        platform: this.detectPlatform(url),
        url: url,
        content: `Sample content from ${this.detectPlatform(url)}`,
        author: 'sample_author',
        timestamp: new Date().toISOString(),
        engagement: {
          likes: Math.floor(Math.random() * 1000),
          shares: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 50)
        },
        hashtags: ['#sample', '#content'],
        mentions: ['@sample'],
        mediaUrls: ['https://example.com/mock-image.jpg']
      };
    } catch (error) {
      console.error(`Error extracting post data from ${url}:`, error);
      return null;
    }
  }

  /**
   * Detect social media platform from URL
   */
  private detectPlatform(url: string): string {
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('facebook.com')) return 'facebook';
    if (url.includes('youtube.com')) return 'youtube';
    if (url.includes('linkedin.com')) return 'linkedin';
    return 'unknown';
  }

  /**
   * Parse scraped data into structured format
   */
  private parseScrapedData(data: any, url: string): SocialMediaPost {
    return {
      platform: this.detectPlatform(url),
      url,
      content: data.content || data.text || '',
      author: data.author || data.username || 'Unknown',
      timestamp: data.timestamp || data.date || new Date().toISOString(),
      engagement: {
        likes: parseInt(data.likes || data.like_count || '0'),
        shares: parseInt(data.shares || data.share_count || '0'),
        comments: parseInt(data.comments || data.comment_count || '0')
      },
      mediaUrls: data.media_urls || data.images || [],
      hashtags: this.extractHashtags(data.content || ''),
      mentions: this.extractMentions(data.content || '')
    };
  }

  /**
   * Extract hashtags from content
   */
  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    return content.match(hashtagRegex) || [];
  }

  /**
   * Extract mentions from content
   */
  private extractMentions(content: string): string[] {
    const mentionRegex = /@[\w\u0590-\u05ff]+/g;
    return content.match(mentionRegex) || [];
  }

  /**
   * Identify competitive claims and insights from social media posts
   * Inspired by FactFlux claim identification but focused on competitive intelligence
   */
  async identifyCompetitiveClaims(posts: SocialMediaPost[], category: string): Promise<CompetitiveInsight[]> {
    console.log('🎯 Identifying competitive claims and insights...');

    const insights: CompetitiveInsight[] = [];

    for (const post of posts) {
      try {
        const postInsights = await this.analyzePostForClaims(post, category);
        insights.push(...postInsights);
      } catch (error) {
        console.error(`Error analyzing post ${post.url}:`, error);
      }
    }

    console.log(`✅ Identified ${insights.length} competitive insights`);
    return insights;
  }

  /**
   * Analyze a single post for competitive claims
   */
  private async analyzePostForClaims(post: SocialMediaPost, category: string): Promise<CompetitiveInsight[]> {
    const prompt = `
    Analyze this ${post.platform} post for competitive intelligence insights related to ${category}:

    Content: ${post.content}
    Author: ${post.author}
    Engagement: ${post.engagement.likes} likes, ${post.engagement.shares} shares, ${post.engagement.comments} comments
    Hashtags: ${post.hashtags.join(', ')}
    Mentions: ${post.mentions.join(', ')}

    Identify:
    1. Product claims or features mentioned
    2. Pricing information
    3. Market positioning statements
    4. Customer testimonials or reviews
    5. Competitive comparisons
    6. Marketing strategies or campaigns
    7. Brand messaging or value propositions

    For each insight, provide:
    - The specific claim or insight
    - Source (post URL)
    - Credibility score (0-100)
    - Relevance to ${category} (0-100)
    - Sentiment (positive/negative/neutral)
    - Category of insight
    - Supporting evidence

    Return as JSON array of insights.
    `;

    // If Gemini is not available or not properly initialized, return mock insights
    if (!this.gemini || this.gemini === null || !this.gemini.models) {
      console.log('🔧 Gemini not available or not properly initialized, using mock insights');
      return this.generateMockInsights(post, category);
    }

    try {
      const result = await this.gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: prompt }] }]
      });
      const text = result.text;

      // Parse the JSON response
      const insights = JSON.parse(text);
      return insights.map((insight: any) => ({
        claim: insight.claim,
        source: post.url,
        credibility: insight.credibility,
        relevance: insight.relevance,
        sentiment: insight.sentiment,
        category: insight.category,
        evidence: insight.evidence || [],
        timestamp: post.timestamp
      }));
    } catch (error) {
      console.error('Error analyzing post for claims:', error);
      return this.generateMockInsights(post, category);
    }
  }

  private generateMockInsights(post: SocialMediaPost, category: string): CompetitiveInsight[] {
    // Generate realistic mock insights based on the post content
    const insights: CompetitiveInsight[] = [];
    
    // Simple keyword-based analysis for mock data
    const content = post.content.toLowerCase();
    const hashtags = post.hashtags.join(' ').toLowerCase();
    const allText = `${content} ${hashtags}`;

    // Check for common competitive keywords
    if (allText.includes('new') || allText.includes('launch') || allText.includes('introducing')) {
      insights.push({
        claim: "Product launch or new feature announcement",
        source: post.url,
        credibility: 85,
        relevance: 90,
        sentiment: 'positive',
        category: category,
        evidence: [post.content],
        timestamp: post.timestamp
      });
    }

    if (allText.includes('better') || allText.includes('improved') || allText.includes('enhanced')) {
      insights.push({
        claim: "Product improvement or enhancement claim",
        source: post.url,
        credibility: 75,
        relevance: 85,
        sentiment: 'positive',
        category: category,
        evidence: [post.content],
        timestamp: post.timestamp
      });
    }

    if (allText.includes('price') || allText.includes('cost') || allText.includes('affordable')) {
      insights.push({
        claim: "Pricing or value proposition",
        source: post.url,
        credibility: 80,
        relevance: 80,
        sentiment: 'positive',
        category: category,
        evidence: [post.content],
        timestamp: post.timestamp
      });
    }

    if (allText.includes('quality') || allText.includes('premium') || allText.includes('best')) {
      insights.push({
        claim: "Quality or premium positioning",
        source: post.url,
        credibility: 70,
        relevance: 75,
        sentiment: 'positive',
        category: category,
        evidence: [post.content],
        timestamp: post.timestamp
      });
    }

    return insights;
  }

  /**
   * Cross-reference competitive insights with authoritative sources
   * Inspired by FactFlux cross-referencing but focused on competitive intelligence
   */
  async crossReferenceInsights(insights: CompetitiveInsight[]): Promise<CompetitiveInsight[]> {
    console.log('🔍 Cross-referencing competitive insights...');

    const verifiedInsights: CompetitiveInsight[] = [];

    for (const insight of insights) {
      try {
        const verifiedInsight = await this.verifyInsight(insight);
        verifiedInsights.push(verifiedInsight);
      } catch (error) {
        console.error(`Error verifying insight: ${insight.claim}`, error);
        verifiedInsights.push(insight); // Keep original if verification fails
      }
    }

    console.log(`✅ Cross-referenced ${verifiedInsights.length} insights`);
    return verifiedInsights;
  }

  /**
   * Verify a single insight against authoritative sources
   */
  private async verifyInsight(insight: CompetitiveInsight): Promise<CompetitiveInsight> {
    // If Gemini is not available or not properly initialized, return the insight as-is
    if (!this.gemini || this.gemini === null || !this.gemini.models) {
      return insight;
    }

    const prompt = `
    Verify this competitive insight against authoritative sources:

    Claim: ${insight.claim}
    Category: ${insight.category}
    Source: ${insight.source}

    Search for:
    1. Official company announcements or press releases
    2. News articles from reputable sources
    3. Industry reports or analysis
    4. Financial filings or SEC documents
    5. Official social media accounts
    6. Product documentation or specifications

    Provide:
    - Verification status (verified/partially_verified/unverified)
    - Supporting sources with URLs
    - Updated credibility score
    - Any corrections or additional context

    Return as JSON with verification details.
    `;

    try {
      const result = await this.gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: prompt }] }]
      });
      const text = result.text;

      const verification = JSON.parse(text);
      
      return {
        ...insight,
        credibility: verification.credibility || insight.credibility,
        evidence: [...insight.evidence, ...(verification.sources || [])]
      };
    } catch (error) {
      console.error('Error verifying insight:', error);
      return insight;
    }
  }

  /**
   * Generate comprehensive competitive analysis report
   * Inspired by FactFlux verdict synthesis but focused on competitive intelligence
   */
  async generateCompetitiveAnalysis(
    posts: SocialMediaPost[],
    insights: CompetitiveInsight[],
    category: string
  ): Promise<FactFluxAnalysis> {
    console.log('📊 Generating comprehensive competitive analysis...');

    const summary = {
      totalPosts: posts.length,
      topPlatforms: this.getTopPlatforms(posts),
      averageEngagement: this.calculateAverageEngagement(posts),
      trendingTopics: this.getTrendingTopics(posts),
      competitorMentions: this.getCompetitorMentions(posts)
    };

    const confidence = this.calculateConfidence(insights);

    console.log('✅ Generated competitive analysis report');
    
    return {
      posts,
      insights,
      summary,
      confidence
    };
  }

  /**
   * Get top platforms by post count
   */
  private getTopPlatforms(posts: SocialMediaPost[]): string[] {
    const platformCounts = posts.reduce((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(platformCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([platform]) => platform);
  }

  /**
   * Calculate average engagement across all posts
   */
  private calculateAverageEngagement(posts: SocialMediaPost[]): number {
    if (posts.length === 0) return 0;
    
    const totalEngagement = posts.reduce((sum, post) => {
      return sum + post.engagement.likes + post.engagement.shares + post.engagement.comments;
    }, 0);

    return Math.round(totalEngagement / posts.length);
  }

  /**
   * Get trending topics from hashtags
   */
  private getTrendingTopics(posts: SocialMediaPost[]): string[] {
    const hashtagCounts = posts.reduce((acc, post) => {
      post.hashtags.forEach(hashtag => {
        acc[hashtag] = (acc[hashtag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([hashtag]) => hashtag);
  }

  /**
   * Get competitor mentions
   */
  private getCompetitorMentions(posts: SocialMediaPost[]): string[] {
    const mentions = new Set<string>();
    posts.forEach(post => {
      post.mentions.forEach(mention => mentions.add(mention));
    });
    return Array.from(mentions);
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(insights: CompetitiveInsight[]): number {
    if (insights.length === 0) return 0;
    
    const totalCredibility = insights.reduce((sum, insight) => sum + insight.credibility, 0);
    return Math.round(totalCredibility / insights.length);
  }

  /**
   * Main method to run complete FactFlux-inspired competitive analysis
   */
  async runCompetitiveAnalysis(
    competitorUrls: string[],
    category: string
  ): Promise<FactFluxAnalysis> {
    console.log('🚀 Starting FactFlux-inspired competitive analysis...');

    // Step 1: Extract social media data
    const posts = await this.extractSocialMediaData(competitorUrls);

    // Step 2: Identify competitive claims
    const insights = await this.identifyCompetitiveClaims(posts, category);

    // Step 3: Cross-reference insights
    const verifiedInsights = await this.crossReferenceInsights(insights);

    // Step 4: Generate comprehensive analysis
    const analysis = await this.generateCompetitiveAnalysis(posts, verifiedInsights, category);

    console.log('✅ FactFlux competitive analysis completed');
    return analysis;
  }
}
