'use client';

import { motion, Variants } from 'framer-motion';
import React from 'react';

const Comet = () => {
  const variants: Variants = {
    initial: {
      x: '110vw',
      y: `${Math.random() * 100}vh`,
      opacity: 0,
    },
    animate: {
      x: '-10vw',
      y: `${Math.random() * 100}vh`,
      opacity: [0, 1, 1, 0],
      transition: {
        duration: Math.random() * 4 + 3,
        ease: 'linear',
        repeat: Infinity,
        delay: Math.random() * 5,
      },
    },
  };

  return (
    <motion.div
      className="absolute top-0 left-0 w-64 h-1 bg-gradient-to-r from-white/80 to-transparent rounded-full"
      variants={variants}
      initial="initial"
      animate="animate"
      style={{
        rotate: '-45deg',
      }}
    />
  );
};

export const CometShower = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
      {Array.from({ length: 7 }).map((_, i) => (
        <Comet key={i} />
      ))}
    </div>
  );
};
