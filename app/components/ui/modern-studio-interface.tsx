'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  Upload, 
  Download, 
  Loader2, 
  Sparkles, 
  Play,
  FileImage,
  X
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ModernStudioInterfaceProps {
  mode: 'create-image' | 'edit-image' | 'compose-image' | 'create-video' | 'product-gallery';
  isGenerating: boolean;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onReset: () => void;
  onFileUpload?: (files: File[]) => void;
  generatedContent?: {
    type: 'image' | 'video';
    url: string;
  };
}

const modeConfig = {
  'create-image': {
    title: 'Create Image',
    description: 'Generate stunning visuals from your imagination',
    placeholder: 'Describe the image you want to create...',
    icon: Sparkles,
    color: 'from-blue-500 to-purple-500'
  },
  'edit-image': {
    title: 'Edit Image',
    description: 'Transform existing images with AI',
    placeholder: 'Describe how you want to edit the image...',
    icon: FileImage,
    color: 'from-green-500 to-blue-500'
  },
  'compose-image': {
    title: 'Compose Image',
    description: 'Combine multiple images with AI',
    placeholder: 'Describe how you want to combine the images...',
    icon: FileImage,
    color: 'from-teal-500 to-green-500'
  },
  'create-video': {
    title: 'Create Video',
    description: 'Generate dynamic videos from text',
    placeholder: 'Describe the video you want to create...',
    icon: Play,
    color: 'from-purple-500 to-pink-500'
  },
  'product-gallery': {
    title: 'Gallery',
    description: 'Browse your AI creations',
    placeholder: '',
    icon: FileImage,
    color: 'from-orange-500 to-red-500'
  }
};

export function ModernStudioInterface({
  mode,
  isGenerating,
  prompt,
  onPromptChange,
  onGenerate,
  onReset,
  onFileUpload,
  generatedContent
}: ModernStudioInterfaceProps) {
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const config = modeConfig[mode];
  const Icon = config.icon;

  // Simulate progress during generation
  React.useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 800);
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [isGenerating]);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (onFileUpload) {
      const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      if (files.length > 0) {
        onFileUpload(files);
      }
    }
  }, [onFileUpload]);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      {/* Main content area that grows */}
      <div className="flex-1 p-6 pb-0">
        <div className="mx-auto max-w-4xl h-full flex flex-col">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2 mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${config.color}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {config.title}
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold">{config.title}</h1>
            <p className="text-muted-foreground">{config.description}</p>
          </motion.div>

          {/* Main Content Area - grows to fill space */}
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <GeneratingState 
                  key="generating"
                  progress={progress} 
                  mode={mode}
                />
              ) : generatedContent ? (
                <GeneratedContentDisplay 
                  key="content"
                  content={generatedContent}
                  onReset={onReset}
                />
              ) : (
                <EmptyState
                  key="empty"
                  mode={mode}
                  onFileUpload={onFileUpload}
                  dragActive={dragActive}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Fixed bottom chatbox */}
      <div className="p-6 pt-0">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-lg bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <Textarea
                  value={prompt}
                  onChange={(e) => onPromptChange(e.target.value)}
                  placeholder={config.placeholder}
                  className="min-h-[80px] resize-none text-base"
                  disabled={isGenerating}
                />
                
                <div className="flex items-center justify-between">
                  <Button
                    onClick={onReset}
                    variant="outline"
                    size="sm"
                    disabled={isGenerating}
                  >
                    Reset
                  </Button>
                  
                  <Button
                    onClick={onGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Generating State Component
function GeneratingState({ progress, mode }: { progress: number; mode: string }) {
  const messages = [
    'Initializing AI models...',
    'Analyzing your prompt...',
    'Generating content...',
    'Applying finishing touches...',
    'Almost ready...'
  ];
  
  const currentMessage = messages[Math.floor((progress / 100) * messages.length)] || messages[0];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center space-y-6"
    >
      <Card className="shadow-lg">
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Creating your {mode.replace('-', ' ')}</h3>
              <p className="text-sm text-muted-foreground">{currentMessage}</p>
            </div>
            
            <div className="space-y-2">
              <Progress value={progress} className="w-full max-w-sm mx-auto" />
              <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Generated Content Display Component
function GeneratedContentDisplay({ 
  content, 
  onReset 
}: { 
  content: { type: 'image' | 'video'; url: string };
  onReset: () => void;
}) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = content.url;
    link.download = `alchemy-${content.type}-${Date.now()}`;
    link.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <Card className="shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="min-h-[400px] max-h-[800px] bg-muted relative flex items-center justify-center">
            {content.type === 'image' ? (
              <Image
                src={content.url}
                alt="Generated content"
                width={800}
                height={600}
                className="object-contain max-w-full max-h-full"
              />
            ) : (
              <video
                src={content.url}
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: '800px' }}
                controls
                autoPlay
                muted
              />
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-center gap-3">
        <Button onClick={onReset} variant="outline">
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
        <Button onClick={handleDownload} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </motion.div>
  );
}

// Empty State Component
function EmptyState({
  mode,
  onFileUpload,
  dragActive,
  onDrop,
  onDragOver,
  onDragLeave
}: {
  mode: string;
  onFileUpload?: (files: File[]) => void;
  dragActive: boolean;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
}) {
  const needsFileUpload = mode === 'edit-image' || mode === 'compose-image';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {needsFileUpload ? (
        <Card 
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = mode === 'compose-image';
            input.onchange = (e) => {
              const files = Array.from((e.target as HTMLInputElement).files || []);
              if (files.length > 0 && onFileUpload) {
                onFileUpload(files);
              }
            };
            input.click();
          }}
        >
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Upload an image to edit</h3>
                <p className="text-sm text-muted-foreground">
                  Drag and drop an image here, or click to browse
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports PNG, JPG, WEBP up to 10MB
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Ready to create something amazing?</h3>
                <p className="text-muted-foreground w-full max-w-none px-4 leading-relaxed" style={{ wordBreak: 'normal', whiteSpace: 'normal', textOrientation: 'mixed', writingMode: 'horizontal-tb' }}>
                  Describe your vision in the prompt below and let AI bring it to life
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}