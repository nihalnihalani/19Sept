'use client';

import { motion } from 'framer-motion';
import React from 'react';

const AnimatedBackground = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 w-[150%] h-[150%] bg-gradient-to-br from-gray-900 via-purple-900/50 to-yellow-600/30"
        animate={{
          x: ['-25%', '0%', '-25%'],
          y: ['-25%', '0%', '-25%'],
        }}
        transition={{
          duration: 20,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'mirror',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
