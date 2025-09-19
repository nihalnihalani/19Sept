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
  X,
  ArrowRight,
  RefreshCw,
  History
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { StudioState, StudioActions } from '@/lib/hooks/useStudio';

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
  // NEW: Add studio state for enhanced functionality
  studio?: StudioState & StudioActions;
  onModeChange?: (mode: 'create-image' | 'edit-image' | 'compose-image' | 'create-video') => void;
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
  generatedContent,
  studio,
  onModeChange
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

  // NEW: Get available transfer actions based on current state
  const getTransferActions = () => {
    if (!studio || !onModeChange) return [];
    
    const actions = [];
    
    if (generatedContent?.type === 'image') {
      if (mode !== 'edit-image') {
        actions.push({
          label: 'Edit This Image',
          target: 'edit-image' as const,
          icon: FileImage,
          description: 'Modify this generated image'
        });
      }
      if (mode !== 'create-video') {
        actions.push({
          label: 'Make Video',
          target: 'create-video' as const,
          icon: Play,
          description: 'Use this image to generate a video'
        });
      }
    }
    
    if (studio.sharedContent.culturalContext && mode !== 'create-image') {
      actions.push({
        label: 'Create with Context',
        target: 'create-image' as const,
        icon: Sparkles,
        description: 'Create new content with cultural context'
      });
    }
    
    return actions;
  };

  // NEW: Handle smart transfer
  const handleTransfer = (targetMode: 'create-image' | 'edit-image' | 'compose-image' | 'create-video') => {
    if (!studio || !onModeChange) return;
    
    const transferData: any = {};
    
    if (generatedContent?.url) {
      if (generatedContent.type === 'image') {
        transferData.image = generatedContent.url;
      } else if (generatedContent.type === 'video') {
        transferData.video = generatedContent.url;
      }
    }
    
    if (prompt) {
      transferData.prompt = prompt;
    }
    
    studio.transferToMode(targetMode, transferData);
    onModeChange(targetMode);
  };

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
              <div className="p-2 rounded-lg bg-muted">
                <Icon className="h-5 w-5 text-foreground" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {config.title}
              </Badge>
              
              {/* NEW: Show workflow indicator */}
              {studio && studio.workflowHistory.length > 0 && (
                <Badge variant="outline" className="text-xs ml-2" title="Workflow steps completed">
                  <History className="h-3 w-3 mr-1" />
                  {studio.workflowHistory.length}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-semibold">{config.title}</h1>
            <p className="text-muted-foreground">{config.description}</p>
            
            {/* NEW: Show cultural context if available */}
            {studio?.sharedContent.culturalContext && (
              <div className="mt-3 p-2 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs text-primary font-medium">Cultural Context Applied</p>
              </div>
            )}
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
                  transferActions={getTransferActions()}
                  onTransfer={handleTransfer}
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
                  studio={studio}
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
            <Card className="border border-border shadow-none bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4 space-y-3">
                <Textarea
                  value={prompt}
                  onChange={(e) => onPromptChange(e.target.value)}
                  placeholder={config.placeholder}
                  className="min-h-[72px] resize-none text-base"
                  disabled={isGenerating}
                />
                
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={onReset}
                      variant="outline"
                      size="sm"
                      disabled={isGenerating}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                    <Button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const files = Array.from((e.target as HTMLInputElement).files || []);
                          if (files.length > 0 && onFileUpload) {
                            onFileUpload(files);
                          }
                        };
                        input.click();
                      }}
                      variant="outline"
                      size="sm"
                      disabled={isGenerating}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Upload Image
                    </Button>
                    
                    {/* NEW: Apply cultural context button */}
                    {studio?.sharedContent.culturalContext && !prompt && (
                      <Button
                        onClick={() => onPromptChange(studio.sharedContent.culturalContext || '')}
                        variant="outline"
                        size="sm"
                        disabled={isGenerating}
                        title="Apply cultural context"
                      >
                        Apply Context
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={onGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="bg-foreground text-background hover:opacity-90"
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

// Generating State Component (unchanged)
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
      <Card className="border border-border shadow-none">
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-foreground/80 animate-pulse" />
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

// Enhanced Generated Content Display Component
function GeneratedContentDisplay({ 
  content, 
  onReset,
  transferActions = [],
  onTransfer
}: { 
  content: { type: 'image' | 'video'; url: string };
  onReset: () => void;
  transferActions?: Array<{
    label: string;
    target: 'create-image' | 'edit-image' | 'compose-image' | 'create-video';
    icon: any;
    description: string;
  }>;
  onTransfer?: (target: 'create-image' | 'edit-image' | 'compose-image' | 'create-video') => void;
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
      className="space-y-6 w-full"
    >
      <Card className="border border-border shadow-none overflow-hidden">
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
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <div className="flex items-center gap-3">
          <Button onClick={onReset} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button onClick={handleDownload} className="bg-foreground text-background hover:opacity-90">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
        
        {/* NEW: Transfer actions */}
        {transferActions.length > 0 && onTransfer && (
          <div className="flex items-center gap-2">
            <div className="h-4 w-px bg-border" />
            {transferActions.slice(0, 2).map((action) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={action.target}
                  onClick={() => onTransfer(action.target)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  title={action.description}
                >
                  <ActionIcon className="h-3 w-3" />
                  {action.label}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Enhanced Empty State Component
function EmptyState({
  mode,
  onFileUpload,
  dragActive,
  onDrop,
  onDragOver,
  onDragLeave,
  studio
}: {
  mode: string;
  onFileUpload?: (files: File[]) => void;
  dragActive: boolean;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  studio?: StudioState & StudioActions;
}) {
  const needsFileUpload = mode === 'edit-image' || mode === 'compose-image';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      {needsFileUpload ? (
        <div className="space-y-4">
          {/* NEW: Show available shared content */}
          {studio?.sharedContent.lastGeneratedImage && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={studio.sharedContent.lastGeneratedImage}
                      alt="Previous generation"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Use Previous Image</p>
                    <p className="text-xs text-muted-foreground">Continue with your last generated image</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (studio.sharedContent.lastGeneratedImage) {
                        studio.setGeneratedImage(studio.sharedContent.lastGeneratedImage);
                      }
                    }}
                  >
                    Use This
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
                  <h3 className="text-lg font-medium">Upload an image to {mode === 'edit-image' ? 'edit' : 'combine'}</h3>
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
        </div>
      ) : (
        (mode === 'create-image' || mode === 'create-video') ? (
          <Card className="border border-border shadow-none">
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Ready to create</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter a prompt below to start generating your {mode.replace('-', ' ')}
                  </p>
                </div>
                
                {/* NEW: Show recent workflow context */}
                {studio && studio.workflowHistory.length > 0 && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Recent Workflow</p>
                    <div className="space-y-2">
                      {studio.workflowHistory.slice(-2).map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs px-2 py-0">
                            {item.mode.replace('-', ' ')}
                          </Badge>
                          <span className="truncate max-w-48">{item.prompt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null
      )}
    </motion.div>
  );
}