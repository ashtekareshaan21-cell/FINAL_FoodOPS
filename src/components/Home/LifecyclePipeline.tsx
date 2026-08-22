'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';

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
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % PIPELINE_STAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const nodeVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4 },
    },
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <div className="bg-surface/50 backdrop-blur-md border border-border rounded-lg p-8 md:p-10 shadow-sm relative overflow-hidden">
        <div className="text-center mb-8">
          <span className="text-[10px] font-bold text-muted-light uppercase tracking-widest">Platform Core Architecture</span>
          <h3 className="text-lg font-bold text-foreground mt-1">End-To-End Operational Routing</h3>
        </div>
        
        {/* Connected Steps */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-center relative z-10"
        >
          {PIPELINE_STAGES.map((step, idx) => {
            const isActive = activeIdx === idx;
            
            return (
              <motion.div 
                key={idx} 
                variants={nodeVariants}
                animate={isActive && !shouldReduceMotion ? { scale: 1.03, y: -2 } : { scale: 1, y: 0 }}
                className={`relative p-4 rounded-lg border transition-colors duration-500 group ${
                  isActive 
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/5' 
                    : 'bg-surface-muted/50 border-border/60 hover:border-primary/30'
                }`}
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>
                <div className={`text-[10px] font-bold tracking-tight transition-colors duration-500 ${
                  isActive ? 'text-primary' : 'text-foreground'
                }`}>
                  {step.label}
                </div>
                <div className="text-[9px] text-muted-text mt-1 leading-normal">
                  {step.desc}
                </div>
                
                {/* Connecting Arrows */}
                {idx < 7 && (
                  <div className={`hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 font-mono font-bold z-20 text-[11px] transition-colors duration-500 ${
                    isActive ? 'text-primary scale-110' : 'text-border'
                  }`}>
                    &rarr;
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
