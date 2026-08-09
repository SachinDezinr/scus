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
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="ssusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#00f5d4" />
          <stop offset="100%" stopColor="#7b61ff" />
        </linearGradient>
        <linearGradient id="ssusAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f5d4" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      {/* Emblem Shield Outline */}
      <path
        d="M50 8 L85 24 V52 C85 72 50 92 50 92 C50 92 15 72 15 52 V24 L50 8 Z"
        fill="url(#ssusGrad)"
        fillOpacity="0.12"
        stroke="url(#ssusGrad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Graduation Cap Top */}
      <polygon points="50,22 82,36 50,50 18,36" fill="url(#ssusGrad)" />

      {/* Cap Base */}
      <path
        d="M30 43 V56 C30 63 70 63 70 56 V43"
        fill="none"
        stroke="url(#ssusGrad)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Tassel */}
      <path
        d="M80 37 V58"
        stroke="url(#ssusAccent)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="80" cy="61" r="3" fill="#00f5d4" />

      {/* Smart Utility Node Spark */}
      <circle cx="50" cy="74" r="4.5" fill="#00f5d4" />
      <path
        d="M50 63 V69.5 M38 74 H45.5 M54.5 74 H62"
        stroke="#00f5d4"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}