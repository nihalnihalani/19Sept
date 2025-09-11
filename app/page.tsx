'use client';

import React, { useState } from 'react';
import { StudioMode } from '@/lib/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { StudioContent } from '@/components/studio/StudioContent';
import Gallery from '@/components/gallery/Gallery';
import { useStudio } from '@/lib/hooks/useStudio';

const POLL_INTERVAL_MS = 5000;

const VeoStudio: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<StudioMode>('create-image');
  const studio = useStudio();

  // Sync mode between local state and studio hook
  React.useEffect(() => {
    studio.setMode(currentMode);
  }, [currentMode, studio]);

  // Video polling for operations
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    
    async function poll() {
      if (!studio.operationName || studio.videoUrl) return;
      
      try {
        const resp = await fetch('/api/veo/operation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: studio.operationName }),
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
            studio.setVideoUrl(url);
          }
          studio.setIsGenerating(false);
          return;
        }
      } catch (e) {
        console.error(e);
        studio.setIsGenerating(false);
      } finally {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }
    
    if (studio.operationName && !studio.videoUrl) {
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [studio.operationName, studio.videoUrl, studio]);

  // File upload handlers
  const handleFileUpload = (files: File[]) => {
    studio.setMultipleImageFiles(files);
  };

  const handleImageUpload = (file: File) => {
    studio.setImageFile(file);
  };

  // Download handlers
  const handleDownloadImage = async () => {
    if (!studio.generatedImage) return;

    try {
      const response = await fetch(studio.generatedImage);
      const blob = await response.blob();
      const mimeType = blob.type || 'image/png';
      const extension = mimeType.split('/')[1] || 'png';
      const safeModelName = studio.selectedModel.replace(/[^a-zA-Z0-9-]/g, '_');
      const filename = `${safeModelName}.${extension}`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.setAttribute('download', filename);
      link.setAttribute('rel', 'noopener');
      link.target = '_self';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 0);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleDownloadVideo = async () => {
    if (!studio.videoUrl) return;

    try {
      const response = await fetch(studio.videoUrl);
      const blob = await response.blob();
      const filename = 'veo3_video.mp4';

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.setAttribute('download', filename);
      link.setAttribute('rel', 'noopener');
      link.target = '_self';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 0);
    } catch (error) {
      console.error('Error downloading video:', error);
    }
  };

  // Render content based on current mode
  const renderContent = () => {
    if (currentMode === 'product-gallery') {
      return <Gallery />;
    }
    
    return (
      <StudioContent
        studio={studio}
        onFileUpload={handleFileUpload}
        onImageUpload={handleImageUpload}
        onDownloadImage={handleDownloadImage}
        onDownloadVideo={handleDownloadVideo}
      />
    );
  };

  return (
    <AppLayout currentMode={currentMode} onModeChange={setCurrentMode}>
      {renderContent()}
    </AppLayout>
  );
};

export default VeoStudio;
