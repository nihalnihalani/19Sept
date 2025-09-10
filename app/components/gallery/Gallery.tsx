"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_VIDEOS } from "@/lib/config";
import { Video } from "@/lib/types";
import { PlayCircle, X, Search, Filter, Grid, List, Download, Share, SortAsc, SortDesc, ArrowLeft } from "lucide-react";

const VideoPlayerModal = ({ video, onClose, downloadVideo, shareVideo }: { 
  video: Video; 
  onClose: () => void;
  downloadVideo: (video: Video) => void;
  shareVideo: (video: Video) => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-gray-900/90 border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white truncate">{video.title}</h3>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => downloadVideo(video)}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => shareVideo(video)}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors"
              title="Share"
            >
              <Share className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Video */}
        <div className="flex-1 bg-black rounded-b-2xl overflow-hidden">
          <video 
            src={video.videoUrl} 
            className="w-full h-full" 
            controls 
            autoPlay 
            muted={false}
            loop 
            playsInline 
          />
        </div>
        
        {/* Description */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <p className="text-gray-300 text-sm leading-relaxed">
            {video.description}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

type SortOption = 'title' | 'newest' | 'oldest';
type ViewMode = 'grid' | 'list';

const Gallery: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter and sort videos
  const filteredAndSortedVideos = useMemo(() => {
    const filtered = MOCK_VIDEOS.filter(video =>
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Sort videos
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
        case 'newest':
          // Since we don't have actual dates, use id as proxy
          compareValue = parseInt(b.id) - parseInt(a.id);
          break;
        case 'oldest':
          compareValue = parseInt(a.id) - parseInt(b.id);
          break;
      }
      
      return sortOrder === 'desc' ? -compareValue : compareValue;
    });
    
    return filtered;
  }, [searchTerm, sortBy, sortOrder]);
  
  const downloadVideo = async (video: Video) => {
    try {
      const response = await fetch(video.videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${video.title.replace(/[^a-zA-Z0-9-_]/g, '_')}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };
  
  const shareVideo = (video: Video) => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: video.description,
        url: video.videoUrl
      });
    } else {
      navigator.clipboard.writeText(video.videoUrl);
      // You could show a toast notification here
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      {onBack && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700 rounded-lg text-gray-300 hover:text-white transition-all duration-200 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Studio
          </button>
        </motion.div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl md:text-5xl">
          Video Gallery
        </h1>
        <p className="mt-2 max-w-md mx-auto text-base text-gray-400 sm:text-lg md:mt-3 md:max-w-2xl">
          Browse through your AI-generated video creations.
        </p>
      </motion.div>
      
      {/* Search and Filter Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8 space-y-4"
      >
        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800/60 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />
        </div>
        
        {/* Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                showFilters
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-700/60'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="title">Title</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 bg-gray-800/60 border border-gray-700 rounded-lg hover:bg-gray-700/60 transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4 text-gray-300" /> : <SortDesc className="w-4 h-4 text-gray-300" />}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {filteredAndSortedVideos.length} video{filteredAndSortedVideos.length !== 1 ? 's' : ''}
            </span>
            
            <div className="flex border border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/60'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/60'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-800/40 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex flex-wrap gap-4">
                <div className="text-sm text-gray-300">
                  Filter by category, duration, or other criteria would go here...
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Video Grid/List */}
      <div className={`${
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
      }`}>
        {filteredAndSortedVideos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`group relative overflow-hidden rounded-2xl shadow-lg cursor-pointer bg-gray-800/50 border border-gray-700 ${
              viewMode === 'list' ? 'flex gap-4 p-4' : ''
            }`}
          >
            <div
              className={`${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-video'} relative`}
              onClick={() => setSelectedVideo(video)}
            >
              <video
                src={video.videoUrl}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg"
                muted
                loop
                playsInline
                onMouseOver={(e) => e.currentTarget.play()}
                onMouseOut={(e) => e.currentTarget.pause()}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-lg" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <PlayCircle className="w-12 h-12 text-white/80" />
              </div>
            </div>
            
            <div className={`${
              viewMode === 'list'
                ? 'flex-1 flex flex-col justify-between min-w-0'
                : 'absolute bottom-0 left-0 p-4'
            }`}>
              <div>
                <h3 className={`font-bold text-white ${
                  viewMode === 'list' ? 'text-lg mb-2' : 'text-lg'
                }`}>
                  {video.title}
                </h3>
                {viewMode === 'list' && (
                  <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                    {video.description}
                  </p>
                )}
              </div>
              
              {viewMode === 'list' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadVideo(video);
                    }}
                    className="p-2 bg-gray-700/60 hover:bg-gray-600/80 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-gray-300" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      shareVideo(video);
                    }}
                    className="p-2 bg-gray-700/60 hover:bg-gray-600/80 rounded-lg transition-colors"
                    title="Share"
                  >
                    <Share className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Grid view action buttons */}
            {viewMode === 'grid' && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadVideo(video);
                  }}
                  className="p-2 bg-black/50 hover:bg-black/70 rounded-lg backdrop-blur-sm transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    shareVideo(video);
                  }}
                  className="p-2 bg-black/50 hover:bg-black/70 rounded-lg backdrop-blur-sm transition-colors"
                  title="Share"
                >
                  <Share className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Empty State */}
      {filteredAndSortedVideos.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-gray-400 text-lg mb-2">No videos found</div>
          <div className="text-gray-500 text-sm">
            {searchTerm ? 'Try adjusting your search terms' : 'No videos match the current filters'}
          </div>
        </motion.div>
      )}

      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          downloadVideo={downloadVideo}
          shareVideo={shareVideo}
        />
      )}
    </div>
  );
};

export default Gallery;
