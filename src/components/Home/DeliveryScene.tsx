'use client';

import { useEffect, useRef, useState } from 'react';
import { createScope, animate } from 'animejs';
import { MOTION } from '@/animations/config';
import { prefersReducedMotion } from '@/animations/accessibility';

export default function DeliveryScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const riderRef = useRef<SVGGElement>(null);
  const etaRef = useRef<HTMLSpanElement>(null);
  
  // Status check marks Refs
  const step1Ref = useRef<HTMLSpanElement>(null);
  const step2Ref = useRef<HTMLSpanElement>(null);
  const step3Ref = useRef<HTMLSpanElement>(null);
  const step4Ref = useRef<HTMLSpanElement>(null);
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    const pathEl = pathRef.current;
    const riderEl = riderRef.current;
    if (!el || !pathEl || !riderEl || prefersReducedMotion()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const scope = createScope({ root: el }).add(() => {
              const textItems = el.querySelectorAll('.scene-text');
              const trackerCard = el.querySelector('.tracker-card');
              
              const s1 = step1Ref.current;
              const s2 = step2Ref.current;
              const s3 = step3Ref.current;
              const s4 = step4Ref.current;
              const etaEl = etaRef.current;

              // Animate text slide-in
              animate(textItems, {
                opacity: [0, 1],
                translateY: [20, 0],
                duration: MOTION.duration.medium,
                ease: MOTION.easing.smooth,
                delay: (_el?: any, i?: number) => (i || 0) * 100
              });

              // Fade in tracker card
              if (trackerCard) {
                animate(trackerCard, {
                  opacity: [0, 1],
                  translateY: [15, 0],
                  duration: MOTION.duration.medium,
                  ease: MOTION.easing.smooth,
                  delay: 300
                });
              }

              // Animate rider along SVG path using native path math
              const totalLength = pathEl.getTotalLength();
              const obj = { progress: 0 };

              const updateRider = (percent: number) => {
                const point = pathEl.getPointAtLength(percent * totalLength);
                const delta = 1;
                const nextPoint = pathEl.getPointAtLength(Math.min(totalLength, percent * totalLength + delta));
                const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);
                
                if (riderEl) {
                  riderEl.style.transform = `translate(${point.x}px, ${point.y}px) rotate(${angle}deg)`;
                }

                // Update checklist steps and ETA based on progress percentage
                if (s1 && s2 && s3 && s4 && etaEl) {
                  if (percent >= 0.1) {
                    s1.innerText = '✓';
                    s1.className = 'w-4 h-4 rounded-full bg-success text-white flex items-center justify-center text-[9px] font-black';
                  } else {
                    s1.innerText = '';
                    s1.className = 'w-4 h-4 rounded-full border border-border flex items-center justify-center';
                  }

                  if (percent >= 0.4) {
                    s2.innerText = '✓';
                    s2.className = 'w-4 h-4 rounded-full bg-success text-white flex items-center justify-center text-[9px] font-black';
                  } else {
                    s2.innerText = '';
                    s2.className = 'w-4 h-4 rounded-full border border-border flex items-center justify-center';
                  }

                  if (percent >= 0.7) {
                    s3.innerText = '✓';
                    s3.className = 'w-4 h-4 rounded-full bg-success text-white flex items-center justify-center text-[9px] font-black';
                  } else {
                    s3.innerText = '';
                    s3.className = 'w-4 h-4 rounded-full border border-border flex items-center justify-center';
                  }

                  if (percent >= 0.98) {
                    s4.innerText = '✓';
                    s4.className = 'w-4 h-4 rounded-full bg-success text-white flex items-center justify-center text-[9px] font-black';
                    etaEl.innerText = 'DELIVERED';
                    etaEl.className = 'text-2xl font-black text-success font-mono';
                  } else {
                    s4.innerText = '';
                    s4.className = 'w-4 h-4 rounded-full border border-border flex items-center justify-center';
                    
                    // Countdown ETA: 12min -> 2min
                    const mins = Math.max(2, Math.round(12 - (percent * 10)));
                    etaEl.innerText = `${mins} MIN`;
                    etaEl.className = 'text-2xl font-black text-foreground font-mono';
                  }
                }
              };

              // Animate progress value
              animate(obj, {
                progress: 1.0,
                duration: 6000,
                ease: 'linear',
                loop: true,
                onRender: () => {
                  updateRider(obj.progress);
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
      ref={containerRef}
      className="relative py-32 border-t border-border bg-surface-muted/30 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Narrative Text */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="scene-text text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 border border-primary/10 px-3 py-1 rounded-full w-fit block">
              Step 5: Last-Mile Delivery routing
            </span>
            <h2 
              className={`scene-text text-4xl sm:text-6xl font-black text-foreground leading-[1.1] font-display transition-opacity duration-200 ${
                mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
              }`}
            >
              REDUCE TRANSIT. <br />
              DELIVER <br />
              <span className="text-primary font-display">IMPACT.</span>
            </h2>
            <p 
              className={`scene-text text-sm sm:text-base text-muted-text leading-relaxed font-medium transition-opacity duration-200 ${
                mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
              }`}
            >
              FoodOps matches local couriers to optimize delivery routes. Real-time SVG path tracking demonstrates secure, high-speed cargo transit.
            </p>
          </div>

          {/* Delivery Tracker Showcase Graphic */}
          <div className="lg:col-span-7 flex justify-center items-center p-4">
            <div 
              className={`tracker-card w-full max-w-lg bg-surface border border-border rounded-lg p-6 shadow-md z-10 transition-all duration-300 ${
                mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {/* Header and ETA Display */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-muted tracking-widest">ACTIVE TRANSIT</h4>
                  <p className="text-xs font-bold text-foreground mt-0.5">Order #1042 Delivery Route</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-muted-light uppercase tracking-wider block">Estimated ETA</span>
                  <span ref={etaRef} className="text-2xl font-black text-foreground font-mono">12 MIN</span>
                </div>
              </div>

              {/* SVG Transit Route Visualizer */}
              <div className="relative h-28 w-full flex items-center justify-center bg-surface-muted rounded border border-border px-4 mb-6">
                <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible">
                  {/* Static route track */}
                  <path
                    d="M 20,50 Q 110,-10 200,50 T 380,50"
                    fill="none"
                    stroke="var(--color-border, #e4e4e7)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Glowing active path */}
                  <path
                    ref={pathRef}
                    d="M 20,50 Q 110,-10 200,50 T 380,50"
                    fill="none"
                    stroke="var(--color-primary, #10b981)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="6 5"
                  />

                  {/* Start Point */}
                  <circle cx="20" cy="50" r="6" fill="var(--color-primary, #10b981)" />
                  <text x="20" y="70" fontSize="8" fontWeight="bold" fill="currentColor" textAnchor="middle">🏨 DONOR</text>

                  {/* End Point */}
                  <circle cx="380" cy="50" r="6" fill="var(--color-primary, #10b981)" />
                  <text x="380" y="70" fontSize="8" fontWeight="bold" fill="currentColor" textAnchor="middle">🌍 NGO</text>

                  {/* Rider Marker */}
                  <g ref={riderRef} style={{ transformOrigin: 'center' }}>
                    <circle cx="0" cy="0" r="10" fill="var(--color-primary, #10b981)" className="shadow-md" />
                    <text x="-5" y="3" fontSize="9" fill="white">🚴</text>
                  </g>
                </svg>
              </div>

              {/* Status checklist */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span ref={step1Ref} className="w-4 h-4 rounded-full border border-border flex items-center justify-center" />
                  <span className="text-muted-text">Preparing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span ref={step2Ref} className="w-4 h-4 rounded-full border border-border flex items-center justify-center" />
                  <span className="text-muted-text">Packed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span ref={step3Ref} className="w-4 h-4 rounded-full border border-border flex items-center justify-center" />
                  <span className="text-muted-text">Transit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span ref={step4Ref} className="w-4 h-4 rounded-full border border-border flex items-center justify-center" />
                  <span className="text-muted-text">Delivered</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
