'use client';

import { motion, useReducedMotion } from 'motion/react';

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
      transition: { duration: 0.45, ease: 'easeOut' as const },
    },
  };

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
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Weight Rescued */}
          <motion.div 
            variants={cardVariants}
            whileHover={shouldReduceMotion ? {} : { scale: 1.01, y: -2 }}
            className="p-6 bg-surface rounded-lg border border-border flex flex-col justify-between hover:border-primary/20 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Weight Rescued</span>
              <span className="badge-premium bg-success-bg text-success border border-success-border">REAL DATA</span>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground tracking-tight">
                {(stats.foodWeightKg || 0).toLocaleString()} kg
              </p>
              <p className="mt-1.5 text-xs text-muted-text leading-normal">Surplus weight collected and safely distributed.</p>
            </div>
          </motion.div>

          {/* Completed Rescues */}
          <motion.div 
            variants={cardVariants}
            whileHover={shouldReduceMotion ? {} : { scale: 1.01, y: -2 }}
            className="p-6 bg-surface rounded-lg border border-border flex flex-col justify-between hover:border-primary/20 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Completed Rescues</span>
              <span className="badge-premium bg-success-bg text-success border border-success-border">REAL DATA</span>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground tracking-tight">
                {stats.completedRescues || 0}
              </p>
              <p className="mt-1.5 text-xs text-muted-text leading-normal">Successful end-to-end driver transit deliveries.</p>
            </div>
          </motion.div>

          {/* CO2 Abated */}
          <motion.div 
            variants={cardVariants}
            whileHover={shouldReduceMotion ? {} : { scale: 1.01, y: -2 }}
            className="p-6 bg-surface rounded-lg border border-border flex flex-col justify-between hover:border-primary/20 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">CO₂e Abated</span>
              <span className="badge-premium bg-info-bg text-info border border-info-border">ESTIMATED IMPACT</span>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground tracking-tight">
                {Math.round(stats.co2SavedKg || 0).toLocaleString()} kg
              </p>
              <p className="mt-1.5 text-xs text-muted-text leading-normal">Methane emissions prevented from food decomposition.</p>
            </div>
          </motion.div>

          {/* Water footprint conserved */}
          <motion.div 
            variants={cardVariants}
            whileHover={shouldReduceMotion ? {} : { scale: 1.01, y: -2 }}
            className="p-6 bg-surface rounded-lg border border-border flex flex-col justify-between hover:border-primary/20 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Water footprint</span>
              <span className="badge-premium bg-info-bg text-info border border-info-border">ESTIMATED IMPACT</span>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground tracking-tight">
                {Math.round(stats.waterSavedLiters || 0).toLocaleString()} L
              </p>
              <p className="mt-1.5 text-xs text-muted-text leading-normal">Virtual agricultural water resources preserved.</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
