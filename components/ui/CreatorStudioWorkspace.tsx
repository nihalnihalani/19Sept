"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Image as ImageIcon,
  Film,
  Upload,
  Sparkles,
  Target,
  Eye,
  Download,
  RotateCcw,
  Play,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

type StudioMode =
  | "create-image"
  | "edit-image"
  | "compose-image"
  | "create-video"
  | "product-gallery"
  | "category-detection";

interface CreatorStudioWorkspaceProps {
  onSwitchToCampaign: () => void;
  activeMode: StudioMode;
  setActiveMode: (mode: StudioMode) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  imagePrompt: string;
  setImagePrompt: (prompt: string) => void;
  editPrompt: string;
  setEditPrompt: (prompt: string) => void;
  composePrompt: string;
  setComposePrompt: (prompt: string) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  generatedImageUrl: string | null;
  setGeneratedImageUrl: (url: string | null) => void;
  videoUrl: string | null;
  setVideoUrl: (url: string | null) => void;
  uploadedImage: File | null;
  setUploadedImage: (file: File | null) => void;
  uploadedImageUrl: string | null;
  setUploadedImageUrl: (url: string | null) => void;
  geminiBusy: boolean;
  setGeminiBusy: (busy: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const CreatorStudioWorkspace: React.FC<CreatorStudioWorkspaceProps> = ({ 
  onSwitchToCampaign,
  activeMode,
  setActiveMode,
  selectedModel,
  setSelectedModel,
  prompt,
  setPrompt,
  imagePrompt,
  setImagePrompt,
  editPrompt,
  setEditPrompt,
  composePrompt,
  setComposePrompt,
  isGenerating,
  setIsGenerating,
  generatedImageUrl,
  setGeneratedImageUrl,
  videoUrl,
  setVideoUrl,
  uploadedImage,
  setUploadedImage,
  uploadedImageUrl,
  setUploadedImageUrl,
  geminiBusy,
  setGeminiBusy,
  error,
  setError
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      setError(null);
    }
  }, [setUploadedImage, setUploadedImageUrl, setError]);

  const getModeTitle = () => {
    switch (activeMode) {
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
        return "Creator Studio";
    }
  };

  const getModeDescription = () => {
    switch (activeMode) {
      case "create-image":
        return "Generate stunning images from text prompts using AI";
      case "edit-image":
        return "Transform and enhance your images with AI-powered editing";
      case "compose-image":
        return "Combine multiple images into creative compositions";
      case "create-video":
        return "Create dynamic videos from text prompts or images";
      case "product-gallery":
        return "Browse and manage your generated content";
      case "category-detection":
        return "AI-powered product category detection";
      default:
        return "Professional AI-powered creative tools";
    }
  };

