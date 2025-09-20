/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { CampaignMedia } from '../../types/campaign';
import { XMarkIcon, PencilSquareIcon, DownloadIcon } from './icons';

interface MediaPlayerProps {
  media: CampaignMedia;
  onClose: () => void;
  onEdit?: (media: CampaignMedia) => void;
}

/**
 * A component that renders a full-screen media player for images and videos.
 */
export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  media,
  onClose,
  onEdit,
}) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = media.mediaUrl;
    link.download = media.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-6xl relative overflow-hidden flex flex-col max-h-[90vh] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with controls */}
        <div className="flex-shrink-0 p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-white truncate">
                {media.title}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {media.type === 'video' ? 'Video' : 'Image'} • {new Date(media.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handleDownload}
                className="p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
                aria-label="Download media"
              >
                <DownloadIcon className="w-5 h-5" />
              </button>
              
              {onEdit && (
                <button
                  onClick={() => onEdit(media)}
                  className="p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
                  aria-label="Edit media details"
                >
                  <PencilSquareIcon className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
                aria-label="Close media player"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Media content */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="w-full h-full flex items-center justify-center">
            {media.type === 'video' ? (
              <video
                key={media.id}
                className="max-w-full max-h-full rounded-md"
                src={media.mediaUrl}
                controls
                autoPlay
                loop
                aria-label={media.title}
              />
            ) : (
              <img
                className="max-w-full max-h-full object-contain rounded-md"
                src={media.mediaUrl}
                alt={media.title}
              />
            )}
          </div>
        </div>

        {/* Footer with description */}
        {media.description && (
          <div className="flex-shrink-0 p-4 border-t border-gray-700">
            <p className="text-sm text-gray-400 whitespace-pre-wrap">
              {media.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
