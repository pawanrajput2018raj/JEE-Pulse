import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  onClick,
  className = '',
}) => {
  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-13 h-13',
  }[size];

  return (
    <div
      className={`flex items-center gap-2.5 select-none ${
        onClick ? 'cursor-pointer group' : ''
      } ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      title={onClick ? 'Go to Daily Log' : undefined}
    >
      {/* Brand-New Ultra-Modern Apex Quantum Delta Emblem */}
      <div className={`${iconDimensions} relative shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full transform transition-all duration-300 group-hover:scale-105 drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            {/* Outer Squircle Gradient Border */}
            <linearGradient id="apexOuterBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="35%" stopColor="#6366f1" />
              <stop offset="70%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Physics Energy Ribbon: Cyan to Sky */}
            <linearGradient id="apexPhysicsGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="60%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            {/* Chemistry Quantum Ribbon: Mint to Emerald */}
            <linearGradient id="apexChemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>

            {/* Mathematics Power Ribbon: Royal Indigo to Electric Violet */}
            <linearGradient id="apexMathGrad" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="50%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>

            {/* Pinnacle AIR 1 Star */}
            <linearGradient id="apexGoldStar" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            {/* Core Dark Shield Backdrop */}
            <linearGradient id="apexShieldBackdrop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>

            <filter id="apexGlowShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#4f46e5" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Outer Rounded Container */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="24"
            fill="url(#apexShieldBackdrop)"
            stroke="url(#apexOuterBorder)"
            strokeWidth="2.5"
            filter="url(#apexGlowShadow)"
          />

          {/* Precision Guidance Grid Rings */}
          <circle cx="50" cy="50" r="32" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          <circle cx="50" cy="50" r="22" stroke="#475569" strokeWidth="1" opacity="0.4" />

          {/* Triple-Vortex Triad Blades (Physics, Chemistry, Math) */}
          {/* Blade 1: Physics (Left Ascending Wing) */}
          <path
            d="M 50 16 C 42 28 24 50 20 62 C 18 68 22 74 28 74 C 36 74 44 64 50 50 Z"
            fill="url(#apexPhysicsGrad)"
            opacity="0.95"
          />

          {/* Blade 2: Chemistry (Right Ascending Wing) */}
          <path
            d="M 50 16 C 58 28 76 50 80 62 C 82 68 78 74 72 74 C 64 74 56 64 50 50 Z"
            fill="url(#apexChemGrad)"
            opacity="0.95"
          />

          {/* Blade 3: Mathematics (Base Horizon Arc) */}
          <path
            d="M 28 74 C 36 82 64 82 72 74 C 62 66 38 66 28 74 Z"
            fill="url(#apexMathGrad)"
            opacity="0.95"
          />

          {/* Central Precision Delta Core (AIR 1 Target) */}
          <path
            d="M 50 36 L 62 58 L 38 58 Z"
            fill="#ffffff"
            opacity="0.9"
          />
          <path
            d="M 50 42 L 57 55 L 43 55 Z"
            fill="#1e1b4b"
          />

          {/* Apex Golden Star (Pinnacle Benchmark) */}
          <g transform="translate(50, 16)">
            <polygon
              points="0,-7 2,-2 7,0 2,2 0,7 -2,2 -7,0 -2,-2"
              fill="url(#apexGoldStar)"
            />
            <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
          </g>

          {/* Precision Crosshair Ticks */}
          <line x1="50" y1="26" x2="50" y2="30" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="50" y1="70" x2="50" y2="74" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="26" y1="50" x2="30" y2="50" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="70" y1="50" x2="74" y2="50" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Brand Identity Typography */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight">
              JEE <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600">PULSE</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-gradient-to-r from-slate-900 to-indigo-950 text-sky-300 border border-sky-400/40 shadow-2xs">
              AIR CBT
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 leading-tight hidden sm:block">
            Question Tracker &amp; CBT Test Simulator
          </span>
        </div>
      )}
    </div>
  );
};
