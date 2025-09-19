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
  Menu,
  X,
  Play,
  Pause,
  Settings,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import ModelSelector from "./ModelSelector";

type StudioMode =
  | "create-image"
  | "edit-image"
  | "compose-image"
  | "create-video"
  | "product-gallery"
  | "category-detection";

interface CreatorStudioSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
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

const CreatorStudioSidebar: React.FC<CreatorStudioSidebarProps> = ({ 
  collapsed, 
  onToggleCollapse,
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["tools"]));

  // Update selected model when mode changes
  useEffect(() => {
    if (activeMode === "create-video") {
      setSelectedModel("veo-3.0-generate-001");
    } else if (activeMode === "edit-image" || activeMode === "compose-image") {
      setSelectedModel("gemini-2.5-flash-image-preview");
    } else {
      setSelectedModel("gemini-2.5-flash-image-preview");
    }
  }, [activeMode]);

  const getCurrentPrompt = () => {
    switch (activeMode) {
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
    switch (activeMode) {
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
    
    if (activeMode === "edit-image" || activeMode === "compose-image") {
      return uploadedImage !== null;
    }
    
    return true;
  }, [activeMode, getCurrentPrompt, uploadedImage]);

  const startGeneration = useCallback(async () => {
    if (!canStart() || isGenerating) return;

    setIsGenerating(true);
    setGeminiBusy(true);

    try {
      const currentPrompt = getCurrentPrompt();
      
      if (activeMode === "create-video") {
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
        const formData = new FormData();
        formData.append('prompt', currentPrompt);
        formData.append('model', selectedModel);
        
        if (uploadedImage && (activeMode === "edit-image" || activeMode === "compose-image")) {
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
  }, [activeMode, canStart, isGenerating, getCurrentPrompt, selectedModel, uploadedImage]);

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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const tools = [
    { 
      id: "create-image" as StudioMode, 
      label: "Create Image", 
      icon: ImageIcon, 
      color: "from-blue-500 to-cyan-500",
      description: "Generate images from text prompts"
    },
    { 
      id: "edit-image" as StudioMode, 
      label: "Edit Image", 
      icon: Upload, 
      color: "from-green-500 to-emerald-500",
      description: "AI-powered image editing"
    },
    { 
      id: "compose-image" as StudioMode, 
      label: "Compose", 
      icon: Palette, 
      color: "from-purple-500 to-pink-500",
      description: "Multi-image composition"
    },
    { 
      id: "create-video" as StudioMode, 
      label: "Create Video", 
      icon: Film, 
      color: "from-orange-500 to-red-500",
      description: "Generate videos from prompts"
    },
    { 
      id: "product-gallery" as StudioMode, 
      label: "Gallery", 
      icon: Target, 
      color: "from-teal-500 to-blue-500",
      description: "Browse your creations"
    },
    { 
      id: "category-detection" as StudioMode, 
      label: "Category", 
      icon: Eye, 
      color: "from-pink-500 to-purple-500",
      description: "Product category detection"
    }
  ];

  const renderToolContent = () => {
    if (activeMode === "product-gallery") {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-[#f5f5f5] mb-2">Your Creations</h3>
          </div>
          
          <div className="space-y-3">
            {generatedImageUrl && (
              <div className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-xl p-3">
                <img
                  src={generatedImageUrl}
                  alt="Generated content"
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[#f5f5f5] text-sm font-medium">Image</span>
                  <button
                    onClick={downloadImage}
                    className="p-1.5 bg-[#7e3ff2]/20 hover:bg-[#7e3ff2]/30 rounded-lg transition-colors"
                  >
                    <Download className="w-3 h-3 text-[#7e3ff2]" />
                  </button>
                </div>
              </div>
            )}
            
            {videoUrl && (
              <div className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-xl p-3">
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[#f5f5f5] text-sm font-medium">Video</span>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = videoUrl;
                      link.download = `alchemy-studio-video-${Date.now()}.mp4`;
                      link.click();
                    }}
                    className="p-1.5 bg-[#7e3ff2]/20 hover:bg-[#7e3ff2]/30 rounded-lg transition-colors"
                  >
                    <Download className="w-3 h-3 text-[#7e3ff2]" />
                  </button>
                </div>
              </div>
            )}
            
            {!generatedImageUrl && !videoUrl && (
              <div className="text-center py-8">
                <div className="p-3 bg-[#2a2a2a]/30 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-[#a5a5a5]" />
                </div>
                <p className="text-[#a5a5a5] text-sm">No content yet</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeMode === "category-detection") {
      return (
        <div className="text-center py-8">
          <div className="p-3 bg-gradient-to-r from-[#7e3ff2]/20 to-[#5a2db8]/20 rounded-xl w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <Eye className="w-6 h-6 text-[#7e3ff2]" />
          </div>
          <h3 className="text-lg font-semibold text-[#f5f5f5] mb-2">Category Detection</h3>
          <p className="text-[#a5a5a5] text-sm mb-4">Available in Campaign Workflow</p>
          <button
            onClick={() => {
              // This would switch to campaign mode
              window.location.reload(); // Temporary solution
            }}
            className="w-full px-4 py-2 bg-gradient-to-r from-[#7e3ff2] to-[#5a2db8] text-white rounded-lg hover:from-[#6d2ee6] hover:to-[#4a1f9a] transition-all duration-300 text-sm"
          >
            Go to Campaign
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-[#f5f5f5] mb-2">Model</label>
          <ModelSelector
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            mode={activeMode}
          />
        </div>

        {/* Image Upload for Edit/Compose */}
        {(activeMode === "edit-image" || activeMode === "compose-image") && (
          <div>
            <label className="block text-sm font-medium text-[#f5f5f5] mb-2">Upload Image</label>
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
                className="block w-full p-3 border-2 border-dashed border-[#2a2a2a] rounded-lg cursor-pointer hover:border-[#7e3ff2]/50 transition-colors"
              >
                {uploadedImage ? (
                  <div className="text-center">
                    <img
                      src={uploadedImageUrl!}
                      alt="Uploaded"
                      className="w-full h-16 object-cover rounded mb-2"
                    />
                    <span className="text-[#7e3ff2] text-sm">Change Image</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-6 h-6 text-[#a5a5a5] mx-auto mb-2" />
                    <span className="text-[#a5a5a5] text-sm">Click to upload</span>
                  </div>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Prompt Input */}
        <div>
          <label className="block text-sm font-medium text-[#f5f5f5] mb-2">Prompt</label>
          <textarea
            value={getCurrentPrompt()}
            onChange={(e) => setCurrentPrompt(e.target.value)}
            placeholder={`Enter your ${activeMode.replace('-', ' ')} prompt...`}
            className="w-full p-3 bg-[#2a2a2a]/50 border border-[#2a2a2a]/50 rounded-lg text-[#f5f5f5] placeholder-[#a5a5a5] focus:border-[#7e3ff2]/50 focus:outline-none resize-none"
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={startGeneration}
            disabled={!canStart() || isGenerating}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              canStart() && !isGenerating
                ? "bg-gradient-to-r from-[#7e3ff2] to-[#5a2db8] hover:from-[#6d2ee6] hover:to-[#4a1f9a] text-white"
                : "bg-[#2a2a2a]/50 text-[#666] cursor-not-allowed"
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm">Generating...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span className="text-sm">Generate</span>
              </>
            )}
          </button>
          
          <button
            onClick={resetAll}
            className="p-2 bg-[#2a2a2a]/50 hover:bg-[#2a2a2a]/70 text-[#a5a5a5] hover:text-[#f5f5f5] rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Generated Content Preview */}
        {generatedImageUrl && (
          <div className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-lg p-3">
            <img
              src={generatedImageUrl}
              alt="Generated"
              className="w-full h-24 object-cover rounded mb-2"
            />
            <button
              onClick={downloadImage}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#7e3ff2]/20 hover:bg-[#7e3ff2]/30 text-[#7e3ff2] rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        )}

        {videoUrl && (
          <div className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-lg p-3">
            <video
              src={videoUrl}
              controls
              className="w-full h-24 object-cover rounded mb-2"
            />
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = videoUrl;
                link.download = `alchemy-studio-video-${Date.now()}.mp4`;
                link.click();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#7e3ff2]/20 hover:bg-[#7e3ff2]/30 text-[#7e3ff2] rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#2a2a2a]/30">
        <div className="flex items-center justify-between mb-4">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-[#f5f5f5]">Creator Tools</h2>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 text-[#a5a5a5] hover:text-[#f5f5f5] hover:bg-[#2a2a2a]/30 rounded-xl transition-all duration-300"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        {/* Tool Selection */}
        {!collapsed && (
          <div className="grid grid-cols-2 gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.button
                  key={tool.id}
                  onClick={() => setActiveMode(tool.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    activeMode === tool.id
                      ? `bg-gradient-to-r ${tool.color} text-white shadow-lg`
                      : "bg-[#2a2a2a]/30 text-[#a5a5a5] hover:bg-[#2a2a2a]/50 hover:text-[#f5f5f5]"
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs font-medium block text-center">{tool.label}</span>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Collapsed Tool Icons */}
        {collapsed && (
          <div className="space-y-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.button
                  key={tool.id}
                  onClick={() => setActiveMode(tool.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-full p-3 rounded-xl transition-all duration-300 ${
                    activeMode === tool.id
                      ? `bg-gradient-to-r ${tool.color} text-white shadow-lg`
                      : "bg-[#2a2a2a]/30 text-[#a5a5a5] hover:bg-[#2a2a2a]/50 hover:text-[#f5f5f5]"
                  }`}
                  title={tool.label}
                >
                  <Icon className="w-5 h-5 mx-auto" />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content Area */}
      {!collapsed && (
        <div className="flex-1 p-4 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderToolContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CreatorStudioSidebar;
