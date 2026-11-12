import type { MetadataRoute } from 'next';
import { CANONICAL_SITE_URL, PUBLIC_ROUTES } from '@/lib/siteConfig';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-11-12T00:00:00.000Z');

  return PUBLIC_ROUTES.map((route) => ({
    url: route === '/' ? CANONICAL_SITE_URL : `${CANONICAL_SITE_URL}${route}`,
    lastModified,
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority:
      route === '/'
        ? 1.0
        : route === '/register' ||
            route === '/for-donors' ||
            route === '/for-ngos' ||
            route === '/for-riders'
          ? 0.8
          : 0.6,
  }));
}
