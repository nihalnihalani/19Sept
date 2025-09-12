'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StudioMode } from '@/lib/types';
import { ModernNavbar } from '@/components/ui/modern-navbar';
import { ModernStudioInterface } from '@/components/ui/modern-studio-interface';
import { ModernGallery } from '@/components/ui/modern-gallery';

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

// Mock gallery data for demonstration
const mockGalleryItems = [
  {
    id: '1',
    type: 'video' as const,
    title: 'Fluffy Characters Culinary Adventure',
    description: 'A whimsical stop-motion animation featuring fluffy characters in a colorful kitchen setting with bubbling potions and magical cooking mishaps.',
    url: 'https://www.gstatic.com/aistudio/starter-apps/veo3-gallery/Stop_Motion_Fluffy_Characters__Culinary_Disaster.mp4',
    createdAt: new Date('2024-12-20'),
    tags: ['stop-motion', 'characters', 'cooking']
  },
  {
    id: '2',
    type: 'video' as const,
    title: 'Robot Existential Crisis',
    description: 'A claymation piece exploring themes of purpose and identity through a charming robot character in a cluttered workshop setting.',
    url: 'https://www.gstatic.com/aistudio/starter-apps/veo3-gallery/Claymation_Robot_s_Existential_Crisis.mp4',
    createdAt: new Date('2024-12-19'),
    tags: ['claymation', 'robot', 'philosophy']
  },
  {
    id: '3',
    type: 'video' as const,
    title: 'Mechanical Heart in Desert',
    description: 'An abstract cinematic visualization of a massive mechanical heart structure in a desolate landscape, tended by tiny maintenance figures.',
    url: 'https://www.gstatic.com/aistudio/starter-apps/veo3-gallery/Abstract_Cinematic_The_Mechanical_Heartbeat.mp4',
    createdAt: new Date('2024-12-18'),
    tags: ['abstract', 'mechanical', 'desert']
  },
  {
    id: '4',
    type: 'video' as const,
    title: 'Live Jazz Performance',
    description: 'A soulful vocalist performing in an intimate jazz club setting with warm lighting and atmospheric smoke.',
    url: 'https://www.gstatic.com/aistudio/starter-apps/veo3-gallery/Live_Performance_Soulful_Singer_s_Ballad.mp4',
    createdAt: new Date('2024-12-17'),
    tags: ['jazz', 'performance', 'music']
  }
];

export default function ModernAlchemyStudio() {
  const [state, setState] = useState<AppState>({
    mode: 'create-image',
    prompt: '',
    isGenerating: false,
    generatedContent: null
  });

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
      // Simulate API call based on mode
      if (state.mode === 'create-video') {
        await simulateVideoGeneration();
      } else {
        await simulateImageGeneration();
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
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
  };

  // Handle file uploads
  const handleFileUpload = (files: File[]) => {
    console.log('Files uploaded:', files);
    // Handle file upload logic here
  };

  // Simulate image generation
  const simulateImageGeneration = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock generated image
    setState(prev => ({
      ...prev,
      generatedContent: {
        type: 'image',
        url: `https://picsum.photos/800/600?random=${Date.now()}`
      }
    }));
  };

  // Simulate video generation
  const simulateVideoGeneration = async () => {
    // Simulate longer API delay for video
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Use one of the mock videos
    const randomVideo = mockGalleryItems[Math.floor(Math.random() * mockGalleryItems.length)];
    setState(prev => ({
      ...prev,
      generatedContent: {
        type: 'video',
        url: randomVideo.url
      }
    }));
  };

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