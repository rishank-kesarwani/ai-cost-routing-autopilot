import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  withLink?: boolean;
  className?: string;
  subtitle?: string;
}

const sizeMap = {
  xs: { box: 'w-6 h-6', icon: 24, text: 'text-xs', sub: 'text-[9px]' },
  sm: { box: 'w-8 h-8', icon: 32, text: 'text-sm', sub: 'text-[10px]' },
  md: { box: 'w-10 h-10', icon: 40, text: 'text-base', sub: 'text-xs' },
  lg: { box: 'w-12 h-12', icon: 48, text: 'text-lg', sub: 'text-xs' },
  xl: { box: 'w-16 h-16', icon: 64, text: 'text-xl', sub: 'text-sm' },
};

export function LogoIcon({
  size = 'sm',
  className = '',
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const s = sizeMap[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 rounded-xl bg-gradient-to-br from-slate-900 via-[#0a101f] to-indigo-950/80 p-0.5 border border-indigo-500/30 shadow-[0_0_15px_-3px_rgba(56,189,248,0.3)] transition-transform duration-300 hover:scale-105 ${s.box} ${className}`}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/10 blur-sm -z-10" />

      <svg
        viewBox="0 0 128 128"
        className="w-full h-full drop-shadow-[0_2px_8px_rgba(34,211,238,0.4)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoVecGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#22d3ee" />
            <stop offset="50%" stop-color="#38bdf8" />
            <stop offset="100%" stop-color="#818cf8" />
          </linearGradient>
          <linearGradient id="logoAccentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#6366f1" />
            <stop offset="100%" stop-color="#06b6d4" />
          </linearGradient>
        </defs>

        {/* Orbit Ring */}
        <circle
          cx="64"
          cy="64"
          r="46"
          stroke="url(#logoAccentGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          opacity="0.4"
        />

        {/* Neural Routing Web */}
        <g stroke="#38bdf8" strokeWidth="1.8" opacity="0.5" strokeLinecap="round">
          <line x1="64" y1="22" x2="100" y2="44" />
          <line x1="100" y1="44" x2="100" y2="86" />
          <line x1="100" y1="86" x2="64" y2="106" />
          <line x1="64" y1="106" x2="28" y2="86" />
          <line x1="28" y1="86" x2="28" y2="44" />
          <line x1="28" y1="44" x2="64" y2="22" />
          <line x1="64" y1="64" x2="28" y2="44" />
          <line x1="64" y1="64" x2="100" y2="86" />
          <line x1="64" y1="64" x2="64" y2="106" />
        </g>

        {/* Star Nodes */}
        <circle cx="64" cy="22" r="4" fill="#22d3ee" />
        <circle cx="100" cy="44" r="3.5" fill="#38bdf8" />
        <circle cx="100" cy="86" r="3.5" fill="#818cf8" />
        <circle cx="64" cy="106" r="4" fill="#6366f1" />
        <circle cx="28" cy="86" r="3.5" fill="#38bdf8" />
        <circle cx="28" cy="44" r="3.5" fill="#22d3ee" />

        {/* Dynamic Vector Compass Arrow */}
        <path
          d="M64 34 L94 80 L64 68 L34 80 Z"
          fill="url(#logoVecGrad)"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path d="M64 34 L64 68 L94 80 Z" fill="#ffffff" opacity="0.25" />

        {/* Central Core Pulse */}
        <circle cx="64" cy="67" r="4.5" fill="#ffffff" />
        <circle cx="64" cy="67" r="2.5" fill="#22d3ee" />
      </svg>
    </div>
  );
}

export function Logo({
  size = 'sm',
  showText = true,
  withLink = true,
  className = '',
  subtitle = 'Routing & Spend Autopilot',
}: LogoProps) {
  const s = sizeMap[size];

  const content = (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <LogoIcon size={size} />

      {showText && (
        <div className="flex flex-col min-w-0 leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-bold tracking-tight text-white bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent ${s.text}`}
            >
              Cost Autopilot
            </span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold tracking-wider uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              AI
            </span>
          </div>
          {subtitle && (
            <span
              className={`text-slate-400 tracking-wider uppercase font-mono ${s.sub}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (withLink) {
    return (
      <Link
        href="/"
        className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg"
      >
        {content}
      </Link>
    );
  }

  return content;
}
