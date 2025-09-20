"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Search, 
  Palette, 
  Globe, 
  Type, 
  Eye, 
  Download, 
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Image as ImageIcon,
  Target,
  Users,
  BarChart3,
  Sparkles,
  X,
  Play,
  Loader2,
  ImageIcon as GalleryIcon
} from "lucide-react";
import ProductCategoryDetector from "./ProductCategoryDetector";
import { CampaignGallery } from "../gallery/CampaignGallery";

interface CampaignWorkflowProps {
  onSwitchToCreator: () => void;
}

interface ScrapedAd {
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

interface CompetitiveAnalysisResult {
  productCategory: {
    id: string;
    name: string;
    keywords: string[];
    competitors: Array<{
      id: string;
      name: string;
      website: string;
    }>;
  };
  confidence: number;
  imageDescription: string;
  competitors: Array<{
    id: string;
    name: string;
    website: string;
  }>;
  scrapedAds: ScrapedAd[];
  competitiveImage: {
    imageBytes: string;
    mimeType: string;
  };
  insights: Array<{
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
  }>;
  marketTrends: Array<{
    id: string;
    trend: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    timeframe: string;
    supportingData: string[];
    confidence: number;
  }>;
  socialMediaAnalysis?: {
    posts: Array<{
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
      hashtags: string[];
      mentions: string[];
    }>;
    insights: Array<{
      claim: string;
      source: string;
      credibility: number;
      relevance: number;
      sentiment: 'positive' | 'negative' | 'neutral';
      category: string;
      evidence: string[];
      timestamp: string;
    }>;
    summary: {
      totalPosts: number;
      topPlatforms: string[];
      averageEngagement: number;
      trendingTopics: string[];
      competitorMentions: string[];
    };
    confidence: number;
    trendingTopics: string[];
    competitorMentions: string[];
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

interface GeneratedContent {
  images: Array<{
    id: string;
    url: string;
    prompt: string;
    style: string;
  }>;
  videos: Array<{
    id: string;
    url: string;
    prompt: string;
    style: string;
  }>;
}

type WorkflowStep = 
  | "upload"
  | "category"
  | "analysis" 
  | "generation"
  | "personalization"
  | "copy"
  | "review"
  | "export"
  | "optimization";

const WORKFLOW_STEPS = [
  {
    id: "upload" as WorkflowStep,
    title: "Upload Product Image",
    description: "Upload your product image to start the campaign creation process",
    icon: Upload,
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "category" as WorkflowStep,
    title: "Product Category Detection",
    description: "AI automatically detects your product category for better targeting",
    icon: Eye,
    color: "from-green-500 to-emerald-500"
  },
  {
    id: "analysis" as WorkflowStep,
    title: "Competitor & Market Analysis",
    description: "AI analyzes competitor ads, styles, and market trends",
    icon: Search,
    color: "from-purple-500 to-pink-500"
  },
  {
    id: "generation" as WorkflowStep,
    title: "Ad Creative Generation",
    description: "Generate ad banners and posters with your product + insights",
    icon: Palette,
    color: "from-green-500 to-emerald-500"
  },
  {
    id: "personalization" as WorkflowStep,
    title: "Personalization & Localization",
    description: "Adapt creatives for different markets (US, Japan, India, etc.)",
    icon: Globe,
    color: "from-orange-500 to-red-500"
  },
  {
    id: "copy" as WorkflowStep,
    title: "Ad Copy + Taglines",
    description: "Generate headlines and CTAs mapped to design style",
    icon: Type,
    color: "from-indigo-500 to-purple-500"
  },
  {
    id: "review" as WorkflowStep,
    title: "Review & Select",
    description: "Review variants and select or edit your favorites",
    icon: Eye,
    color: "from-teal-500 to-cyan-500"
  },
  {
    id: "export" as WorkflowStep,
    title: "Export Campaign",
    description: "Get all assets in ad-ready formats for all platforms",
    icon: Download,
    color: "from-pink-500 to-rose-500"
  },
  {
    id: "optimization" as WorkflowStep,
    title: "Feedback & Optimization",
    description: "Track performance and get improvement recommendations",
    icon: TrendingUp,
    color: "from-yellow-500 to-orange-500"
  }
];

const CampaignWorkflow: React.FC<CampaignWorkflowProps> = ({ onSwitchToCreator }) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("upload");
  const [completedSteps, setCompletedSteps] = useState<Set<WorkflowStep>>(new Set());
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [detectedProductCategory, setDetectedProductCategory] = useState<string | null>(null);
  
  // Competitive Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [competitiveAnalysis, setCompetitiveAnalysis] = useState<CompetitiveAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // Gallery State
  const [showGallery, setShowGallery] = useState(false);
  
  // Generated Content State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({ images: [], videos: [] });
  const [generationError, setGenerationError] = useState<string | null>(null);

  const currentStepIndex = WORKFLOW_STEPS.findIndex(step => step.id === currentStep);
  const currentStepData = WORKFLOW_STEPS[currentStepIndex];

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImage(file);
      setProductImageUrl(URL.createObjectURL(file));
      setCompletedSteps(prev => new Set([...prev, "upload"]));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      setProductImage(imageFile);
      setProductImageUrl(URL.createObjectURL(imageFile));
      setCompletedSteps(prev => new Set([...prev, "upload"]));
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < WORKFLOW_STEPS.length - 1) {
      const nextStepId = WORKFLOW_STEPS[currentStepIndex + 1].id;
      setCurrentStep(nextStepId);
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    }
  }, [currentStepIndex, currentStep]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevStepId = WORKFLOW_STEPS[currentStepIndex - 1].id;
      setCurrentStep(prevStepId);
    }
  }, [currentStepIndex]);

  const handleCompetitiveAnalysis = useCallback(async () => {
    if (!productImage) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setCompetitiveAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("imageFile", productImage);
      formData.append("prompt", "Analyze this product for competitive intelligence");

      console.log("Starting competitive analysis...");
      
      const response = await fetch("/api/competitive-analysis", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Analysis response:", data);

      if (data.success) {
        setCompetitiveAnalysis(data.analysis);
        setCompletedSteps(prev => new Set([...prev, "analysis"]));
        console.log("Analysis completed successfully");
      } else {
        const errorMessage = data.error || "Analysis failed";
        setAnalysisError(errorMessage);
        console.error("Analysis failed:", errorMessage);
      }
    } catch (err) {
      const errorMessage = "Network error occurred. Please check your connection and try again.";
      setAnalysisError(errorMessage);
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [productImage]);

  const handleGenerateContent = useCallback(async () => {
    if (!competitiveAnalysis) return;

    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedContent({ images: [], videos: [] });

    try {
      // Generate 5 different images based on competitive insights
      const imagePrompts = [
        `Create a modern ${competitiveAnalysis.detectedCategory.name} advertisement inspired by ${competitiveAnalysis.insights.topBrands[0]} style with clean minimalist design`,
        `Design a premium ${competitiveAnalysis.detectedCategory.name} marketing image with luxury aesthetic and professional lighting`,
        `Generate a dynamic ${competitiveAnalysis.detectedCategory.name} ad with bold colors and contemporary design trends`,
        `Create a lifestyle-focused ${competitiveAnalysis.detectedCategory.name} advertisement showing product in use`,
        `Design a competitive ${competitiveAnalysis.detectedCategory.name} ad that stands out from ${competitiveAnalysis.insights.topBrands.slice(0, 2).join(' and ')}`
      ];

      // Generate images
      const imagePromises = imagePrompts.map(async (prompt, index) => {
        const response = await fetch("/api/gemini/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, model: "gemini-2.5-flash-image-preview" }),
        });

        if (!response.ok) throw new Error(`Image generation failed: ${response.statusText}`);
        const result = await response.json();
        
        return {
          id: `img-${index + 1}`,
          url: result.imageUrl,
          prompt,
          style: `Style ${index + 1}`
        };
      });

      // Generate videos using MiniMax
      const videoPrompts = [
        `Create a 15-second ${competitiveAnalysis.detectedCategory.name} advertisement video with modern motion graphics and dynamic transitions`,
        `Generate a lifestyle ${competitiveAnalysis.detectedCategory.name} video ad showing the product in action with smooth camera movements`
      ];

      const videoPromises = videoPrompts.map(async (prompt, index) => {
        const response = await fetch("/api/minimax/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            prompt,
            duration: 10,
            resolution: "1080P",
            asyncMode: false
          }),
        });

        if (!response.ok) throw new Error(`Video generation failed: ${response.statusText}`);
        const result = await response.json();
        
        return {
          id: `vid-${index + 1}`,
          url: result.videoUrl,
          prompt,
          style: `Video Style ${index + 1}`
        };
      });

      // Generate images first
      const images = await Promise.all(imagePromises);

      // Generate videos using MiniMax multiple video generation API
      const videoResponse = await fetch("/api/minimax/generate-multiple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: competitiveAnalysis.detectedCategory.name,
          topBrands: competitiveAnalysis.insights.topBrands,
          customPrompts: [
            `Create a 15-second ${competitiveAnalysis.detectedCategory.name} advertisement video with modern motion graphics and dynamic transitions`,
            `Generate a lifestyle ${competitiveAnalysis.detectedCategory.name} video ad showing the product in action with smooth camera movements`
          ]
        }),
      });

      if (!videoResponse.ok) {
        throw new Error(`Video generation failed: ${videoResponse.statusText}`);
      }

      const videoResult = await videoResponse.json();
      const videos = videoResult.videos || [];

      setGeneratedContent({ images, videos });
      setCompletedSteps(prev => new Set([...prev, "generation"]));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Content generation failed";
      setGenerationError(errorMessage);
      console.error("Generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [competitiveAnalysis]);

  const renderStepContent = () => {
    switch (currentStep) {
      case "upload":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-[#f5f5f5] to-[#a5a5a5] bg-clip-text text-transparent mb-4">
                Upload Your Product Image
              </h3>
              <p className="text-[#a5a5a5] text-lg mb-8">Start by uploading a high-quality image of your product</p>
            </div>

            {!productImage ? (
              <div
                className="border-2 border-dashed border-[#2a2a2a] rounded-2xl p-16 cursor-pointer transition-all duration-300 hover:border-[#7e3ff2]/50 hover:bg-[#7e3ff2]/5 hover:scale-105"
                onClick={() => document.getElementById('product-upload')?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-8 text-[#a5a5a5]">
                  <div className="p-6 bg-gradient-to-r from-[#7e3ff2]/20 to-[#5a2db8]/20 rounded-3xl shadow-lg">
                    <Upload className="w-16 h-16 text-[#7e3ff2]" />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-2xl text-[#f5f5f5] mb-3">
                      Drop your product image here
                    </div>
                    <div className="text-[#a5a5a5] text-lg mb-4">
                      or click to browse files
                    </div>
                    <div className="text-sm text-[#a5a5a5] bg-[#2a2a2a]/50 px-4 py-2 rounded-full inline-block">
                      Supports JPEG, PNG, WebP up to 10MB
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="relative max-w-lg mx-auto">
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl border-2 border-[#2a2a2a]/50">
                    <img
                      src={productImageUrl!}
                      alt="Product"
                      className="w-full h-80 object-contain bg-[#121212]/50"
                    />
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-[#7e3ff2] to-[#5a2db8] text-white px-3 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-semibold">Uploaded</span>
                    </div>
                    <button
                      onClick={() => {
                        setProductImage(null);
                        if (productImageUrl) {
                          URL.revokeObjectURL(productImageUrl);
                          setProductImageUrl(null);
                        }
                        setCompletedSteps(prev => {
                          const newSet = new Set(prev);
                          newSet.delete("upload");
                          return newSet;
                        });
                      }}
                      className="absolute top-4 left-4 p-2 bg-red-500/90 hover:bg-red-600 rounded-full transition-all duration-300 shadow-lg hover:scale-110"
                      title="Remove image"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-2xl p-6 mb-6">
                    <p className="text-[#f5f5f5] text-lg font-semibold mb-2">✅ Product image uploaded successfully!</p>
                    <p className="text-[#a5a5a5] text-sm">Ready for category detection and campaign creation</p>
                  </div>
                  <button
                    onClick={() => document.getElementById('product-upload')?.click()}
                    className="text-[#7e3ff2] hover:text-[#5a2db8] underline font-medium transition-colors"
                  >
                    Upload different image
                  </button>
                </div>
              </div>
            )}

            <input
              id="product-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        );

      case "category":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4">
                Product Category Detection
              </h3>
              <p className="text-purple-300 text-lg mb-8">AI will analyze your uploaded product image to detect its category for better campaign targeting</p>
            </div>

            {productImage && productImageUrl ? (
              <div className="space-y-8">
                {/* Display the uploaded image */}
                <div className="flex justify-center">
                  <div className="relative max-w-lg">
                    <div className="relative overflow-hidden rounded-2xl shadow-2xl border-2 border-purple-400/30">
                      <img
                        src={productImageUrl}
                        alt="Product to analyze"
                        className="w-full h-80 object-contain bg-slate-800/50"
                      />
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-semibold">Ready for Analysis</span>
                      </div>
                      <button
                        onClick={() => {
                          setProductImage(null);
                          if (productImageUrl) {
                            URL.revokeObjectURL(productImageUrl);
                            setProductImageUrl(null);
                          }
                          setDetectedProductCategory(null);
                          setCompletedSteps(prev => {
                            const newSet = new Set(prev);
                            newSet.delete("upload");
                            newSet.delete("category");
                            return newSet;
                          });
                        }}
                        className="absolute top-4 left-4 p-2 bg-red-500/90 hover:bg-red-600 rounded-full transition-all duration-300 shadow-lg hover:scale-110"
                        title="Remove image"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Category Detection Button */}
                <div className="flex justify-center">
                  <button
                    onClick={async () => {
                      if (!productImage) return;
                      
                      try {
                        const formData = new FormData();
                        formData.append('imageFile', productImage);

                        const response = await fetch('/api/gemini/category', {
                          method: 'POST',
                          body: formData,
                        });

                        if (!response.ok) {
                          const errorData = await response.json().catch(() => ({}));
                          const errorMessage = errorData.error || `Server error (${response.status})`;
                          throw new Error(errorMessage);
                        }

                        const result = await response.json();
                        if (result.error) {
                          throw new Error(result.error);
                        }

                        console.log('Category detection result:', result);
                        setDetectedProductCategory(result.category);
                        setCompletedSteps(prev => new Set([...prev, "category"]));
                      } catch (err) {
                        console.error('Error detecting category:', err);
                        // You could add error state handling here if needed
                      }
                    }}
                    disabled={!!detectedProductCategory}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg ${
                      detectedProductCategory
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-xl"
                    }`}
                  >
                    {detectedProductCategory ? (
                      <>
                        <CheckCircle className="w-6 h-6" />
                        <span className="font-semibold text-lg">Category Detected</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-6 h-6" />
                        <span className="font-semibold text-lg">Detect Product Category</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Display detected category */}
                {detectedProductCategory && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-3xl mx-auto"
                  >
                    <div className="bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 border-2 border-emerald-400/50 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
                      <div className="flex items-center gap-6">
                        <div className="text-6xl animate-bounce">
                          {detectedProductCategory === 'shoes' && '👟'}
                          {detectedProductCategory === 'beauty' && '💄'}
                          {detectedProductCategory === 'beverage' && '🥤'}
                          {detectedProductCategory === 'clothing' && '👕'}
                          {detectedProductCategory === 'electronics' && '📱'}
                          {detectedProductCategory === 'home' && '🏠'}
                          {detectedProductCategory === 'food' && '🍿'}
                          {detectedProductCategory === 'accessories' && '👜'}
                          {detectedProductCategory === 'sports' && '⚽'}
                          {detectedProductCategory === 'automotive' && '🚗'}
                          {detectedProductCategory === 'other' && '📦'}
                        </div>
                        <div className="flex-1">
                          <div className="text-2xl font-bold bg-gradient-to-r from-emerald-200 to-green-200 bg-clip-text text-transparent mb-2">
                            {detectedProductCategory === 'shoes' && 'Shoes & Footwear'}
                            {detectedProductCategory === 'beauty' && 'Beauty & Cosmetics'}
                            {detectedProductCategory === 'beverage' && 'Beverages'}
                            {detectedProductCategory === 'clothing' && 'Clothing & Apparel'}
                            {detectedProductCategory === 'electronics' && 'Electronics'}
                            {detectedProductCategory === 'home' && 'Home & Living'}
                            {detectedProductCategory === 'food' && 'Food & Snacks'}
                            {detectedProductCategory === 'accessories' && 'Accessories'}
                            {detectedProductCategory === 'sports' && 'Sports & Fitness'}
                            {detectedProductCategory === 'automotive' && 'Automotive'}
                            {detectedProductCategory === 'other' && 'Other Products'}
                          </div>
                          <div className="text-lg text-emerald-300 font-semibold mb-3">
                            ✅ Product category detected and saved
                          </div>
                          <div className="bg-slate-800/50 rounded-xl p-3 border border-emerald-400/30">
                            <div className="text-sm text-emerald-400/80 mb-1">Category Variable:</div>
                            <code className="bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-lg font-mono text-sm">
                              {detectedProductCategory}
                            </code>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl">
                            <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
                          </div>
                          <div className="text-sm text-emerald-400 font-semibold text-center">
                            AI Powered
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <Upload className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">No Product Image Found</h3>
                <p className="text-slate-400 text-lg mb-8">Please go back to Step 1 and upload a product image first</p>
                <button
                  onClick={() => setCurrentStep("upload")}
                  className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white rounded-xl transition-all duration-300 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-semibold">Back to Upload</span>
                </button>
              </div>
            )}
          </div>
        );

      case "analysis":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-[#f5f5f5] to-[#a5a5a5] bg-clip-text text-transparent mb-4">
                Competitive Analysis
              </h3>
              <p className="text-[#a5a5a5] text-lg mb-8">AI analyzes competitor ads, styles, and market trends using Apify data</p>
            </div>

            {productImage && productImageUrl ? (
              <div className="space-y-8">
                {/* Display the uploaded image */}
                <div className="flex justify-center">
                  <div className="relative max-w-lg">
                    <div className="relative overflow-hidden rounded-2xl shadow-2xl border-2 border-[#7e3ff2]/30">
                      <img
                        src={productImageUrl}
                        alt="Product for analysis"
                        className="w-full h-80 object-contain bg-[#2a2a2a]/50"
                      />
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-[#7e3ff2] to-[#5a2db8] text-white px-3 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg">
                        <Target className="w-4 h-4" />
                        <span className="font-semibold">Ready for Analysis</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analysis Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleCompetitiveAnalysis}
                    disabled={isAnalyzing || !!competitiveAnalysis}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg ${
                      competitiveAnalysis
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white cursor-not-allowed"
                        : isAnalyzing
                        ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white cursor-not-allowed"
                        : "bg-gradient-to-r from-[#7e3ff2] to-[#5a2db8] hover:from-[#5a2db8] hover:to-[#7e3ff2] text-white shadow-xl"
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="font-semibold text-lg">Analyzing Competition...</span>
                      </>
                    ) : competitiveAnalysis ? (
                      <>
                        <CheckCircle className="w-6 h-6" />
                        <span className="font-semibold text-lg">Analysis Complete</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-6 h-6" />
                        <span className="font-semibold text-lg">Start Competitive Analysis</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Error Display */}
                {analysisError && (
                  <div className="bg-red-900/50 border border-red-700 rounded-2xl p-6">
                    <p className="text-red-200">{analysisError}</p>
                  </div>
                )}

                {/* Analysis Results */}
                {competitiveAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Category Detection */}
                    <div className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-2xl p-6">
                      <h4 className="text-lg font-semibold text-[#f5f5f5] mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Product Category Detection
                      </h4>
                      <div className="space-y-3">
                        <p className="text-[#a5a5a5]">
                          <span className="font-medium">Detected:</span> {competitiveAnalysis.detectedCategory.name}
                        </p>
                        <p className="text-[#a5a5a5]">
                          <span className="font-medium">Confidence:</span>{" "}
                          <span className={`${
                            competitiveAnalysis.confidence > 0.7 ? 'text-green-400' : 
                            competitiveAnalysis.confidence > 0.4 ? 'text-yellow-400' : 
                            'text-red-400'
                          }`}>
                            {(competitiveAnalysis.confidence * 100).toFixed(1)}%
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Market Insights */}
                    <div className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-2xl p-6">
                      <h4 className="text-lg font-semibold text-[#f5f5f5] mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Market Insights
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#7e3ff2]">
                            {competitiveAnalysis.insights.totalCompetitorsAnalyzed}
                          </div>
                          <div className="text-sm text-[#a5a5a5]">Competitors</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">
                            {competitiveAnalysis.insights.totalAdsScraped}
                          </div>
                          <div className="text-sm text-[#a5a5a5]">Ads Analyzed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">
                            ${competitiveAnalysis.insights.averagePrice.toFixed(0)}
                          </div>
                          <div className="text-sm text-[#a5a5a5]">Avg Price</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-400">
                            {competitiveAnalysis.insights.topBrands.length}
                          </div>
                          <div className="text-sm text-[#a5a5a5]">Top Brands</div>
                        </div>
                      </div>
                    </div>

                    {/* Competitor Ads Preview */}
                    {competitiveAnalysis.scrapedAds && competitiveAnalysis.scrapedAds.length > 0 && (
                      <div className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-2xl p-6">
                        <h4 className="text-lg font-semibold text-[#f5f5f5] mb-4 flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Competitor Analysis ({competitiveAnalysis.scrapedAds.length} ads found)
                        </h4>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {competitiveAnalysis.scrapedAds.slice(0, 5).map((ad, index) => (
                            <div key={ad.id} className="bg-[#2a2a2a]/50 rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-[#7e3ff2]/20 rounded-lg flex items-center justify-center">
                                  <span className="text-xs font-bold text-[#7e3ff2]">
                                    {ad.brand.charAt(0)}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-medium text-[#f5f5f5]">{ad.title}</h5>
                                    {ad.price && (
                                      <span className="text-green-400 font-semibold text-sm">{ad.price}</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-[#a5a5a5] mt-1">{ad.description}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs bg-[#7e3ff2]/20 text-[#7e3ff2] px-2 py-1 rounded">
                                      {ad.brand}
                                    </span>
                                    {ad.platform && (
                                      <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded">
                                        {ad.platform}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* FactFlux Social Media Analysis */}
                    {competitiveAnalysis.socialMediaAnalysis && (
                      <div className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-2xl p-6">
                        <h4 className="text-lg font-semibold text-[#f5f5f5] mb-4 flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          Social Media Intelligence ({competitiveAnalysis.socialMediaAnalysis.posts.length} posts analyzed)
                        </h4>
                        
                        {/* Social Media Summary */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-[#7e3ff2]">
                              {competitiveAnalysis.socialMediaAnalysis.summary.totalPosts}
                            </div>
                            <div className="text-sm text-[#a5a5a5]">Social Posts</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">
                              {competitiveAnalysis.socialMediaAnalysis.summary.averageEngagement}
                            </div>
                            <div className="text-sm text-[#a5a5a5]">Avg Engagement</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">
                              {competitiveAnalysis.socialMediaAnalysis.summary.topPlatforms.length}
                            </div>
                            <div className="text-sm text-[#a5a5a5]">Active Platforms</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">
                              {competitiveAnalysis.socialMediaAnalysis.confidence}%
                            </div>
                            <div className="text-sm text-[#a5a5a5]">Confidence</div>
                          </div>
                        </div>

                        {/* Trending Topics */}
                        {competitiveAnalysis.socialMediaAnalysis.trendingTopics.length > 0 && (
                          <div className="mb-6">
                            <h5 className="text-md font-semibold text-[#f5f5f5] mb-3">Trending Topics</h5>
                            <div className="flex flex-wrap gap-2">
                              {competitiveAnalysis.socialMediaAnalysis.trendingTopics.slice(0, 8).map((topic, index) => (
                                <span key={index} className="text-xs bg-[#7e3ff2]/20 text-[#7e3ff2] px-3 py-1 rounded-full">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Competitive Insights */}
                        {competitiveAnalysis.socialMediaAnalysis.insights.length > 0 && (
                          <div>
                            <h5 className="text-md font-semibold text-[#f5f5f5] mb-3">Key Competitive Insights</h5>
                            <div className="space-y-3 max-h-48 overflow-y-auto">
                              {competitiveAnalysis.socialMediaAnalysis.insights.slice(0, 5).map((insight, index) => (
                                <div key={index} className="bg-[#2a2a2a]/50 rounded-lg p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <p className="text-sm text-[#f5f5f5] font-medium">{insight.claim}</p>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        insight.sentiment === 'positive' ? 'bg-green-600/20 text-green-300' :
                                        insight.sentiment === 'negative' ? 'bg-red-600/20 text-red-300' :
                                        'bg-gray-600/20 text-gray-300'
                                      }`}>
                                        {insight.sentiment}
                                      </span>
                                      <span className="text-xs text-[#a5a5a5]">
                                        {insight.credibility}% credible
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded">
                                      {insight.category}
                                    </span>
                                    <span className="text-xs text-[#a5a5a5]">
                                      {insight.platform}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <Upload className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">No Product Image Found</h3>
                <p className="text-slate-400 text-lg mb-8">Please go back to Step 1 and upload a product image first</p>
                <button
                  onClick={() => setCurrentStep("upload")}
                  className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white rounded-xl transition-all duration-300 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-semibold">Back to Upload</span>
                </button>
              </div>
            )}
          </div>
        );

      case "generation":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-[#f5f5f5] to-[#a5a5a5] bg-clip-text text-transparent mb-4">
                Ad Creative Generation
              </h3>
              <p className="text-[#a5a5a5] text-lg mb-8">Generate 5 different images and 2 ad videos based on competitive insights</p>
            </div>

            {competitiveAnalysis ? (
              <div className="space-y-8">
                {/* Generate Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleGenerateContent}
                    disabled={isGenerating || generatedContent.images.length > 0}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg ${
                      generatedContent.images.length > 0
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white cursor-not-allowed"
                        : isGenerating
                        ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white cursor-not-allowed"
                        : "bg-gradient-to-r from-[#7e3ff2] to-[#5a2db8] hover:from-[#5a2db8] hover:to-[#7e3ff2] text-white shadow-xl"
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="font-semibold text-lg">Generating Content...</span>
                      </>
                    ) : generatedContent.images.length > 0 ? (
                      <>
                        <CheckCircle className="w-6 h-6" />
                        <span className="font-semibold text-lg">Content Generated</span>
                      </>
                    ) : (
                      <>
                        <Palette className="w-6 h-6" />
                        <span className="font-semibold text-lg">Generate 5 Images + 2 Videos</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Error Display */}
                {generationError && (
                  <div className="bg-red-900/50 border border-red-700 rounded-2xl p-6">
                    <p className="text-red-200">{generationError}</p>
                  </div>
                )}

                {/* Generated Images */}
                {generatedContent.images.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h4 className="text-2xl font-bold text-[#f5f5f5] flex items-center gap-2">
                      <ImageIcon className="w-6 h-6" />
                      Generated Images (5)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {generatedContent.images.map((image, index) => (
                        <div key={image.id} className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-2xl p-4 hover:border-[#7e3ff2]/50 transition-all duration-300">
                          <div className="aspect-video bg-[#2a2a2a]/50 rounded-lg mb-4 overflow-hidden">
                            <img
                              src={image.url}
                              alt={`Generated image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="space-y-2">
                            <h5 className="font-semibold text-[#f5f5f5]">{image.style}</h5>
                            <p className="text-sm text-[#a5a5a5] line-clamp-2">{image.prompt}</p>
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = image.url;
                                link.download = `ad-image-${index + 1}.png`;
                                link.click();
                              }}
                              className="w-full bg-[#7e3ff2]/20 hover:bg-[#7e3ff2]/30 text-[#7e3ff2] py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Generated Videos */}
                {generatedContent.videos.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h4 className="text-2xl font-bold text-[#f5f5f5] flex items-center gap-2">
                      <Play className="w-6 h-6" />
                      Generated Videos (2)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {generatedContent.videos.map((video, index) => (
                        <div key={video.id} className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-2xl p-4 hover:border-[#7e3ff2]/50 transition-all duration-300">
                          <div className="aspect-video bg-[#2a2a2a]/50 rounded-lg mb-4 overflow-hidden">
                            <video
                              src={video.url}
                              controls
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="space-y-2">
                            <h5 className="font-semibold text-[#f5f5f5]">{video.style}</h5>
                            <p className="text-sm text-[#a5a5a5] line-clamp-2">{video.prompt}</p>
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = video.url;
                                link.download = `ad-video-${index + 1}.mp4`;
                                link.click();
                              }}
                              className="w-full bg-[#7e3ff2]/20 hover:bg-[#7e3ff2]/30 text-[#7e3ff2] py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Loading State */}
                {isGenerating && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-[#7e3ff2]/30 border-t-[#7e3ff2] rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-[#a5a5a5] text-lg">Generating your ad creatives...</p>
                      <p className="text-[#a5a5a5] text-sm">This may take a few minutes</p>
                    </div>
                    
                    {/* Loading Placeholders */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-2xl p-4">
                          <div className="aspect-video bg-[#2a2a2a]/50 rounded-lg mb-4 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-8 h-8 border-2 border-t-transparent border-[#7e3ff2] rounded-full animate-spin mx-auto mb-2" />
                              <p className="text-[#a5a5a5] text-sm">Generating...</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-[#f5f5f5] font-medium">Image {i}</p>
                            <p className="text-[#a5a5a5] text-sm">Based on competitive insights</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <Search className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Competitive Analysis Required</h3>
                <p className="text-slate-400 text-lg mb-8">Please complete the competitive analysis first to generate content</p>
                <button
                  onClick={() => setCurrentStep("analysis")}
                  className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white rounded-xl transition-all duration-300 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-semibold">Back to Analysis</span>
                </button>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-800/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <currentStepData.icon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">{currentStepData.title}</h3>
            <p className="text-gray-400 mb-8">{currentStepData.description}</p>
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 max-w-md mx-auto">
              <p className="text-gray-400">This step is coming soon...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d0d] to-[#121212]">
      {/* Step Progress Bar */}
      <div className="bg-[#121212]/60 backdrop-blur-xl border-b border-[#2a2a2a]/30">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-[#f5f5f5] mb-1">Campaign Workflow</h2>
              <p className="text-[#a5a5a5] text-sm">Step-by-step ad creation pipeline</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowGallery(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7e3ff2] to-[#5a2db8] hover:from-[#6d2ee6] hover:to-[#4a1f9a] text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-[#7e3ff2]/30"
              >
                <GalleryIcon className="w-4 h-4" />
                <span className="text-sm font-semibold">Campaign Gallery</span>
              </button>
              <div className="text-right">
                <span className="text-sm font-semibold text-[#f5f5f5]">
                  Step {currentStepIndex + 1} of {WORKFLOW_STEPS.length}
                </span>
                <div className="w-32 h-1.5 bg-[#2a2a2a] rounded-full mt-2">
                  <div 
                    className="h-1.5 bg-gradient-to-r from-[#7e3ff2] to-[#5a2db8] rounded-full transition-all duration-500"
                    style={{ width: `${((currentStepIndex + 1) / WORKFLOW_STEPS.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {WORKFLOW_STEPS.map((step, index) => {
              const isCompleted = completedSteps.has(step.id);
              const isCurrent = currentStep === step.id;
              const isAccessible = index <= currentStepIndex || isCompleted;
              
              return (
                <div key={step.id} className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => isAccessible && setCurrentStep(step.id)}
                    disabled={!isAccessible}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 min-w-0 ${
                      isCurrent
                        ? "bg-gradient-to-r from-[#7e3ff2] to-[#5a2db8] text-white shadow-lg border border-[#7e3ff2]/30"
                        : isCompleted
                        ? "bg-[#2a2a2a]/50 text-[#a5a5a5] border border-[#2a2a2a]/50"
                        : isAccessible
                        ? "bg-[#2a2a2a]/30 text-[#a5a5a5] hover:bg-[#2a2a2a]/50 border border-[#2a2a2a]/30"
                        : "bg-[#121212]/50 text-[#666] cursor-not-allowed border border-[#2a2a2a]/20"
                    }`}
                  >
                    <step.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-medium truncate">{step.title}</span>
                    {isCompleted && <CheckCircle className="w-4 h-4 flex-shrink-0 text-[#7e3ff2]" />}
                  </button>
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-[#2a2a2a] flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Main Content */}
        <div className="bg-[#121212]/40 backdrop-blur-xl rounded-3xl border border-[#2a2a2a]/30 p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-[#2a2a2a]/30">
            <button
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                currentStepIndex === 0
                  ? "bg-[#121212]/50 text-[#666] cursor-not-allowed border border-[#2a2a2a]/30"
                  : "bg-[#2a2a2a]/50 hover:bg-[#2a2a2a]/70 text-[#f5f5f5] border border-[#2a2a2a]/50 hover:border-[#7e3ff2]/30 shadow-lg hover:shadow-xl"
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Previous</span>
            </button>

            <div className="text-center">
              <div className="text-lg font-bold text-[#f5f5f5] mb-1">
                {currentStepData.title}
              </div>
              <div className="text-sm text-[#a5a5a5]">
                {currentStepData.description}
              </div>
            </div>

            <button
              onClick={nextStep}
              disabled={currentStepIndex === WORKFLOW_STEPS.length - 1 || !completedSteps.has(currentStep)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                currentStepIndex === WORKFLOW_STEPS.length - 1 || !completedSteps.has(currentStep)
                  ? "bg-[#121212]/50 text-[#666] cursor-not-allowed border border-[#2a2a2a]/30"
                  : "bg-gradient-to-r from-[#7e3ff2] to-[#5a2db8] hover:from-[#6d2ee6] hover:to-[#4a1f9a] text-white border border-[#7e3ff2]/30 hover:border-[#7e3ff2]/50 shadow-lg hover:shadow-xl"
              }`}
            >
              <span className="font-semibold">
                {currentStepIndex === WORKFLOW_STEPS.length - 1 ? "Complete" : "Next"}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Campaign Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
          <div className="h-full w-full">
            <CampaignGallery onClose={() => setShowGallery(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignWorkflow;
