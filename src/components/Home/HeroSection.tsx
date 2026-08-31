'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createScope, animate } from 'animejs';
import { MOTION } from '@/animations/config';
import { prefersReducedMotion } from '@/animations/accessibility';

export default function HeroSection() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    // Component-scoped Anime.js timeline entrance
    const scope = createScope({ root }).add(() => {
      const textItems = root.querySelectorAll('.hero-text-anim');
      const nodes = root.querySelectorAll('.hero-node-anim');
      const lines = root.querySelectorAll('.hero-line-anim');

      // Animating the text and then drawing the connections of the central core
      animate(textItems, {
        opacity: [0, 1],
        translateY: [25, 0],
        duration: MOTION.duration.slow,
        ease: MOTION.easing.smooth,
        delay: (_el?: any, i?: number) => (i || 0) * 120,
      });

      animate(lines, {
        strokeDashoffset: [300, 0],
        opacity: [0, 1],
        duration: MOTION.duration.slow,
        ease: MOTION.easing.smooth,
        delay: 500,
      });

      animate(nodes, {
        scale: [0, 1],
        opacity: [0, 1],
        duration: MOTION.duration.medium,
        ease: MOTION.easing.bounce,
        delay: (_el?: any, i?: number) => 800 + (i || 0) * 100,
      });
    });

    return () => {
      scope.revert();
    };
  }, []);

  return (
    <section ref={rootRef} className="relative overflow-hidden min-h-screen pt-24 pb-20 flex items-center bg-transparent">
      {/* Decorative Radial Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.06),rgba(0,0,0,0))] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Operational Typography Treatment */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <span 
              className="hero-text-anim inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest text-[#166534] bg-emerald-50 border border-emerald-200"
            >
              🌿 SIH 2026 Problem Statement ID: 26193 • Agriculture & FoodTech
            </span>
            
            <h1 
              className="hero-text-anim text-4xl sm:text-6xl font-bold tracking-tight text-[#0f2942] leading-[1.1] font-display"
            >
              FoodOPS <br />
              <span className="text-slate-700 font-semibold text-3xl sm:text-4xl block mt-1">
                Intelligent Surplus-Food Rescue & Recovery
              </span>
            </h1>
            
            <p 
              className="hero-text-anim max-w-lg text-base sm:text-lg text-slate-600 leading-relaxed font-normal"
            >
              Connect surplus food with verified receivers before the rescue window closes — and route missed rescues toward responsible organic recovery.
            </p>
            
            <div 
              className="hero-text-anim pt-2 flex flex-col sm:flex-row gap-3"
            >
              <div>
                <Link
                  href="/register"
                  className="btn-primary w-full sm:w-auto px-7 py-3 text.sm font-semibold shadow-xs block text-center"
                >
                  Explore Platform
                </Link>
              </div>
              <div>
                <a
                  href="#how-it-works"
                  className="btn-secondary w-full sm:w-auto px-7 py-3 text-sm font-semibold shadow-xs block text-center"
                >
                  How FoodOPS Works &darr;
                </a>
              </div>
            </div>
          </div>

          {/* Central FoodOps Core SVG System Diagram */}
          <div className="lg:col-span-6 flex justify-center items-center relative min-h-[350px]">
            <svg 
              viewBox="0 0 500 500" 
              className="w-full max-w-[450px] aspect-square overflow-visible"
            >
              {/* Connector lines (glowing paths) */}
              <g className="opacity-75">
                {/* Orders to Core */}
                <path 
                  d="M 100,100 L 250,250" 
                  stroke="var(--color-primary, #10b981)" 
                  strokeWidth="2.5" 
                  strokeDasharray="300"
                  strokeDashoffset="300"
                  className="hero-line-anim"
                />
                {/* Kitchen to Core */}
                <path 
                  d="M 400,100 L 250,250" 
                  stroke="var(--color-primary, #10b981)" 
                  strokeWidth="2.5" 
                  strokeDasharray="300"
                  strokeDashoffset="300"
                  className="hero-line-anim"
                />
                {/* Inventory to Core */}
                <path 
                  d="M 100,400 L 250,250" 
                  stroke="var(--color-primary, #10b981)" 
                  strokeWidth="2.5" 
                  strokeDasharray="300"
                  strokeDashoffset="300"
                  className="hero-line-anim"
                />
                {/* Delivery to Core */}
                <path 
                  d="M 400,400 L 250,250" 
                  stroke="var(--color-primary, #10b981)" 
                  strokeWidth="2.5" 
                  strokeDasharray="300"
                  strokeDashoffset="300"
                  className="hero-line-anim"
                />
              </g>

              {/* Central Core Circle Node */}
              <g className="hero-node-anim" style={{ transformOrigin: '250px 250px' }}>
                <circle 
                  cx="250" 
                  cy="250" 
                  r="50" 
                  className="fill-surface stroke-primary" 
                  strokeWidth="3.5" 
                />
                <circle 
                  cx="250" 
                  cy="250" 
                  r="62" 
                  fill="none" 
                  className="stroke-primary/20 animate-ping" 
                  strokeWidth="1" 
                />
                <text 
                  x="250" 
                  y="245" 
                  fontSize="12" 
                  fontWeight="bold" 
                  textAnchor="middle" 
                  fill="currentColor"
                >
                  FOODOPS
                </text>
                <text 
                  x="250" 
                  y="262" 
                  fontSize="10" 
                  fontWeight="black" 
                  className="fill-primary"
                  textAnchor="middle"
                >
                  CORE
                </text>
              </g>

              {/* Operational nodes */}
              {/* ORDERS */}
              <g className="hero-node-anim" style={{ transformOrigin: '100px 100px' }}>
                <circle cx="100" cy="100" r="36" className="fill-surface stroke-border hover:stroke-primary" strokeWidth="2" />
                <text x="100" y="96" fontSize="16" textAnchor="middle">📝</text>
                <text x="100" y="120" fontSize="9" fontWeight="bold" fill="currentColor" textAnchor="middle">ORDERS</text>
              </g>

              {/* KITCHEN */}
              <g className="hero-node-anim" style={{ transformOrigin: '400px 100px' }}>
                <circle cx="400" cy="100" r="36" className="fill-surface stroke-border hover:stroke-primary" strokeWidth="2" />
                <text x="400" y="96" fontSize="16" textAnchor="middle">🍳</text>
                <text x="400" y="120" fontSize="9" fontWeight="bold" fill="currentColor" textAnchor="middle">KITCHEN</text>
              </g>

              {/* INVENTORY */}
              <g className="hero-node-anim" style={{ transformOrigin: '100px 400px' }}>
                <circle cx="100" cy="400" r="36" className="fill-surface stroke-border hover:stroke-primary" strokeWidth="2" />
                <text x="100" y="396" fontSize="16" textAnchor="middle">📊</text>
                <text x="100" y="420" fontSize="9" fontWeight="bold" fill="currentColor" textAnchor="middle">INVENTORY</text>
              </g>

              {/* DELIVERY */}
              <g className="hero-node-anim" style={{ transformOrigin: '400px 400px' }}>
                <circle cx="400" cy="400" r="36" className="fill-surface stroke-border hover:stroke-primary" strokeWidth="2" />
                <text x="400" y="396" fontSize="16" textAnchor="middle">🚴</text>
                <text x="400" y="420" fontSize="9" fontWeight="bold" fill="currentColor" textAnchor="middle">DELIVERY</text>
              </g>
            </svg>
          </div>

        </div>
      </div>
    </section>
  );
}
