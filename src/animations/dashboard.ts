import { createTimeline } from 'animejs';
import { MOTION } from './config';
import { prefersReducedMotion } from './accessibility';

/**
 * Creates staggered entrances for major dashboard grids (Header -> Stat Cards -> Charts -> Recent orders)
 */
export function animateDashboardEntrance({
  header,
  statCards,
  charts,
  recentOrders
}: {
  header: any;
  statCards: any;
  charts: any;
  recentOrders: any;
}) {
  if (prefersReducedMotion()) return null;

  const tl = createTimeline({
    defaults: {
      ease: MOTION.easing.smooth,
      duration: MOTION.duration.normal,
    }
  });

  if (header) {
    tl.add(header, { opacity: [0, 1], translateY: [10, 0] });
  }

  if (statCards) {
    tl.add(statCards, {
      opacity: [0, 1],
      translateY: [12, 0],
      delay: (_el?: any, i?: number) => (i || 0) * MOTION.duration.stagger
    }, '-=200');
  }

  if (charts) {
    tl.add(charts, { opacity: [0, 1], translateY: [12, 0] }, '-=200');
  }

  if (recentOrders) {
    tl.add(recentOrders, { opacity: [0, 1], translateY: [12, 0] }, '-=200');
  }

  return tl;
}
