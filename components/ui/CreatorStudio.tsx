"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Palette, 
  Image as ImageIcon, 
  Film, 
  Upload, 
  Eye,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import Composer from "./Composer";
import ProductCategoryDetector from "./ProductCategoryDetector";

interface CreatorStudioProps {
  onSwitchToCampaign: () => void;
}

type StudioMode =
  | "create-image"
  | "edit-image"
  | "compose-image"
  | "create-video"
  | "product-gallery"
  | "product-category";

const CreatorStudio: React.FC<CreatorStudioProps> = ({ onSwitchToCampaign }) => {
  const [mode, setMode] = useState<StudioMode>("create-image");
  const [detectedProductCategory, setDetectedProductCategory] = useState<string | null>(null);

  const getTabText = (mode: StudioMode) => {
    switch (mode) {
      case "create-image":
        return "Create Image";
      case "edit-image":
        return "Edit Image";
      case "compose-image":
        return "Compose Image";
      case "create-video":
        return "Create Video";
      case "product-gallery":
        return "Product Gallery";
      case "product-category":
        return "Category Detection";
      default:
        return mode;
    }
  };

  const getTabIcon = (mode: StudioMode) => {
    switch (mode) {
      case "create-image":
        return ImageIcon;
      case "edit-image":
        return Upload;
      case "compose-image":
        return Palette;
      case "create-video":
        return Film;
      case "product-gallery":
        return ImageIcon;
      case "product-category":
        return Eye;
      default:
        return ImageIcon;
    }
  };

  const renderModeContent = () => {
    if (mode === "product-category") {
      return (
        <div className="space-y-8">
          <ProductCategoryDetector
            detectedCategory={detectedProductCategory}
            setDetectedCategory={setDetectedProductCategory}
            onCategoryDetected={(category) => {
              console.log('Detected category:', category);
              setDetectedProductCategory(category);
            }}
          />
          
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
      );
    }

    return (
      <div className="text-center py-12">
        <div className="p-4 bg-gray-800/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          {React.createElement(getTabIcon(mode), { className: "w-8 h-8 text-gray-400" })}
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">{getTabText(mode)}</h3>
        <p className="text-gray-400 mb-8">This creative tool is available in the main Creator Studio</p>
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 max-w-md mx-auto">
          <p className="text-gray-400">Switch to the main Creator Studio to access all creative tools</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Creator Studio</h1>
                <p className="text-gray-400 text-sm">AI-powered creative tools and utilities</p>
              </div>
            </div>
            <button
              onClick={onSwitchToCampaign}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Campaign Workflow
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Mode Tabs */}
        <div className="mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { id: "create-image" as StudioMode, label: "Create Image", icon: ImageIcon },
              { id: "edit-image" as StudioMode, label: "Edit Image", icon: Upload },
              { id: "compose-image" as StudioMode, label: "Compose Image", icon: Palette },
              { id: "create-video" as StudioMode, label: "Create Video", icon: Film },
              { id: "product-gallery" as StudioMode, label: "Product Gallery", icon: ImageIcon },
              { id: "product-category" as StudioMode, label: "Category Detection", icon: Eye },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMode(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${
                    mode === tab.id
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                      : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gray-800/30 rounded-2xl border border-gray-700 p-8">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderModeContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CreatorStudio;
