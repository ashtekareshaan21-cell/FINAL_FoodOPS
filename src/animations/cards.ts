import { animate } from 'animejs';
import { MOTION } from './config';
import { prefersReducedMotion } from './accessibility';

/**
 * Staggers entrance of lists of items / cards
 */
export function staggerCards(targets: any, duration = MOTION.duration.normal) {
  if (prefersReducedMotion()) {
    const els = typeof targets === 'string' ? document.querySelectorAll(targets) : targets;
    if (els && els.forEach) {
      els.forEach((el: any) => {
        if (el.style) el.style.opacity = '1';
      });
    }
    return null;
  }

  return animate(targets, {
    opacity: [0, 1],
    translateY: [12, 0],
    delay: (_el?: any, i?: number) => (i || 0) * MOTION.duration.stagger,
    duration,
    ease: MOTION.easing.smooth,
  });
}

/**
 * Card Hover micro-interaction animation
 */
export function animateCardHover(target: any, enter: boolean) {
  if (prefersReducedMotion()) return null;
  return animate(target, {
    scale: enter ? 1.01 : 1.0,
    translateY: enter ? -2 : 0,
    duration: MOTION.duration.fast,
    ease: MOTION.easing.standard,
  });
}
