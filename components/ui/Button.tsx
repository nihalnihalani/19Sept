'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import React from 'react';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const Button = ({ children, variant = 'primary', ...props }: ButtonProps) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2';
  
  const variantClasses = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseClasses} ${variantClasses[variant]}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
