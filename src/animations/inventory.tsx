'use client';

import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { prefersReducedMotion } from './accessibility';
import { MOTION } from './config';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  round?: boolean;
}

export function AnimatedNumber({
  value,
  className = '',
  prefix = '',
  suffix = '',
  round = true,
}: AnimatedNumberProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef<number>(0);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const safeVal = isNaN(value) ? 0 : value;

    if (prefersReducedMotion()) {
      const displayVal = round ? Math.round(safeVal) : safeVal;
      el.innerText = `${prefix}${displayVal.toLocaleString()}${suffix}`;
      prevValueRef.current = safeVal;
      return;
    }

    const startVal = isNaN(prevValueRef.current) ? 0 : prevValueRef.current;
    const targetVal = safeVal;
    const startTime = performance.now();
    const duration = 1200;

    let rafId: number;

    const updateCounter = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (targetVal - startVal) * easeProgress;
      const safeCurrent = isNaN(current) ? 0 : current;
      const displayVal = round ? Math.round(safeCurrent) : safeCurrent;

      if (el) {
        el.innerText = `${prefix}${displayVal.toLocaleString()}${suffix}`;
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(updateCounter);
      }
    };

    rafId = requestAnimationFrame(updateCounter);
    prevValueRef.current = targetVal;

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [value, prefix, suffix, round]);

  return <span ref={elementRef} className={className} />;
}
