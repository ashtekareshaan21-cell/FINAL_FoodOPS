export const CANONICAL_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || 'https://www.foodops.live';

export const CANONICAL_HOST = (() => {
  try {
    return new URL(CANONICAL_SITE_URL).host;
  } catch {
    return 'www.foodops.live';
  }
})();

export const DEMO_SITE_URL = process.env.NEXT_PUBLIC_DEMO_URL?.trim() || '';
export const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

const configuredEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'FoodOPServices@gmail.com';
export const HAS_CONFIGURED_CONTACT_EMAIL = configuredEmail.includes('@');
export const CONTACT_EMAIL = HAS_CONFIGURED_CONTACT_EMAIL
  ? configuredEmail
  : 'FoodOPServices@gmail.com';

export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/for-donors',
  '/for-ngos',
  '/for-riders',
  '/about',
  '/contact',
  '/compliance',
  '/food-safety',
  '/privacy',
  '/terms',
] as const;

export const ROUTE_VOCABULARY_NOTES = {
  signUp: '/register',
  signUpAlias: '/signup (301 permanent redirect -> /register)',
  signIn: '/login',
  donateAlias: 'Not created (/donate intentionally returns 404 until a public non-account flow exists)',
} as const;
