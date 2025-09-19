"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Target,
  User,
  Settings,
  ChevronDown,
  Sparkles
} from "lucide-react";
import CampaignWorkflow from "@/components/ui/CampaignWorkflow";
import CreatorStudio from "@/components/ui/CreatorStudio";

type AppMode = "campaign" | "creator";

const AlchemyStudio: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>("campaign");
  const [sidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Shared state for Creator Studio
  const [activeMode, setActiveMode] = useState<"create-image" | "edit-image" | "compose-image" | "create-video" | "product-gallery" | "category-detection">("create-image");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash-image-preview");
  const [prompt, setPrompt] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [composePrompt, setComposePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [multipleImageFiles, setMultipleImageFiles] = useState<File[]>([]);
  const [geminiBusy, setGeminiBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSwitchToCreator = () => {
    setAppMode("creator");
  };

  const handleSwitchToCampaign = () => {
    setAppMode("campaign");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d0d] to-[#121212] text-[#f5f5f5] overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#121212]/80 backdrop-blur-xl border-b border-[#2a2a2a]/50">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left: Logo */}
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-r from-[#7e3ff2] to-[#5a2db8] rounded-2xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#f5f5f5] to-[#a5a5a5] bg-clip-text text-transparent">
              Alchemy Studio
            </h1>
          </div>

          {/* Center: Mode Switcher */}
          <div className="flex items-center bg-[#2a2a2a]/50 rounded-2xl p-1 border border-[#2a2a2a]/30">
            <button
              onClick={handleSwitchToCampaign}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                appMode === "campaign"
                  ? "bg-gradient-to-r from-[#7e3ff2] to-[#5a2db8] text-white shadow-lg"
                  : "text-[#a5a5a5] hover:text-[#f5f5f5] hover:bg-[#2a2a2a]/30"
              }`}
            >
              <Target className="w-4 h-4" />
              <span className="font-medium">Campaign Workflow</span>
            </button>
            <button
              onClick={handleSwitchToCreator}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                appMode === "creator"
                  ? "bg-gradient-to-r from-[#7e3ff2] to-[#5a2db8] text-white shadow-lg"
                  : "text-[#a5a5a5] hover:text-[#f5f5f5] hover:bg-[#2a2a2a]/30"
              }`}
            >
              <Palette className="w-4 h-4" />
              <span className="font-medium">Creator Studio</span>
            </button>
                  </div>

          {/* Right: User Profile + Settings */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-[#a5a5a5] hover:text-[#f5f5f5] hover:bg-[#2a2a2a]/30 rounded-xl transition-all duration-300">
              <Settings className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 text-[#a5a5a5] hover:text-[#f5f5f5] hover:bg-[#2a2a2a]/30 rounded-xl transition-all duration-300"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-[#7e3ff2] to-[#5a2db8] rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-[#121212]/95 backdrop-blur-xl border border-[#2a2a2a]/50 rounded-2xl shadow-2xl py-2"
                  >
                    <button className="w-full px-4 py-2 text-left text-[#a5a5a5] hover:text-[#f5f5f5] hover:bg-[#2a2a2a]/30 transition-colors">
                      Profile Settings
                    </button>
                    <button className="w-full px-4 py-2 text-left text-[#a5a5a5] hover:text-[#f5f5f5] hover:bg-[#2a2a2a]/30 transition-colors">
                      Account
                    </button>
                    <hr className="my-2 border-[#2a2a2a]/50" />
                    <button className="w-full px-4 py-2 text-left text-[#a5a5a5] hover:text-[#f5f5f5] hover:bg-[#2a2a2a]/30 transition-colors">
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
                            </div>
                          </div>
                        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex pt-20">

        {/* Main Workspace */}
        <main className="flex-1 min-h-screen">
          <AnimatePresence mode="wait">
            {appMode === "campaign" ? (
              <CampaignWorkflow onSwitchToCreator={handleSwitchToCreator} />
            ) : (
              <CreatorStudio 
                onSwitchToCampaign={handleSwitchToCampaign}
                activeMode={activeMode}
                setActiveMode={setActiveMode}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
          prompt={prompt}
          setPrompt={setPrompt}
          imagePrompt={imagePrompt}
          setImagePrompt={setImagePrompt}
          editPrompt={editPrompt}
          setEditPrompt={setEditPrompt}
          composePrompt={composePrompt}
          setComposePrompt={setComposePrompt}
                isGenerating={isGenerating}
                setIsGenerating={setIsGenerating}
                generatedImageUrl={generatedImageUrl}
                setGeneratedImageUrl={setGeneratedImageUrl}
                videoUrl={videoUrl}
                setVideoUrl={setVideoUrl}
                uploadedImage={uploadedImage}
                setUploadedImage={setUploadedImage}
                uploadedImageUrl={uploadedImageUrl}
                setUploadedImageUrl={setUploadedImageUrl}
                multipleImageFiles={multipleImageFiles}
                setMultipleImageFiles={setMultipleImageFiles}
          geminiBusy={geminiBusy}
                setGeminiBusy={setGeminiBusy}
                error={error}
                setError={setError}
        />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AlchemyStudio;
