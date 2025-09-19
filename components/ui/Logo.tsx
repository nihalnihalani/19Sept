import React from 'react';

const Logo = ({ className = '' }: { className?: string }) => (
  <svg
    className={className}
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#FDE047', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#F59E0B', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path
      d="M16 2L2 9.5V22.5L16 30L30 22.5V9.5L16 2Z"
      stroke="url(#goldGradient)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 16L30 9.5"
      stroke="url(#goldGradient)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 16V30"
      stroke="url(#goldGradient)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 16L2 9.5"
      stroke="url(#goldGradient)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Logo;
