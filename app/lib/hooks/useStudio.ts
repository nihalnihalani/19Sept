'use client';

import { useState, useEffect, useCallback } from 'react';
import { StudioMode } from '@/lib/types';

export interface StudioState {
  // Core state
  mode: StudioMode;
  
  // Generation state
  isGenerating: boolean;
  imagenBusy: boolean;
  geminiBusy: boolean;
  
  // Model configuration
  selectedModel: string;
  
  // Prompts for different modes
  imagePrompt: string;
  editPrompt: string;
  composePrompt: string;
  videoPrompt: string;
  negativePrompt: string;
  aspectRatio: string;
  
  // Media handling
  imageFile: File | null;
  uploadedImageUrl: string | null;
  multipleImageFiles: File[];
  generatedImage: string | null;
  videoUrl: string | null;
  
  // Video generation
  operationName: string | null;
}

export interface StudioActions {
  // Mode management
  setMode: (mode: StudioMode) => void;
  
  // Generation controls
  setIsGenerating: (generating: boolean) => void;
  setImagenBusy: (busy: boolean) => void;
  setGeminiBusy: (busy: boolean) => void;
  
  // Model selection
  setSelectedModel: (model: string) => void;
  
  // Prompt management
  setImagePrompt: (prompt: string) => void;
  setEditPrompt: (prompt: string) => void;
  setComposePrompt: (prompt: string) => void;
  setVideoPrompt: (prompt: string) => void;
  setNegativePrompt: (prompt: string) => void;
  setAspectRatio: (ratio: string) => void;
  
  // Media handling
  setImageFile: (file: File | null) => void;
  setMultipleImageFiles: (files: File[]) => void;
  setGeneratedImage: (image: string | null) => void;
  setVideoUrl: (url: string | null) => void;
  setOperationName: (name: string | null) => void;
  
  // Utility actions
  resetAll: () => void;
  getCurrentPrompt: () => string;
  setCurrentPrompt: (prompt: string) => void;
}

const initialState: StudioState = {
  mode: 'create-image',
  isGenerating: false,
  imagenBusy: false,
  geminiBusy: false,
  selectedModel: 'gemini-2.5-flash-image-preview',
  imagePrompt: '',
  editPrompt: '',
  composePrompt: '',
  videoPrompt: '',
  negativePrompt: '',
  aspectRatio: '16:9',
  imageFile: null,
  uploadedImageUrl: null,
  multipleImageFiles: [],
  generatedImage: null,
  videoUrl: null,
  operationName: null,
};

export function useStudio(): StudioState & StudioActions {
  // Core state
  const [mode, setMode] = useState<StudioMode>(initialState.mode);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(initialState.isGenerating);
  const [imagenBusy, setImagenBusy] = useState(initialState.imagenBusy);
  const [geminiBusy, setGeminiBusy] = useState(initialState.geminiBusy);
  
  // Model configuration
  const [selectedModel, setSelectedModel] = useState(initialState.selectedModel);
  
  // Prompts
  const [imagePrompt, setImagePrompt] = useState(initialState.imagePrompt);
  const [editPrompt, setEditPrompt] = useState(initialState.editPrompt);
  const [composePrompt, setComposePrompt] = useState(initialState.composePrompt);
  const [videoPrompt, setVideoPrompt] = useState(initialState.videoPrompt);
  const [negativePrompt, setNegativePrompt] = useState(initialState.negativePrompt);
  const [aspectRatio, setAspectRatio] = useState(initialState.aspectRatio);
  
  // Media
  const [imageFile, setImageFile] = useState<File | null>(initialState.imageFile);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(initialState.uploadedImageUrl);
  const [multipleImageFiles, setMultipleImageFiles] = useState<File[]>(initialState.multipleImageFiles);
  const [generatedImage, setGeneratedImage] = useState<string | null>(initialState.generatedImage);
  const [videoUrl, setVideoUrl] = useState<string | null>(initialState.videoUrl);
  const [operationName, setOperationName] = useState<string | null>(initialState.operationName);
  
  // Auto-update model based on mode
  useEffect(() => {
    if (mode === 'create-video') {
      setSelectedModel('veo-3.0-generate-001');
    } else if (mode === 'edit-image' || mode === 'compose-image') {
      setSelectedModel('gemini-2.5-flash-image-preview');
    } else if (mode === 'create-image') {
      if (!selectedModel.includes('gemini') && !selectedModel.includes('imagen')) {
        setSelectedModel('gemini-2.5-flash-image-preview');
      }
    }
  }, [mode, selectedModel]);
  
  // Handle image file URL generation
  useEffect(() => {
    let objectUrl: string | null = null;
    if (imageFile) {
      objectUrl = URL.createObjectURL(imageFile);
      setUploadedImageUrl(objectUrl);
    } else {
      setUploadedImageUrl(null);
    }
    
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageFile]);
  
  // Reset function
  const resetAll = useCallback(() => {
    setVideoPrompt('');
    setNegativePrompt('');
    setAspectRatio('16:9');
    setImagePrompt('');
    setEditPrompt('');
    setComposePrompt('');
    setImageFile(null);
    setMultipleImageFiles([]);
    setGeneratedImage(null);
    setOperationName(null);
    setIsGenerating(false);
    setVideoUrl(null);
    setImagenBusy(false);
    setGeminiBusy(false);
  }, []);
  
  // Get current prompt based on mode
  const getCurrentPrompt = useCallback(() => {
    switch (mode) {
      case 'create-image':
        return imagePrompt;
      case 'edit-image':
        return editPrompt;
      case 'compose-image':
        return composePrompt;
      case 'create-video':
        return videoPrompt;
      default:
        return '';
    }
  }, [mode, imagePrompt, editPrompt, composePrompt, videoPrompt]);
  
  // Set current prompt based on mode
  const setCurrentPrompt = useCallback((prompt: string) => {
    switch (mode) {
      case 'create-image':
        setImagePrompt(prompt);
        break;
      case 'edit-image':
        setEditPrompt(prompt);
        break;
      case 'compose-image':
        setComposePrompt(prompt);
        break;
      case 'create-video':
        setVideoPrompt(prompt);
        break;
    }
  }, [mode]);
  
  return {
    // State
    mode,
    isGenerating,
    imagenBusy,
    geminiBusy,
    selectedModel,
    imagePrompt,
    editPrompt,
    composePrompt,
    videoPrompt,
    negativePrompt,
    aspectRatio,
    imageFile,
    uploadedImageUrl,
    multipleImageFiles,
    generatedImage,
    videoUrl,
    operationName,
    
    // Actions
    setMode,
    setIsGenerating,
    setImagenBusy,
    setGeminiBusy,
    setSelectedModel,
    setImagePrompt,
    setEditPrompt,
    setComposePrompt,
    setVideoPrompt,
    setNegativePrompt,
    setAspectRatio,
    setImageFile,
    setMultipleImageFiles,
    setGeneratedImage,
    setVideoUrl,
    setOperationName,
    resetAll,
    getCurrentPrompt,
    setCurrentPrompt,
  };
}