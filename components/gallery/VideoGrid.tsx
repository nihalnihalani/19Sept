import { motion } from 'framer-motion';
import React from 'react';
import { Video } from '@/types/gallery';
import { VideoCard } from './VideoCard';

interface VideoGridProps {
  videos: Video[];
  onPlayVideo: (video: Video) => void;
}

/**
 * A component that renders a grid of video cards.
 */
export const VideoGrid: React.FC<VideoGridProps> = ({ videos, onPlayVideo }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {videos.map((video, i) => (
        <motion.div
          key={video.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
        >
          <VideoCard video={video} onPlay={onPlayVideo} />
        </motion.div>
      ))}
    </div>
  );
};
