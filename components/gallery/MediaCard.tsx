/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { CampaignMedia } from '../../types/campaign';
import { PlayIcon, PencilSquareIcon, XMarkIcon } from './icons';

interface MediaCardProps {
  media: CampaignMedia;
  onPlay: (media: CampaignMedia) => void;
  onEdit?: (media: CampaignMedia) => void;
  onDelete?: (media: CampaignMedia) => void;
}

/**
 * A component that renders a media card with thumbnail, title, and action buttons.
 */
export const MediaCard: React.FC<MediaCardProps> = ({ 
  media, 
  onPlay, 
  onEdit, 
  onDelete 
}) => {
  const handlePlay = () => {
    onPlay(media);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(media);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(media);
  };

  return (
    <div className="group relative bg-gray-800/50 rounded-lg overflow-hidden shadow-lg hover:shadow-gray-500/30 transform transition-all duration-300 hover:-translate-y-2">
      <div
        className="w-full text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        onClick={handlePlay}
        aria-label={`Play ${media.type}: ${media.title}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlePlay();
          }
        }}
      >
        <div className="relative">
          {media.type === 'video' ? (
            <video
              className="w-full h-48 object-cover pointer-events-none"
              src={media.mediaUrl}
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
          ) : (
            <img
              className="w-full h-48 object-cover pointer-events-none"
              src={media.mediaUrl}
              alt={media.title}
              loading="lazy"
            />
          )}
          
          {/* Play button overlay for videos */}
          {media.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <PlayIcon className="w-16 h-16 text-white opacity-80 drop-shadow-lg group-hover:opacity-100 transform group-hover:scale-110 transition-transform" />
            </div>
          )}

          {/* Media type indicator */}
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              media.type === 'video' 
                ? 'bg-purple-600/80 text-white' 
                : 'bg-blue-600/80 text-white'
            }`}>
              {media.type === 'video' ? 'Video' : 'Image'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
                aria-label={`Edit ${media.title}`}
              >
                <PencilSquareIcon className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 bg-red-600/80 hover:bg-red-700/80 text-white rounded-full transition-colors"
                aria-label={`Delete ${media.title}`}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3
          className="text-base font-semibold text-gray-200 truncate mb-1"
          title={media.title}
        >
          {media.title}
        </h3>
        
        {media.description && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-2">
            {media.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {new Date(media.createdAt).toLocaleDateString()}
          </span>
          {media.dimensions && (
            <span>
              {media.dimensions.width} × {media.dimensions.height}
            </span>
          )}
        </div>

        {media.tags && media.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {media.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {media.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs">
                +{media.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