  const renderContent = () => {
    if (activeMode === "product-gallery") {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedImageUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-2xl p-4 group hover:border-[#7e3ff2]/30 transition-all duration-300"
              >
                <div className="relative overflow-hidden rounded-xl mb-4">
                  <img
                    src={generatedImageUrl}
                    alt="Generated content"
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <button
                      onClick={() => setIsFullscreen(true)}
                      className="opacity-0 group-hover:opacity-100 p-2 bg-white/20 backdrop-blur-sm rounded-full transition-opacity duration-300"
                    >
                      <Maximize2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-[#f5f5f5] font-semibold">Generated Image</h3>
                    <p className="text-[#a5a5a5] text-sm">AI Generated</p>
                  </div>
                  <button
                    onClick={downloadImage}
                    className="p-2 bg-[#7e3ff2]/20 hover:bg-[#7e3ff2]/30 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4 text-[#7e3ff2]" />
                  </button>
                </div>
              </motion.div>
            )}
            
            {videoUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-2xl p-4 group hover:border-[#7e3ff2]/30 transition-all duration-300"
              >
                <div className="relative overflow-hidden rounded-xl mb-4">
                  <video
                    src={videoUrl}
                    controls
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-[#f5f5f5] font-semibold">Generated Video</h3>
                    <p className="text-[#a5a5a5] text-sm">AI Generated</p>
                  </div>
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
              </motion.div>
            )}
            
            {!generatedImageUrl && !videoUrl && (
              <div className="col-span-full text-center py-16">
                <div className="p-6 bg-[#2a2a2a]/30 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-[#a5a5a5]" />
                </div>
                <h3 className="text-xl font-semibold text-[#f5f5f5] mb-2">No Content Yet</h3>
                <p className="text-[#a5a5a5] mb-6">Create some images or videos to see them here!</p>
                <button
                  onClick={() => setActiveMode("create-image")}
                  className="px-6 py-3 bg-gradient-to-r from-[#7e3ff2] to-[#5a2db8] text-white rounded-xl hover:from-[#6d2ee6] hover:to-[#4a1f9a] transition-all duration-300"
                >
                  Start Creating
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeMode === "category-detection") {
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

    return (
      <div className="space-y-6">
        {/* Upload Area for Edit/Compose */}
        {(activeMode === "edit-image" || activeMode === "compose-image") && (
          <div className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-[#f5f5f5] mb-4">Upload Image</h3>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="block w-full p-8 border-2 border-dashed border-[#2a2a2a] rounded-xl cursor-pointer hover:border-[#7e3ff2]/50 transition-colors"
              >
                {uploadedImage ? (
                  <div className="text-center">
                    <img
                      src={uploadedImageUrl!}
                      alt="Uploaded"
                      className="w-full max-w-md h-48 object-contain rounded-lg mx-auto mb-4"
                    />
                    <span className="text-[#7e3ff2] font-medium">Click to change image</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-[#a5a5a5] mx-auto mb-4" />
                    <span className="text-[#a5a5a5] text-lg">Click to upload an image</span>
                    <p className="text-[#a5a5a5] text-sm mt-2">Supports JPEG, PNG, WebP up to 10MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Generated Content Display */}
        {(generatedImageUrl || videoUrl) && (
          <div className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#f5f5f5]">Generated Content</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-2 bg-[#2a2a2a]/50 hover:bg-[#2a2a2a]/70 text-[#a5a5a5] hover:text-[#f5f5f5] rounded-lg transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={activeMode === "create-video" ? () => {
                    const link = document.createElement('a');
                    link.href = videoUrl!;
                    link.download = `alchemy-studio-video-${Date.now()}.mp4`;
                    link.click();
                  } : downloadImage}
                  className="p-2 bg-[#7e3ff2]/20 hover:bg-[#7e3ff2]/30 text-[#7e3ff2] rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="relative overflow-hidden rounded-xl">
              {generatedImageUrl && (
                <img
                  src={generatedImageUrl}
                  alt="Generated content"
                  className="w-full h-auto max-h-96 object-contain"
                />
              )}
              {videoUrl && (
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-auto max-h-96"
                />
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <h4 className="text-red-300 font-semibold">Generation Failed</h4>
              <p className="text-red-400/80 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto p-1 text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Generation Status */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#7e3ff2]/20 border border-[#7e3ff2]/40 rounded-xl p-4 flex items-center gap-3"
          >
            <Loader2 className="w-5 h-5 text-[#7e3ff2] animate-spin flex-shrink-0" />
            <div>
              <h4 className="text-[#7e3ff2] font-semibold">Generating Content</h4>
              <p className="text-[#7e3ff2]/80 text-sm">
                {activeMode === "create-video" ? "Creating video... This may take several minutes." : "Creating image... Please wait."}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d0d] to-[#121212]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#f5f5f5] to-[#a5a5a5] bg-clip-text text-transparent mb-2">
              {getModeTitle()}
            </h1>
            <p className="text-[#a5a5a5] text-lg">{getModeDescription()}</p>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="bg-[#121212]/40 backdrop-blur-xl rounded-3xl border border-[#2a2a2a]/30 p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Fullscreen Modal */}
        <AnimatePresence>
          {isFullscreen && (generatedImageUrl || videoUrl) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setIsFullscreen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-7xl max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
                >
                  <X className="w-6 h-6" />
                </button>
                
                {generatedImageUrl && (
                  <img
                    src={generatedImageUrl}
                    alt="Generated content"
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                )}
                {videoUrl && (
                  <video
                    src={videoUrl}
                    controls
                    className="max-w-full max-h-full rounded-lg"
                    autoPlay
                  />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreatorStudioWorkspace;
