"use client";

import React, { useState, useCallback } from "react";
import { Upload, Eye, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ProductCategoryDetectorProps {
  onCategoryDetected?: (category: string) => void;
  detectedCategory?: string;
  setDetectedCategory?: (category: string | null) => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  shoes: "👟",
  beauty: "💄",
  beverage: "🥤",
  clothing: "👕",
  electronics: "📱",
  home: "🏠",
  food: "🍿",
  accessories: "👜",
  sports: "⚽",
  automotive: "🚗",
  other: "📦"
};

const CATEGORY_LABELS: Record<string, string> = {
  shoes: "Shoes & Footwear",
  beauty: "Beauty & Cosmetics",
  beverage: "Beverages",
  clothing: "Clothing & Apparel",
  electronics: "Electronics",
  home: "Home & Living",
  food: "Food & Snacks",
  accessories: "Accessories",
  sports: "Sports & Fitness",
  automotive: "Automotive",
  other: "Other Products"
};

const ProductCategoryDetector: React.FC<ProductCategoryDetectorProps> = ({
  onCategoryDetected,
  detectedCategory: externalDetectedCategory,
  setDetectedCategory: externalSetDetectedCategory
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [internalDetectedCategory, setInternalDetectedCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use external state if provided, otherwise use internal state
  const detectedCategory = externalDetectedCategory !== undefined ? externalDetectedCategory : internalDetectedCategory;
  const setDetectedCategory = externalSetDetectedCategory || setInternalDetectedCategory;

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if the file type is supported
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!supportedTypes.includes(file.type)) {
        setError(`Unsupported image format: ${file.type}. Please use JPEG, PNG, or WebP format.`);
        return;
      }
      
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setDetectedCategory(null);
      setError(null);
    }
  }, [setDetectedCategory]);

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
      // Check if the file type is supported
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!supportedTypes.includes(imageFile.type)) {
        setError(`Unsupported image format: ${imageFile.type}. Please use JPEG, PNG, or WebP format.`);
        return;
      }
      
      setImageFile(imageFile);
      setImageUrl(URL.createObjectURL(imageFile));
      setDetectedCategory(null);
      setError(null);
    }
  }, [setDetectedCategory]);

  const detectCategory = useCallback(async () => {
    if (!imageFile) return;

    setIsDetecting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('imageFile', imageFile);

      const response = await fetch('/api/gemini/category', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Server error (${response.status})`;
        
        if (response.status === 500 && errorMessage.includes('GEMINI_API_KEY')) {
          throw new Error('API key not configured. Please set up your Gemini API key.');
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      console.log('Category detection result:', result);
      setDetectedCategory(result.category);
      onCategoryDetected?.(result.category);
    } catch (err) {
      console.error('Error detecting category:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to detect product category. Please try again.';
      setError(errorMessage);
    } finally {
      setIsDetecting(false);
    }
  }, [imageFile, onCategoryDetected, setDetectedCategory]);

  const reset = useCallback(() => {
    setImageFile(null);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
    setDetectedCategory(null);
    setError(null);
  }, [imageUrl, setDetectedCategory]);

  return (
    <div className="w-full max-w-2xl mx-auto relative z-10">
      <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-100 mb-2">
            Product Category Detection
          </h3>
          <p className="text-gray-400 text-sm">
            Upload a product image and let AI automatically detect its category
          </p>
        </div>

        {!imageFile ? (
          <div
            className="border-2 border-dashed border-gray-600 rounded-lg p-8 cursor-pointer transition-colors hover:border-purple-500 hover:bg-purple-500/10"
            onClick={() => document.getElementById('category-image-input')?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <Upload className="w-12 h-12" />
              <div className="text-center">
                <div className="font-medium text-lg text-gray-200 mb-1">
                  Drop product image here, or click to upload
                </div>
                <div className="text-sm opacity-80">
                  JPEG, PNG, WebP up to 10MB (AVIF not supported)
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <div className="aspect-video overflow-hidden rounded-lg border border-gray-600">
                <Image
                  src={imageUrl!}
                  alt="Product to analyze"
                  className="w-full h-full object-contain"
                  width={400}
                  height={300}
                />
              </div>
              <button
                onClick={reset}
                className="absolute top-2 right-2 p-1.5 bg-gray-800/80 hover:bg-gray-700 rounded-full transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4 text-gray-300" />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={detectCategory}
                disabled={isDetecting}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${
                  detectedCategory 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : isDetecting 
                    ? "bg-gray-600 cursor-not-allowed text-white" 
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                {isDetecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                    <span>Detecting...</span>
                  </>
                ) : detectedCategory ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Detect Again</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>Detect Category</span>
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {detectedCategory && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/40 rounded-xl shadow-lg relative z-20"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl animate-bounce">
                      {CATEGORY_EMOJIS[detectedCategory] || "📦"}
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-bold text-green-200 mb-1">
                        {CATEGORY_LABELS[detectedCategory] || "Unknown Category"}
                      </div>
                      <div className="text-sm text-green-300 opacity-90">
                        ✅ Category detected successfully
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-green-400 animate-pulse" />
                      <div className="text-xs text-green-400 font-medium">
                        AI Powered
                      </div>
                    </div>
                  </div>
                  
                  {/* Debug info - remove this in production */}
                  <div className="mt-3 pt-3 border-t border-green-400/20">
                    <div className="text-xs text-green-400/70">
                      Raw category: <code className="bg-green-500/20 px-1 rounded">{detectedCategory}</code>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <input
          id="category-image-input"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>
    </div>
  );
};

export default ProductCategoryDetector;