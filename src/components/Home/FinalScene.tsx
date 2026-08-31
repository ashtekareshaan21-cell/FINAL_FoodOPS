'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createScope, animate } from 'animejs';
import { MOTION } from '@/animations/config';
import { prefersReducedMotion } from '@/animations/accessibility';

export default function FinalScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            createScope({ root: el }).add(() => {
              const textItems = el.querySelectorAll('.final-text-anim');
              const nodes = el.querySelectorAll('.final-node');
              const lines = el.querySelectorAll('.final-line');

              // Text fade-in
              animate(textItems, {
                opacity: [0, 1],
                translateY: [25, 0],
                duration: MOTION.duration.slow,
                ease: MOTION.easing.smooth,
                delay: (_el?: any, i?: number) => (i || 0) * 120
              });

              // Connection lines draw
              animate(lines, {
                strokeDashoffset: [200, 0],
                opacity: [0, 1],
                duration: MOTION.duration.slow,
                ease: MOTION.easing.smooth,
                delay: 400
              });

              // Pop peripheral circles
              animate(nodes, {
                scale: [0, 1],
                opacity: [0, 1],
                duration: MOTION.duration.medium,
                ease: MOTION.easing.bounce,
                delay: (_el?: any, i?: number) => 800 + (i || 0) * 100
              });
            });
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative py-32 border-t border-border bg-transparent overflow-hidden"
    >
      {/* Decorative center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Final Narratives & CTA */}
          <div className="lg:col-span-6 space-y-8 text-left">
            <div className="space-y-4">
              <span className="final-text-anim text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 border border-primary/10 px-3 py-1 rounded-full w-fit block">
                FoodOps Complete Ecosystem
              </span>
              <h2 
                className={`final-text-anim text-4xl sm:text-6xl font-black text-foreground leading-[1.0] font-display transition-opacity duration-200 ${
                  'opacity-100'
                }`}
              >
                ONE SYSTEM. <br />
                EVERY <br />
                <span className="text-primary font-display">OPERATION.</span>
              </h2>
              <p 
                className={`final-text-anim max-w-lg text-sm sm:text-base text-muted-text leading-relaxed font-medium transition-opacity duration-200 ${
                  'opacity-100'
                }`}
              >
                FoodOps orchestrates the entire operational journey. Join verified donor establishments, NGO redistribution systems, and volunteer couriers to secure surplus food and automate zero-waste cycles.
              </p>
            </div>

            {/* CTAs */}
            <div 
              className={`final-text-anim flex flex-col sm:flex-row gap-4 pt-4 transition-opacity duration-200 ${
                'opacity-100'
              }`}
            >
              <div className="w-full sm:w-auto hover:scale-[1.01] active:scale-[0.99] transition-transform duration-200">
                <Link
                  href="/register"
                  className="btn-primary w-full sm:w-auto px-8 py-4 shadow-lg shadow-primary/10 block text-center font-bold"
                >
                  GET STARTED
                </Link>
              </div>
              <div className="w-full sm:w-auto hover:scale-[1.01] active:scale-[0.99] transition-transform duration-200">
                <Link
                  href="/login"
                  className="btn-secondary w-full sm:w-auto px-8 py-4 block text-center font-bold"
                >
                  SIGN IN TO CONSOLE
                </Link>
              </div>
            </div>
          </div>

          {/* Unified System SVG Diagram Climax */}
          <div className="lg:col-span-6 flex justify-center items-center relative min-h-[400px]">
            <svg viewBox="0 0 400 400" className="w-full max-w-[400px] aspect-square overflow-visible">
              {/* Radial connector lines */}
              <g className="opacity-60">
                {/* Orders */}
                <line x1="200" y1="200" x2="200" y2="60" stroke="var(--color-primary, #10b981)" strokeWidth="2" strokeDasharray="200" strokeDashoffset="200" className="final-line" />
                {/* Kitchen */}
                <line x1="200" y1="200" x2="340" y2="150" stroke="var(--color-primary, #10b981)" strokeWidth="2" strokeDasharray="200" strokeDashoffset="200" className="final-line" />
                {/* Inventory */}
                <line x1="200" y1="200" x2="310" y2="310" stroke="var(--color-primary, #10b981)" strokeWidth="2" strokeDasharray="200" strokeDashoffset="200" className="final-line" />
                {/* Delivery */}
                <line x1="200" y1="200" x2="90" y2="310" stroke="var(--color-primary, #10b981)" strokeWidth="2" strokeDasharray="200" strokeDashoffset="200" className="final-line" />
                {/* Customer */}
                <line x1="200" y1="200" x2="60" y2="150" stroke="var(--color-primary, #10b981)" strokeWidth="2" strokeDasharray="200" strokeDashoffset="200" className="final-line" />
              </g>

              {/* Core Node */}
              <g className="final-node" style={{ transformOrigin: '200px 200px' }}>
                <circle cx="200" cy="200" r="42" className="fill-surface stroke-primary" strokeWidth="3" />
                <circle cx="200" cy="200" r="50" fill="none" className="stroke-primary/20 animate-ping" strokeWidth="1" />
                <text x="200" y="196" fontSize="10" fontWeight="bold" textAnchor="middle" fill="currentColor">FOODOPS</text>
                <text x="200" y="212" fontSize="9" fontWeight="black" className="fill-primary" textAnchor="middle">SYSTEM</text>
              </g>

              {/* Peripheral Nodes */}
              {/* ORDERS */}
              <g className="final-node" style={{ transformOrigin: '200px 60px' }}>
                <circle cx="200" cy="60" r="28" className="fill-surface stroke-border" strokeWidth="1.5" />
                <text x="200" y="56" fontSize="14" textAnchor="middle">📝</text>
                <text x="200" y="74" fontSize="7" fontWeight="bold" fill="currentColor" textAnchor="middle">ORDERS</text>
              </g>

              {/* KITCHEN */}
              <g className="final-node" style={{ transformOrigin: '340px 150px' }}>
                <circle cx="340" cy="150" r="28" className="fill-surface stroke-border" strokeWidth="1.5" />
                <text x="340" y="146" fontSize="14" textAnchor="middle">🍳</text>
                <text x="340" y="164" fontSize="7" fontWeight="bold" fill="currentColor" textAnchor="middle">KITCHEN</text>
              </g>

              {/* INVENTORY */}
              <g className="final-node" style={{ transformOrigin: '310px 310px' }}>
                <circle cx="310" cy="310" r="28" className="fill-surface stroke-border" strokeWidth="1.5" />
                <text x="310" y="306" fontSize="14" textAnchor="middle">📊</text>
                <text x="310" y="324" fontSize="7" fontWeight="bold" fill="currentColor" textAnchor="middle">INVENTORY</text>
              </g>

              {/* DELIVERY */}
              <g className="final-node" style={{ transformOrigin: '90px 310px' }}>
                <circle cx="90" cy="310" r="28" className="fill-surface stroke-border" strokeWidth="1.5" />
                <text x="90" y="306" fontSize="14" textAnchor="middle">🚴</text>
                <text x="90" y="324" fontSize="7" fontWeight="bold" fill="currentColor" textAnchor="middle">DELIVERY</text>
              </g>

              {/* CUSTOMER */}
              <g className="final-node" style={{ transformOrigin: '60px 150px' }}>
                <circle cx="60" cy="150" r="28" className="fill-surface stroke-border" strokeWidth="1.5" />
                <text x="60" y="146" fontSize="14" textAnchor="middle">🍽️</text>
                <text x="60" y="164" fontSize="7" fontWeight="bold" fill="currentColor" textAnchor="middle">CUSTOMER</text>
              </g>
            </svg>
          </div>

        </div>
      </div>
    </section>
  );
}
