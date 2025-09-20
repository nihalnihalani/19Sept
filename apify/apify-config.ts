// Apify configuration for competitive analysis

export const APIFY_CONFIG = {
  API_KEY: process.env.APIFY_API_KEY || 'apify_api_placeholder',
  BASE_URL: 'https://api.apify.com/v2',
  SYNC_ENDPOINT: '/run-sync-get-dataset-items',
  TIMEOUT: 30000, // 30 seconds
};

export const APIFY_ACTORS = {
  GOOGLE_IMAGES: 'hooli~google-images-scraper',
  FACEBOOK_ADS: 'apify~facebook-ads-scraper',
  AMAZON_PRODUCTS: 'junglee~amazon-crawler',
};

export const PLATFORM_CONFIGS = {
  google: {
    maxResults: 10,
    includeImages: true,
    includePrices: true,
  },
  facebook: {
    maxResults: 15,
    includeImages: true,
    includeText: true,
  },
  amazon: {
    maxResults: 20,
    includeImages: true,
    includePrices: true,
    includeReviews: true,
  },
};
