"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMedia } from "@/lib/hooks/useMedia";
import { MediaMetadata } from "@/lib/types";
import { PlayCircle, X, Search, Filter, Grid, List, Download, Share, SortAsc, SortDesc, Loader2, RefreshCw, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MediaPlayerModal = ({ media, onClose, downloadMedia, shareMedia, deleteMedia }: { 
  media: MediaMetadata; 
  onClose: () => void;
  downloadMedia: (media: MediaMetadata) => void;
  shareMedia: (media: MediaMetadata) => void;
  deleteMedia: (media: MediaMetadata) => void;
}) => {
  const isVideo = media.type === 'video';
  const isImage = media.type === 'image';

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
            <CardTitle className="text-xl truncate">{media.title || `${media.type} ${media.id}`}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => downloadMedia(media)}
                variant="outline"
                size="sm"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => shareMedia(media)}
                variant="outline"
                size="sm"
                title="Share"
              >
                <Share className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => deleteMedia(media)}
                variant="outline"
                size="sm"
                title="Delete"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
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
          
          {/* Media Content */}
          <CardContent className="flex-1 p-0">
            <div className="aspect-video bg-black">
              {isVideo && (
                <video 
                  src={media.url} 
                  className="w-full h-full" 
                  controls 
                  autoPlay 
                  muted={false}
                  loop 
                  playsInline 
                />
              )}
              {isImage && (
                <img 
                  src={media.url} 
                  alt={media.title || 'Media content'}
                  className="w-full h-full object-contain" 
                />
              )}
            </div>
          </CardContent>
          
          {/* Description */}
          <CardContent className="pt-4">
            <CardDescription className="text-sm leading-relaxed">
              {media.description || 'No description available'}
            </CardDescription>
            {media.createdAt && (
              <CardDescription className="text-xs text-muted-foreground mt-2">
                Created: {new Date(media.createdAt).toLocaleDateString()}
              </CardDescription>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

type SortOption = 'title' | 'newest' | 'oldest';
type ViewMode = 'grid' | 'list';

const Gallery: React.FC = () => {
  const [selectedMedia, setSelectedMedia] = useState<MediaMetadata | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [mediaType, setMediaType] = useState<'all' | 'image' | 'video' | 'audio' | 'other'>('all');
  
  // Use the media hook
  const { 
    media, 
    loading, 
    error, 
    refetch, 
    deleteMedia: deleteMediaFromDB 
  } = useMedia({
    type: mediaType === 'all' ? undefined : mediaType,
    limit: 100,
    searchQuery: searchTerm || undefined
  });
  
  // Filter and sort media
  const filteredAndSortedMedia = useMemo(() => {
    let filtered = [...media];
    
    // Additional client-side filtering if needed
    if (searchTerm && !searchTerm.trim()) {
      filtered = media.filter(item =>
        (item.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.description?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Sort media
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'title':
          const titleA = a.title || a.id;
          const titleB = b.title || b.id;
          compareValue = titleA.localeCompare(titleB);
          break;
        case 'newest':
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          compareValue = dateB - dateA;
          break;
        case 'oldest':
          const dateA2 = new Date(a.createdAt || 0).getTime();
          const dateB2 = new Date(b.createdAt || 0).getTime();
          compareValue = dateA2 - dateB2;
          break;
      }
      
      return sortOrder === 'desc' ? -compareValue : compareValue;
    });
    
    return filtered;
  }, [media, searchTerm, sortBy, sortOrder]);
  
  const downloadMedia = async (mediaItem: MediaMetadata) => {
    try {
      const response = await fetch(mediaItem.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Determine file extension based on type
      const extension = mediaItem.type === 'video' ? 'mp4' : 
                      mediaItem.type === 'image' ? 'png' : 
                      mediaItem.type === 'audio' ? 'mp3' : 'file';
      
      const filename = mediaItem.title 
        ? `${mediaItem.title.replace(/[^a-zA-Z0-9-_]/g, '_')}.${extension}`
        : `${mediaItem.id}.${extension}`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };
  
  const shareMedia = (mediaItem: MediaMetadata) => {
    if (navigator.share) {
      navigator.share({
        title: mediaItem.title || `${mediaItem.type} ${mediaItem.id}`,
        text: mediaItem.description || '',
        url: mediaItem.url
      });
    } else {
      navigator.clipboard.writeText(mediaItem.url);
      // You could show a toast notification here
    }
  };

  const handleDeleteMedia = async (mediaItem: MediaMetadata) => {
    if (confirm(`Are you sure you want to delete "${mediaItem.title || mediaItem.id}"?`)) {
      try {
        await deleteMediaFromDB(mediaItem.id);
        setSelectedMedia(null);
      } catch (error) {
        console.error('Failed to delete media:', error);
        alert('Failed to delete media. Please try again.');
      }
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
            Media Gallery
          </h1>
          <p className="mt-2 max-w-md mx-auto text-base text-muted-foreground sm:text-lg md:mt-3 md:max-w-2xl">
            Browse through your AI-generated images, videos, and other media.
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
                placeholder="Search media..."
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
                
                <Button
                  onClick={refetch}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <div className="flex items-center gap-2">
                  <Select value={mediaType} onValueChange={(value) => setMediaType(value as any)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="image">Images</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  
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
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    `${filteredAndSortedMedia.length} item${filteredAndSortedMedia.length !== 1 ? 's' : ''}`
                  )}
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

        {/* Error State */}
        {error && (
          <Card className="text-center py-12 mb-8">
            <CardContent>
              <CardTitle className="text-lg mb-2 text-destructive">Error Loading Media</CardTitle>
              <CardDescription className="mb-4">{error}</CardDescription>
              <Button onClick={refetch} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Media Grid/List */}
        {!error && (
          <div className={`${
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }`}>
            {filteredAndSortedMedia.map((mediaItem, index) => {
              const isVideo = mediaItem.type === 'video';
              const isImage = mediaItem.type === 'image';
              
              return (
                <motion.div
                  key={mediaItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className={`group cursor-pointer hover:shadow-lg transition-all duration-300 ${
                    viewMode === 'list' ? 'flex-row overflow-hidden' : ''
                  }`}>
                    <div
                      className={`${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-video'} relative overflow-hidden`}
                      onClick={() => setSelectedMedia(mediaItem)}
                    >
                      {isVideo && (
                        <video
                          src={mediaItem.url}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          muted
                          loop
                          playsInline
                          onMouseOver={(e) => e.currentTarget.play()}
                          onMouseOut={(e) => e.currentTarget.pause()}
                        />
                      )}
                      {isImage && (
                        <img
                          src={mediaItem.url}
                          alt={mediaItem.title || 'Media content'}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                      {!isVideo && !isImage && (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl mb-2">📄</div>
                            <div className="text-sm text-muted-foreground">{mediaItem.type}</div>
                          </div>
                        </div>
                      )}
                      
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
                              downloadMedia(mediaItem);
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
                              shareMedia(mediaItem);
                            }}
                            variant="secondary"
                            size="sm"
                            className="backdrop-blur-sm bg-background/80"
                            title="Share"
                          >
                            <Share className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMedia(mediaItem);
                            }}
                            variant="secondary"
                            size="sm"
                            className="backdrop-blur-sm bg-background/80 text-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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
                          {mediaItem.title || `${mediaItem.type} ${mediaItem.id}`}
                        </CardTitle>
                        {viewMode === 'list' && (
                          <CardDescription className="line-clamp-3 mb-4">
                            {mediaItem.description || 'No description available'}
                          </CardDescription>
                        )}
                      </div>
                      
                      {viewMode === 'list' && (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadMedia(mediaItem);
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
                              shareMedia(mediaItem);
                            }}
                            variant="outline"
                            size="sm"
                            title="Share"
                          >
                            <Share className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMedia(mediaItem);
                            }}
                            variant="outline"
                            size="sm"
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      
        {/* Empty State */}
        {!loading && !error && filteredAndSortedMedia.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <CardTitle className="text-lg mb-2 text-muted-foreground">No media found</CardTitle>
              <CardDescription>
                {searchTerm ? 'Try adjusting your search terms' : 'No media items match the current filters'}
              </CardDescription>
            </CardContent>
          </Card>
        )}

        {selectedMedia && (
          <MediaPlayerModal
            media={selectedMedia}
            onClose={() => setSelectedMedia(null)}
            downloadMedia={downloadMedia}
            shareMedia={shareMedia}
            deleteMedia={handleDeleteMedia}
          />
        )}
    </div>
  );
};

export default Gallery;
