'use client';

import { useState, useEffect, useRef } from 'react';
import { createScope, animate } from 'animejs';
import { MOTION } from '@/animations/config';
import { prefersReducedMotion } from '@/animations/accessibility';

const PIPELINE_STAGES = [
  { label: '1. SURPLUS', icon: '🏨', desc: 'Listing declared' },
  { label: '2. AI AUDIT', icon: '🤖', desc: 'Gemini visual scan' },
  { label: '3. NGO MATCH', icon: '📍', desc: 'Radius checks' },
  { label: '4. CLAIM', icon: '🔒', desc: 'Atomic db lock' },
  { label: '5. VOLUNTEER PICKUP', icon: '🚴', desc: 'Rider dispatched' },
  { label: '6. SECURE HANDOVER', icon: '🔑', desc: 'OTP verification' },
  { label: '7. DELIVERY', icon: '🍽️', desc: 'Redistribution' },
  { label: '8. IMPACT', icon: '♻️', desc: 'Carbon registration' },
];

export default function LifecyclePipeline() {
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (prefersReducedMotion()) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % PIPELINE_STAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            createScope({ root: el }).add(() => {
              const nodes = el.querySelectorAll('.pipeline-node');
              animate(nodes, {
                opacity: [0, 1],
                scale: [0.95, 1],
                translateY: [10, 0],
                duration: MOTION.duration.normal,
                delay: (_node?: any, i?: number) => (i || 0) * 60,
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-xs relative overflow-hidden">
        <div className="text-center mb-8">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Platform Core Workflow</span>
          <h3 className="text-xl font-bold text-[#0f2942] mt-1">Operational Lifecycle Pipeline</h3>
        </div>
        
        {/* Connected Steps */}
        <div 
          ref={containerRef}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-center relative z-10"
        >
          {PIPELINE_STAGES.map((step, idx) => {
            const isActive = activeIdx === idx;
            
            return (
              <div 
                key={idx} 
                className={`pipeline-node relative p-3.5 rounded-lg border transition-all duration-300 ease-out group ${
                  isActive 
                    ? 'border-[#0f2942] bg-slate-50 ring-2 ring-slate-200 scale-[1.02]' 
                    : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 scale-100'
                } ${mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'}`}
              >
                <div className="text-xl mb-1.5 group-hover:scale-105 transition-transform duration-200">
                  {step.icon}
                </div>
                <div className={`text-[10px] font-bold tracking-tight transition-colors duration-300 ${
                  isActive ? 'text-[#0f2942]' : 'text-slate-700'
                }`}>
                  {step.label}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                  {step.desc}
                </div>
                
                {/* Connecting Arrows */}
                {idx < 7 && (
                  <div className={`hidden lg:block absolute top-1/2 -right-2.5 -translate-y-1/2 font-mono font-bold z-20 text-[10px] transition-all duration-300 ${
                    isActive ? 'text-[#0f2942]' : 'text-slate-300'
                  }`}>
                    &rarr;
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
