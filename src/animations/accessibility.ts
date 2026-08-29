import { useEffect, useState } from 'react';

/**
 * React hook to listen to browser reduced-motion preferences.
 */
export function usePrefersReducedMotion(): boolean {
  const [shouldReduce, setShouldReduce] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldReduce(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setShouldReduce(event.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, []);

  return shouldReduce;
}

/**
 * Static check for functions executing in client components.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
