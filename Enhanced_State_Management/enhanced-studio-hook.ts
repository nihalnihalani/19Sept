'use client';

import { useState, useEffect, useCallback } from 'react';
import { StudioMode } from '@/lib/types';

// Extended state interface with cross-mode connectivity
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

  // NEW: Cross-mode state sharing
  sharedContent: {
    lastGeneratedImage: string | null;
    lastGeneratedVideo: string | null;
    culturalContext: string | null;
    basePrompt: string | null; // Shared prompt context
  };
  
  // NEW: Workflow history
  workflowHistory: Array<{
    mode: StudioMode;
    prompt: string;
    result: string;
    timestamp: Date;
  }>;
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
  
  // NEW: Cross-mode actions
  setSharedContent: (content: Partial<StudioState['sharedContent']>) => void;
  addToWorkflowHistory: (entry: Omit<StudioState['workflowHistory'][0], 'timestamp'>) => void;
  transferToMode: (targetMode: StudioMode, transferData?: any) => void;
  applyCulturalContext: (context: string) => void;
  
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
  // NEW: Initialize shared state
  sharedContent: {
    lastGeneratedImage: null,
    lastGeneratedVideo: null,
    culturalContext: null,
    basePrompt: null,
  },
  workflowHistory: [],
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
  
  // NEW: Cross-mode state
  const [sharedContent, setSharedContentState] = useState(initialState.sharedContent);
  const [workflowHistory, setWorkflowHistory] = useState(initialState.workflowHistory);

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

  // NEW: Auto-populate content when switching modes
  useEffect(() => {
    if (mode === 'edit-image' && sharedContent.lastGeneratedImage && !generatedImage) {
      setGeneratedImage(sharedContent.lastGeneratedImage);
    } else if (mode === 'create-video' && sharedContent.lastGeneratedImage && !imageFile && !generatedImage) {
      setGeneratedImage(sharedContent.lastGeneratedImage);
    }
    
    // Apply cultural context if available
    if (sharedContent.culturalContext && !getCurrentPrompt()) {
      const contextualPrompt = sharedContent.basePrompt || sharedContent.culturalContext;
      setCurrentPrompt(contextualPrompt);
    }
  }, [mode, sharedContent]);

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

  // NEW: Track generated content in shared state
  useEffect(() => {
    if (generatedImage && generatedImage !== sharedContent.lastGeneratedImage) {
      setSharedContentState(prev => ({
        ...prev,
        lastGeneratedImage: generatedImage
      }));
    }
  }, [generatedImage, sharedContent.lastGeneratedImage]);

  useEffect(() => {
    if (videoUrl && videoUrl !== sharedContent.lastGeneratedVideo) {
      setSharedContentState(prev => ({
        ...prev,
        lastGeneratedVideo: videoUrl
      }));
    }
  }, [videoUrl, sharedContent.lastGeneratedVideo]);
  
  // NEW: Cross-mode actions
  const setSharedContent = useCallback((content: Partial<StudioState['sharedContent']>) => {
    setSharedContentState(prev => ({ ...prev, ...content }));
  }, []);

  const addToWorkflowHistory = useCallback((entry: Omit<StudioState['workflowHistory'][0], 'timestamp'>) => {
    setWorkflowHistory(prev => [
      ...prev,
      { ...entry, timestamp: new Date() }
    ].slice(-10)); // Keep last 10 entries
  }, []);

  const transferToMode = useCallback((targetMode: StudioMode, transferData?: any) => {
    // Add current state to history
    const currentPrompt = getCurrentPrompt();
    if (currentPrompt) {
      addToWorkflowHistory({
        mode,
        prompt: currentPrompt,
        result: generatedImage || videoUrl || 'No result'
      });
    }

    // Transfer data based on mode
    if (transferData) {
      if (transferData.image) {
        setGeneratedImage(transferData.image);
        setSharedContent({ lastGeneratedImage: transferData.image });
      }
      if (transferData.video) {
        setVideoUrl(transferData.video);
        setSharedContent({ lastGeneratedVideo: transferData.video });
      }
      if (transferData.prompt) {
        setSharedContent({ basePrompt: transferData.prompt });
      }
    }

    // Switch mode
    setMode(targetMode);
  }, [mode, getCurrentPrompt, generatedImage, videoUrl, addToWorkflowHistory, setSharedContent]);

  const applyCulturalContext = useCallback((context: string) => {
    setSharedContent({ 
      culturalContext: context,
      basePrompt: context 
    });
    
    // Apply to current mode's prompt if empty
    const currentPrompt = getCurrentPrompt();
    if (!currentPrompt.trim()) {
      setCurrentPrompt(context);
    }
  }, [getCurrentPrompt, setSharedContent]);
  
  // Reset function (enhanced)
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
    // Don't reset shared content to maintain cross-mode connectivity
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
    sharedContent,
    workflowHistory,
    
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
    setSharedContent,
    addToWorkflowHistory,
    transferToMode,
    applyCulturalContext,
    resetAll,
    getCurrentPrompt,
    setCurrentPrompt,
  };
}