'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Image, 
  Video, 
  Layers, 
  FileImage, 
  Menu,
  Sun,
  Moon,
  Globe,
  ArrowRight,
  History
} from 'lucide-react';
import { StudioMode } from '@/lib/types';
import { StudioState, StudioActions } from '@/lib/hooks/useStudio';

interface ModernNavbarProps {
  currentMode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  // NEW: Add studio state for intelligent transfer actions
  studio?: StudioState & StudioActions;
}

const navigationItems = [
  {
    id: 'cultural' as StudioMode,
    label: 'Cultural',
    icon: Globe,
  },
  {
    id: 'create-image' as StudioMode,
    label: 'Create',
    icon: Image,
  },
  {
    id: 'edit-image' as StudioMode,
    label: 'Edit',
    icon: Layers,
  },
  {
    id: 'create-video' as StudioMode,
    label: 'Video',
    icon: Video,
  },
  {
    id: 'product-gallery' as StudioMode,
    label: 'Gallery',
    icon: FileImage,
  }
];

export function ModernNavbar({ currentMode, onModeChange, studio }: ModernNavbarProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // NEW: Smart transfer logic
  const handleModeChange = (newMode: StudioMode) => {
    if (!studio) {
      onModeChange(newMode);
      return;
    }

    // Determine what to transfer based on current state
    const transferData: any = {};
    
    if (studio.generatedImage) {
      transferData.image = studio.generatedImage;
    }
    if (studio.videoUrl) {
      transferData.video = studio.videoUrl;
    }
    if (studio.sharedContent.basePrompt) {
      transferData.prompt = studio.sharedContent.basePrompt;
    }

    // Use the smart transfer function
    if (Object.keys(transferData).length > 0) {
      studio.transferToMode(newMode, transferData);
    } else {
      studio.setMode(newMode);
    }
    
    onModeChange(newMode);
  };

  // NEW: Get available transfer actions
  const getAvailableTransfers = () => {
    if (!studio) return [];
    
    const transfers = [];
    
    if (studio.generatedImage && currentMode !== 'edit-image') {
      transfers.push({
        target: 'edit-image' as StudioMode,
        label: 'Edit This Image',
        icon: Layers
      });
    }
    
    if (studio.generatedImage && currentMode !== 'create-video') {
      transfers.push({
        target: 'create-video' as StudioMode,
        label: 'Make Video',
        icon: Video
      });
    }

    if (studio.sharedContent.culturalContext && currentMode !== 'create-image') {
      transfers.push({
        target: 'create-image' as StudioMode,
        label: 'Create with Context',
        icon: Image
      });
    }
    
    return transfers;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        
        {/* Logo */}
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Alchemy Studio</h1>
          </div>
          
          {/* NEW: Show workflow indicators */}
          {studio && studio.workflowHistory.length > 0 && (
            <Badge variant="secondary" className="text-xs ml-2">
              <History className="h-3 w-3 mr-1" />
              {studio.workflowHistory.length}
            </Badge>
          )}
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <div className="flex items-center gap-4">
            <Tabs value={currentMode} onValueChange={handleModeChange}>
              <TabsList className="grid w-full grid-cols-5 rounded-full border border-border bg-muted/50 p-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <TabsTrigger
                      key={item.id}
                      value={item.id}
                      className="nav-tab flex items-center gap-2 px-3 py-1.5 rounded-full text-muted-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:!text-black dark:data-[state=active]:!text-white"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden lg:inline">{item.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
            
            {/* NEW: Quick transfer actions */}
            {studio && getAvailableTransfers().length > 0 && (
              <div className="flex items-center gap-2">
                {getAvailableTransfers().slice(0, 2).map((transfer, index) => {
                  const Icon = transfer.icon;
                  return (
                    <Button
                      key={transfer.target}
                      variant="outline"
                      size="sm"
                      onClick={() => handleModeChange(transfer.target)}
                      className="gap-2 hidden xl:flex"
                      title={transfer.label}
                    >
                      <Icon className="h-3 w-3" />
                      <ArrowRight className="h-3 w-3" />
                      {transfer.label.split(' ')[0]}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="hidden sm:flex"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <div className="flex flex-col space-y-4 mt-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold">Alchemy Studio</h2>
                </div>
                
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentMode === item.id;
                  
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "default" : "ghost"}
                      className="justify-start w-full"
                      onClick={() => handleModeChange(item.id)}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {item.label}
                    </Button>
                  );
                })}
                
                {/* NEW: Mobile transfer actions */}
                {studio && getAvailableTransfers().length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Quick Actions</p>
                    {getAvailableTransfers().map((transfer) => {
                      const Icon = transfer.icon;
                      return (
                        <Button
                          key={transfer.target}
                          variant="outline"
                          className="justify-start w-full mb-2"
                          onClick={() => handleModeChange(transfer.target)}
                        >
                          <Icon className="h-4 w-4 mr-3" />
                          {transfer.label}
                        </Button>
                      );
                    })}
                  </div>
                )}
                
                <div className="border-t pt-4 mt-6">
                  <Button
                    variant="ghost"
                    className="justify-start w-full"
                    onClick={toggleTheme}
                  >
                    {theme === 'light' ? (
                      <>
                        <Moon className="h-4 w-4 mr-3" />
                        Dark Mode
                      </>
                    ) : (
                      <>
                        <Sun className="h-4 w-4 mr-3" />
                        Light Mode
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}