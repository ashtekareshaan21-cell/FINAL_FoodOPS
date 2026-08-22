'use client';

import { motion, useReducedMotion } from 'motion/react';

export default function RoadmapSection() {
  const shouldReduceMotion = useReducedMotion();
  const yOffset = shouldReduceMotion ? 0 : 16;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center mb-16 space-y-3">
        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Network Development Plan</span>
        <h2 className="text-3xl font-extrabold text-foreground font-display">FoodOps is evolving.</h2>
        <p className="max-w-2xl mx-auto text-sm text-muted-text leading-relaxed font-medium">
          We&apos;re continuously improving the rescue network to make every recovery faster, safer and more impactful.
        </p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
      >
        {/* Timeline Line */}
        <div className="hidden md:block absolute top-[44px] left-[15%] right-[15%] h-0.5 bg-border pointer-events-none z-0" />

        {/* LIVE */}
        <motion.div 
          variants={cardVariants}
          whileHover={shouldReduceMotion ? {} : { scale: 1.01, y: -2 }}
          className="bg-surface p-6 rounded-lg border border-border space-y-4 relative z-10 shadow-sm transition-shadow"
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
        </motion.div>

        {/* IN PROGRESS */}
        <motion.div 
          variants={cardVariants}
          whileHover={shouldReduceMotion ? {} : { scale: 1.01, y: -2 }}
          className="bg-surface p-6 rounded-lg border border-border space-y-4 relative z-10 shadow-sm transition-shadow"
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
        </motion.div>

        {/* COMING NEXT */}
        <motion.div 
          variants={cardVariants}
          whileHover={shouldReduceMotion ? {} : { scale: 1.01, y: -2 }}
          className="bg-surface p-6 rounded-lg border border-border space-y-4 relative z-10 shadow-sm transition-shadow"
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
        </motion.div>
      </motion.div>
    </section>
  );
}
