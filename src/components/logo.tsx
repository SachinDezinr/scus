'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <rect width="32" height="32" rx="8" fill="#171923" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="#2b2f42" />
      
      {/* Structural building & graduation cap motif */}
      <path
        d="M16 7L24 11.5L16 16L8 11.5L16 7Z"
        fill="#4F6EF7"
      />
      <path
        d="M11 14.5V19.5C11 20.8807 13.2386 22 16 22C18.7614 22 21 20.8807 21 19.5V14.5"
        stroke="#E0E7FF"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 11.5V18.5"
        stroke="#4F6EF7"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="24" cy="19.5" r="1" fill="#10B981" />
    </svg>
  );
}