// Product category detection and competitor mapping system

export interface ProductCategory {
  id: string;
  name: string;
  keywords: string[];
  competitors: CompetitorBrand[];
}

export interface CompetitorBrand {
  id: string;
  name: string;
  website: string;
  apifyActorId: string;
  searchTerms: string[];
  productTypes: string[];
}

export interface ScrapedAd {
  id: string;
  brand: string;
  title: string;
  description: string;
  imageUrl: string;
  productUrl: string;
  price?: string;
  scrapedAt: string;
  platform?: string;
}

export interface ProductAnalysis {
  detectedCategory: ProductCategory;
  confidence: number;
  suggestedCompetitors: CompetitorBrand[];
  scrapedAds: ScrapedAd[];
}

// Product categories with competitor mapping
export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: 'shoes',
    name: 'Shoes',
    keywords: ['shoe', 'shoes', 'sneaker', 'sneakers', 'footwear', 'boot', 'boots', 'sandal', 'sandals', 'heel', 'heels', 'athletic', 'running', 'casual'],
    competitors: [
      {
        id: 'nike',
        name: 'Nike',
        website: 'https://www.nike.com',
        apifyActorId: 'nike-scraper',
        searchTerms: ['sports shoes', 'running shoes', 'sneakers', 'athletic footwear'],
        productTypes: ['sports shoes', 'running shoes', 'sneakers']
      },
      {
        id: 'adidas',
        name: 'Adidas',
        website: 'https://www.adidas.com',
        apifyActorId: 'adidas-scraper',
        searchTerms: ['sneakers', 'sports footwear', 'yeezy', 'athletic shoes'],
        productTypes: ['sneakers', 'sports footwear', 'Yeezy collab']
      },
      {
        id: 'puma',
        name: 'Puma',
        website: 'https://www.puma.com',
        apifyActorId: 'puma-scraper',
        searchTerms: ['casual shoes', 'sports shoes', 'sneakers', 'athletic footwear'],
        productTypes: ['casual & sports shoes']
      }
    ]
  },
  {
    id: 'soft-drinks',
    name: 'Soft Drinks',
    keywords: ['drink', 'drinks', 'soda', 'cola', 'beverage', 'soft drink', 'carbonated', 'coke', 'pepsi', 'sprite', 'fanta'],
    competitors: [
      {
        id: 'coca-cola',
        name: 'Coca-Cola',
        website: 'https://www.coca-cola.com',
        apifyActorId: 'coca-cola-scraper',
        searchTerms: ['coke', 'diet coke', 'coke zero', 'coca cola'],
        productTypes: ['Coke', 'Diet Coke', 'Coke Zero']
      },
      {
        id: 'pepsi',
        name: 'Pepsi',
        website: 'https://www.pepsi.com',
        apifyActorId: 'pepsi-scraper',
        searchTerms: ['pepsi', 'diet pepsi', 'pepsi max', 'pepsi cola'],
        productTypes: ['Pepsi', 'Diet Pepsi', 'Pepsi Max']
      },
      {
        id: 'dr-pepper',
        name: 'Dr Pepper',
        website: 'https://www.drpepper.com',
        apifyActorId: 'dr-pepper-scraper',
        searchTerms: ['dr pepper', 'dr pepper flavors', 'soda'],
        productTypes: ['Dr Pepper flavors']
      }
    ]
  },
  {
    id: 'skincare',
    name: 'Skincare Products',
    keywords: ['skincare', 'skin care', 'moisturizer', 'serum', 'cleanser', 'cream', 'lotion', 'sunscreen', 'face wash', 'beauty', 'cosmetic', 'anti-aging'],
    competitors: [
      {
        id: 'loreal',
        name: 'L\'Oréal',
        website: 'https://www.loreal.com',
        apifyActorId: 'loreal-scraper',
        searchTerms: ['moisturizers', 'serums', 'cleansers', 'skincare', 'beauty'],
        productTypes: ['moisturizers', 'serums', 'cleansers']
      },
      {
        id: 'neutrogena',
        name: 'Neutrogena',
        website: 'https://www.neutrogena.com',
        apifyActorId: 'neutrogena-scraper',
        searchTerms: ['sunscreens', 'face washes', 'acne treatment', 'skincare'],
        productTypes: ['sunscreens', 'face washes', 'acne treatment']
      },
      {
        id: 'olay',
        name: 'Olay',
        website: 'https://www.olay.com',
        apifyActorId: 'olay-scraper',
        searchTerms: ['anti-aging creams', 'lotions', 'serums', 'skincare'],
        productTypes: ['anti-aging creams', 'lotions', 'serums']
      }
    ]
  }
];

