import type { NextConfig } from 'next';
import path from 'node:path';

const BASE_CSP = [
  "default-src 'self'",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
  "style-src 'self'",
  "script-src 'self'",
  "connect-src 'self' https://nominatim.openstreetmap.org https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.supabase.co wss://*.supabase.co",
  "font-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: BASE_CSP },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self)' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  async redirects() {
    return [
      {
        source: '/signup',
        destination: '/register',
        statusCode: 301,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
