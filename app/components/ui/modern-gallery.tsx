'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  Play, 
  Download, 
  Share, 
  Search, 
  Grid3X3,
  MoreVertical,
  Calendar
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  createdAt: Date;
  tags?: string[];
}

interface ModernGalleryProps {
  items: GalleryItem[];
}

type SortOption = 'newest' | 'oldest' | 'title';
type FilterOption = 'all' | 'image' | 'video';

export function ModernGallery({ items }: ModernGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    const filtered = items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterBy === 'all' || item.type === filterBy;
      return matchesSearch && matchesFilter;
    });

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, searchQuery, sortBy, filterBy]);

  const handleDownload = async (item: GalleryItem) => {
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.${item.type === 'video' ? 'mp4' : 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleShare = async (item: GalleryItem) => {
    if (navigator.share) {
      await navigator.share({
        title: item.title,
        text: item.description,
        url: item.url
      });
    } else {
      await navigator.clipboard.writeText(item.url);
      // You could add a toast notification here
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
              <Grid3X3 className="h-5 w-5 text-white" />
            </div>
            <Badge variant="secondary" className="text-xs">Gallery</Badge>
          </div>
          <h1 className="text-2xl font-semibold">Your Creations</h1>
          <p className="text-muted-foreground">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search your creations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="image">Images</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Gallery Grid */}
        {filteredItems.length === 0 ? (
          <EmptyGalleryState hasSearchQuery={!!searchQuery} />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {filteredItems.map((item, index) => (
                <GalleryItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  onView={() => setSelectedItem(item)}
                  onDownload={() => handleDownload(item)}
                  onShare={() => handleShare(item)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Item Detail Modal */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            {selectedItem && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span className="truncate pr-4">{selectedItem.title}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(selectedItem)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShare(selectedItem)}
                      >
                        <Share className="h-4 w-4" />
                      </Button>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    {selectedItem.type === 'video' ? (
                      <video
                        src={selectedItem.url}
                        className="w-full h-full object-contain"
                        controls
                        autoPlay
                        muted
                        playsInline
                        loop
                      />
                    ) : (
                      <Image
                        src={selectedItem.url}
                        alt={selectedItem.title}
                        fill
                        className="object-contain"
                      />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {selectedItem.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {selectedItem.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Gallery Item Card Component
function GalleryItemCard({
  item,
  index,
  onView,
  onDownload,
  onShare
}: {
  item: GalleryItem;
  index: number;
  onView: () => void;
  onDownload: () => void;
  onShare: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group"
    >
      <Card className="shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-muted cursor-pointer group" onClick={onView}>
            {item.type === 'video' ? (
              <>
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onMouseEnter={(e) => {
                    const video = e.currentTarget;
                    video.currentTime = 0;
                    video.play().catch(() => {
                      // Silently handle autoplay restrictions
                    });
                  }}
                  onMouseLeave={(e) => {
                    const video = e.currentTarget;
                    video.pause();
                    video.currentTime = 0;
                  }}
                />
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-4 rounded-full bg-white/90 backdrop-blur-sm shadow-lg">
                    <Play className="h-8 w-8 text-gray-900 ml-1" />
                  </div>
                </div>
                {/* Video duration or info overlay */}
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-white text-xs font-medium">
                  Video
                </div>
              </>
            ) : (
              <Image
                src={item.url}
                alt={item.title}
                fill
                className="object-cover"
              />
            )}
            
            {/* Type badge */}
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="text-xs">
                {item.type}
              </Badge>
            </div>
            
            {/* Actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={onDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onShare}>
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="p-4 space-y-2">
            <h3 className="font-medium truncate">{item.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{item.createdAt.toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Empty State Component
function EmptyGalleryState({ hasSearchQuery }: { hasSearchQuery: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <Card className="border-0 shadow-sm">
        <CardContent className="p-12">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Grid3X3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                {hasSearchQuery ? 'No results found' : 'No creations yet'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {hasSearchQuery 
                  ? 'Try adjusting your search or filters to find what you\'re looking for'
                  : 'Start creating amazing content with AI and it will appear here'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}