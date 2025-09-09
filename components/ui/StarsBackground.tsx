'use client';

import React, { useState, useEffect } from 'react';

const StarsBackground = () => {
  const [stars, setStars] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const generateStars = () => {
      const newStars = Array.from({ length: 50 }).map((_, i) => {
        const style: React.CSSProperties = {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${Math.random() * 2 + 1}px`,
          height: `${Math.random() * 2 + 1}px`,
          animationDelay: `${Math.random() * 10}s`,
          animationDuration: `${Math.random() * 5 + 5}s`,
        };
        return (
          <div
            key={i}
            className="absolute bg-gradient-to-r from-white to-transparent rounded-full opacity-80 animate-[anim-star_ease-in-out_infinite]"
            style={style}
          />
        );
      });
      setStars(newStars);
    };

    generateStars();
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full -z-20">
      {stars}
    </div>
  );
};

export default StarsBackground;
