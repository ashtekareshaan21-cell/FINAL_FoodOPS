'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';

export default function HeroSection() {
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

  const itemVariants = {
    hidden: { opacity: 0, y: yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  };

  return (
    <section className="relative overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-28">
      {/* Ambient Climate-Tech Background Decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 opacity-30 pointer-events-none -z-10">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-emerald-500/10 to-teal-400/5 blur-[120px]" />
        <div className="absolute -top-30 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-emerald-600/10 to-teal-500/5 blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center space-y-6 max-w-4xl mx-auto"
        >
          <motion.span 
            variants={itemVariants}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/5 border border-primary/10"
          >
            🌿 Intelligent Circular Food Rescue Operations
          </motion.span>
          
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-foreground leading-[1.1] font-display"
          >
            Turn Surplus <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-650 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
              Into Impact.
            </span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-muted-text leading-relaxed font-medium"
          >
            FoodOps coordinates time-critical food rescue from surplus generation to redistribution and responsible recovery.
          </motion.p>
          
          <motion.div 
            variants={itemVariants}
            className="pt-6 flex flex-col sm:flex-row justify-center items-center gap-3"
          >
            <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.01 }} whileTap={shouldReduceMotion ? {} : { scale: 0.99 }} className="w-full sm:w-auto">
              <Link
                href="/register"
                className="btn-primary w-full sm:w-auto px-8 py-3.5 shadow-lg shadow-primary/10 block"
              >
                Get Started
              </Link>
            </motion.div>
            <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.01 }} whileTap={shouldReduceMotion ? {} : { scale: 0.99 }} className="w-full sm:w-auto">
              <a
                href="#how-it-works"
                className="btn-secondary w-full sm:w-auto px-8 py-3.5 block"
              >
                Explore How It Works
              </a>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
