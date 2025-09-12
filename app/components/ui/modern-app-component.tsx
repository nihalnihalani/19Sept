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
  const [state, setState] = useState<AppState>({
    mode: 'create-image',
    prompt: '',
    isGenerating: false,
    generatedContent: null
  });

  const [operationName, setOperationName] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(mockGalleryItems);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  // Map between URL path segment and StudioMode
  const pathToMode = (path: string): StudioMode => {
    const seg = path.replace(/\/+$/, '').split('/').filter(Boolean)[0] || '';
    switch (seg) {
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
    setState(prev => ({ ...prev, mode: initialMode }));

    // Handle back/forward buttons
    const onPopState = () => {
      const m = pathToMode(window.location.pathname);
      setState(prev => ({ ...prev, mode: m, generatedContent: null }));
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
    setState(prev => ({
      ...prev,
      mode,
      prompt: '',
      generatedContent: null
    }));
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
    if (state.mode !== 'product-gallery') return;
    const iv = setInterval(() => {
      loadGallery().catch(() => {/* noop */});
    }, 8000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.mode]);

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
        // If the API also saved the image and inserted into Neo4j, refresh gallery
        // Prefer the saved URL for the gallery view
        if (json?.image?.url) {
          await loadGallery();
        }
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
      } else if (json?.message) {
        // Gemini may return text guidance without an inline image (we fallback attempted on server)
        alert(json.message || 'No image generated. Try a more specific prompt.');
        setState(prev => ({ ...prev, isGenerating: false }));
      } else if (json?.error) {
        throw new Error(json.error);
      }

      // If server saved the edited image and returned a URL, refresh gallery
      if (json?.image?.url) {
        await loadGallery();
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
      form.append('model', 'veo-3.0-generate-001');

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
      
      let completed = false;
      try {
        const resp = await fetch('/api/veo/operation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: operationName }),
        });
        const fresh = await resp.json();
        
        if (fresh?.done) {
          completed = true;
          const primaryUri = fresh?.response?.generatedVideos?.[0]?.video?.uri;
          const fallbackUri = Array.isArray(fresh?.uris) && fresh.uris.length > 0 ? fresh.uris[0] : undefined;
          const fileUri = primaryUri || fallbackUri;
          if (fileUri) {
            try {
              const dl = await fetch('/api/veo/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uri: fileUri, save: true }),
              });
              if (dl.ok) {
                const saved = await dl.json();
                const url = saved?.url as string | undefined;
                if (url) {
                  setState(prev => ({
                    ...prev,
                    generatedContent: {
                      type: 'video',
                      url
                    },
                    isGenerating: false
                  }));
                  setVideoUrl(url);
                  await loadGallery();
                } else {
                  // Fallback to streaming if JSON not as expected
                  setState(prev => ({ ...prev, isGenerating: false }));
                }
              } else {
                setState(prev => ({ ...prev, isGenerating: false }));
              }
            } catch (e) {
              console.error('Download/save video failed:', e);
              setState(prev => ({ ...prev, isGenerating: false }));
            }
          } else {
            setState(prev => ({ ...prev, isGenerating: false }));
          }
          // Stop further polling for this operation
          setOperationName(null);
          return;
        }
      } catch (e) {
        console.error('Polling error:', e);
        setState(prev => ({ ...prev, isGenerating: false }));
      } finally {
        if (!completed) {
          timer = setTimeout(poll, 5000);
        }
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
            <ModernGallery items={galleryItems} onDelete={handleDelete} />
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