'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StudioMode } from '@/lib/types';
import { ModernNavbar } from '@/components/ui/modern-navbar';
import { ModernStudioInterface } from '@/components/ui/modern-studio-interface';
import { ModernGallery } from '@/components/ui/modern-gallery';
import { ModernCultural } from '@/components/ui/modern-cultural';
import { MOCK_VIDEOS } from '@/lib/config';
import { useStudio } from '@/lib/hooks/useStudio';
import { useGeneration } from '@/lib/hooks/useGeneration';

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

// Gallery item type to match ModernGallery expectations
type GalleryItem = {
  id: string;
  type: 'image' | 'video';
  title: string;
  description: string;
  url: string;
  createdAt: Date;
  tags?: string[];
};

export default function ModernAlchemyStudio() {
  // NEW: Use the enhanced studio hook
  const studio = useStudio();
  const generation = useGeneration(studio);
  
  // Gallery state
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(mockGalleryItems);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  // Map between URL path segment and StudioMode
  const pathToMode = (path: string): StudioMode => {
    const seg = path.replace(/\/+$/, '').split('/').filter(Boolean)[0] || '';
    switch (seg) {
      case 'cultural':
        return 'cultural';
      case 'create':
        return 'create-image';
      case 'edit':
        return 'edit-image';
      case 'video':
        return 'create-video';
      case 'gallery':
        return 'product-gallery';
      default:
        return 'create-image';
    }
  };

  const modeToPath = (mode: StudioMode): string => {
    switch (mode) {
      case 'cultural':
        return '/cultural';
      case 'create-image':
        return '/create';
      case 'edit-image':
        return '/edit';
      case 'create-video':
        return '/video';
      case 'product-gallery':
        return '/gallery';
      case 'compose-image':
        return '/compose';
      default:
        return '/create';
    }
  };

  // Initialize mode from current URL path
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initialMode = pathToMode(window.location.pathname);
    studio.setMode(initialMode);

    // Handle back/forward buttons
    const onPopState = () => {
      const m = pathToMode(window.location.pathname);
      studio.setMode(m);
      if (m === 'product-gallery') {
        loadGallery().catch(() => {/* noop */});
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle mode changes
  const handleModeChange = (mode: StudioMode) => {
    // Update URL without page refresh
    if (typeof window !== 'undefined') {
      const target = modeToPath(mode);
      if (window.location.pathname !== target) {
        window.history.pushState({}, '', target);
      }
    }
    
    // When switching into gallery mode, refresh items from API
    if (mode === 'product-gallery') {
      loadGallery().catch(() => {/* noop */});
    }
  };

  // Handle file uploads with enhanced logic
  const handleFileUpload = async (files: File[]) => {
    try {
      if (!files || files.length === 0) return;
      
      if (studio.mode === 'compose-image' && files.length > 1) {
        // Handle multiple files for compose mode
        studio.setMultipleImageFiles(files.slice(0, 10));
      } else {
        // Handle single file for edit mode or single image
        const file = files[0];
        studio.setImageFile(file);
        
        // For edit mode, immediately show the uploaded image
        if (studio.mode === 'edit-image') {
          const previewUrl = URL.createObjectURL(file);
          studio.setGeneratedImage(previewUrl);
        }
      }
    } catch (e) {
      console.error('File upload failed:', e);
      alert(`File upload failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  // Load media items from backend (Neo4j via /api/media)
  async function loadGallery() {
    try {
      if (isLoadingGallery) return; // prevent overlapping calls
      setIsLoadingGallery(true);
      const res = await fetch('/api/media?limit=100', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to fetch media: ${res.status}`);
      const data = await res.json();
      const media = Array.isArray(data?.media) ? data.media : [];
      if (media.length === 0) {
        // Fallback to mocks when no media exist
        setGalleryItems(mockGalleryItems);
        return;
      }
      const mapped: GalleryItem[] = media
        .filter((m: any) => m && (m.type === 'image' || m.type === 'video') && typeof m.url === 'string')
        .map((m: any) => ({
          id: String(m.id || m.url),
          type: m.type === 'video' ? 'video' : 'image',
          title: m.title || String(m.id || 'Untitled'),
          description: m.description || '',
          // Normalize to relative URL to avoid next/image host config issues
          url: typeof m.url === 'string' ? m.url.replace(/^https?:\/\/localhost:3000/, '') : '',
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
          tags: Array.isArray(m.tags) ? m.tags : [],
        }));
      setGalleryItems(mapped);
    } catch (e) {
      console.error('Failed to load gallery items:', e);
      // On error, keep current items (initially mocks)
    } finally {
      setIsLoadingGallery(false);
    }
  }

  // Initial load on mount
  useEffect(() => {
    loadGallery().catch(() => {/* noop */});
  }, []);

  // Real-time refresh while in Gallery mode (poll every 8s)
  useEffect(() => {
    if (studio.mode !== 'product-gallery') return;
    const iv = setInterval(() => {
      loadGallery().catch(() => {/* noop */});
    }, 8000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studio.mode]);

  // NEW: Auto-refresh gallery when new content is generated
  useEffect(() => {
    if (studio.generatedImage || studio.videoUrl) {
      // Delay refresh to allow backend processing
      const timer = setTimeout(() => {
        loadGallery().catch(() => {/* noop */});
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [studio.generatedImage, studio.videoUrl]);

  // Delete handler passed into ModernGallery
  const handleDelete = async (item: GalleryItem) => {
    try {
      // Prefer deleting by id; fallback to url
      const payload = item.id ? { id: item.id } : { url: item.url };
      const resp = await fetch('/api/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Delete failed: ${resp.status} ${text}`);
      }
      await loadGallery();
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Failed to delete media.');
    }
  };

  // NEW: Handle cultural context transfer
  const handleCulturalTransfer = (mode: 'create-image' | 'edit-image' | 'create-video') => {
    studio.setMode(mode);
    handleModeChange(mode);
  };

  // NEW: Handle downloads with shared state tracking
  const handleDownloadImage = () => {
    if (studio.generatedImage) {
      const link = document.createElement('a');
      link.href = studio.generatedImage;
      link.download = `alchemy-image-${Date.now()}.png`;
      link.click();
      
      // Track in workflow history
      studio.addToWorkflowHistory({
        mode: studio.mode,
        prompt: studio.getCurrentPrompt(),
        result: 'Image downloaded'
      });
    }
  };

  const handleDownloadVideo = () => {
    if (studio.videoUrl) {
      const link = document.createElement('a');
      link.href = studio.videoUrl;
      link.download = `alchemy-video-${Date.now()}.mp4`;
      link.click();
      
      // Track in workflow history
      studio.addToWorkflowHistory({
        mode: studio.mode,
        prompt: studio.getCurrentPrompt(),
        result: 'Video downloaded'
      });
    }
  };

  // Enhanced current content for studio interface
  const currentGeneratedContent = useMemo(() => {
    if (studio.videoUrl) {
      return { type: 'video' as const, url: studio.videoUrl };
    }
    if (studio.generatedImage) {
      return { type: 'image' as const, url: studio.generatedImage };
    }
    return undefined;
  }, [studio.videoUrl, studio.generatedImage]);

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Navigation with studio state */}
      <ModernNavbar 
        currentMode={studio.mode} 
        onModeChange={handleModeChange}
        studio={studio}
      />

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={studio.mode}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {studio.mode === 'product-gallery' ? (
            <ModernGallery items={galleryItems} onDelete={handleDelete} />
          ) : studio.mode === 'cultural' ? (
            <ModernCultural 
              studio={studio}
              onTransferToMode={handleCulturalTransfer}
            />
          ) : (
            <ModernStudioInterface
              mode={studio.mode}
              isGenerating={generation.isLoadingUI}
              prompt={studio.getCurrentPrompt()}
              onPromptChange={studio.setCurrentPrompt}
              onGenerate={generation.startGeneration}
              onReset={studio.resetAll}
              onFileUpload={handleFileUpload}
              generatedContent={currentGeneratedContent}
              studio={studio}
              onModeChange={(mode) => {
                studio.setMode(mode);
                handleModeChange(mode);
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}