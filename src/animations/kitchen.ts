import { animate } from 'animejs';
import { MOTION } from './config';
import { prefersReducedMotion } from './accessibility';

/**
 * Slide out and remove an item from its current operational queue column
 */
export function slideOutAndRemove(target: any, callback: () => void) {
  if (prefersReducedMotion()) {
    callback();
    return null;
  }

  return animate(target, {
    opacity: 0,
    translateX: -20,
    duration: MOTION.duration.normal,
    ease: MOTION.easing.smooth,
    onComplete: callback
  });
}

/**
 * Slide in an item entering a new queue state (e.g. READY/PREPARING)
 */
export function slideInNewItem(target: any) {
  if (prefersReducedMotion()) return null;
  return animate(target, {
    opacity: [0, 1],
    translateX: [20, 0],
    duration: MOTION.duration.normal,
    ease: MOTION.easing.smooth,
  });
}
