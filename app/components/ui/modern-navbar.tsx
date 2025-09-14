'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Sparkles, 
  Image, 
  Video, 
  Layers, 
  FileImage, 
  Menu,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { StudioMode } from '@/lib/types';
import { useStudio } from '@/lib/useStudio';

interface ModernNavbarProps {
  currentMode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
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

export function ModernNavbar({ currentMode, onModeChange }: ModernNavbarProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const studio = useStudio();
  const hasCulture = !!studio.state.culturalContext;
  const hasLastImage = !!studio.state.lastImage?.url;

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
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
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <Tabs value={currentMode} onValueChange={onModeChange}>
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

          {/* Quick transfer actions (minimal UI) */}
          {hasCulture && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                try { studio.applyCulturalToPrompt(currentMode === 'edit-image' ? 'edit' : currentMode === 'create-video' ? 'video' : 'create'); } catch {}
              }}
              className="hidden md:flex"
              title="Apply Cultural Context to Prompt"
            >
              Apply Cultural
            </Button>
          )}
          {hasLastImage && currentMode !== 'edit-image' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onModeChange('edit-image');
              }}
              className="hidden md:flex"
              title="Open last image in Edit"
            >
              Open in Edit
            </Button>
          )}
          {hasLastImage && currentMode !== 'create-video' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onModeChange('create-video');
              }}
              className="hidden md:flex"
              title="Use last image in Video"
            >
              Use in Video
            </Button>
          )}

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
                      onClick={() => onModeChange(item.id)}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {item.label}
                    </Button>
                  );
                })}
                
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
                  {/* Mobile quick actions */}
                  {hasCulture && (
                    <Button
                      variant="ghost"
                      className="justify-start w-full"
                      onClick={() => {
                        try { studio.applyCulturalToPrompt(currentMode === 'edit-image' ? 'edit' : currentMode === 'create-video' ? 'video' : 'create'); } catch {}
                      }}
                    >
                      Apply Cultural
                    </Button>
                  )}
                  {hasLastImage && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="ghost"
                        className="flex-1"
                        onClick={() => onModeChange('edit-image')}
                      >Open in Edit</Button>
                      <Button
                        variant="ghost"
                        className="flex-1"
                        onClick={() => onModeChange('create-video')}
                      >Use in Video</Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}