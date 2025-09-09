'use client';

import React, { useState, useEffect } from 'react';

const StarsBackground = () => {
  const [stars, setStars] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const generateStars = () => {
      const newStars = Array.from({ length: 25 }).map((_, i) => { // Reduced count for subtlety
        const animClass = `animate-[anim-comet-${Math.ceil(Math.random() * 3)}_ease-in-out_infinite]`;
        const style: React.CSSProperties = {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: '2px', // Consistent width
          height: '150px', // Longer tail
          animationDelay: `${Math.random() * 15}s`,
          animationDuration: `${Math.random() * 8 + 5}s`,
        };
        return (
          <div
            key={i}
            className={`absolute bg-gradient-to-b from-white/80 to-transparent rounded-full opacity-80 ${animClass}`}
            style={style}
          />
        );
      });
      setStars(newStars);
    };

    generateStars();
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full -z-20 overflow-hidden">
      {stars}
    </div>
  );
};

export default StarsBackground;
