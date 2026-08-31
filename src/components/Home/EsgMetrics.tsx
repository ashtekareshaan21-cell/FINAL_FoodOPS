'use client';

import { useEffect, useRef, useState } from 'react';
import { createScope, animate } from 'animejs';
import { MOTION } from '@/animations/config';
import { prefersReducedMotion } from '@/animations/accessibility';
import { AnimatedNumber } from '@/animations/inventory';

interface EsgMetricsProps {
  stats: {
    foodWeightKg: number;
    completedRescues: number;
    co2SavedKg: number;
    waterSavedLiters: number;
    verifiedNgos: number;
    totalNgos: number;
  };
}

export default function EsgMetrics({ stats }: EsgMetricsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);

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
            setInView(true);
            createScope({ root: el }).add(() => {
              const cards = el.querySelectorAll('.esg-card');
              animate(cards, {
                opacity: [0, 1],
                translateY: [15, 0],
                duration: MOTION.duration.medium,
                delay: (_node?: any, i?: number) => (i || 0) * 80,
                ease: MOTION.easing.smooth,
              });
            });
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-surface-muted border-y border-border py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
            ESG Audit Registry
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-foreground font-display">
            Real-Time Rescue Balance Sheet
          </h2>
        </div>
        
        <div 
          ref={containerRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Weight Rescued */}
          <div 
            className={`esg-card p-6 bg-surface rounded-lg border border-border flex flex-col justify-between hover:border-primary/20 hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 shadow-sm ${
              mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Weight Rescued</span>
              <span className="badge-premium bg-success-bg text-success border border-success-border">REAL DATA</span>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground tracking-tight">
                {inView || prefersReducedMotion() ? (
                  <AnimatedNumber value={stats.foodWeightKg || 0} suffix=" kg" />
                ) : (
                  '0 kg'
                )}
              </p>
              <p className="mt-1.5 text-xs text-muted-text leading-normal">Surplus weight collected and safely distributed.</p>
            </div>
          </div>

          {/* Completed Rescues */}
          <div 
            className={`esg-card p-6 bg-surface rounded-lg border border-border flex flex-col justify-between hover:border-primary/20 hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 shadow-sm ${
              mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Completed Rescues</span>
              <span className="badge-premium bg-success-bg text-success border border-success-border">REAL DATA</span>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground tracking-tight">
                {inView || prefersReducedMotion() ? (
                  <AnimatedNumber value={stats.completedRescues || 0} />
                ) : (
                  '0'
                )}
              </p>
              <p className="mt-1.5 text-xs text-muted-text leading-normal">Successful end-to-end driver transit deliveries.</p>
            </div>
          </div>

          {/* CO2 Abated */}
          <div 
            className={`esg-card p-6 bg-surface rounded-lg border border-border flex flex-col justify-between hover:border-primary/20 hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 shadow-sm ${
              mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">CO₂e Abated</span>
              <span className="badge-premium bg-info-bg text-info border border-info-border">ESTIMATED IMPACT</span>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground tracking-tight">
                {inView || prefersReducedMotion() ? (
                  <AnimatedNumber value={Math.round(stats.co2SavedKg || 0)} suffix=" kg" />
                ) : (
                  '0 kg'
                )}
              </p>
              <p className="mt-1.5 text-xs text-muted-text leading-normal">Methane emissions prevented from food decomposition.</p>
            </div>
          </div>

          {/* Water footprint conserved */}
          <div 
            className={`esg-card p-6 bg-surface rounded-lg border border-border flex flex-col justify-between hover:border-primary/20 hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 shadow-sm ${
              mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Water footprint</span>
              <span className="badge-premium bg-info-bg text-info border border-info-border">ESTIMATED IMPACT</span>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground tracking-tight">
                {inView || prefersReducedMotion() ? (
                  <AnimatedNumber value={Math.round(stats.waterSavedLiters || 0)} suffix=" L" />
                ) : (
                  '0 L'
                )}
              </p>
              <p className="mt-1.5 text-xs text-muted-text leading-normal">Virtual agricultural water resources preserved.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
