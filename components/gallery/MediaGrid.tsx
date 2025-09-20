/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { CampaignMedia } from '../../types/campaign';
import { MediaCard } from './MediaCard';

interface MediaGridProps {
  media: CampaignMedia[];
  onPlayMedia: (media: CampaignMedia) => void;
  onEditMedia?: (media: CampaignMedia) => void;
  onDeleteMedia?: (media: CampaignMedia) => void;
}

/**
 * A component that renders a grid of media cards.
 */
export const MediaGrid: React.FC<MediaGridProps> = ({ 
  media, 
  onPlayMedia, 
  onEditMedia, 
  onDeleteMedia 
}) => {
  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          No Campaign Media Found
        </h3>
        <p className="text-gray-500 max-w-md">
          Generate some ads using the Campaign Workflow to see them appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {media.map((item) => (
        <MediaCard
          key={item.id}
          media={item}
          onPlay={onPlayMedia}
          onEdit={onEditMedia}
          onDelete={onDeleteMedia}
        />
      ))}
    </div>
  );
};
