import { animate } from 'animejs';
import { MOTION } from './config';
import { prefersReducedMotion } from './accessibility';

/**
 * Slide, fade, and scale-in notifications using a spring-like curve.
 * Animates: opacity: 0 -> 1, x: 30px -> 0, scale: 0.96 -> 1
 */
export function animateNotificationEntrance(target: any) {
  if (prefersReducedMotion()) {
    const el = typeof target === 'string' ? document.querySelector(target) as HTMLElement : target;
    if (el) el.style.opacity = '1';
    return null;
  }

  return animate(target, {
    opacity: [0, 1],
    translateX: [30, 0],
    scale: [0.96, 1.0],
    duration: MOTION.duration.medium,
    ease: MOTION.easing.bounce,
  });
}
