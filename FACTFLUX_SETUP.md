# FactFlux Integration Setup Guide

This guide will help you set up the FactFlux-inspired social media competitive analysis in your Alchemy Studio project.

## Overview

FactFlux integration provides advanced social media competitive analysis using:
- **Multi-Platform Support**: TikTok, Instagram, Twitter/X, Facebook, YouTube, LinkedIn
- **Intelligent Data Extraction**: Automated social media post scraping and analysis
- **Competitive Intelligence**: AI-powered claim identification and verification
- **Trending Analysis**: Real-time trending topics and engagement metrics
- **Cross-Reference Verification**: Evidence-based insights with credibility scoring

## Prerequisites

1. **Bright Data API Key**: Sign up at [Bright Data](https://brightdata.com) for web scraping services
2. **Gemini API Key**: Already configured for image generation
3. **Node.js**: Version 20.17.0 or higher

## Installation

The required packages have been installed:
- `@brightdata/mcp` - Bright Data MCP tools for web scraping
- `@google/genai` - Google Gemini AI for analysis

## Configuration

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Bright Data Configuration
BRIGHT_DATA_API_KEY=your_bright_data_api_key_here
BRIGHT_DATA_WEB_UNLOCKER_ZONE=unblocker
BRIGHT_DATA_BROWSER_ZONE=scraping_browser
BRIGHT_DATA_TIMEOUT=30000

# Existing Gemini API Key (already configured)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Bright Data Setup

1. **Create Bright Data Account**:
   - Go to [Bright Data Console](https://brightdata.com/cp/account)
   - Sign up for a free trial or paid plan
   - Navigate to the "API" section

2. **Get API Key**:
   - Generate a new API key
   - Copy the key and replace `your_bright_data_api_key_here` in your `.env.local`

3. **Configure Zones**:
   - **Web Unlocker Zone**: Used for general web scraping
   - **Browser Zone**: Used for JavaScript-heavy sites like social media platforms

## API Endpoints

### 1. FactFlux Analysis
```javascript
// POST /api/factflux/analyze
{
  "competitorUrls": [
    "https://www.instagram.com/nike",
    "https://www.tiktok.com/@nike",
    "https://www.twitter.com/nike"
  ],
  "category": "shoes",
  "searchTerms": ["athletic shoes", "sneakers"]
}
```

### 2. Bright Data Scraping
```javascript
// POST /api/brightdata/scrape
{
  "url": "https://www.instagram.com/p/example",
  "platform": "instagram",
  "options": {
    "include_engagement": true,
    "include_media": true
  }
}
```

### 3. Enhanced Competitive Analysis
The existing `/api/competitive-analysis` endpoint now includes FactFlux social media analysis automatically.

## Integration with Campaign Workflow

The FactFlux integration is seamlessly integrated into the Campaign Workflow:

### Step 3: Enhanced Competitive Analysis
1. **Product Category Detection** → AI detects product category
2. **Standard Apify Analysis** → Scrapes competitor ads from Google, Amazon, etc.
3. **FactFlux Social Media Analysis** → NEW: Analyzes competitor social media posts
4. **Comprehensive Insights** → Combines all data sources for complete competitive intelligence

### Social Media Analysis Features

**Data Extraction**:
- Post content and media
- Author information
- Engagement metrics (likes, shares, comments)
- Hashtags and mentions
- Timestamps and platform data

**Competitive Intelligence**:
- Product claims and features
- Pricing information
- Market positioning
- Customer testimonials
- Marketing strategies
- Brand messaging

**Trending Analysis**:
- Top trending topics
- Platform-specific trends
- Engagement patterns
- Competitor mentions
- Hashtag analysis

## Usage Examples

### 1. Basic Competitive Analysis
```javascript
// Upload product image → Detect category → Analyze competition
// FactFlux automatically analyzes competitor social media posts
```

### 2. Custom Social Media Analysis
```javascript
const response = await fetch('/api/factflux/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    competitorUrls: [
      'https://www.instagram.com/competitor1',
      'https://www.tiktok.com/@competitor2'
    ],
    category: 'beauty',
    searchTerms: ['skincare', 'makeup']
  })
});
```

### 3. Direct Social Media Scraping
```javascript
const response = await fetch('/api/brightdata/scrape', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.instagram.com/p/example',
    platform: 'instagram'
  })
});
```

## Supported Platforms

- ✅ **TikTok**: Posts, videos, engagement metrics
- ✅ **Instagram**: Posts, stories, reels, engagement
- ✅ **Twitter/X**: Tweets, replies, engagement
- ✅ **Facebook**: Posts, pages, engagement
- ✅ **YouTube**: Videos, comments, engagement
- ✅ **LinkedIn**: Posts, company pages, engagement

## Data Structure

### Social Media Post
```typescript
interface SocialMediaPost {
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
```

### Competitive Insight
```typescript
interface CompetitiveInsight {
  claim: string;
  source: string;
  credibility: number; // 0-100
  relevance: number; // 0-100
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
  evidence: string[];
  timestamp: string;
}
```

## Error Handling

The system includes comprehensive error handling:

- **API Key Validation**: Checks for valid Bright Data and Gemini API keys
- **Network Timeouts**: Configurable timeout settings
- **Rate Limiting**: Respects platform rate limits
- **Fallback Mechanisms**: Continues with standard analysis if FactFlux fails
- **User-Friendly Messages**: Clear error messages for troubleshooting

## Performance Optimization

- **Parallel Processing**: Multiple social media posts analyzed simultaneously
- **Caching**: Results cached to avoid redundant API calls
- **Selective Analysis**: Only analyzes relevant posts based on category
- **Efficient Scraping**: Uses optimal scraping methods per platform

## Security & Compliance

- **API Key Protection**: All keys stored in environment variables
- **Rate Limiting**: Respects platform terms of service
- **Data Privacy**: No personal data stored permanently
- **Compliance**: Follows platform scraping guidelines

## Troubleshooting

### Common Issues

1. **Bright Data Connection Failed**:
   - Verify API key is correct
   - Check network connectivity
   - Ensure sufficient API credits

2. **Social Media Scraping Failed**:
   - Verify URLs are publicly accessible
   - Check if posts are private or deleted
   - Ensure platform is supported

3. **Analysis Timeout**:
   - Increase `BRIGHT_DATA_TIMEOUT` value
   - Reduce number of URLs being analyzed
   - Check API rate limits

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

## Monitoring & Analytics

The system provides detailed analytics:

- **Scraping Success Rate**: Percentage of successful data extractions
- **Analysis Confidence**: AI confidence scores for insights
- **Platform Coverage**: Distribution of data across platforms
- **Engagement Metrics**: Average engagement across analyzed posts

## Next Steps

1. **Set up Bright Data API key**
2. **Test social media scraping**
3. **Run complete competitive analysis**
4. **Monitor performance and adjust settings**
5. **Customize analysis parameters for your needs**

## Support

For issues related to:
- **Bright Data API**: Contact Bright Data support
- **FactFlux Integration**: Check console logs and error messages
- **Social Media Scraping**: Verify URLs and platform access
- **Analysis Results**: Review confidence scores and evidence

## Updates

- Monitor Bright Data API changes
- Keep Gemini model versions updated
- Check for new platform support
- Review scraping compliance guidelines

---

**Note**: This integration is designed for competitive intelligence and market research. Always respect platform terms of service and rate limits when scraping social media data.
