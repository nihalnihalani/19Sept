// Qloo API Integration Service (ported)
const QLOO_API_URL = process.env.QLOO_API_URL || 'https://hackathon.api.qloo.com/';
const QLOO_API_KEY = process.env.QLOO_API_KEY || '';

export interface QlooBrand {
  id: string;
  name: string;
  category: string;
  description?: string;
  popularity_score?: number;
  cultural_relevance?: number;
}

export interface QlooPlace {
  id: string;
  name: string;
  type: string;
  location: {
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  popularity_score?: number;
  cultural_significance?: number;
}

export interface QlooResponse<T> {
  results: {
    entities: T[];
    total_count: number;
    page: number;
    per_page: number;
  };
  status: string;
  message?: string;
}

class QlooAPIService {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = QLOO_API_URL;
    this.apiKey = QLOO_API_KEY;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<QlooResponse<T>> {
    const url = new URL(endpoint, this.baseURL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.append(key, String(value));
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Qloo API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async getBrands(city: string, country: string, limit = 20): Promise<QlooBrand[]> {
    try {
      const res = await this.makeRequest<any>('search', { query: city, entity_type: 'brand', limit });
      return (
        res.results?.entities
          ?.filter((e: any) => e.types?.includes('urn:entity:brand'))
          .map((e: any) => ({
            id: e.entity_id,
            name: e.name,
            category: e.tags?.[0]?.name || 'Unknown',
            description: e.properties?.description,
            popularity_score: e.popularity,
            cultural_relevance: e.popularity,
          })) || []
      );
    } catch (e) {
      console.error('Failed to fetch brands:', e);
      return [];
    }
  }

  async getPlaces(city: string, country: string, limit = 20): Promise<QlooPlace[]> {
    try {
      const res = await this.makeRequest<any>('search', { query: city, entity_type: 'place', limit });
      return (
        res.results?.entities
          ?.filter((e: any) => e.types?.includes('urn:entity:place'))
          .map((e: any) => ({
            id: e.entity_id,
            name: e.name,
            type: e.tags?.[0]?.name || 'Place',
            location: {
              city: e.properties?.geocode?.city || city,
              country: e.properties?.geocode?.country || country,
              coordinates: e.location ? { lat: e.location.lat, lng: e.location.lon } : undefined,
            },
            popularity_score: e.popularity,
            cultural_significance: e.popularity,
          })) || []
      );
    } catch (e) {
      console.error('Failed to fetch places:', e);
      return [];
    }
  }

  async getCulturalInsights(city: string, country: string) {
    const [brands, places] = await Promise.all([this.getBrands(city, country, 30), this.getPlaces(city, country, 30)]);
    return {
      location: { city, country },
      brands,
      places,
      cultural_metrics: {
        brand_diversity: this.calculateBrandDiversity(brands),
        place_diversity: this.calculatePlaceDiversity(places),
        cultural_richness: this.calculateCulturalRichness(brands, places),
      },
      timestamp: new Date().toISOString(),
    };
  }

  private calculateBrandDiversity(brands: QlooBrand[]): number {
    if (brands.length === 0) return 0;
    const categories = new Set(brands.map((b) => b.category));
    return Math.min(categories.size / 10, 1);
  }
  private calculatePlaceDiversity(places: QlooPlace[]): number {
    if (places.length === 0) return 0;
    const types = new Set(places.map((p) => p.type));
    return Math.min(types.size / 8, 1);
  }
  private calculateCulturalRichness(brands: QlooBrand[], places: QlooPlace[]): number {
    const brandScore = brands.reduce((s, b) => s + (b.cultural_relevance || 0), 0) / (brands.length || 1);
    const placeScore = places.reduce((s, p) => s + (p.cultural_significance || 0), 0) / (places.length || 1);
    return Math.min((brandScore + placeScore) / 2, 1);
  }
}

export const qlooAPI = new QlooAPIService();
export default qlooAPI;
