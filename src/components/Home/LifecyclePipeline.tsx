'use client';

import { useState, useEffect, useRef } from 'react';
import { createScope, animate } from 'animejs';
import { MOTION } from '@/animations/config';
import { prefersReducedMotion } from '@/animations/accessibility';

const PIPELINE_STAGES = [
  { label: '01. LIST', icon: '📝', title: 'Donor Lists Surplus', desc: 'Commercial kitchen declares food with AI visual screening.' },
  { label: '02. MATCH', icon: '📍', title: 'Receiver Matched', desc: 'Deterministic radius, category, capacity & urgency scoring.' },
  { label: '03. RESCUE', icon: '🚴', title: 'Pickup & Handover', desc: 'Volunteer rider dispatched with secure 6-digit OTP check.' },
  { label: '04. RECOVER', icon: '♻️', title: 'Organic Recovery', desc: 'Missed SLA listings routed to composting or biogas recovery.' },
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
    }, 3200);
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
                scale: [0.98, 1],
                translateY: [8, 0],
                duration: MOTION.duration.normal,
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
    <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-xs relative overflow-hidden">
        <div className="text-center mb-8">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operational Protocol</span>
          <h3 className="text-xl font-bold text-[#0f2942] mt-1">4-Step Food Rescue & Recovery Process</h3>
        </div>
        
        {/* Connected 4 Steps */}
        <div 
          ref={containerRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center relative z-10"
        >
          {PIPELINE_STAGES.map((step, idx) => {
            const isActive = activeIdx === idx;
            
            return (
              <div 
                key={idx} 
                className={`pipeline-node relative p-5 rounded-lg border transition-all duration-300 ease-out text-left flex flex-col justify-between ${
                  isActive 
                    ? 'border-[#0f2942] bg-slate-50 ring-2 ring-slate-200' 
                    : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                } bg-slate-50/50 border-slate-200 hover:border-slate-300`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{step.icon}</span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider ${
                      isActive ? 'bg-[#0f2942] text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-[#0f2942] mb-1">
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </div>
                
                {/* Connecting Arrow */}
                {idx < 3 && (
                  <div className={`hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 font-mono font-bold z-20 text-sm transition-all duration-300 ${
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
