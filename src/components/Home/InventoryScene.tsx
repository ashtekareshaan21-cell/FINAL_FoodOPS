'use client';

import { useEffect, useRef, useState } from 'react';
import { createScope, animate } from 'animejs';
import { MOTION } from '@/animations/config';
import { prefersReducedMotion } from '@/animations/accessibility';

export default function InventoryScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tomatoesValRef = useRef<HTMLSpanElement>(null);
  const tomatoesBarRef = useRef<HTMLDivElement>(null);
  const onionsValRef = useRef<HTMLSpanElement>(null);
  const onionsBarRef = useRef<HTMLDivElement>(null);
  
  const alertRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
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
              const items = el.querySelectorAll('.inventory-item');
              
              const tVal = tomatoesValRef.current;
              const tBar = tomatoesBarRef.current;
              const oVal = onionsValRef.current;
              const oBar = onionsBarRef.current;
              const alertBox = alertRef.current;
              const actionBox = actionRef.current;

              // Animate text slide-in
              animate(textItems, {
                opacity: [0, 1],
                translateY: [20, 0],
                duration: MOTION.duration.medium,
                ease: MOTION.easing.smooth,
                delay: (_el?: any, i?: number) => (i || 0) * 100
              });

              // Stagger items loading in
              animate(items, {
                opacity: [0, 1],
                translateX: [-15, 0],
                duration: MOTION.duration.medium,
                ease: MOTION.easing.smooth,
                delay: (_el?: any, i?: number) => 300 + (i || 0) * 80
              });

              // Animate stock depletion:
              if (tVal && tBar && oVal && oBar && alertBox && actionBox) {
                // Set initial bar width
                tBar.style.width = '82%';
                oBar.style.width = '64%';

                // Deplete Tomatoes: 82kg -> 8kg
                const tObj = { val: 82 };
                animate(tBar, {
                  width: '8%',
                  duration: 2500,
                  ease: 'inOut(quad)',
                  delay: 1000
                });
                animate(tObj, {
                  val: 8,
                  duration: 2500,
                  ease: 'inOut(quad)',
                  delay: 1000,
                  onRender: () => {
                    tVal.innerText = `${Math.round(tObj.val)} KG`;
                  }
                });

                // Deplete Onions: 64kg -> 21kg
                const oObj = { val: 64 };
                animate(oBar, {
                  width: '21%',
                  duration: 2500,
                  ease: 'inOut(quad)',
                  delay: 1000
                });
                animate(oObj, {
                  val: 21,
                  duration: 2500,
                  ease: 'inOut(quad)',
                  delay: 1000,
                  onRender: () => {
                    oVal.innerText = `${Math.round(oObj.val)} KG`;
                  }
                });

                // Trigger Alert when Tomatoes go low (around 2.5s later)
                animate(alertBox, {
                  opacity: [0, 1],
                  scale: [0.95, 1],
                  duration: MOTION.duration.normal,
                  ease: MOTION.easing.bounce,
                  delay: 3200
                });

                // Trigger Auto Reorder Action banner (around 4s later)
                animate(actionBox, {
                  opacity: [0, 1],
                  translateY: [15, 0],
                  duration: MOTION.duration.medium,
                  ease: 'spring(1, 80, 12, 0)',
                  delay: 4200
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
      className="relative py-32 border-t border-border bg-surface-muted/30 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Narrative Text */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="scene-text text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 border border-primary/10 px-3 py-1 rounded-full w-fit block">
              Step 3: consumption detection
            </span>
            <h2 
              className={`scene-text text-4xl sm:text-6xl font-black text-foreground leading-[1.1] font-display transition-opacity duration-200 ${
                mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
              }`}
            >
              KNOW WHAT&apos;S <br />
              RUNNING <br />
              <span className="text-primary font-display">LOW.</span>
            </h2>
            <p 
              className={`scene-text text-sm sm:text-base text-muted-text leading-relaxed font-medium transition-opacity duration-200 ${
                mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
              }`}
            >
              FoodOps monitors inventory levels continuously. If consumption thresholds drop, the platform flags warning states and initiates supply actions.
            </p>
          </div>

          {/* Depletion Tracker Graphic */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-surface border border-border p-6 rounded-lg shadow-sm space-y-5">
              
              {/* Item: Tomatoes */}
              <div 
                className={`inventory-item space-y-1.5 transition-opacity duration-200 ${
                  mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-foreground">TOMATOES</span>
                  <span ref={tomatoesValRef} className="font-mono font-bold text-foreground">82 KG</span>
                </div>
                <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                  <div 
                    ref={tomatoesBarRef}
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: '82%' }}
                  />
                </div>
              </div>

              {/* Item: Onions */}
              <div 
                className={`inventory-item space-y-1.5 transition-opacity duration-200 ${
                  mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-foreground">ONIONS</span>
                  <span ref={onionsValRef} className="font-mono font-bold text-foreground">64 KG</span>
                </div>
                <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                  <div 
                    ref={onionsBarRef}
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: '64%' }}
                  />
                </div>
              </div>

              {/* Item: Bread */}
              <div 
                className={`inventory-item space-y-1.5 transition-opacity duration-200 ${
                  mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-foreground">BREAD</span>
                  <span className="font-mono font-bold text-foreground">71 KG</span>
                </div>
                <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ width: '71%' }}
                  />
                </div>
              </div>

              {/* Alert Warning Box */}
              <div 
                ref={alertRef}
                className={`p-3 bg-danger-bg border border-danger-border rounded-md text-danger text-xs font-semibold flex items-center gap-2 ${
                  mounted && !prefersReducedMotion() ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
                style={{ opacity: 0 }}
              >
                <span>⚠️</span>
                <span>Low stock detected on Tomatoes (under 10 KG)!</span>
              </div>

              {/* Automated Reorder Box */}
              <div 
                ref={actionRef}
                className={`p-3 bg-success-bg border border-success-border rounded-md text-success text-xs font-semibold flex items-center gap-2 ${
                  mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
                }`}
                style={{ opacity: 0 }}
              >
                <span>✓</span>
                <span>Automated Reorder: 50 kg Tomatoes requested from Partner Farm.</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
