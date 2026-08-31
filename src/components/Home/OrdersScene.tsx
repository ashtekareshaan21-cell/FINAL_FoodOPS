'use client';

import { useEffect, useRef, useState } from 'react';
import { createScope, animate } from 'animejs';
import { MOTION } from '@/animations/config';
import { prefersReducedMotion } from '@/animations/accessibility';

const INCOMING_ORDERS = [
  { id: '#1042', time: 'Just now', servings: '35 meals', category: '🥗 Veg' },
  { id: '#1043', time: '1 min ago', servings: '60 meals', category: '🍗 Non-Veg' },
  { id: '#1044', time: '3 min ago', servings: '18 meals', category: '🍞 Bakery' },
  { id: '#1045', time: '5 min ago', servings: '50 meals', category: '🍲 Mixed' }
];

export default function OrdersScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
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
              const text = el.querySelectorAll('.scene-text');
              const cards = el.querySelectorAll('.order-card');
              const lines = el.querySelectorAll('.order-line');
              const core = el.querySelector('.order-core');

              // Animate text slide-in
              animate(text, {
                opacity: [0, 1],
                translateY: [20, 0],
                duration: MOTION.duration.medium,
                ease: MOTION.easing.smooth,
                delay: (_el?: any, i?: number) => (i || 0) * 100
              });

              // Pop core node
              if (core) {
                animate(core, {
                  scale: [0, 1],
                  opacity: [0, 1],
                  duration: MOTION.duration.medium,
                  ease: MOTION.easing.bounce,
                  delay: 300
                });
              }

              // Stagger order cards docking from different directions
              const translateOffsets = [
                { x: [-120, 0], y: [-50, 0] },
                { x: [120, 0], y: [-50, 0] },
                { x: [-120, 0], y: [50, 0] },
                { x: [120, 0], y: [50, 0] }
              ];

              cards.forEach((card, idx) => {
                const offsets = translateOffsets[idx % translateOffsets.length];
                animate(card, {
                  opacity: [0, 1],
                  translateX: offsets.x,
                  translateY: offsets.y,
                  scale: [0.9, 1],
                  duration: MOTION.duration.slow,
                  ease: MOTION.easing.smooth,
                  delay: 600 + idx * 150
                });
              });

              // Draw connection lines
              animate(lines, {
                strokeDashoffset: [200, 0],
                opacity: [0, 1],
                duration: MOTION.duration.slow,
                ease: MOTION.easing.smooth,
                delay: 1100
              });

              // Interpolate orders counter
              const counterObj = { val: 0 };
              const counterEl = counterRef.current;
              animate(counterObj, {
                val: 127,
                duration: 2000,
                ease: MOTION.easing.smooth,
                delay: 1300,
                onRender: () => {
                  if (counterEl) {
                    counterEl.innerText = Math.round(counterObj.val).toString();
                  }
                }
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
      id="orders-narrative"
      ref={containerRef}
      className="relative py-32 border-t border-border overflow-hidden bg-surface-muted/30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Narrative Text */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="scene-text text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 border border-primary/10 px-3 py-1 rounded-full w-fit block">
              Step 1: surplus listing declaration
            </span>
            <h2 
              className={`scene-text text-4xl sm:text-6xl font-black text-foreground leading-[1.1] font-display transition-opacity duration-200 ${
                'opacity-100'
              }`}
            >
              EVERYTHING <br />
              STARTS WITH <br />
              <span className="text-primary font-display">ORDERS.</span>
            </h2>
            <p 
              className={`scene-text text-sm sm:text-base text-muted-text leading-relaxed font-medium transition-opacity duration-200 ${
                'opacity-100'
              }`}
            >
              Surplus listing declarations from banquets, events, or corporate dining halls feed instantly into the FoodOps operational queue.
            </p>
            
            {/* Real-time Order Count display */}
            <div 
              className={`scene-text p-6 bg-surface border border-border rounded-lg shadow-sm w-fit transition-opacity duration-200 ${
                'opacity-100'
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span 
                  ref={counterRef}
                  className="text-4xl font-black text-foreground tracking-tight font-mono"
                >
                  127
                </span>
                <span className="text-xs font-bold text-success uppercase tracking-wider">▲ ACTIVE</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-muted mt-1 tracking-widest">Rescues Audited Today</p>
            </div>
          </div>

          {/* Converging Cards Graphic */}
          <div className="lg:col-span-7 flex justify-center items-center relative min-h-[400px]">
            {/* SVG Connector Lines background */}
            <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              <path d="M 60,80 L 200,200" fill="none" stroke="var(--color-primary, #10b981)" strokeWidth="1.5" strokeDasharray="200" strokeDashoffset="200" className="order-line opacity-50" />
              <path d="M 340,80 L 200,200" fill="none" stroke="var(--color-primary, #10b981)" strokeWidth="1.5" strokeDasharray="200" strokeDashoffset="200" className="order-line opacity-50" />
              <path d="M 60,320 L 200,200" fill="none" stroke="var(--color-primary, #10b981)" strokeWidth="1.5" strokeDasharray="200" strokeDashoffset="200" className="order-line opacity-50" />
              <path d="M 340,320 L 200,200" fill="none" stroke="var(--color-primary, #10b981)" strokeWidth="1.5" strokeDasharray="200" strokeDashoffset="200" className="order-line opacity-50" />
            </svg>

            {/* Central Node */}
            <div 
              className={`order-core w-24 h-24 rounded-full bg-primary/10 border-2 border-primary flex flex-col items-center justify-center relative z-20 shadow-md transition-all ${
                mounted && !prefersReducedMotion() ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
              }`}
            >
              <span className="text-2xl animate-pulse">🛰️</span>
              <span className="text-[9px] font-black uppercase text-primary tracking-widest mt-1">GATEWAY</span>
            </div>

            {/* Order cards floating and converging */}
            {/* Top Left */}
            <div 
              className={`order-card absolute top-4 left-4 p-4 w-44 bg-surface border border-border rounded-lg shadow-md z-10 hover:border-primary/20 transition-all ${
                'opacity-100'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono text-xs font-bold text-foreground">{INCOMING_ORDERS[0].id}</span>
                <span className="text-[9px] font-bold text-success bg-success-bg px-2 py-0.5 rounded-full border border-success-border">{INCOMING_ORDERS[0].category}</span>
              </div>
              <p className="text-[10px] text-muted-text font-semibold">{INCOMING_ORDERS[0].servings} declared</p>
              <p className="text-[9px] text-muted-light mt-1 font-mono">{INCOMING_ORDERS[0].time}</p>
            </div>

            {/* Top Right */}
            <div 
              className={`order-card absolute top-4 right-4 p-4 w-44 bg-surface border border-border rounded-lg shadow-md z-10 hover:border-primary/20 transition-all ${
                'opacity-100'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono text-xs font-bold text-foreground">{INCOMING_ORDERS[1].id}</span>
                <span className="text-[9px] font-bold text-success bg-success-bg px-2 py-0.5 rounded-full border border-success-border">{INCOMING_ORDERS[1].category}</span>
              </div>
              <p className="text-[10px] text-muted-text font-semibold">{INCOMING_ORDERS[1].servings} declared</p>
              <p className="text-[9px] text-muted-light mt-1 font-mono">{INCOMING_ORDERS[1].time}</p>
            </div>

            {/* Bottom Left */}
            <div 
              className={`order-card absolute bottom-4 left-4 p-4 w-44 bg-surface border border-border rounded-lg shadow-md z-10 hover:border-primary/20 transition-all ${
                'opacity-100'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono text-xs font-bold text-foreground">{INCOMING_ORDERS[2].id}</span>
                <span className="text-[9px] font-bold text-success bg-success-bg px-2 py-0.5 rounded-full border border-success-border">{INCOMING_ORDERS[2].category}</span>
              </div>
              <p className="text-[10px] text-muted-text font-semibold">{INCOMING_ORDERS[2].servings} declared</p>
              <p className="text-[9px] text-muted-light mt-1 font-mono">{INCOMING_ORDERS[2].time}</p>
            </div>

            {/* Bottom Right */}
            <div 
              className={`order-card absolute bottom-4 right-4 p-4 w-44 bg-surface border border-border rounded-lg shadow-md z-10 hover:border-primary/20 transition-all ${
                'opacity-100'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono text-xs font-bold text-foreground">{INCOMING_ORDERS[3].id}</span>
                <span className="text-[9px] font-bold text-success bg-success-bg px-2 py-0.5 rounded-full border border-success-border">{INCOMING_ORDERS[3].category}</span>
              </div>
              <p className="text-[10px] text-muted-text font-semibold">{INCOMING_ORDERS[3].servings} declared</p>
              <p className="text-[9px] text-muted-light mt-1 font-mono">{INCOMING_ORDERS[3].time}</p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
