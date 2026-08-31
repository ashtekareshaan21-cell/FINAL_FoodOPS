'use client';

import { useEffect, useRef, useState } from 'react';
import { createScope, animate } from 'animejs';
import { MOTION } from '@/animations/config';
import { prefersReducedMotion } from '@/animations/accessibility';

export default function AnalyticsScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalOpsRef = useRef<HTMLSpanElement>(null);
  const orderCountRef = useRef<HTMLSpanElement>(null);
  const chartBarsRef = useRef<SVGGElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    const chartBars = chartBarsRef.current;
    if (!el || prefersReducedMotion()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            createScope({ root: el }).add(() => {
              const textItems = el.querySelectorAll('.scene-text');
              const gridItems = el.querySelectorAll('.analytics-grid-item');
              
              const opsEl = totalOpsRef.current;
              const ordEl = orderCountRef.current;

              // Animate text slide-in
              animate(textItems, {
                opacity: [0, 1],
                translateY: [20, 0],
                duration: MOTION.duration.medium,
                ease: MOTION.easing.smooth,
                delay: (_el?: any, i?: number) => (i || 0) * 100
              });

              // Fade in metric cards
              animate(gridItems, {
                opacity: [0, 1],
                scale: [0.96, 1],
                translateY: [15, 0],
                duration: MOTION.duration.medium,
                ease: MOTION.easing.smooth,
                delay: (_el?: any, i?: number) => 300 + (i || 0) * 80
              });

              // Interpolate total operations count
              if (opsEl) {
                const opsObj = { val: 0 };
                animate(opsObj, {
                  val: 24821,
                  duration: 2500,
                  ease: MOTION.easing.smooth,
                  delay: 600,
                  onRender: () => {
                    opsEl.innerText = Math.round(opsObj.val).toLocaleString();
                  }
                });
              }

              // Interpolate sub-order count
              if (ordEl) {
                const ordObj = { val: 0 };
                animate(ordObj, {
                  val: 24821,
                  duration: 2500,
                  ease: MOTION.easing.smooth,
                  delay: 600,
                  onRender: () => {
                    ordEl.innerText = Math.round(ordObj.val).toLocaleString();
                  }
                });
              }

              // Scale SVG chart bars
              if (chartBars) {
                const bars = chartBars.querySelectorAll('rect');
                animate(bars, {
                  scaleY: [0, 1],
                  duration: MOTION.duration.slow,
                  ease: MOTION.easing.smooth,
                  delay: (_el?: any, i?: number) => 800 + (i || 0) * 120
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
              Step 6: operational metrics & analytics
            </span>
            <h2 
              className={`scene-text text-4xl sm:text-6xl font-black text-foreground leading-[1.1] font-display transition-opacity duration-200 ${
                mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
              }`}
            >
              COMMAND & <br />
              ANALYZE <br />
              <span className="text-primary font-display">IMPACT.</span>
            </h2>
            <p 
              className={`scene-text text-sm sm:text-base text-muted-text leading-relaxed font-medium transition-opacity duration-200 ${
                mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
              }`}
            >
              Command center analytics aggregates operational data. Live reports trace waste reductions, transit efficiency, and co2 savings in real-time.
            </p>
          </div>

          {/* Grid stats and charts */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Total Operations managed big stat */}
            <div 
              className={`analytics-grid-item p-6 bg-surface border border-border rounded-lg shadow-sm text-center transition-all duration-300 ${
                mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <span ref={totalOpsRef} className="text-5xl sm:text-6xl font-black text-foreground font-mono tracking-tight">24,821</span>
              <p className="text-[10px] uppercase font-bold text-muted mt-2 tracking-widest">Total Rescue Operations Managed</p>
            </div>

            {/* Metrics cards and charts container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Staggered Metric Cards */}
              <div className="space-y-4">
                {/* Orders Card */}
                <div className={`analytics-grid-item p-4 bg-surface border border-border rounded-lg shadow-sm flex justify-between items-center transition-all duration-300 ${mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'}`}>
                  <div>
                    <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">Total Orders</span>
                    <span ref={orderCountRef} className="text-lg font-bold text-foreground font-mono">24,821</span>
                  </div>
                  <span className="text-xl">📋</span>
                </div>

                {/* Waste reduction card */}
                <div className={`analytics-grid-item p-4 bg-surface border border-border rounded-lg shadow-sm flex justify-between items-center transition-all duration-300 ${mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'}`}>
                  <div>
                    <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">Waste Reduction</span>
                    <span className="text-lg font-bold text-success font-mono">-18%</span>
                  </div>
                  <span className="text-xl">♻️</span>
                </div>

                {/* Delivery efficiency card */}
                <div className={`analytics-grid-item p-4 bg-surface border border-border rounded-lg shadow-sm flex justify-between items-center transition-all duration-300 ${mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'}`}>
                  <div>
                    <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">Delivery Times</span>
                    <span className="text-lg font-bold text-success font-mono">-23%</span>
                  </div>
                  <span className="text-xl">🚚</span>
                </div>
              </div>

              {/* SVG bar chart */}
              <div 
                className={`analytics-grid-item bg-surface border border-border p-5 rounded-lg shadow-sm flex flex-col justify-between min-h-[220px] transition-all duration-300 ${
                  mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted tracking-widest mb-4">
                  <span>RECOVERY LOGS</span>
                  <span className="text-primary font-bold">LIVE STATS</span>
                </div>

                {/* SVG Chart */}
                <div className="h-32 w-full relative flex items-end">
                  <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
                    <g ref={chartBarsRef}>
                      {/* Bar 1 */}
                      <rect x="20" y="20" width="20" height="80" rx="2" fill="var(--color-primary, #10b981)" style={{ transformOrigin: 'bottom', transform: 'scaleY(0)' }} />
                      <text x="30" y="95" fontSize="8" fill="white" fontWeight="bold" textAnchor="middle">Q1</text>

                      {/* Bar 2 */}
                      <rect x="65" y="40" width="20" height="60" rx="2" fill="var(--color-primary, #10b981)" style={{ transformOrigin: 'bottom', transform: 'scaleY(0)' }} />
                      <text x="75" y="95" fontSize="8" fill="white" fontWeight="bold" textAnchor="middle">Q2</text>

                      {/* Bar 3 */}
                      <rect x="110" y="10" width="20" height="90" rx="2" fill="var(--color-primary, #10b981)" style={{ transformOrigin: 'bottom', transform: 'scaleY(0)' }} />
                      <text x="120" y="95" fontSize="8" fill="white" fontWeight="bold" textAnchor="middle">Q3</text>

                      {/* Bar 4 */}
                      <rect x="155" y="5" width="20" height="95" rx="2" fill="var(--color-primary, #10b981)" style={{ transformOrigin: 'bottom', transform: 'scaleY(0)' }} />
                      <text x="165" y="95" fontSize="8" fill="white" fontWeight="bold" textAnchor="middle">Q4</text>
                    </g>
                    {/* Baseline */}
                    <line x1="0" y1="100" x2="200" y2="100" stroke="var(--color-border, #e4e4e7)" strokeWidth="1" />
                  </svg>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
