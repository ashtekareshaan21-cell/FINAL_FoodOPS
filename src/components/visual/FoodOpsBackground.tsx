'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface FoodOpsBackgroundProps {
  variant?: 'hero' | 'auth' | 'dashboard' | 'admin';
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export default function FoodOpsBackground({ variant = 'dashboard' }: FoodOpsBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setMounted(true);
    if (shouldReduceMotion || variant === 'auth' || variant === 'admin') return;

    // Generate static list of particles on client mount to avoid hydration mismatch
    const newParticles = Array.from({ length: variant === 'hero' ? 25 : 12 }).map((_, i) => ({
      id: i,
      x: (i * 7 + 13) % 100, // deterministic pseudo-random distribution
      y: (i * 9 + 23) % 100,
      size: ((i * 3) % 4) + 1.5,
      duration: 18 + (i % 5) * 4,
      delay: -(i % 3) * 3,
    }));
    setParticles(newParticles);
  }, [shouldReduceMotion, variant]);

  // Map variant to opacity levels for atmospheric radial glows
  const radialOpacity = {
    hero: 0.16,
    auth: 0.08,
    dashboard: 0.04,
    admin: 0.02,
  }[variant];

  const gridAccentOpacity = {
    hero: 0.05,
    auth: 0.03,
    dashboard: 0.02,
    admin: 0.06, // Admin has a more technical operational grid
  }[variant];

  if (!mounted) {
    // Render static fallback during SSR to prevent flashes
    return (
      <div className="fixed inset-0 w-full h-full bg-[#030705] pointer-events-none -z-50" />
    );
  }

  // Lifecycle path coordinates for hero variant (viewBox="0 0 1000 500")
  const lifecycleNodes = [
    { name: 'SURPLUS', x: 80, y: 180, icon: '🏨' },
    { name: 'AI AUDIT', x: 210, y: 340, icon: '🤖' },
    { name: 'NGO MATCH', x: 340, y: 200, icon: '📍' },
    { name: 'CLAIM', x: 470, y: 360, icon: '🔒' },
    { name: 'PICKUP', x: 600, y: 220, icon: '🚴' },
    { name: 'SECURE OTP', x: 730, y: 380, icon: '🔑' },
    { name: 'DELIVERY', x: 860, y: 240, icon: '🍽️' },
    { name: 'IMPACT', x: 940, y: 310, icon: '♻️' },
  ];

  const heroPathD = "M 80,180 Q 145,280 210,340 T 340,200 T 470,360 T 600,220 T 730,380 T 860,240 Q 900,270 940,310";

  // Dashboard geometric connection network lines
  const dashboardLines = [
    { x1: 10, y1: 15, x2: 25, y2: 35 },
    { x1: 25, y1: 35, x2: 45, y2: 20 },
    { x1: 45, y1: 20, x2: 60, y2: 45 },
    { x1: 60, y1: 45, x2: 85, y2: 25 },
    { x1: 85, y1: 25, x2: 95, y2: 60 },
    { x1: 25, y1: 35, x2: 30, y2: 75 },
    { x1: 60, y1: 45, x2: 70, y2: 85 },
  ];

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none -z-50 select-none">
      {/* LAYER 1: Base dark background with very subtle green gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 100%, #08150c 0%, #020503 100%)'
        }}
      />

      {/* LAYER 2: Subtle green radial atmosphere (glow) */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000 blur-3xl"
        style={{ 
          opacity: radialOpacity,
          background: 'radial-gradient(circle at 50% 25%, #10b981 0%, transparent 60%)',
          mixBlendMode: 'screen' 
        }} 
      />

      {/* LAYER 3: Map/Topographic texture & leaf outlines */}
      <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
        {/* Technical grids */}
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(16, 185, 129, 0.07)" strokeWidth="0.5" />
          </pattern>
          <pattern id="dot-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.75" fill="rgba(16, 185, 129, 0.12)" />
          </pattern>
        </defs>
        
        {variant === 'admin' ? (
          // Operational radar style grid for admin console
          <>
            <rect width="100%" height="100%" fill="url(#grid)" opacity={gridAccentOpacity} />
            <circle cx="50%" cy="50%" r="300" fill="none" stroke="rgba(16, 185, 129, 0.05)" strokeWidth="1" />
            <circle cx="50%" cy="50%" r="500" fill="none" stroke="rgba(16, 185, 129, 0.03)" strokeWidth="0.5" strokeDasharray="5 5" />
            {/* Tech crosshairs */}
            <path d="M 50% 10% L 50% 90% M 10% 50% L 90% 50%" stroke="rgba(16, 185, 129, 0.03)" strokeWidth="0.5" />
          </>
        ) : (
          // Standard topographic and dot grid background
          <>
            <rect width="100%" height="100%" fill="url(#dot-grid)" opacity={gridAccentOpacity} />
            {/* Topographic organic curves */}
            <path 
              d="M -100,200 C 100,220 150,100 300,120 C 450,140 500,300 700,250 C 900,200 850,50 1100,80" 
              fill="none" 
              stroke="rgba(16, 185, 129, 0.04)" 
              strokeWidth="1.5" 
            />
            <path 
              d="M -120,250 C 90,280 140,150 290,170 C 440,190 480,360 690,300 C 900,240 830,100 1120,130" 
              fill="none" 
              stroke="rgba(16, 185, 129, 0.03)" 
              strokeWidth="1.2" 
            />
            <path 
              d="M -80,150 C 110,160 160,50 310,70 C 460,90 520,240 710,200 C 900,160 870,0 1080,30" 
              fill="none" 
              stroke="rgba(16, 185, 129, 0.02)" 
              strokeWidth="1" 
            />
            
            {/* Organic leaf veins stylized (bottom-right / top-left) */}
            <path 
              d="M 90% 95% C 85% 85% 75% 85% 70% 90% C 75% 95% 85% 98% 90% 95% Z" 
              fill="none" 
              stroke="rgba(16, 185, 129, 0.02)" 
              strokeWidth="1.5" 
            />
            <path d="M 70% 90% L 85% 92.5%" stroke="rgba(16, 185, 129, 0.02)" strokeWidth="1" />
            <path d="M 76% 91% C 78% 89% 82% 89% 84% 92%" stroke="rgba(16, 185, 129, 0.015)" strokeWidth="0.75" fill="none" />
          </>
        )}
      </svg>

      {/* LAYER 4 & 5: FoodOps Route Paths & Network Nodes */}
      {variant === 'hero' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            viewBox="0 0 1000 500" 
            className="w-full max-w-7xl h-[60vh] opacity-80" 
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background path line */}
            <path 
              d={heroPathD} 
              stroke="rgba(16, 185, 129, 0.15)" 
              strokeWidth="2.5" 
              fill="none" 
              strokeLinecap="round"
            />

            {/* Glowing moving segment along route */}
            <motion.path 
              d={heroPathD} 
              stroke="url(#route-glow-grad)" 
              strokeWidth="3.5" 
              strokeLinecap="round"
              fill="none"
              initial={{ strokeDasharray: "25 250", strokeDashoffset: 0 }}
              animate={shouldReduceMotion ? {} : { strokeDashoffset: -275 }}
              transition={shouldReduceMotion ? {} : { 
                duration: 9, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            />

            {/* SVG Definitions for Gradients */}
            <defs>
              <linearGradient id="route-glow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.1)" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="rgba(20, 184, 166, 0.2)" />
              </linearGradient>
            </defs>

            {/* Glowing active stages nodes */}
            {lifecycleNodes.map((node, i) => (
              <g key={i} className="group">
                {/* Node Outer Pulsing Glow */}
                <motion.circle 
                  cx={node.x} 
                  cy={node.y} 
                  r={9} 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="1.5"
                  animate={shouldReduceMotion ? {} : { 
                    scale: [1, 2.3, 1], 
                    opacity: [0.35, 0, 0.35] 
                  }}
                  transition={shouldReduceMotion ? {} : { 
                    duration: 3, 
                    delay: i * 0.35, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                />
                
                {/* Node Solid Center */}
                <circle 
                  cx={node.x} 
                  cy={node.y} 
                  r={4.5} 
                  fill="#10b981" 
                  className="drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                />

                {/* Node Labels underneath path in layout (subtle) */}
                <text
                  x={node.x}
                  y={node.y + 24}
                  textAnchor="middle"
                  fill="rgba(141, 156, 146, 0.7)"
                  fontSize="8"
                  fontWeight="bold"
                  letterSpacing="0.05em"
                  className="font-sans pointer-events-none select-none uppercase"
                >
                  {node.name}
                </text>
                
                {/* Node Icon */}
                <text
                  x={node.x}
                  y={node.y - 14}
                  textAnchor="middle"
                  fontSize="12"
                  className="pointer-events-none select-none"
                >
                  {node.icon}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* Subtle background lines for dashboard variants */}
      {(variant === 'dashboard' || variant === 'auth') && (
        <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
          {dashboardLines.map((line, i) => {
            const x1Pct = `${line.x1}%`;
            const y1Pct = `${line.y1}%`;
            const x2Pct = `${line.x2}%`;
            const y2Pct = `${line.y2}%`;

            return (
              <g key={i}>
                <line 
                  x1={x1Pct} 
                  y1={y1Pct} 
                  x2={x2Pct} 
                  y2={y2Pct} 
                  stroke="rgba(16, 185, 129, 0.12)" 
                  strokeWidth="1" 
                />
                <circle 
                  cx={x1Pct} 
                  cy={y1Pct} 
                  r="2" 
                  fill="rgba(16, 185, 129, 0.3)" 
                />
                {i % 3 === 0 && !shouldReduceMotion && (
                  <motion.circle
                    cx={x1Pct}
                    cy={y1Pct}
                    r="4"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="0.75"
                    animate={{ scale: [1, 2.5, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 4, delay: i, repeat: Infinity }}
                  />
                )}
              </g>
            );
          })}
        </svg>
      )}

      {/* LAYER 6: Very subtle floating environmental particles */}
      {mounted && !shouldReduceMotion && particles.length > 0 && (
        <div className="absolute inset-0">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-emerald-400/30"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                filter: 'blur(0.5px)',
              }}
              animate={{
                y: [0, -120, 0],
                x: [0, 40, 0],
                opacity: [0.1, 0.65, 0.1],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* LAYER 8: Vignette & Readability Gradient Overlay */}
      <div 
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `linear-gradient(to bottom, ${
            variant === 'hero'
              ? 'transparent, rgba(3, 7, 4, 0.4) 60%, #030704 100%'
              : variant === 'auth'
              ? 'rgba(3, 7, 4, 0.8), rgba(3, 7, 4, 0.9) 60%, #030704 100%'
              : 'rgba(3, 7, 4, 0.9), rgba(3, 7, 4, 0.95) 70%, #030704 100%'
          })`,
          boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.8)'
        }}
      />
    </div>
  );
}
