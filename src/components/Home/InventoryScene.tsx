'use client';

import { useEffect, useRef, useState } from 'react';
import { createScope, animate } from 'animejs';
import { MOTION } from '@/animations/config';
import { prefersReducedMotion } from '@/animations/accessibility';

export default function InventoryScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const auditValRef = useRef<HTMLSpanElement>(null);
  const tempValRef = useRef<HTMLSpanElement>(null);
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
              const items = el.querySelectorAll('.verification-item');
              
              const auditVal = auditValRef.current;
              const tempVal = tempValRef.current;

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

              // Safely animate metric counters with explicit initial values
              if (auditVal) {
                let score = 75;
                const scoreTimer = setInterval(() => {
                  score += 1;
                  if (score >= 98) {
                    score = 98;
                    clearInterval(scoreTimer);
                  }
                  if (auditVal) auditVal.innerText = `${score}% MATCH`;
                }, 40);
              }

              if (tempVal) {
                let temp = 85;
                const tempTimer = setInterval(() => {
                  temp -= 1;
                  if (temp <= 64) {
                    temp = 64;
                    clearInterval(tempTimer);
                  }
                  if (tempVal) tempVal.innerText = `${temp}°C FRESH`;
                }, 50);
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
              Step 3: Verification & Safety Clearance
            </span>
            <h2 
              className="scene-text text-4xl sm:text-6xl font-black text-foreground leading-[1.1] font-display transition-opacity duration-200 opacity-100"
            >
              VERIFIED <br />
              SAFETY <br />
              <span className="text-primary font-display">CLEARANCE.</span>
            </h2>
            <p 
              className="scene-text text-sm sm:text-base text-muted-text leading-relaxed font-medium transition-opacity duration-200 opacity-100"
            >
              FoodOps automatically cross-checks organization verification status, FSSAI compliance, and AI safety assessments before opening operational dispatch.
            </p>
          </div>

          {/* Verification Pipeline Graphic */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-surface border border-border p-6 rounded-lg shadow-sm space-y-5">
              
              {/* Item 1: FSSAI License Check */}
              <div className="verification-item space-y-1.5 transition-opacity duration-200 opacity-100">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    FSSAI LICENSE COMPLIANCE
                  </span>
                  <span className="font-mono font-bold text-success bg-success-bg px-2 py-0.5 rounded border border-success-border">VERIFIED</span>
                </div>
                <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Item 2: AI Visual Hygiene Audit */}
              <div className="verification-item space-y-1.5 transition-opacity duration-200 opacity-100">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-foreground">AI VISUAL HYGIENE AUDIT</span>
                  <span ref={auditValRef} className="font-mono font-bold text-foreground">98% MATCH</span>
                </div>
                <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: '98%' }} />
                </div>
              </div>

              {/* Item 3: Temperature & Storage Verification */}
              <div className="verification-item space-y-1.5 transition-opacity duration-200 opacity-100">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-foreground">HOT HOLDING TEMPERATURE</span>
                  <span ref={tempValRef} className="font-mono font-bold text-foreground">64°C FRESH</span>
                </div>
                <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '85%' }} />
                </div>
              </div>

              {/* Verified Clearance Banner */}
              <div className="p-3 bg-success-bg border border-success-border rounded-md text-success text-xs font-semibold flex items-center gap-2">
                <span>✓</span>
                <span>Operational Clearance Granted: Listing passed FSSAI & AI Hygiene inspection.</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
