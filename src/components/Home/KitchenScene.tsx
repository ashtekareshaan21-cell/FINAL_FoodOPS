'use client';

import { useEffect, useRef, useState } from 'react';
import { createScope, animate } from 'animejs';
import { MOTION } from '@/animations/config';
import { prefersReducedMotion } from '@/animations/accessibility';

export default function KitchenScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef1 = useRef<HTMLDivElement>(null);
  const cardRef2 = useRef<HTMLDivElement>(null);
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
              const cols = el.querySelectorAll('.kitchen-col');
              const c1 = cardRef1.current;
              const c2 = cardRef2.current;

              // Animate headers and text
              animate(text, {
                opacity: [0, 1],
                translateY: [20, 0],
                duration: MOTION.duration.medium,
                ease: MOTION.easing.smooth,
                delay: (_el?: any, i?: number) => (i || 0) * 100
              });

              animate(cols, {
                opacity: [0, 1],
                translateY: [15, 0],
                duration: MOTION.duration.medium,
                ease: MOTION.easing.smooth,
                delay: (_el?: any, i?: number) => 300 + (i || 0) * 100
              });

              // Initial card entrances
              if (c1 && c2) {
                animate([c1, c2], {
                  opacity: [0, 1],
                  scale: [0.95, 1],
                  duration: MOTION.duration.normal,
                  ease: MOTION.easing.smooth,
                  delay: 800
                });

                // Simulate order state movement timeline:
                // Card 1 moves from NEW (col 1) to PREPARING (col 2)
                animate(c1, {
                  translateX: [0, 240], // distance between columns (approx 240px depending on screen)
                  translateY: [0, 0],
                  duration: 1800,
                  ease: MOTION.easing.smooth,
                  delay: 1800
                });

                // Card 2 moves from PREPARING (col 2) to READY (col 3)
                animate(c2, {
                  translateX: [0, 240], // shift columns right
                  duration: 1800,
                  ease: MOTION.easing.smooth,
                  delay: 3600
                });
              }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Narrative Text */}
          <div className="lg:col-span-5 space-y-6 text-left lg:order-last">
            <span className="scene-text text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 border border-primary/10 px-3 py-1 rounded-full w-fit block">
              Step 2: operational kitchen dispatching
            </span>
            <h2 
              className={`scene-text text-4xl sm:text-6xl font-black text-foreground leading-[1.1] font-display transition-opacity duration-200 ${
                'opacity-100'
              }`}
            >
              FROM ORDER <br />
              TO <br />
              <span className="text-primary font-display">KITCHEN.</span>
            </h2>
            <p 
              className={`scene-text text-sm sm:text-base text-muted-text leading-relaxed font-medium transition-opacity duration-200 ${
                'opacity-100'
              }`}
            >
              Once claimed by an NGO, orders enter a real-time status flow. Kitchen staff and NGO centers align instantly on status shifts, eliminating idle time.
            </p>

            {/* Micro Annotation Label */}
            <div className={`scene-text flex items-center gap-3 border-l-2 border-primary pl-4 py-1 transition-opacity duration-200 ${
              'opacity-100'
            }`}>
              <span className="text-xl">👩‍🍳</span>
              <div>
                <p className="text-[10px] font-bold text-muted-light uppercase tracking-wider">Preparation Efficiency</p>
                <p className="text-xs font-semibold text-foreground font-mono">Status updates trigger automatic courier radius checks</p>
              </div>
            </div>
          </div>

          {/* Workflow Board Graphic */}
          <div className="lg:col-span-7 flex justify-center items-center relative overflow-x-auto select-none p-4">
            <div className="flex gap-6 min-w-[650px] justify-between w-full relative">
              
              {/* NEW COLUMN */}
              <div 
                className={`kitchen-col flex-1 bg-surface-muted/50 p-4 rounded-lg border border-border min-h-[220px] transition-opacity duration-200 ${
                  'opacity-100'
                }`}
              >
                <h4 className="text-[10px] font-black uppercase text-muted tracking-widest mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-info" />
                  NEW ORDERS
                </h4>
                <div className="space-y-3 relative">
                  <div 
                    ref={cardRef1}
                    className="p-3.5 bg-surface border border-border rounded-md shadow-sm transition-all duration-300 relative z-20 opacity-100 scale-100"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[10px] font-bold">#1042</span>
                      <span className="text-[9px] font-bold text-info bg-info-bg px-2 rounded-sm border border-info-border">Vegetable Biryani</span>
                    </div>
                    <p className="text-[10px] font-semibold text-muted-text mt-1">Ready for packing</p>
                  </div>
                </div>
              </div>

              {/* PREPARING COLUMN */}
              <div 
                className={`kitchen-col flex-1 bg-surface-muted/50 p-4 rounded-lg border border-border min-h-[220px] transition-opacity duration-200 ${
                  'opacity-100'
                }`}
              >
                <h4 className="text-[10px] font-black uppercase text-muted tracking-widest mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                  PREPARING
                </h4>
                <div className="space-y-3 relative">
                  <div 
                    ref={cardRef2}
                    className="p-3.5 bg-surface border border-border rounded-md shadow-sm transition-all duration-300 relative z-20 opacity-100 scale-100"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[10px] font-bold">#1043</span>
                      <span className="text-[9px] font-bold text-warning bg-warning-bg px-2 rounded-sm border border-warning-border">Chicken Reshmi</span>
                    </div>
                    <p className="text-[10px] font-semibold text-muted-text mt-1">Cooking in progress</p>
                  </div>
                </div>
              </div>

              {/* READY COLUMN */}
              <div 
                className={`kitchen-col flex-1 bg-surface-muted/50 p-4 rounded-lg border border-border min-h-[220px] transition-opacity duration-200 ${
                  'opacity-100'
                }`}
              >
                <h4 className="text-[10px] font-black uppercase text-muted tracking-widest mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  READY / DONE
                </h4>
                <div className="space-y-3">
                  {/* Empty state or placeholders */}
                  <div className="text-center py-6 text-[10px] text-muted-light font-semibold border-2 border-dashed border-border rounded-md">
                    Waiting for handovers
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
