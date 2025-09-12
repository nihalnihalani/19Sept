'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StudioMode } from '@/lib/types';
import { ModernNavbar } from '@/components/ui/modern-navbar';
import { ModernStudioInterface } from '@/components/ui/modern-studio-interface';
import { ModernGallery } from '@/components/ui/modern-gallery';
import { MOCK_VIDEOS } from '@/lib/config';

// Simplified state management
interface AppState {
  mode: StudioMode;
  prompt: string;
  isGenerating: boolean;
  generatedContent: {
    type: 'image' | 'video';
    url: string;
  } | null;
}

// Convert mock videos to gallery format
const mockGalleryItems = MOCK_VIDEOS.map(video => ({
  id: video.id,
  type: 'video' as const,
  title: video.title,
  description: video.description,
  url: video.videoUrl,
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random dates within last 30 days
  tags: video.title.toLowerCase().split(' ').slice(0, 3)
}));

export default function ModernAlchemyStudio() {
  const [state, setState] = useState<AppState>({
    mode: 'create-image',
    prompt: '',
    isGenerating: false,
    generatedContent: null
  });

  const [operationName, setOperationName] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Handle mode changes
  const handleModeChange = (mode: StudioMode) => {
    setState(prev => ({
      ...prev,
      mode,
      prompt: '',
      generatedContent: null
    }));
  };

  // Handle prompt changes
  const handlePromptChange = (prompt: string) => {
    setState(prev => ({ ...prev, prompt }));
  };

  // Handle generation
  const handleGenerate = async () => {
    if (!state.prompt.trim()) return;

    setState(prev => ({ ...prev, isGenerating: true }));

    try {
      if (state.mode === 'create-video') {
        await generateVideo();
      } else if (state.mode === 'edit-image' || state.mode === 'compose-image') {
        await editWithGemini();
      } else {
        // create-image mode
        await generateImage();
      }
    } catch (error) {
      console.error('Generation failed:', error);
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  // Handle reset
  const handleReset = () => {
    setState(prev => ({
      ...prev,
      prompt: '',
      generatedContent: null
    }));
    setOperationName(null);
    setVideoUrl(null);
  };

  // Handle file uploads
  const handleFileUpload = (files: File[]) => {
    console.log('Files uploaded:', files);
    // File upload logic will be handled by the existing API endpoints
  };

  // Generate image using existing API
  const generateImage = async () => {
    try {
      const endpoint = '/api/imagen/generate'; // Default to Imagen
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: state.prompt }),
      });

      if (!resp.ok) {
        throw new Error(`API error: ${resp.status}`);
      }

      const json = await resp.json();
      
      if (json?.image?.imageBytes) {
        const dataUrl = `data:${json.image.mimeType};base64,${json.image.imageBytes}`;
        setState(prev => ({
          ...prev,
          generatedContent: {
            type: 'image',
            url: dataUrl
          },
          isGenerating: false
        }));
      } else if (json?.error) {
        throw new Error(json.error);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  // Edit image using Gemini API
  const editWithGemini = async () => {
    try {
      const form = new FormData();
      form.append('prompt', state.prompt);

      // For now, we'll simulate the editing by generating a new image
      // In a real implementation, you'd handle file upload here
      const resp = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: state.prompt }),
      });

      if (!resp.ok) {
        throw new Error(`API error: ${resp.status}`);
      }

      const json = await resp.json();
      
      if (json?.image?.imageBytes) {
        const dataUrl = `data:${json.image.mimeType};base64,${json.image.imageBytes}`;
        setState(prev => ({
          ...prev,
          generatedContent: {
            type: 'image',
            url: dataUrl
          },
          isGenerating: false
        }));
      } else if (json?.error) {
        throw new Error(json.error);
      }
    } catch (error) {
      console.error('Error editing image:', error);
      alert(`Failed to edit image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  // Generate video using existing Veo API
  const generateVideo = async () => {
    try {
      const form = new FormData();
      form.append('prompt', state.prompt);
      form.append('model', 'veo-3');

      const resp = await fetch('/api/veo/generate', {
        method: 'POST',
        body: form,
      });
      
      const json = await resp.json();
      setOperationName(json?.name || null);
    } catch (error) {
      console.error('Error generating video:', error);
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  // Poll for video generation completion
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    
    async function poll() {
      if (!operationName || videoUrl) return;
      
      try {
        const resp = await fetch('/api/veo/operation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: operationName }),
        });
        const fresh = await resp.json();
        
        if (fresh?.done) {
          const fileUri = fresh?.response?.generatedVideos?.[0]?.video?.uri;
          if (fileUri) {
            const dl = await fetch('/api/veo/download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uri: fileUri }),
            });
            const blob = await dl.blob();
            const url = URL.createObjectURL(blob);
            
            setState(prev => ({
              ...prev,
              generatedContent: {
                type: 'video',
                url: url
              },
              isGenerating: false
            }));
            setVideoUrl(url);
          } else {
            setState(prev => ({ ...prev, isGenerating: false }));
          }
          return;
        }
      } catch (e) {
        console.error('Polling error:', e);
        setState(prev => ({ ...prev, isGenerating: false }));
      } finally {
        timer = setTimeout(poll, 5000);
      }
    }
    
    if (operationName && !videoUrl) {
      timer = setTimeout(poll, 5000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [operationName, videoUrl]);

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <ModernNavbar 
        currentMode={state.mode} 
        onModeChange={handleModeChange} 
      />

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.mode}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {state.mode === 'product-gallery' ? (
            <ModernGallery items={mockGalleryItems} />
          ) : (
            <ModernStudioInterface
              mode={state.mode}
              isGenerating={state.isGenerating}
              prompt={state.prompt}
              onPromptChange={handlePromptChange}
              onGenerate={handleGenerate}
              onReset={handleReset}
              onFileUpload={handleFileUpload}
              generatedContent={state.generatedContent}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}