'use client';

import React, { useEffect, useRef } from 'react';
import { createTimeline } from 'animejs';
import { prefersReducedMotion } from './accessibility';
import { MOTION } from './config';

interface SuccessCheckProps {
  message: string;
  className?: string;
}

export function SuccessCheck({ message, className = '' }: SuccessCheckProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const circle = circleRef.current;
    const path = pathRef.current;
    const msg = msgRef.current;

    if (!circle || !path || !msg) return;

    if (prefersReducedMotion()) {
      circle.style.opacity = '1';
      circle.style.strokeDashoffset = '0';
      path.style.opacity = '1';
      path.style.strokeDashoffset = '0';
      msg.style.opacity = '1';
      return;
    }

    const tl = createTimeline({
      defaults: {
        ease: MOTION.easing.smooth,
        duration: MOTION.duration.normal,
      }
    });

    tl.add(circle, {
      strokeDashoffset: [160, 0],
      opacity: [0, 1],
      duration: MOTION.duration.medium,
    })
    .add(path, {
      strokeDashoffset: [40, 0],
      opacity: [0, 1],
      duration: MOTION.duration.normal,
    }, '-=250')
    .add(msg, {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: MOTION.duration.normal,
    }, '-=200');

    return () => {
      tl.revert();
    };
  }, [message]);

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
      <svg className="w-16 h-16 text-success" viewBox="0 0 52 52" fill="none">
        <circle
          ref={circleRef}
          cx="26"
          cy="26"
          r="25"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="160"
          strokeDashoffset="160"
          strokeLinecap="round"
          style={{ opacity: 0 }}
        />
        <path
          ref={pathRef}
          d="M14.1 27.2l7.1 7.2 16.7-16.8"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray="40"
          strokeDashoffset="40"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0 }}
        />
      </svg>
      <div ref={msgRef} className="mt-4 font-bold text-foreground text-sm" style={{ opacity: 0 }}>
        {message}
      </div>
    </div>
  );
}
