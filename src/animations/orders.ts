import { animate } from 'animejs';
import { MOTION } from './config';
import { prefersReducedMotion } from './accessibility';

/**
 * Animates the width of the horizontal order tracker progress line
 */
export function animateOrderProgressLine(target: any, percentage: number) {
  if (prefersReducedMotion()) {
    const el = typeof target === 'string' ? document.querySelector(target) as HTMLElement : target;
    if (el) el.style.width = `${percentage}%`;
    return null;
  }

  return animate(target, {
    width: `${percentage}%`,
    duration: MOTION.duration.medium,
    ease: MOTION.easing.smooth,
  });
}

/**
 * Adds dynamic pulsing attention animation to status badges or transit buttons
 */
export function animateStatusPulse(target: any) {
  if (prefersReducedMotion()) return null;
  return animate(target, {
    scale: [1, 1.04, 1],
    duration: MOTION.duration.slow,
    loop: true,
    ease: 'inOut(sine)',
  });
}
