import { animate, createTimeline } from 'animejs';
import { MOTION } from './config';
import { prefersReducedMotion } from './accessibility';

/**
 * Animate elements fading and sliding upwards
 */
export function fadeSlideIn(targets: any, duration = MOTION.duration.normal, delay = 0) {
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
    translateY: [15, 0],
    duration,
    delay,
    ease: MOTION.easing.smooth,
  });
}

/**
 * Creates a sequential timeline for landing page layouts
 */
export function playLandingEntranceTimeline({
  logo,
  headline,
  description,
  ctas,
  pipeline,
  metrics,
  cards
}: {
  logo: any;
  headline: any;
  description: any;
  ctas: any;
  pipeline: any;
  metrics: any;
  cards: any;
}) {
  if (prefersReducedMotion()) return null;

  const tl = createTimeline({
    defaults: {
      ease: MOTION.easing.smooth,
      duration: MOTION.duration.medium,
    }
  });

  tl.add(logo, { opacity: [0, 1], translateY: [10, 0] })
    .add(headline, { opacity: [0, 1], translateY: [20, 0] }, '-=300')
    .add(description, { opacity: [0, 1], translateY: [15, 0] }, '-=400')
    .add(ctas, { opacity: [0, 1], translateY: [10, 0] }, '-=400')
    .add(pipeline, { opacity: [0, 1], scale: [0.98, 1] }, '-=300')
    .add(metrics, { opacity: [0, 1], translateY: [20, 0] }, '-=200')
    .add(cards, {
      opacity: [0, 1],
      translateY: [20, 0],
      delay: (_el?: any, i?: number) => (i || 0) * MOTION.duration.stagger
    }, '-=300');

  return tl;
}
