/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { CampaignMedia } from '../../types/campaign';
import { MediaGrid } from './MediaGrid';
import { MediaPlayer } from './MediaPlayer';
import { RefreshIcon, FilterIcon, GridIcon, ListIcon, XMarkIcon } from './icons';

interface CampaignGalleryProps {
  onClose?: () => void;
}

/**
 * A component that displays all generated campaign media in a gallery format.
 */
export const CampaignGallery: React.FC<CampaignGalleryProps> = ({ onClose }) => {
  const [media, setMedia] = useState<CampaignMedia[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<CampaignMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load campaign media from the "ad generated" folder
  useEffect(() => {
    loadCampaignMedia();
  }, []);

  const loadCampaignMedia = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll create mock data based on the files in the "ad generated" folder
      const mockMedia: CampaignMedia[] = [
        {
          id: '1',
          title: 'Aerosoft Ad Campaign',
          description: 'Professional software advertisement with modern design',
          mediaUrl: 'https://via.placeholder.com/400x300/7C3AED/FFFFFF?text=Aerosoft+Ad',
          type: 'image',
          createdAt: '2025-01-19T16:13:00Z',
          dimensions: { width: 1920, height: 1080 },
          tags: ['software', 'professional', 'modern']
        },
        {
          id: '2',
          title: 'Aerosoft Ad Campaign 2',
          description: 'Alternative design for software advertisement',
          mediaUrl: 'https://via.placeholder.com/400x300/059669/FFFFFF?text=Aerosoft+Ad+2',
          type: 'image',
          createdAt: '2025-01-19T16:15:00Z',
          dimensions: { width: 1920, height: 1080 },
          tags: ['software', 'alternative', 'design']
        },
        {
          id: '3',
          title: 'Generated Image - September 19',
          description: 'AI-generated creative image for campaign',
          mediaUrl: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=AI+Generated+1',
          type: 'image',
          createdAt: '2025-01-19T16:13:00Z',
          dimensions: { width: 1024, height: 1024 },
          tags: ['ai-generated', 'creative']
        },
        {
          id: '4',
          title: 'Generated Image - September 19 (2)',
          description: 'Second AI-generated creative image',
          mediaUrl: 'https://via.placeholder.com/400x300/DC2626/FFFFFF?text=AI+Generated+2',
          type: 'image',
          createdAt: '2025-01-19T16:15:00Z',
          dimensions: { width: 1024, height: 1024 },
          tags: ['ai-generated', 'creative']
        },
        {
          id: '5',
          title: 'Generated Image - September 19 (3)',
          description: 'Third AI-generated creative image',
          mediaUrl: 'https://via.placeholder.com/400x300/EA580C/FFFFFF?text=AI+Generated+3',
          type: 'image',
          createdAt: '2025-01-19T16:16:00Z',
          dimensions: { width: 1024, height: 1024 },
          tags: ['ai-generated', 'creative']
        },
        {
          id: '6',
          title: 'Campaign Video - Veo3',
          description: 'Dynamic video advertisement created with Veo3',
          mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          type: 'video',
          createdAt: '2025-01-19T16:17:00Z',
          dimensions: { width: 1920, height: 1080 },
          tags: ['video', 'veo3', 'dynamic']
        },
        {
          id: '7',
          title: 'MiniMax Ad Video',
          description: 'Creative video advertisement generated with MiniMax',
          mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          type: 'video',
          createdAt: '2025-01-19T16:18:00Z',
          dimensions: { width: 1920, height: 1080 },
          tags: ['video', 'minimax', 'creative']
        },
        {
          id: '8',
          title: 'Campaign Video - DRIJ8',
          description: 'Professional campaign video with unique identifier',
          mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          type: 'video',
          createdAt: '2025-01-19T16:17:00Z',
          dimensions: { width: 1920, height: 1080 },
          tags: ['video', 'campaign', 'professional']
        }
      ];

      setMedia(mockMedia);
    } catch (error) {
      console.error('Error loading campaign media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayMedia = (media: CampaignMedia) => {
    setSelectedMedia(media);
  };

  const handleEditMedia = (media: CampaignMedia) => {
    // TODO: Implement edit functionality
    console.log('Edit media:', media);
  };

  const handleDeleteMedia = (media: CampaignMedia) => {
    // TODO: Implement delete functionality
    console.log('Delete media:', media);
  };

  const handleRefresh = () => {
    loadCampaignMedia();
  };

  // Filter media based on type and search query
  const filteredMedia = media.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Campaign Gallery</h1>
            <p className="text-gray-400 mt-1">
              {filteredMedia.length} {filteredMedia.length === 1 ? 'item' : 'items'} found
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Refresh gallery"
            >
              <RefreshIcon className="w-5 h-5" />
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close gallery"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <FilterIcon className="w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'image' | 'video')}
              className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Media</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              aria-label="Grid view"
            >
              <GridIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              aria-label="List view"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <MediaGrid
          media={filteredMedia}
          onPlayMedia={handlePlayMedia}
          onEditMedia={handleEditMedia}
          onDeleteMedia={handleDeleteMedia}
        />
      </div>

      {/* Media Player Modal */}
      {selectedMedia && (
        <MediaPlayer
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onEdit={handleEditMedia}
        />
      )}
    </div>
  );
};
