"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Palette, 
  Image as ImageIcon, 
  Film, 
  Upload, 
  ArrowLeft
} from "lucide-react";
import Composer from "./Composer";

interface CreatorStudioProps {
  onSwitchToCampaign: () => void;
}

type StudioMode =
  | "create-image"
  | "edit-image"
  | "compose-image"
  | "create-video"
  | "product-gallery";

const CreatorStudio: React.FC<CreatorStudioProps> = ({ onSwitchToCampaign }) => {
  const [mode, setMode] = useState<StudioMode>("create-image");

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
      default:
        return ImageIcon;
    }
  };

  const renderModeContent = () => {
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
                <h1 className="text-xl font-bold text-white">Alchemy Studio</h1>
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
