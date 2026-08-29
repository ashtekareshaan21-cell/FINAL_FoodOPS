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

    if (prefersReducedMotion()) {
      const displayVal = round ? Math.round(value) : value;
      el.innerText = `${prefix}${displayVal.toLocaleString()}${suffix}`;
      prevValueRef.current = value;
      return;
    }

    const startVal = prevValueRef.current;
    const obj = { val: startVal };

    const anim = animate(obj, {
      val: value,
      duration: MOTION.duration.slow,
      ease: MOTION.easing.smooth,
      onRender: () => {
        if (el) {
          const displayVal = round ? Math.round(obj.val) : obj.val;
          el.innerText = `${prefix}${displayVal.toLocaleString()}${suffix}`;
        }
      }
    });

    prevValueRef.current = value;

    return () => {
      anim.revert();
    };
  }, [value, prefix, suffix, round]);

  return <span ref={elementRef} className={className} />;
}
