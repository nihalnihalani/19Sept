"use client";

import React, { useState } from 'react';
import { EditVideoPage } from './EditVideoPage';
import { ErrorModal } from './ErrorModal';
import { VideoCameraIcon } from './icons';
import { SavingProgressPage } from './SavingProgressPage';
import { VideoGrid } from './VideoGrid';
import { VideoPlayer } from './VideoPlayer';
import { MOCK_VIDEOS } from '@/lib/constants';
import { Video } from '@/types/gallery';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { AnimatedLayout } from '@/components/ui/Animation';
import Header from '@/components/ui/Header';

const VEO3_MODEL_NAME = 'veo-3.0-fast-generate-001';

// ---

function blobToBase64(blob: Blob) {
  return new Promise<string>(async (resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      resolve(url.split(',')[1]);
    };
    reader.readAsDataURL(blob);
  });
}

// ---

async function generateVideoFromText(
  prompt: string,
  numberOfVideos = 1,
): Promise<string[]> {
  try {
    const response = await fetch('/api/veo/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model: VEO3_MODEL_NAME,
        config: {
          numberOfVideos,
          aspectRatio: '16:9',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const json = await response.json();
    const operationName = json?.name;

    if (!operationName) {
      throw new Error('No operation name returned');
    }

    // Poll for completion
    let operation = { done: false };
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      console.log('...Generating...');
      
      const operationResponse = await fetch('/api/veo/operation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: operationName }),
      });
      
      operation = await operationResponse.json();
    }

    if (operation?.response) {
      const videos = operation.response?.generatedVideos;
      if (videos === undefined || videos.length === 0) {
        throw new Error('No videos generated');
      }

      return await Promise.all(
        videos.map(async (generatedVideo: any) => {
          const fileUri = generatedVideo.video.uri;
          if (!fileUri) {
            throw new Error('No video URI found');
          }

          const dl = await fetch('/api/veo/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uri: fileUri }),
          });
          
          const blob = await dl.blob();
          return blobToBase64(blob);
        }),
      );
    } else {
      throw new Error('No videos generated');
    }
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
}

interface ProductGalleryProps {
  onBack: () => void;
}

/**
 * Main component for the Product Gallery.
 * It manages the state of videos, playing videos, editing videos and error handling.
 */
export const ProductGallery: React.FC<ProductGalleryProps> = ({ onBack }) => {
  const [videos, setVideos] = useState<Video[]>(MOCK_VIDEOS);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [generationError, setGenerationError] = useState<string[] | null>(null);

  const handlePlayVideo = (video: Video) => {
    setPlayingVideo(video);
  };

  const handleClosePlayer = () => {
    setPlayingVideo(null);
  };

  const handleStartEdit = (video: Video) => {
    setPlayingVideo(null); // Close player
    setEditingVideo(video); // Open edit page
  };

  const handleCancelEdit = () => {
    setEditingVideo(null); // Close edit page, return to grid
  };

  const handleSaveEdit = async (originalVideo: Video) => {
    setEditingVideo(null);
    setIsSaving(true);
    setGenerationError(null);

    try {
      const promptText = originalVideo.description;
      console.log('Generating video...', promptText);
      const videoObjects = await generateVideoFromText(promptText);

      if (!videoObjects || videoObjects.length === 0) {
        throw new Error('Video generation returned no data.');
      }

      console.log('Generated video data received.');

      const mimeType = 'video/mp4';
      const videoSrc = videoObjects[0];
      const src = `data:${mimeType};base64,${videoSrc}`;

      const newVideo: Video = {
        id: self.crypto.randomUUID(),
        title: `Remix of "${originalVideo.title}"`,
        description: originalVideo.description,
        videoUrl: src,
      };

      setVideos((currentVideos) => [newVideo, ...currentVideos]);
      setPlayingVideo(newVideo); // Go to the new video
    } catch (error) {
      console.error('Video generation failed:', error);
      setGenerationError([
        'Veo 3 is only available on the Paid Tier.',
        'Please select your Cloud Project to get started',
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatedLayout>
      <div className="min-h-[calc(100vh-80px)] bg-gray-900 text-gray-100 font-sans">
        {isSaving ? <SavingProgressPage /> : (
          editingVideo ? (
            <EditVideoPage
              video={editingVideo}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          ) : (
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <header className="py-8 text-center relative">
                <div className="absolute top-1/2 left-0 -translate-y-1/2">
                  <Button onClick={onBack} variant="secondary">
                    <ArrowLeft className="w-5 h-5" />
                    Back to Studio
                  </Button>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                  Product Gallery
                </h1>
                <p className="text-gray-400 mt-2 text-lg max-w-2xl mx-auto">
                  Explore our collection of AI-generated videos. Click any video to watch it, or select "Edit" to use its prompt as a starting point for your own creation.
                </p>
              </header>
              <main className="pb-8">
                <VideoGrid videos={videos} onPlayVideo={handlePlayVideo} />
              </main>
            </div>
          )
        )}

        {playingVideo && (
          <VideoPlayer
            video={playingVideo}
            onClose={handleClosePlayer}
            onEdit={handleStartEdit}
          />
        )}

        {generationError && (
          <ErrorModal
            message={generationError}
            onClose={() => setGenerationError(null)}
            onSelectKey={async () => {
              // Handle API key selection - you might want to implement this
              console.log('API key selection requested');
            }}
          />
        )}
      </div>
    </AnimatedLayout>
  );
};
