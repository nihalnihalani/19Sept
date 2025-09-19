"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Image as ImageIcon,
  Film,
  Upload,
  ArrowLeft,
  Sparkles,
  Target,
  Eye,
  RotateCcw,
  Download
} from "lucide-react";
import Composer from "./Composer";
import ModelSelector from "./ModelSelector";

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
  
  // State management for all creator tools
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
  const [geminiBusy, setGeminiBusy] = useState(false);

  // Update selected model when mode changes
  useEffect(() => {
    if (mode === "create-video") {
      setSelectedModel("veo-3.0-generate-001");
    } else if (mode === "edit-image" || mode === "compose-image") {
      setSelectedModel("gemini-2.5-flash-image-preview");
    } else {
      setSelectedModel("gemini-2.5-flash-image-preview");
    }
  }, [mode]);

  const getCurrentPrompt = () => {
    switch (mode) {
      case "create-image":
        return imagePrompt;
      case "edit-image":
        return editPrompt;
      case "compose-image":
        return composePrompt;
      case "create-video":
        return prompt;
      default:
        return prompt;
    }
  };

  const setCurrentPrompt = (value: string) => {
    switch (mode) {
      case "create-image":
        setImagePrompt(value);
        break;
      case "edit-image":
        setEditPrompt(value);
        break;
      case "compose-image":
        setComposePrompt(value);
        break;
      case "create-video":
        setPrompt(value);
        break;
      default:
        setPrompt(value);
    }
  };

  const canStart = useCallback(() => {
    const currentPrompt = getCurrentPrompt();
    if (!currentPrompt.trim()) return false;
    
    if (mode === "edit-image" || mode === "compose-image") {
      return uploadedImage !== null;
    }
    
    return true;
  }, [mode, getCurrentPrompt, uploadedImage]);

  const startGeneration = useCallback(async () => {
    if (!canStart() || isGenerating) return;

    setIsGenerating(true);
    setGeminiBusy(true);

    try {
      const currentPrompt = getCurrentPrompt();
      
      if (mode === "create-video") {
        // Video generation logic
        const formData = new FormData();
        formData.append('prompt', currentPrompt);
        if (uploadedImage) {
          formData.append('image', uploadedImage);
        }

        const response = await fetch('/api/veo/generate', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Video generation failed: ${response.statusText}`);
        }

        const result = await response.json();
        setVideoUrl(result.videoUrl);
      } else {
        // Image generation logic
        const formData = new FormData();
        formData.append('prompt', currentPrompt);
        formData.append('model', selectedModel);
        
        if (uploadedImage && (mode === "edit-image" || mode === "compose-image")) {
          formData.append('image', uploadedImage);
        }

        const response = await fetch('/api/gemini/generate', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Image generation failed: ${response.statusText}`);
        }

        const result = await response.json();
        setGeneratedImageUrl(result.imageUrl);
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
      setGeminiBusy(false);
    }
  }, [mode, canStart, isGenerating, getCurrentPrompt, selectedModel, uploadedImage]);

  const resetAll = useCallback(() => {
    setPrompt("");
    setImagePrompt("");
    setEditPrompt("");
    setComposePrompt("");
    setGeneratedImageUrl(null);
    setVideoUrl(null);
    setUploadedImage(null);
    if (uploadedImageUrl) {
      URL.revokeObjectURL(uploadedImageUrl);
      setUploadedImageUrl(null);
    }
    setIsGenerating(false);
    setGeminiBusy(false);
  }, [uploadedImageUrl]);

  const downloadImage = useCallback(() => {
    if (generatedImageUrl) {
      const link = document.createElement('a');
      link.href = generatedImageUrl;
      link.download = `alchemy-studio-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [generatedImageUrl]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      setUploadedImageUrl(URL.createObjectURL(file));
    }
  }, []);

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
    // For category detection, show a special component
    if (mode === "category-detection") {
      return (
        <div className="text-center py-16">
          <div className="p-6 bg-gradient-to-r from-[#7e3ff2]/20 to-[#5a2db8]/20 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg">
            <Eye className="w-12 h-12 text-[#7e3ff2]" />
          </div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-[#f5f5f5] to-[#a5a5a5] bg-clip-text text-transparent mb-4">
            Category Detection
          </h3>
          <p className="text-[#a5a5a5] text-lg mb-8">AI-powered product category detection</p>
          <div className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-2xl p-8 max-w-md mx-auto">
            <p className="text-[#a5a5a5] mb-4">This tool is available in the Campaign Workflow for integrated product analysis.</p>
            <button
              onClick={onSwitchToCampaign}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-[#7e3ff2] to-[#5a2db8] text-white rounded-xl hover:from-[#6d2ee6] hover:to-[#4a1f9a] transition-all duration-300"
            >
              Go to Campaign Workflow
            </button>
          </div>
        </div>
      );
    }

    // For product gallery, show generated content
    if (mode === "product-gallery") {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-[#f5f5f5] mb-2">Your Creations</h3>
            <p className="text-[#a5a5a5]">Browse and manage your generated content</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generatedImageUrl && (
              <div className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-2xl p-4">
                <img
                  src={generatedImageUrl}
                  alt="Generated content"
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[#f5f5f5] font-medium">Generated Image</span>
                  <button
                    onClick={downloadImage}
                    className="p-2 bg-[#7e3ff2]/20 hover:bg-[#7e3ff2]/30 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4 text-[#7e3ff2]" />
                  </button>
                </div>
              </div>
            )}
            
            {videoUrl && (
              <div className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-2xl p-4">
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[#f5f5f5] font-medium">Generated Video</span>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = videoUrl;
                      link.download = `alchemy-studio-video-${Date.now()}.mp4`;
                      link.click();
                    }}
                    className="p-2 bg-[#7e3ff2]/20 hover:bg-[#7e3ff2]/30 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4 text-[#7e3ff2]" />
                  </button>
                </div>
              </div>
            )}
            
            {!generatedImageUrl && !videoUrl && (
              <div className="col-span-full text-center py-12">
                <div className="p-4 bg-[#2a2a2a]/30 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-[#a5a5a5]" />
                </div>
                <p className="text-[#a5a5a5]">No content generated yet. Create some images or videos to see them here!</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // For all other modes, use the Composer component
    return (
      <Composer
        mode={mode}
        setMode={setMode}
        hasGeneratedImage={!!generatedImageUrl}
        hasVideoUrl={!!videoUrl}
        prompt={prompt}
        setPrompt={setPrompt}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        canStart={canStart()}
        isGenerating={isGenerating}
        startGeneration={startGeneration}
        imagePrompt={imagePrompt}
        setImagePrompt={setImagePrompt}
        editPrompt={editPrompt}
        setEditPrompt={setEditPrompt}
        composePrompt={composePrompt}
        setComposePrompt={setComposePrompt}
        geminiBusy={geminiBusy}
        resetAll={resetAll}
        downloadImage={downloadImage}
      />
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