// Enhanced semantic analysis function to detect product category
export function detectProductCategory(imageDescription: string, fileName: string): ProductAnalysis | null {
  console.log("🔍 Starting product category detection...");
  console.log("📝 Input text:", `${imageDescription} ${fileName}`);
  
  const text = `${imageDescription} ${fileName}`.toLowerCase();
  
  let bestMatch: ProductCategory | null = null;
  let bestScore = 0;
  
  // Enhanced keyword matching with synonyms and variations
  const enhancedKeywords = {
    shoes: ['shoe', 'shoes', 'sneaker', 'sneakers', 'footwear', 'boot', 'boots', 'sandal', 'sandals', 'heel', 'heels', 'athletic', 'running', 'casual', 'trainer', 'trainers', 'loafers', 'oxfords', 'pumps', 'flats', 'high heels', 'sports shoes', 'tennis shoes', 'basketball shoes', 'footwear', 'foot gear', 'soles', 'laces', 'sneaker', 'kicks', 'footwear item', 'shoe product'],
    'soft-drinks': ['drink', 'drinks', 'soda', 'cola', 'beverage', 'soft drink', 'carbonated', 'coke', 'pepsi', 'sprite', 'fanta', 'beverage', 'refreshment', 'liquid', 'bottle', 'can', 'drinkable', 'thirst quencher', 'carbonated drink', 'soda pop', 'soft beverage', 'drink product', 'beverage item'],
    skincare: ['skincare', 'skin care', 'moisturizer', 'serum', 'cleanser', 'cream', 'lotion', 'sunscreen', 'face wash', 'beauty', 'cosmetic', 'anti-aging', 'beauty product', 'skin product', 'facial', 'beauty item', 'cosmetic product', 'skin treatment', 'beauty care', 'personal care', 'beauty routine', 'skin routine', 'beauty device', 'skincare device', 'beauty tool', 'skin tool']
  };
  
  for (const category of PRODUCT_CATEGORIES) {
    let score = 0;
    const categoryKeywords = enhancedKeywords[category.id as keyof typeof enhancedKeywords] || category.keywords;
    
    console.log(`🎯 Analyzing category: ${category.name}`);
    
    // Check keyword matches with enhanced scoring
    for (const keyword of categoryKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 1;
        console.log(`  ✅ Found keyword: "${keyword}" (+1)`);
      }
    }
    
    // Weighted scoring based on keyword importance and context
    const importantKeywords = categoryKeywords.slice(0, 5); // First 5 keywords are most important
    for (const keyword of importantKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 3; // Triple weight for important keywords
        console.log(`  ⭐ Important keyword: "${keyword}" (+3)`);
      }
    }
    
    // Bonus for exact category name matches
    if (text.includes(category.name.toLowerCase())) {
      score += 5;
      console.log(`  🏆 Exact category match: "${category.name}" (+5)`);
    }
    
    // Context-based scoring
    if (category.id === 'shoes' && (text.includes('foot') || text.includes('walk') || text.includes('step'))) {
      score += 2;
      console.log(`  👟 Context bonus for shoes (+2)`);
    }
    if (category.id === 'soft-drinks' && (text.includes('thirst') || text.includes('hydrate') || text.includes('refresh'))) {
      score += 2;
      console.log(`  🥤 Context bonus for drinks (+2)`);
    }
    if (category.id === 'skincare' && (text.includes('face') || text.includes('skin') || text.includes('beauty'))) {
      score += 2;
      console.log(`  🧴 Context bonus for skincare (+2)`);
    }
    
    console.log(`  📊 Final score for ${category.name}: ${score}`);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
      console.log(`  🏆 New best match: ${category.name} (score: ${score})`);
    }
  }
  
  // Lower threshold for detection
  console.log(`🎯 Detection results: Best match = ${bestMatch?.name || 'None'}, Score = ${bestScore}`);
  
  if (bestMatch && bestScore >= 2) {
    const confidence = Math.min(bestScore / 15, 1);
    console.log(`✅ Product detected: ${bestMatch.name} (confidence: ${(confidence * 100).toFixed(1)}%)`);
    return {
      detectedCategory: bestMatch,
      confidence: confidence, // Normalize to 0-1
      suggestedCompetitors: bestMatch.competitors,
      scrapedAds: [] // Will be populated by Apify scraping
    };
  }
  
  console.log(`❌ No product category detected (score: ${bestScore}, threshold: 2)`);
  return null;
}

// Generate search query for Apify scraping
export function generateSearchQuery(category: ProductCategory, competitor: CompetitorBrand): string {
  const randomSearchTerm = competitor.searchTerms[Math.floor(Math.random() * competitor.searchTerms.length)];
  const randomProductType = competitor.productTypes[Math.floor(Math.random() * competitor.productTypes.length)];
  
  return `${randomSearchTerm} ${randomProductType}`.trim();
}

// Create Apify actor input
export function createApifyInput(competitor: CompetitorBrand, searchQuery: string) {
  return {
    startUrls: [competitor.website],
    searchQuery: searchQuery,
    maxResults: 10,
    includeImages: true,
    includePrices: true,
    includeDescriptions: true,
    waitFor: 3000, // Wait 3 seconds for page load
    proxy: {
      useApifyProxy: true,
      apifyProxyGroups: ['RESIDENTIAL']
    }
  };
}
