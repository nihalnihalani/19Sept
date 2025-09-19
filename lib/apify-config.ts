// Apify Actor Configuration
// Update these with your actual Apify actor IDs

export const APIFY_ACTORS = {
  // Google Images Scraper  
  GOOGLE_IMAGES: 'hooli~google-images-scraper',
  
  // Amazon Crawler
  AMAZON: 'junglee~amazon-crawler',
};

// Apify API Configuration
export const APIFY_CONFIG = {
  // Your Apify API key - should be set in environment variables
  API_KEY: process.env.APIFY_API_KEY || '',
  
  // Base URL for Apify API
  BASE_URL: 'https://api.apify.com/v2',
  
  // Sync endpoint for immediate results
  SYNC_ENDPOINT: '/run-sync-get-dataset-items',
  
  // Default settings for all actors
  DEFAULT_SETTINGS: {
    maxResults: 5,
    country: 'US',
    language: 'en',
    proxy: {
      useApifyProxy: true,
      apifyProxyGroups: ['RESIDENTIAL']
    }
  }
};

// Platform-specific configurations
export const PLATFORM_CONFIGS = {
  google: {
    actorId: APIFY_ACTORS.GOOGLE_IMAGES,
    searchFields: ['queries', 'searchTerms', 'keywords'],
    resultFields: ['title', 'description', 'imageUrl', 'url', 'source', 'width', 'height'],
    maxResults: 5,
  },
  amazon: {
    actorId: APIFY_ACTORS.AMAZON,
    searchFields: ['searchTerms', 'productName', 'category'],
    resultFields: ['title', 'description', 'imageUrl', 'productUrl', 'price', 'rating'],
    maxResults: 5,
  }
};

// Helper function to get actor ID by platform
export function getActorId(platform: 'google' | 'amazon'): string {
  return PLATFORM_CONFIGS[platform].actorId;
}

// Helper function to validate Apify configuration
export function validateApifyConfig(): { isValid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!APIFY_CONFIG.API_KEY) {
    missing.push('APIFY_API_KEY');
  }
  
  return {
    isValid: missing.length === 0,
    missing
  };
}
