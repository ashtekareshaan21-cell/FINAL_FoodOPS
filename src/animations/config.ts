// Motion tokens for the FoodOps operational journey animations
export const MOTION = {
  duration: {
    fast: 180,
    normal: 400,
    medium: 600,
    slow: 900,
    stagger: 70,
  },
  easing: {
    bounce: 'spring(1, 80, 10, 0)', // Spring for micro-interactions and notifications
    smooth: 'out(cubic)',           // Standard smooth easing
    springCompact: 'spring(1, 90, 12, 0)',
    standard: 'out(quad)',          // Light transitions
    inOut: 'inOut(quad)',           // Subtle slow-in-slow-out
  }
};
