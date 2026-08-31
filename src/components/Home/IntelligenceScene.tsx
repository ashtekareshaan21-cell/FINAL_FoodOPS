'use client';

import { useEffect, useRef, useState } from 'react';
import { createScope, animate } from 'animejs';
import { MOTION } from '@/animations/config';
import { prefersReducedMotion } from '@/animations/accessibility';

export default function IntelligenceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dataPanelRef = useRef<HTMLDivElement>(null);
  
  // Data particles Refs
  const p1Ref = useRef<SVGCircleElement>(null);
  const p2Ref = useRef<SVGCircleElement>(null);
  const p3Ref = useRef<SVGCircleElement>(null);
  const p4Ref = useRef<SVGCircleElement>(null);
  
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
              const textItems = el.querySelectorAll('.scene-text');
              const nodes = el.querySelectorAll('.intel-node');
              const lines = el.querySelectorAll('.intel-line');
              
              const p1 = p1Ref.current;
              const p2 = p2Ref.current;
              const p3 = p3Ref.current;
              const p4 = p4Ref.current;
              const panel = dataPanelRef.current;

              // Animate text slide-in
              animate(textItems, {
                opacity: [0, 1],
                translateY: [20, 0],
                duration: MOTION.duration.medium,
                ease: MOTION.easing.smooth,
                delay: (_el?: any, i?: number) => (i || 0) * 100
              });

              // Fade in nodes and lines
              animate(nodes, {
                scale: [0.8, 1],
                opacity: [0, 1],
                duration: MOTION.duration.medium,
                ease: MOTION.easing.smooth,
                delay: 200
              });

              animate(lines, {
                strokeDashoffset: [200, 0],
                opacity: [0, 1],
                duration: MOTION.duration.slow,
                ease: MOTION.easing.smooth,
                delay: 400
              });

              // Animate particle data streams: translating along connection paths
              // Path 1: Orders (50, 100) -> Core (200, 200)
              if (p1 && p2 && p3 && p4) {
                animate(p1, {
                  cx: [50, 200],
                  cy: [100, 200],
                  opacity: [0, 1, 0],
                  duration: 2000,
                  loop: true,
                  ease: 'linear',
                  delay: 800
                });

                // Path 2: Inventory (350, 100) -> Core (200, 200)
                animate(p2, {
                  cx: [350, 200],
                  cy: [100, 200],
                  opacity: [0, 1, 0],
                  duration: 2000,
                  loop: true,
                  ease: 'linear',
                  delay: 1100
                });

                // Path 3: Kitchen (50, 300) -> Core (200, 200)
                animate(p3, {
                  cx: [50, 200],
                  cy: [300, 200],
                  opacity: [0, 1, 0],
                  duration: 2000,
                  loop: true,
                  ease: 'linear',
                  delay: 1400
                });

                // Path 4: Delivery (350, 300) -> Core (200, 200)
                animate(p4, {
                  cx: [350, 200],
                  cy: [300, 200],
                  opacity: [0, 1, 0],
                  duration: 2000,
                  loop: true,
                  ease: 'linear',
                  delay: 1700
                });
              }

              // Fade in data analytics insights panel (around 3.5s later)
              if (panel) {
                animate(panel, {
                  opacity: [0, 1],
                  translateY: [15, 0],
                  duration: MOTION.duration.medium,
                  ease: 'spring(1, 80, 12, 0)',
                  delay: 3000
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
              Step 4: AI & Platform Intelligence
            </span>
            <h2 
              className={`scene-text text-4xl sm:text-6xl font-black text-foreground leading-[1.1] font-display transition-opacity duration-200 ${
                'opacity-100'
              }`}
            >
              DON&apos;T JUST <br />
              MANAGE FOOD. <br />
              <span className="text-primary font-display">UNDERSTAND IT.</span>
            </h2>
            <p 
              className={`scene-text text-sm sm:text-base text-muted-text leading-relaxed font-medium transition-opacity duration-200 ${
                'opacity-100'
              }`}
            >
              FoodOps unites previously fragmented operations. Order counts, inventory stocks, preparation flows, and courier routes converge to yield actionable intelligence.
            </p>
          </div>

          {/* Core convergence graphic */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative min-h-[450px]">
            <div className="relative w-full max-w-[400px] aspect-square">
              {/* SVG Connector Streams */}
              <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                {/* Connector lines */}
                <line x1="50" y1="100" x2="200" y2="200" stroke="var(--color-border, #e4e4e7)" strokeWidth="2" strokeDasharray="200" strokeDashoffset="200" className="intel-line" />
                <line x1="350" y1="100" x2="200" y2="200" stroke="var(--color-border, #e4e4e7)" strokeWidth="2" strokeDasharray="200" strokeDashoffset="200" className="intel-line" />
                <line x1="50" y1="300" x2="200" y2="200" stroke="var(--color-border, #e4e4e7)" strokeWidth="2" strokeDasharray="200" strokeDashoffset="200" className="intel-line" />
                <line x1="350" y1="300" x2="200" y2="200" stroke="var(--color-border, #e4e4e7)" strokeWidth="2" strokeDasharray="200" strokeDashoffset="200" className="intel-line" />

                {/* Animated data particles */}
                <circle ref={p1Ref} cx="50" cy="100" r="4" fill="var(--color-primary, #10b981)" style={{ opacity: 0 }} />
                <circle ref={p2Ref} cx="350" cy="100" r="4" fill="var(--color-primary, #10b981)" style={{ opacity: 0 }} />
                <circle ref={p3Ref} cx="50" cy="300" r="4" fill="var(--color-primary, #10b981)" style={{ opacity: 0 }} />
                <circle ref={p4Ref} cx="350" cy="300" r="4" fill="var(--color-primary, #10b981)" style={{ opacity: 0 }} />
              </svg>

              {/* Core Node */}
              <div 
                className={`intel-node absolute top-[160px] left-[160px] w-20 h-20 rounded-full bg-primary/5 border border-primary flex items-center justify-center z-20 transition-all ${
                  mounted && !prefersReducedMotion() ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
                }`}
              >
                <span className="text-[10px] font-black text-primary tracking-widest text-center leading-none">FOODOPS<br /><span className="text-[8px] font-semibold text-muted-text">CORE</span></span>
              </div>

              {/* outlying peripheral nodes */}
              {/* ORDERS */}
              <div className={`intel-node absolute top-[76px] left-[26px] w-12 h-12 rounded-lg bg-surface border border-border shadow-sm flex items-center justify-center z-10 transition-all ${mounted && !prefersReducedMotion() ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
                <span className="text-lg">📝</span>
              </div>

              {/* INVENTORY */}
              <div className={`intel-node absolute top-[76px] right-[26px] w-12 h-12 rounded-lg bg-surface border border-border shadow-sm flex items-center justify-center z-10 transition-all ${mounted && !prefersReducedMotion() ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
                <span className="text-lg">📊</span>
              </div>

              {/* KITCHEN */}
              <div className={`intel-node absolute bottom-[76px] left-[26px] w-12 h-12 rounded-lg bg-surface border border-border shadow-sm flex items-center justify-center z-10 transition-all ${mounted && !prefersReducedMotion() ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
                <span className="text-lg">🍳</span>
              </div>

              {/* DELIVERY */}
              <div className={`intel-node absolute bottom-[76px] right-[26px] w-12 h-12 rounded-lg bg-surface border border-border shadow-sm flex items-center justify-center z-10 transition-all ${mounted && !prefersReducedMotion() ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
                <span className="text-lg">🚴</span>
              </div>
            </div>

            {/* Generated Insights panel */}
            <div 
              ref={dataPanelRef}
              className={`w-full max-w-sm bg-surface border border-border p-5 rounded-lg shadow-md z-30 transition-all duration-300 mt-4 ${
                'opacity-100'
              }`}
              style={{ opacity: 0 }}
            >
              <h4 className="text-[10px] font-black uppercase text-muted tracking-widest mb-3">CONVERGED INSIGHTS</h4>
              <div className="grid grid-cols-3 gap-4 text-center font-mono font-bold">
                <div className="p-3 bg-surface-muted border border-border rounded-md">
                  <p className="text-xs text-muted-light">WASTE</p>
                  <p className="text-base text-success mt-1">-18%</p>
                </div>
                <div className="p-3 bg-surface-muted border border-border rounded-md">
                  <p className="text-xs text-muted-light">DELIVERY</p>
                  <p className="text-base text-success mt-1">-23%</p>
                </div>
                <div className="p-3 bg-surface-muted border border-border rounded-md">
                  <p className="text-xs text-muted-light">EFFICIENCY</p>
                  <p className="text-base text-primary mt-1">+31%</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
