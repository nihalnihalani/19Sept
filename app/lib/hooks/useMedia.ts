'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MediaMetadata } from '../types';

interface UseMediaResult {
  media: MediaMetadata[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addMedia: (media: Omit<MediaMetadata, 'createdAt'>) => Promise<void>;
  deleteMedia: (id: string) => Promise<void>;
  updateMedia: (id: string, updates: Partial<Omit<MediaMetadata, 'id' | 'createdAt'>>) => Promise<void>;
}

interface UseMediaOptions {
  type?: 'image' | 'video' | 'audio' | 'other';
  limit?: number;
  searchQuery?: string;
}

export function useMedia(options: UseMediaOptions = {}): UseMediaResult {
  const [media, setMedia] = useState<MediaMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.type) params.set('type', options.type);
      if (options.limit) params.set('limit', options.limit.toString());
      if (options.searchQuery) params.set('q', options.searchQuery);

      const response = await fetch(`/api/media?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.status}`);
      }

      const data = await response.json();
      setMedia(data.media || []);
    } catch (err) {
      console.error('Error fetching media:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch media');
    } finally {
      setLoading(false);
    }
  }, [options.type, options.limit, options.searchQuery]);

  const addMedia = useCallback(async (newMedia: Omit<MediaMetadata, 'createdAt'>) => {
    try {
      const response = await fetch('/api/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMedia),
      });

      if (!response.ok) {
        throw new Error(`Failed to add media: ${response.status}`);
      }

      const data = await response.json();
      setMedia(prev => [data.media, ...prev]);
    } catch (err) {
      console.error('Error adding media:', err);
      throw err;
    }
  }, []);

  const deleteMediaItem = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/media?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete media: ${response.status}`);
      }

      setMedia(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting media:', err);
      throw err;
    }
  }, []);

  const updateMediaItem = useCallback(async (id: string, updates: Partial<Omit<MediaMetadata, 'id' | 'createdAt'>>) => {
    try {
      const response = await fetch('/api/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update media: ${response.status}`);
      }

      const data = await response.json();
      setMedia(prev => prev.map(item => item.id === id ? data.media : item));
    } catch (err) {
      console.error('Error updating media:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  return {
    media,
    loading,
    error,
    refetch: fetchMedia,
    addMedia,
    deleteMedia: deleteMediaItem,
    updateMedia: updateMediaItem,
  };
}
