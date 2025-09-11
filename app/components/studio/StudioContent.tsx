'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Upload, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudioState, StudioActions } from '@/lib/hooks/useStudio';
import { useGeneration } from '@/lib/hooks/useGeneration';

interface StudioContentProps {
  studio: StudioState & StudioActions;
  onFileUpload: (files: File[]) => void;
  onImageUpload: (file: File) => void;
  onDownloadImage: () => void;
  onDownloadVideo: () => void;
}

// Animation variants for consistent motion
const contentVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { delay: 0.1, duration: 0.3 }
  },
};

export function StudioContent({ 
  studio, 
  onFileUpload, 
  onImageUpload, 
  onDownloadImage, 
  onDownloadVideo 
}: StudioContentProps) {
  const generation = useGeneration(studio);
  
  // Loading messages with model integration
  const loadingMessages = useMemo(() => {
    if (studio.mode === 'create-video') {
      return [
        `${generation.modelLabel} is crafting your video...`,
        'Generating keyframes and motion...',
        'Enhancing detail and lighting...',
        'Color grading and encoding...',
        'Almost there...',
        'Perfecting the final details...',
      ];
    }
    return [
      `${generation.modelLabel} is creating your image...`,
      'Composing layout and subject...',
      'Applying style and color...',
      'Refining edges and textures...',
      'Almost there...',
      'Adding final touches...',
    ];
  }, [studio.mode, generation.modelLabel]);

  const [loadingIndex, setLoadingIndex] = useState(0);

  // Rotate loading messages
  useEffect(() => {
    if (!generation.isLoadingUI) {
      setLoadingIndex(0);
      return;
    }
    const id = setInterval(() => {
      setLoadingIndex((i) => (i + 1) % loadingMessages.length);
    }, 2500);
    return () => clearInterval(id);
  }, [generation.isLoadingUI, loadingMessages]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      if (studio.mode === 'compose-image') {
        onFileUpload(imageFiles.slice(0, 10));
      } else if (studio.mode === 'edit-image' || studio.mode === 'create-video') {
        onImageUpload(imageFiles[0]);
      }
    }
  };

  return (
    <div 
      className="relative w-full min-h-[calc(100vh-64px)]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Main content area with consistent spacing */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-4 py-8 space-y-8">
        
        {/* Loading State */}
        {generation.isLoadingUI && !studio.videoUrl && (
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            className="w-full max-w-2xl"
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center gap-6 text-center">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <div className="inline-flex items-center rounded-full bg-primary/20 px-4 py-2 text-sm font-medium text-primary">
                      {generation.modelLabel}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-lg">
                    {loadingMessages[loadingIndex]}
                  </p>
                  <div className="w-full max-w-xs">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <motion.div 
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        initial={{ x: "-100%" }}
                        animate={{ x: "0%" }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {/* Welcome State */}
        {!generation.isLoadingUI && !studio.videoUrl && !studio.generatedImage && !studio.uploadedImageUrl && (
          <motion.div
            variants={contentVariants}
            initial="initial"
            animate="animate"
            className="w-full max-w-3xl"
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Welcome to Alchemy Studio
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  Transform your ideas into stunning visuals with AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Upload area for modes that need images */}
                {((studio.mode === "edit-image" || studio.mode === "create-video") && !studio.imageFile && !studio.generatedImage) && (
                  <div
                    className="rounded-lg border-2 border-dashed border-border p-8 cursor-pointer transition-all duration-200 hover:bg-accent/10 hover:border-primary/50"
                    onClick={() => {
                      const input = document.getElementById("single-image-input") as HTMLInputElement;
                      input?.click();
                    }}
                  >
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Upload className="w-8 h-8" />
                      <div className="font-medium text-lg text-foreground">
                        Drop an image here, or click to upload
                      </div>
                      <div className="text-sm opacity-80">
                        For {studio.mode === 'edit-image' ? 'Image Editing' : 'Video Generation'}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Compose mode upload area */}
                {studio.mode === "compose-image" && studio.multipleImageFiles.length === 0 && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Compose Multiple Images</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload multiple images to combine them into a single composition
                      </p>
                    </div>
                    
                    <div
                      className="rounded-lg border-2 border-dashed border-border p-8 cursor-pointer transition-all duration-200 hover:bg-accent/10 hover:border-primary/50"
                      onClick={() => {
                        const input = document.getElementById("multiple-image-input") as HTMLInputElement;
                        input?.click();
                      }}
                    >
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Upload className="w-8 h-8" />
                        <div className="text-center">
                          <div className="font-medium text-lg text-foreground">
                            Drop multiple images here, or click to upload
                          </div>
                          <div className="text-sm opacity-80 mt-1">
                            PNG, JPG, WEBP up to 10MB each (max 10 images)
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Image thumbnails */}
                    {studio.multipleImageFiles.length > 0 && (
                      <div className="flex flex-wrap gap-4 justify-center mt-6">
                        {studio.multipleImageFiles.map((file, index) => (
                          <div
                            key={index}
                            className="w-20 h-20 rounded-lg overflow-hidden border border-border shadow-sm"
                            title={file.name}
                          >
                            <Image
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                              width={80}
                              height={80}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Hidden file inputs */}
                <input
                  id="single-image-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onImageUpload(file);
                  }}
                />
                <input
                  id="multiple-image-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      const files = Array.from(e.target.files);
                      onFileUpload(files.filter(f => f.type.startsWith('image/')).slice(0, 10));
                    }
                  }}
                />
                
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {/* Generated Content Display */}
        {(studio.generatedImage || studio.uploadedImageUrl) && !studio.videoUrl && !generation.isLoadingUI && (
          <motion.div
            variants={contentVariants}
            initial="initial"
            animate="animate"
            className="w-full max-w-4xl space-y-6"
          >
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video relative">
                  <Image
                    src={studio.generatedImage || studio.uploadedImageUrl || ""}
                    alt="Generated content"
                    className="w-full h-full object-contain"
                    width={800}
                    height={450}
                  />
                </div>
              </CardContent>
            </Card>
            
            {studio.generatedImage && (
              <div className="flex justify-center">
                <Button
                  onClick={onDownloadImage}
                  className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  size="lg"
                >
                  <Download className="w-5 h-5" />
                  Download Image
                </Button>
              </div>
            )}
          </motion.div>
        )}
        
        {/* Video Display */}
        {studio.videoUrl && (
          <motion.div
            variants={contentVariants}
            initial="initial"
            animate="animate"
            className="w-full max-w-4xl space-y-6"
          >
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video bg-black">
                  <video 
                    src={studio.videoUrl} 
                    className="w-full h-full" 
                    controls 
                    autoPlay 
                    muted={false} 
                    loop 
                    playsInline 
                  />
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-center">
              <Button
                onClick={onDownloadVideo}
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                size="lg"
              >
                <Download className="w-5 h-5" />
                Download Video
              </Button>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Control Panel */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-[min(100%,56rem)] px-4">
        <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-2xl">
          <CardContent className="p-6">
            <div className="space-y-4">
              <Textarea
                value={studio.getCurrentPrompt()}
                onChange={(e) => studio.setCurrentPrompt(e.target.value)}
                placeholder={generation.placeholderText}
                className="min-h-[80px] text-base resize-none"
                rows={3}
              />

              <div className="flex items-center justify-between">
                <Button
                  onClick={studio.resetAll}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  Reset
                </Button>
                <Button
                  onClick={generation.startGeneration}
                  disabled={!generation.canStart}
                  className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  size="lg"
                >
                  {generation.isLoadingUI && <Loader2 className="h-4 w-4 animate-spin" />}
                  Generate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}