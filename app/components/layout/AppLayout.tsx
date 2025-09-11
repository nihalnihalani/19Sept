'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/ui/navbar';
import { StudioMode } from '@/lib/types';

interface AppLayoutProps {
  currentMode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  children: React.ReactNode;
}

// Smooth transition variants for content switching
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
  },
};

// Container variants for staggered animations
const containerVariants = {
  initial: {
    opacity: 0,
  },
  enter: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export function AppLayout({ currentMode, onModeChange, children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Navbar */}
      <Navbar currentMode={currentMode} onModeChange={onModeChange} />
      
      {/* Main Content Area with Seamless Transitions */}
      <main className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentMode} // This ensures transitions happen when mode changes
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            transition={{
              duration: 0.4,
              ease: "easeOut",
            }}
            className="min-h-screen pt-16" // Account for fixed navbar
          >
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              className="w-full"
            >
              {children}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}