"use client";

import React from "react";
import {
  RotateCcw,
  Image,
  Edit,
  Palette,
  Video,
  Download,
  Sparkles,
  Grid3X3,
} from "lucide-react";
import ModelSelector from "@/components/ui/ModelSelector";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StudioMode } from "@/types/studio";

interface ComposerProps {
  mode: StudioMode;
  setMode: (mode: StudioMode) => void;
  hasGeneratedImage?: boolean;
  hasVideoUrl?: boolean;

  prompt: string;
  setPrompt: (value: string) => void;

  selectedModel: string;
  setSelectedModel: (model: string) => void;

  canStart: boolean;
  isGenerating: boolean;
  startGeneration: () => void;

  imagePrompt: string;
  setImagePrompt: (value: string) => void;
  editPrompt: string;
  setEditPrompt: (value: string) => void;
  composePrompt: string;
  setComposePrompt: (value: string) => void;

  geminiBusy: boolean;

  resetAll: () => void;
  downloadImage: () => void;
}

const Composer: React.FC<ComposerProps> = ({
  mode,
  setMode,
  hasGeneratedImage = false,
  hasVideoUrl = false,
  prompt,
  setPrompt,
  selectedModel,
  setSelectedModel,
  canStart,
  isGenerating,
  startGeneration,

  imagePrompt,
  setImagePrompt,
  editPrompt,
  setEditPrompt,
  composePrompt,
  setComposePrompt,
  geminiBusy,
  resetAll,
  downloadImage,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      startGeneration();
    }
  };

  const handleReset = () => {
    resetAll();
  };

  const getTabText = (tabMode: StudioMode) => {
    switch (tabMode) {
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
        return "Unknown";
    }
  };

  const isTabDisabled = (tabMode: StudioMode) => {
    // When video is generated, disable all tabs
    if (hasVideoUrl) {
      return true;
    }

    // When image is generated, disable create-image tab but allow others
    if (hasGeneratedImage && tabMode === "create-image") {
      return true;
    }

    return false;
  };

  const getTabTooltip = (tabMode: StudioMode) => {
    if (hasVideoUrl) {
      return "Reset to create new content";
    }

    if (hasGeneratedImage && tabMode === "create-image") {
      return "Use edit, compose, or video modes with existing image";
    }

    return null;
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-[min(100%,56rem)] px-4">
      <div className="relative text-slate-900/80 backdrop-blur-xl bg-gray-800/60 px-6 py-4 rounded-2xl shadow-lg border border-gray-700">
        {hasGeneratedImage && !hasVideoUrl && (
          <div className="absolute -top-14 right-0 z-10">
            <button
              onClick={downloadImage}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors shadow-md"
              title="Download Image"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <ModelSelector
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            mode={mode}
          />
        </div>

        {mode === "create-video" && (
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Generate a video with text and frames..."
            className="w-full bg-gray-900/70 focus:bg-gray-800/90 focus:outline-none resize-none text-base font-normal text-gray-200 placeholder-gray-400 rounded-lg px-4 py-3 border border-gray-700 focus:border-purple-400 transition-all duration-200"
            rows={3}
          />
        )}

        {mode === "create-image" && (
          <textarea
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the image to create..."
            className="w-full bg-gray-900/70 focus:bg-gray-800/90 focus:outline-none resize-none text-base font-normal text-gray-200 placeholder-gray-400 rounded-lg px-4 py-3 border border-gray-700 focus:border-purple-400 transition-all duration-200"
            rows={3}
          />
        )}

        {mode === "edit-image" && (
          <textarea
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe how to edit the image..."
            className="w-full bg-gray-900/70 focus:bg-gray-800/90 focus:outline-none resize-none text-base font-normal text-gray-200 placeholder-gray-400 rounded-lg px-4 py-3 border border-gray-700 focus:border-purple-400 transition-all duration-200"
            rows={3}
          />
        )}

        {mode === "compose-image" && (
          <textarea
            value={composePrompt}
            onChange={(e) => setComposePrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe how to combine the images..."
            className="w-full bg-gray-900/70 focus:bg-gray-800/90 focus:outline-none resize-none text-base font-normal text-gray-200 placeholder-gray-400 rounded-lg px-4 py-3 border border-gray-700 focus:border-purple-400 transition-all duration-200"
            rows={3}
          />
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="h-10 w-10 flex items-center justify-center bg-gray-700/80 rounded-full hover:bg-gray-600/90 cursor-pointer transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-5 h-5 text-gray-300" />
            </button>
          </div>
          <button
            onClick={startGeneration}
            disabled={!canStart || isGenerating || geminiBusy}
            aria-busy={isGenerating || geminiBusy}
            className={`h-10 w-10 flex items-center justify-center rounded-full text-white transition-all duration-300 ${
              !canStart || isGenerating || geminiBusy
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 hover:scale-110 cursor-pointer"
            }`}
            title={
              mode === "create-image"
                ? "Generate Image"
                : mode === "edit-image"
                ? "Edit Image"
                : mode === "compose-image"
                ? "Compose Image"
                : "Generate Video"
            }
          >
            {isGenerating || geminiBusy ? (
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Mode Badges */}
        <div className="flex gap-1 mt-4 bg-gray-900/70 rounded-lg p-1.5 border border-gray-700">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() =>
                  !isTabDisabled("create-image") && setMode("create-image")
                }
                disabled={isTabDisabled("create-image")}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 flex-1 ${
                  mode === "create-image"
                    ? "bg-purple-600/50 text-white shadow-inner"
                    : isTabDisabled("create-image")
                    ? "text-gray-500 cursor-not-allowed opacity-60"
                    : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                }`}
              >
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image className="w-4 h-4" aria-hidden="true" />
                {getTabText("create-image")}
              </button>
            </TooltipTrigger>
            {getTabTooltip("create-image") && (
              <TooltipContent>
                <p>{getTabTooltip("create-image")}</p>
              </TooltipContent>
            )}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() =>
                  !isTabDisabled("edit-image") && setMode("edit-image")
                }
                disabled={isTabDisabled("edit-image")}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 flex-1 ${
                  mode === "edit-image"
                    ? "bg-purple-600/50 text-white shadow-inner"
                    : isTabDisabled("edit-image")
                    ? "text-gray-500 cursor-not-allowed opacity-60"
                    : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                }`}
              >
                <Edit className="w-4 h-4" />
                {getTabText("edit-image")}
              </button>
            </TooltipTrigger>
            {getTabTooltip("edit-image") && (
              <TooltipContent>
                <p>{getTabTooltip("edit-image")}</p>
              </TooltipContent>
            )}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() =>
                  !isTabDisabled("compose-image") && setMode("compose-image")
                }
                disabled={isTabDisabled("compose-image")}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 flex-1 ${
                  mode === "compose-image"
                    ? "bg-purple-600/50 text-white shadow-inner"
                    : isTabDisabled("compose-image")
                    ? "text-gray-500 cursor-not-allowed opacity-60"
                    : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                }`}
              >
                <Palette className="w-4 h-4" />
                {getTabText("compose-image")}
              </button>
            </TooltipTrigger>
            {getTabTooltip("compose-image") && (
              <TooltipContent>
                <p>{getTabTooltip("compose-image")}</p>
              </TooltipContent>
            )}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() =>
                  !isTabDisabled("create-video") && setMode("create-video")
                }
                disabled={isTabDisabled("create-video")}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 flex-1 ${
                  mode === "create-video"
                    ? "bg-purple-600/50 text-white shadow-inner"
                    : isTabDisabled("create-video")
                    ? "text-gray-500 cursor-not-allowed opacity-60"
                    : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                }`}
              >
                <Video className="w-4 h-4" />
                {getTabText("create-video")}
              </button>
            </TooltipTrigger>
            {getTabTooltip("create-video") && (
              <TooltipContent>
                <p>{getTabTooltip("create-video")}</p>
              </TooltipContent>
            )}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setMode("product-gallery")}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 flex-1 ${
                  mode === "product-gallery"
                    ? "bg-purple-600/50 text-white shadow-inner"
                    : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                {getTabText("product-gallery")}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Browse and remix video gallery</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default Composer;
