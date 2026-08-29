'use client';

import { useEffect, useRef, useState } from 'react';
import { createScope, animate } from 'animejs';
import { MOTION } from '@/animations/config';
import { prefersReducedMotion } from '@/animations/accessibility';

export default function RoadmapSection() {
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
            const scope = createScope({ root: el }).add(() => {
              const cards = el.querySelectorAll('.roadmap-card');
              animate(cards, {
                opacity: [0, 1],
                translateY: [15, 0],
                duration: MOTION.duration.medium,
                delay: (_node?: any, i?: number) => (i || 0) * 100,
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center mb-16 space-y-3">
        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Network Development Plan</span>
        <h2 className="text-3xl font-extrabold text-foreground font-display">FoodOps is evolving.</h2>
        <p className="max-w-2xl mx-auto text-sm text-muted-text leading-relaxed font-medium">
          We&apos;re continuously improving the rescue network to make every recovery faster, safer and more impactful.
        </p>
      </div>

      <div 
        ref={containerRef}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
      >
        {/* Timeline Line */}
        <div className="hidden md:block absolute top-[44px] left-[15%] right-[15%] h-0.5 bg-border pointer-events-none z-0" />

        {/* LIVE */}
        <div 
          className={`roadmap-card bg-surface p-6 rounded-lg border border-border space-y-4 relative z-10 shadow-sm hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 ${
            mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="badge-premium bg-success-bg text-success border border-success-border uppercase">
              ✓ LIVE
            </span>
            <span className="text-xs font-mono font-bold text-border">●────────●────────●</span>
          </div>
          <h3 className="text-sm font-bold text-foreground">Production Engine Core</h3>
          <ul className="space-y-2 text-xs text-muted-text font-medium">
            <li className="flex items-center gap-2">✓ Smart NGO Matching</li>
            <li className="flex items-center gap-2">✓ Atomic Claiming Guard</li>
            <li className="flex items-center gap-2">✓ Secure OTP Handover</li>
            <li className="flex items-center gap-2">✓ AI Listing Audit</li>
            <li className="flex items-center gap-2">✓ ESG Carbon Footprints</li>
          </ul>
        </div>

        {/* IN PROGRESS */}
        <div 
          className={`roadmap-card bg-surface p-6 rounded-lg border border-border space-y-4 relative z-10 shadow-sm hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 ${
            mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="badge-premium bg-warning-bg text-warning border border-warning-border uppercase">
              ◉ IN PROGRESS
            </span>
            <span className="text-xs font-mono font-bold text-border">●────────◉────────○</span>
          </div>
          <h3 className="text-sm font-bold text-foreground">Operational Expansion</h3>
          <ul className="space-y-2 text-xs text-muted-text font-medium">
            <li className="flex items-center gap-2">◉ Automated Expiry</li>
            <li className="flex items-center gap-2">◉ Unified Registration</li>
            <li className="flex items-center gap-2">◉ Recovery Partner Network</li>
            <li className="text-muted-light flex items-center gap-2">— Composting Logistics</li>
            <li className="text-muted-light flex items-center gap-2">— Biogas Operations</li>
          </ul>
        </div>

        {/* COMING NEXT */}
        <div 
          className={`roadmap-card bg-surface p-6 rounded-lg border border-border space-y-4 relative z-10 shadow-sm hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 ${
            mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="badge-premium bg-surface-muted text-muted border border-border uppercase">
              ○ COMING NEXT
            </span>
            <span className="text-xs font-mono font-bold text-border">○────────○────────○</span>
          </div>
          <h3 className="text-sm font-bold text-foreground">Advanced Analytics</h3>
          <ul className="space-y-2 text-xs text-muted-text font-medium">
            <li className="text-muted-light flex items-center gap-2">○ Predictive Rescue</li>
            <li className="text-muted-light flex items-center gap-2">○ IoT Monitoring</li>
            <li className="text-muted-light flex items-center gap-2">○ Advanced ESG Reporting</li>
            <li className="text-muted-light flex items-center gap-2">○ Multi-country compliance</li>
            <li className="text-muted-light flex items-center gap-2">○ Micro-bounty routing</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
