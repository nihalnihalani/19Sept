"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Image as ImageIcon,
  Film,
  Upload,
  ArrowLeft,
  Sparkles,
  Target,
  Eye
} from "lucide-react";

interface CreatorStudioProps {
  onSwitchToCampaign: () => void;
}

type StudioMode =
  | "create-image"
  | "edit-image"
  | "compose-image"
  | "create-video"
  | "product-gallery"
  | "category-detection";

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
      case "category-detection":
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
      case "category-detection":
        return Eye;
      default:
        return ImageIcon;
    }
  };

  const renderModeContent = () => {
    return (
      <div className="text-center py-16">
        <div className="p-6 bg-gradient-to-r from-[#7e3ff2]/20 to-[#5a2db8]/20 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg">
          {React.createElement(getTabIcon(mode), { className: "w-12 h-12 text-[#7e3ff2]" })}
        </div>
        <h3 className="text-3xl font-bold bg-gradient-to-r from-[#f5f5f5] to-[#a5a5a5] bg-clip-text text-transparent mb-4">
          {getTabText(mode)}
        </h3>
        <p className="text-[#a5a5a5] text-lg mb-8">Professional creative tool for content creation</p>
        <div className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-2xl p-8 max-w-md mx-auto">
          <p className="text-[#a5a5a5] mb-4">This creative tool provides advanced AI-powered capabilities for:</p>
          <ul className="text-left text-[#a5a5a5] space-y-2">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#7e3ff2] rounded-full"></div>
              High-quality content generation
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#7e3ff2] rounded-full"></div>
              Professional editing tools
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#7e3ff2] rounded-full"></div>
              AI-powered enhancements
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#7e3ff2] rounded-full"></div>
              Export in multiple formats
            </li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d0d] to-[#121212]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Mode Tabs */}
        <div className="mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { id: "create-image" as StudioMode, label: "Create Image", icon: ImageIcon, color: "from-blue-500 to-cyan-500" },
              { id: "edit-image" as StudioMode, label: "Edit Image", icon: Upload, color: "from-green-500 to-emerald-500" },
              { id: "compose-image" as StudioMode, label: "Compose Image", icon: Palette, color: "from-purple-500 to-pink-500" },
              { id: "create-video" as StudioMode, label: "Create Video", icon: Film, color: "from-orange-500 to-red-500" },
              { id: "product-gallery" as StudioMode, label: "Product Gallery", icon: ImageIcon, color: "from-teal-500 to-blue-500" },
              { id: "category-detection" as StudioMode, label: "Category Detection", icon: Eye, color: "from-pink-500 to-purple-500" },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setMode(tab.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 whitespace-nowrap ${
                    mode === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg border border-white/20`
                      : "bg-[#2a2a2a]/30 text-[#a5a5a5] hover:bg-[#2a2a2a]/50 hover:text-[#f5f5f5] border border-[#2a2a2a]/30"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-[#121212]/40 backdrop-blur-xl rounded-3xl border border-[#2a2a2a]/30 p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderModeContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CreatorStudio;