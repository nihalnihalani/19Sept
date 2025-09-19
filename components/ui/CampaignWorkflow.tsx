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
  X
} from "lucide-react";
import ProductCategoryDetector from "./ProductCategoryDetector";

interface CampaignWorkflowProps {
  onSwitchToCreator: () => void;
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

  const renderStepContent = () => {
    switch (currentStep) {
      case "upload":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Upload Your Product Image</h3>
              <p className="text-gray-400 mb-8">Start by uploading a high-quality image of your product</p>
            </div>

            {!productImage ? (
              <div
                className="border-2 border-dashed border-gray-600 rounded-xl p-12 cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-500/10"
                onClick={() => document.getElementById('product-upload')?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-6 text-gray-400">
                  <div className="p-4 bg-blue-500/20 rounded-full">
                    <Upload className="w-12 h-12 text-blue-400" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-xl text-white mb-2">
                      Drop your product image here
                    </div>
                    <div className="text-gray-400">
                      or click to browse files
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Supports JPEG, PNG, WebP up to 10MB
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative max-w-md mx-auto">
                  <img
                    src={productImageUrl!}
                    alt="Product"
                    className="w-full h-64 object-contain rounded-lg border border-gray-600"
                  />
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Uploaded
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
                    className="absolute top-2 left-2 p-1.5 bg-red-500/80 hover:bg-red-600 rounded-full transition-colors"
                    title="Remove image"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-green-400 mb-4">✅ Product image uploaded successfully!</p>
                  <button
                    onClick={() => document.getElementById('product-upload')?.click()}
                    className="text-blue-400 hover:text-blue-300 underline"
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
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Product Category Detection</h3>
              <p className="text-gray-400 mb-8">AI will analyze your uploaded product image to detect its category for better campaign targeting</p>
            </div>

            {productImage && productImageUrl ? (
              <div className="space-y-6">
                {/* Display the uploaded image */}
                <div className="flex justify-center">
                  <div className="relative max-w-md">
                    <img
                      src={productImageUrl}
                      alt="Product to analyze"
                      className="w-full h-64 object-contain rounded-lg border border-gray-600"
                    />
                    <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Uploaded
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
                      className="absolute top-2 left-2 p-1.5 bg-red-500/80 hover:bg-red-600 rounded-full transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
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
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                      detectedProductCategory
                        ? "bg-green-600 text-white cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    }`}
                  >
                    {detectedProductCategory ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Category Detected</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5" />
                        <span>Detect Product Category</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Display detected category */}
                {detectedProductCategory && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-2xl mx-auto"
                  >
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/40 rounded-xl p-6 shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl animate-bounce">
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
                          <div className="text-lg font-bold text-green-200 mb-1">
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
                          <div className="text-sm text-green-300 opacity-90">
                            ✅ Product category detected and saved
                          </div>
                          <div className="text-xs text-green-400/70 mt-2">
                            Category variable: <code className="bg-green-500/20 px-1 rounded">{detectedProductCategory}</code>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-6 h-6 text-green-400 animate-pulse" />
                          <div className="text-xs text-green-400 font-medium">
                            AI Powered
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-800/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">No Product Image Found</h3>
                <p className="text-gray-400 mb-8">Please go back to Step 1 and upload a product image first</p>
                <button
                  onClick={() => setCurrentStep("upload")}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Upload
                </button>
              </div>
            )}
          </div>
        );

      case "analysis":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Market Analysis</h3>
              <p className="text-gray-400 mb-8">AI is analyzing competitor ads and market trends...</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Target className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="font-semibold text-white">Competitor Analysis</h4>
                </div>
                <p className="text-gray-400 text-sm">Analyzing top competitor ad styles and messaging</p>
                <div className="mt-4 flex items-center gap-2 text-purple-400">
                  <div className="w-4 h-4 border-2 border-t-transparent border-purple-400 rounded-full animate-spin" />
                  <span className="text-sm">In progress...</span>
                </div>
              </div>

              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-pink-500/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-pink-400" />
                  </div>
                  <h4 className="font-semibold text-white">Trend Analysis</h4>
                </div>
                <p className="text-gray-400 text-sm">Identifying current market trends and preferences</p>
                <div className="mt-4 flex items-center gap-2 text-pink-400">
                  <div className="w-4 h-4 border-2 border-t-transparent border-pink-400 rounded-full animate-spin" />
                  <span className="text-sm">In progress...</span>
                </div>
              </div>

              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <h4 className="font-semibold text-white">Audience Insights</h4>
                </div>
                <p className="text-gray-400 text-sm">Understanding target audience preferences</p>
                <div className="mt-4 flex items-center gap-2 text-blue-400">
                  <div className="w-4 h-4 border-2 border-t-transparent border-blue-400 rounded-full animate-spin" />
                  <span className="text-sm">In progress...</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "generation":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Ad Creative Generation</h3>
              <p className="text-gray-400 mb-8">Generating ad banners and posters with your product</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <div className="aspect-video bg-gray-700/50 rounded-lg mb-4 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-t-transparent border-green-400 rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Generating...</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">Ad Variant {i}</p>
                    <p className="text-gray-400 text-sm">Modern Style</p>
                  </div>
                </div>
              ))}
            </div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Alchemy Studio</h1>
                <p className="text-gray-400 text-sm">AI-powered ad creation pipeline</p>
              </div>
            </div>
            <button
              onClick={onSwitchToCreator}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Palette className="w-4 h-4" />
              Switch to Creator Studio
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Campaign Creation Progress</h2>
            <span className="text-sm text-gray-400">
              Step {currentStepIndex + 1} of {WORKFLOW_STEPS.length}
            </span>
          </div>
          
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all min-w-0 ${
                      isCurrent
                        ? `bg-gradient-to-r ${step.color} text-white shadow-lg`
                        : isCompleted
                        ? "bg-green-600/20 text-green-400 border border-green-500/30"
                        : isAccessible
                        ? "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                        : "bg-gray-800/50 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <step.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{step.title}</span>
                    {isCompleted && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                  </button>
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gray-800/30 rounded-2xl border border-gray-700 p-8">
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
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-700">
            <button
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {currentStepData.title}
              </span>
            </div>

            <button
              onClick={nextStep}
              disabled={currentStepIndex === WORKFLOW_STEPS.length - 1 || !completedSteps.has(currentStep)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition-all"
            >
              {currentStepIndex === WORKFLOW_STEPS.length - 1 ? "Complete" : "Next"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignWorkflow;
