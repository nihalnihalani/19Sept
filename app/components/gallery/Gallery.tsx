"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_VIDEOS } from "@/lib/config";
import { Video } from "@/lib/types";
import { PlayCircle, X, Search, Filter, Grid, List, Download, Share, SortAsc, SortDesc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      className="fixed inset-0 bg-background/80 backdrop-blur-lg z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-5xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="flex flex-col relative overflow-hidden bg-card/95 backdrop-blur-sm h-full">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl truncate">{video.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => downloadVideo(video)}
                variant="outline"
                size="sm"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => shareVideo(video)}
                variant="outline"
                size="sm"
                title="Share"
              >
                <Share className="w-4 h-4" />
              </Button>
              <Button
                onClick={onClose}
                variant="default"
                size="sm"
                title="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          {/* Video */}
          <CardContent className="flex-1 p-0">
            <div className="aspect-video bg-black">
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
          </CardContent>
          
          {/* Description */}
          <CardContent className="pt-4">
            <CardDescription className="text-sm leading-relaxed">
              {video.description}
            </CardDescription>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

type SortOption = 'title' | 'newest' | 'oldest';
type ViewMode = 'grid' | 'list';

const Gallery: React.FC = () => {
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
      
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Video Gallery
          </h1>
          <p className="mt-2 max-w-md mx-auto text-base text-muted-foreground sm:text-lg md:mt-3 md:max-w-2xl">
            Browse through your AI-generated video creations.
          </p>
        </motion.div>
      
        {/* Search and Filter Controls */}
        <Card className="mb-8">
          <CardContent className="p-6 space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
        
            {/* Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant={showFilters ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
                
                <div className="flex items-center gap-2">
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    variant="outline"
                    size="sm"
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {filteredAndSortedVideos.length} video{filteredAndSortedVideos.length !== 1 ? 's' : ''}
                </span>
                
                <div className="flex border border-border rounded-lg overflow-hidden">
                  <Button
                    onClick={() => setViewMode('grid')}
                    variant={viewMode === 'grid' ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none"
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setViewMode('list')}
                    variant={viewMode === 'list' ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none border-l"
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </Button>
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
                  className="border-t border-border pt-4 mt-4"
                >
                  <div className="text-sm text-muted-foreground">
                    Filter by category, duration, or other criteria would go here...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

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
            >
              <Card className={`group cursor-pointer hover:shadow-lg transition-all duration-300 ${
                viewMode === 'list' ? 'flex-row overflow-hidden' : ''
              }`}>
                <div
                  className={`${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-video'} relative overflow-hidden`}
                  onClick={() => setSelectedVideo(video)}
                >
                  <video
                    src={video.videoUrl}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    muted
                    loop
                    playsInline
                    onMouseOver={(e) => e.currentTarget.play()}
                    onMouseOut={(e) => e.currentTarget.pause()}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <PlayCircle className="w-12 h-12 text-white/90" />
                  </div>
                  
                  {/* Grid view action buttons */}
                  {viewMode === 'grid' && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadVideo(video);
                        }}
                        variant="secondary"
                        size="sm"
                        className="backdrop-blur-sm bg-background/80"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          shareVideo(video);
                        }}
                        variant="secondary"
                        size="sm"
                        className="backdrop-blur-sm bg-background/80"
                        title="Share"
                      >
                        <Share className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <CardContent className={`${
                  viewMode === 'list'
                    ? 'flex-1 flex flex-col justify-between p-4'
                    : 'absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent'
                }`}>
                  <div>
                    <CardTitle className={`text-white ${
                      viewMode === 'list' ? 'text-lg mb-2 text-foreground' : 'text-lg'
                    }`}>
                      {video.title}
                    </CardTitle>
                    {viewMode === 'list' && (
                      <CardDescription className="line-clamp-3 mb-4">
                        {video.description}
                      </CardDescription>
                    )}
                  </div>
                  
                  {viewMode === 'list' && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadVideo(video);
                        }}
                        variant="outline"
                        size="sm"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          shareVideo(video);
                        }}
                        variant="outline"
                        size="sm"
                        title="Share"
                      >
                        <Share className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      
        {/* Empty State */}
        {filteredAndSortedVideos.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <CardTitle className="text-lg mb-2 text-muted-foreground">No videos found</CardTitle>
              <CardDescription>
                {searchTerm ? 'Try adjusting your search terms' : 'No videos match the current filters'}
              </CardDescription>
            </CardContent>
          </Card>
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
