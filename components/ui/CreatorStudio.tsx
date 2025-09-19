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
  Maximize2,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
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

interface CreatorStudioProps {
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
  multipleImageFiles: File[];
  setMultipleImageFiles: (files: File[]) => void;
  geminiBusy: boolean;
  setGeminiBusy: (busy: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const CreatorStudio: React.FC<CreatorStudioProps> = ({ 
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
  multipleImageFiles,
  setMultipleImageFiles,
  geminiBusy,
  setGeminiBusy,
  error,
  setError
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Update selected model when mode changes
  useEffect(() => {
    if (activeMode === "create-video") {
      setSelectedModel("veo-3.0-generate-001");
    } else if (activeMode === "edit-image" || activeMode === "compose-image") {
      setSelectedModel("gemini-2.5-flash-image-preview");
    } else {
      setSelectedModel("gemini-2.5-flash-image-preview");
    }
  }, [activeMode, setSelectedModel]);

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
    
    if (activeMode === "edit-image") {
      return uploadedImage !== null;
    } else if (activeMode === "compose-image") {
      // Allow composition with existing image + new images, or just new images
      const hasExistingImage = uploadedImage || generatedImageUrl;
      const hasNewImages = multipleImageFiles.length > 0;
      return hasExistingImage || hasNewImages;
    }
    
    return true;
  }, [activeMode, getCurrentPrompt, uploadedImage, generatedImageUrl, multipleImageFiles]);

  const startGeneration = useCallback(async () => {
    if (!canStart() || isGenerating) return;

    setIsGenerating(true);
    setGeminiBusy(true);
    setError(null);

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
      } else if (activeMode === "compose-image") {
        // Compose mode - handle multiple images
        const formData = new FormData();
        formData.append('prompt', currentPrompt);

        // Add newly uploaded images first
        for (const file of multipleImageFiles) {
          formData.append('imageFiles', file);
        }

        // Include existing image last (if any)
        if (uploadedImage) {
          formData.append('imageFiles', uploadedImage);
        } else if (generatedImageUrl) {
          // Convert data URL to blob and add as file
          const response = await fetch(generatedImageUrl);
          const blob = await response.blob();
          const existingImageFile = new File([blob], "existing-image.png", {
            type: blob.type,
          });
          formData.append('imageFiles', existingImageFile);
        }

        const response = await fetch('/api/gemini/edit', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Image composition failed: ${response.statusText}`);
        }

        const result = await response.json();
        if (result?.image?.imageBytes) {
          const dataUrl = `data:${result.image.mimeType};base64,${result.image.imageBytes}`;
          setGeneratedImageUrl(dataUrl);
        } else if (result?.error) {
          throw new Error(result.error);
        }
      } else {
        // Regular image generation (create-image, edit-image)
        const formData = new FormData();
        formData.append('prompt', currentPrompt);
        formData.append('model', selectedModel);
        
        if (uploadedImage && activeMode === "edit-image") {
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
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
      setGeminiBusy(false);
    }
  }, [activeMode, canStart, isGenerating, getCurrentPrompt, selectedModel, uploadedImage, setIsGenerating, setGeminiBusy, setError, setVideoUrl, setGeneratedImageUrl]);

  const resetAll = useCallback(() => {
    setPrompt("");
    setImagePrompt("");
    setEditPrompt("");
    setComposePrompt("");
    setGeneratedImageUrl(null);
    setVideoUrl(null);
    setUploadedImage(null);
    setMultipleImageFiles([]);
    if (uploadedImageUrl) {
      URL.revokeObjectURL(uploadedImageUrl);
      setUploadedImageUrl(null);
    }
    setIsGenerating(false);
    setGeminiBusy(false);
    setError(null);
  }, [setPrompt, setImagePrompt, setEditPrompt, setComposePrompt, setGeneratedImageUrl, setVideoUrl, setUploadedImage, setMultipleImageFiles, uploadedImageUrl, setUploadedImageUrl, setIsGenerating, setGeminiBusy, setError]);

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

  const handleMultipleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
      const limitedFiles = imageFiles.slice(0, 10);
      setMultipleImageFiles((prevFiles) =>
        [...prevFiles, ...limitedFiles].slice(0, 10)
      );
      setError(null);
    }
  }, [setMultipleImageFiles, setError]);

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
        {/* Upload Area for Edit */}
        {activeMode === "edit-image" && (
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

        {/* Upload Area for Compose */}
        {activeMode === "compose-image" && (
          <div className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-[#f5f5f5] mb-4">Compose Multiple Images</h3>
            <div className="space-y-4">
              {/* Multiple image upload */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleImageUpload}
                  className="hidden"
                  id="multiple-image-upload"
                />
                <label
                  htmlFor="multiple-image-upload"
                  className="block w-full p-8 border-2 border-dashed border-[#2a2a2a] rounded-xl cursor-pointer hover:border-[#7e3ff2]/50 transition-colors"
                >
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-[#a5a5a5] mx-auto mb-4" />
                    <span className="text-[#a5a5a5] text-lg">Click to upload multiple images</span>
                    <p className="text-[#a5a5a5] text-sm mt-2">Supports JPEG, PNG, WebP up to 10MB each (max 10 images)</p>
                    {multipleImageFiles.length > 0 && (
                      <div className="text-[#7e3ff2] text-sm mt-2">
                        ✓ {multipleImageFiles.length} image{multipleImageFiles.length > 1 ? "s" : ""} selected
                        {multipleImageFiles.length >= 10 ? " (max reached)" : ""}
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Show thumbnails of uploaded images */}
              {multipleImageFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-[#f5f5f5] mb-3">Selected Images:</h4>
                  <div className="flex flex-wrap gap-3">
                    {multipleImageFiles.map((file, index) => (
                      <div
                        key={index}
                        className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-[#2a2a2a]/50 shadow-sm group"
                        title={file.name}
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => {
                            setMultipleImageFiles(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status indicator */}
              {(uploadedImage || generatedImageUrl) && (
                <div className="text-sm text-[#7e3ff2] bg-[#7e3ff2]/10 border border-[#7e3ff2]/20 rounded-lg p-3">
                  ✓ Existing image will be included in composition
                </div>
              )}
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
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d0d] to-[#121212] flex">
      {/* Sidebar */}
      <div className={`bg-[#121212]/60 backdrop-blur-xl border-r border-[#2a2a2a]/30 flex-shrink-0 transition-all duration-300 ${
        sidebarCollapsed ? 'w-20' : 'w-80'
      }`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#2a2a2a]/30">
            <div className="flex items-center justify-between mb-4">
              {!sidebarCollapsed && (
                <h2 className="text-lg font-semibold text-[#f5f5f5]">Creator Tools</h2>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 text-[#a5a5a5] hover:text-[#f5f5f5] hover:bg-[#2a2a2a]/30 rounded-xl transition-all duration-300"
              >
                {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {/* Tool Selection */}
            {!sidebarCollapsed && (
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
            {sidebarCollapsed && (
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

          {/* Controls */}
          {!sidebarCollapsed && (
            <div className="flex-1 p-4 overflow-y-auto">
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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
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

        {/* Content Area */}
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

export default CreatorStudio;
