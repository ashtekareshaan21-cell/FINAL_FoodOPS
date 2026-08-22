'use client';

import { motion, useReducedMotion } from 'motion/react';

interface AdminMetricsProps {
  stats: {
    completedRescues: number;
    foodWeightKg: number;
    waterSavedLiters: number;
    divertedWeightKg: number;
    biogasGeneratedKwh: number;
    co2SavedKg: number;
    verifiedNgos: number;
    totalNgos: number;
  };
}

export default function AdminMetrics({ stats }: AdminMetricsProps) {
  const shouldReduceMotion = useReducedMotion();
  const yOffset = shouldReduceMotion ? 0 : 10;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' as const },
    },
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-12"
    >
      {/* Completed Rescues */}
      <motion.div 
        variants={cardVariants}
        whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
        className="bg-surface p-4 rounded-md border border-border text-center flex flex-col justify-between min-h-[110px] shadow-sm hover:border-primary/20 transition-all cursor-default"
      >
        <p className="text-2xl font-black text-primary tracking-tight">{stats.completedRescues}</p>
        <p className="mt-2 text-[9px] font-bold text-muted uppercase tracking-wider">Completed Rescues</p>
      </motion.div>

      {/* Rescued Food */}
      <motion.div 
        variants={cardVariants}
        whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
        className="bg-surface p-4 rounded-md border border-border text-center flex flex-col justify-between min-h-[110px] shadow-sm hover:border-primary/20 transition-all cursor-default"
      >
        <div>
          <p className="text-2xl font-black text-primary tracking-tight">{stats.foodWeightKg.toFixed(1)} kg</p>
          <p className="text-[10px] text-muted-text font-medium mt-0.5">{Math.round(stats.waterSavedLiters).toLocaleString()} L water</p>
        </div>
        <p className="mt-2 text-[9px] font-bold text-muted uppercase tracking-wider">Rescued Food</p>
      </motion.div>

      {/* Diverted Waste */}
      <motion.div 
        variants={cardVariants}
        whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
        className="bg-surface p-4 rounded-md border border-border text-center flex flex-col justify-between min-h-[110px] shadow-sm hover:border-primary/20 transition-all cursor-default"
      >
        <p className="text-2xl font-black text-warning tracking-tight">{stats.divertedWeightKg.toFixed(1)} kg</p>
        <p className="mt-2 text-[9px] font-bold text-muted uppercase tracking-wider">Diverted wet waste</p>
      </motion.div>

      {/* Biogas Potential */}
      <motion.div 
        variants={cardVariants}
        whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
        className="bg-surface p-4 rounded-md border border-border text-center flex flex-col justify-between min-h-[110px] shadow-sm hover:border-primary/20 transition-all cursor-default"
      >
        <p className="text-2xl font-black text-indigo-500 dark:text-indigo-400 tracking-tight">{stats.biogasGeneratedKwh.toFixed(1)} kWh</p>
        <p className="mt-2 text-[9px] font-bold text-muted uppercase tracking-wider">Biogas Potential</p>
      </motion.div>

      {/* CO2e Prevented */}
      <motion.div 
        variants={cardVariants}
        whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
        className="bg-surface p-4 rounded-md border border-border text-center flex flex-col justify-between min-h-[110px] shadow-sm hover:border-primary/20 transition-all cursor-default"
      >
        <p className="text-2xl font-black text-primary tracking-tight">{Math.round(stats.co2SavedKg).toLocaleString()} kg</p>
        <p className="mt-2 text-[9px] font-bold text-muted uppercase tracking-wider">CO₂e Prevented</p>
      </motion.div>

      {/* Verified NGOs */}
      <motion.div 
        variants={cardVariants}
        whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
        className="bg-surface p-4 rounded-md border border-border text-center flex flex-col justify-between min-h-[110px] shadow-sm hover:border-primary/20 transition-all col-span-2 lg:col-span-1 cursor-default"
      >
        <p className="text-2xl font-black text-foreground tracking-tight">{stats.verifiedNgos} / {stats.totalNgos}</p>
        <p className="mt-2 text-[9px] font-bold text-muted uppercase tracking-wider">Verified NGOs</p>
      </motion.div>
    </motion.div>
  );
}
