'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 32 }: LogoProps) {
  return (
    <img
      src="/app-logo.svg"
      alt="SSUS Logo"
      width={size}
      height={size}
      className={`rounded-lg object-contain shrink-0 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}