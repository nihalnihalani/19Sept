"use client";

import React, { useState } from "react";
import { Upload, Search, TrendingUp, Target, DollarSign, Users, Sparkles } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface CompetitiveAnalysisProps {
  onBack: () => void;
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

interface AnalysisResult {
  detectedCategory: {
    id: string;
    name: string;
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
  insights: {
    totalCompetitorsAnalyzed: number;
    totalAdsScraped: number;
    averagePrice: number;
    topBrands: string[];
  };
  detectionDetails?: {
    initialDetection: boolean;
    fallbackUsed: boolean;
    detectionScore: number;
  };
}

const CompetitiveAnalysis: React.FC<CompetitiveAnalysisProps> = ({ onBack }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setError(null);
      setAnalysisResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append("imageFile", imageFile);
      formData.append("prompt", "Analyze this product for competitive intelligence");

      console.log("Starting competitive analysis...");
      
      const response = await fetch("/api/competitive-analysis", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Analysis response:", data);

      if (data.success) {
        setAnalysisResult(data.analysis);
        console.log("Analysis completed successfully");
      } else {
        const errorMessage = data.error || "Analysis failed";
        setError(errorMessage);
        console.error("Analysis failed:", errorMessage);
      }
    } catch (err) {
      const errorMessage = "Network error occurred. Please check your connection and try again.";
      setError(errorMessage);
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadCompetitiveImage = () => {
    if (!analysisResult?.competitiveImage) return;

    const { imageBytes, mimeType } = analysisResult.competitiveImage;
    const dataUrl = `data:${mimeType};base64,${imageBytes}`;
    
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `competitive-${analysisResult.detectedCategory.name.toLowerCase()}-product.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-white">Competitive Analysis</h1>
          </div>
          <div className="text-sm text-gray-300">
            AI-Powered Market Intelligence
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Product Image
              </h2>
              
              {!imageFile ? (
                <div
                  className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition-colors group"
                  onClick={() => document.getElementById("image-upload")?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-purple-400', 'bg-purple-400/10');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-purple-400', 'bg-purple-400/10');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-purple-400', 'bg-purple-400/10');
                    const files = Array.from(e.dataTransfer.files);
                    const imageFile = files.find(file => file.type.startsWith('image/'));
                    if (imageFile) {
                      setImageFile(imageFile);
                      setError(null);
                      setAnalysisResult(null);
                    }
                  }}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4 group-hover:text-purple-400 transition-colors" />
                  <p className="text-gray-300 mb-2 group-hover:text-white transition-colors">Click to upload or drag & drop</p>
                  <p className="text-sm text-gray-500 mb-2">
                    Supports: Shoes, Skincare, Soft Drinks, and more
                  </p>
                  <p className="text-xs text-gray-600">
                    PNG, JPG, WEBP up to 10MB
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Image
                      src={URL.createObjectURL(imageFile)}
                      alt="Uploaded product"
                      width={400}
                      height={300}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setImageFile(null)}
                      className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 rounded-full text-white"
                    >
                      ×
                    </button>
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Analyze Competition
                      </>
                    )}
                  </button>
                </div>
              )}

              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                <p className="text-red-200">{error}</p>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <AnimatePresence>
              {analysisResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Category Detection */}
                  <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Product Category Detection
                    </h3>
                    <div className="space-y-3">
                      <p className="text-gray-300">
                        <span className="font-medium">Detected:</span> {analysisResult.detectedCategory.name}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">Confidence:</span>{" "}
                        <span className={`${
                          analysisResult.confidence > 0.7 ? 'text-green-400' : 
                          analysisResult.confidence > 0.4 ? 'text-yellow-400' : 
                          'text-red-400'
                        }`}>
                          {(analysisResult.confidence * 100).toFixed(1)}%
                        </span>
                      </p>
                      {analysisResult.detectionDetails && (
                        <div className="text-sm text-gray-400">
                          <p>Detection Method: {analysisResult.detectionDetails.fallbackUsed ? 'Fallback' : 'Initial'}</p>
                          <p>Detection Score: {analysisResult.detectionDetails.detectionScore}</p>
                        </div>
                      )}
                      <div className="text-sm text-gray-400">
                        <p className="font-medium">AI Analysis:</p>
                        <p className="mt-1 text-xs bg-gray-700/50 p-2 rounded">
                          {analysisResult.imageDescription}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Market Insights */}
                  <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Market Insights
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          {analysisResult.insights.totalCompetitorsAnalyzed}
                        </div>
                        <div className="text-sm text-gray-400">Competitors</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {analysisResult.insights.totalAdsScraped}
                        </div>
                        <div className="text-sm text-gray-400">Ads Analyzed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          ${analysisResult.insights.averagePrice.toFixed(0)}
                        </div>
                        <div className="text-sm text-gray-400">Avg Price</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                          {analysisResult.insights.topBrands.length}
                        </div>
                        <div className="text-sm text-gray-400">Top Brands</div>
                      </div>
                    </div>
                  </div>

                  {/* Competitive Image */}
                  <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      AI-Generated Competitive Product
                    </h3>
                    <div className="space-y-4">
                      <div className="relative">
                        <Image
                          src={`data:${analysisResult.competitiveImage.mimeType};base64,${analysisResult.competitiveImage.imageBytes}`}
                          alt="Competitive product"
                          width={400}
                          height={300}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      </div>
                      <button
                        onClick={downloadCompetitiveImage}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <DollarSign className="w-4 h-4" />
                        Download Competitive Image
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Competitor Ads */}
            {analysisResult?.scrapedAds && analysisResult.scrapedAds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Competitor Analysis
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {analysisResult.scrapedAds.map((ad, index) => (
                    <div key={ad.id} className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-300">
                            {ad.brand.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white">{ad.title}</h4>
                            {ad.price && (
                              <span className="text-green-400 font-semibold">{ad.price}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{ad.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
                              {ad.brand}
                            </span>
                            {ad.platform && (
                              <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded">
                                {ad.platform}
                              </span>
                            )}
                            <a
                              href={ad.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300"
                            >
                              View Product →
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitiveAnalysis;
