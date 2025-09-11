'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { 
  Sparkles, 
  Image, 
  Video, 
  Layers, 
  FileImage, 
  Settings, 
  HelpCircle,
  Menu,
  X
} from 'lucide-react';
import { StudioMode } from '@/lib/types';

interface NavbarProps {
  currentMode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
}

export function Navbar({ currentMode, onModeChange }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      id: 'create-image' as StudioMode,
      label: 'Create Image',
      icon: Image,
      description: 'Generate stunning images with AI'
    },
    {
      id: 'edit-image' as StudioMode,
      label: 'Edit Image',
      icon: Settings,
      description: 'Modify existing images'
    },
    {
      id: 'compose-image' as StudioMode,
      label: 'Compose',
      icon: Layers,
      description: 'Combine multiple images'
    },
    {
      id: 'create-video' as StudioMode,
      label: 'Create Video',
      icon: Video,
      description: 'Generate videos with AI'
    },
    {
      id: 'product-gallery' as StudioMode,
      label: 'Gallery',
      icon: FileImage,
      description: 'Browse your creations'
    }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Alchemy Studio</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Creativity</p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentMode === item.id;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onModeChange(item.id)}
                    className={`relative group ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                    
                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap border">
                      {item.description}
                    </div>
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* Right Side - Theme Switcher and Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Theme Switcher */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ThemeSwitcher />
            </motion.div>

            {/* Help Button */}
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <HelpCircle className="w-4 h-4" />
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-border/50 py-4"
          >
            <div className="grid gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentMode === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    className="justify-start w-full"
                    onClick={() => {
                      onModeChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </Button>
                );
              })}
              
              <div className="border-t border-border/50 mt-2 pt-2">
                <Button variant="ghost" className="justify-start w-full">
                  <HelpCircle className="w-4 h-4 mr-3" />
                  Help & Support
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}