# FoodOPS Operations, Deployment & Team Verification Notes

This document records the post-remediation architecture for `www.foodops.live`, exact code-level guarantees, and the team-held operational items marked `[TEAM TO INSERT]` that cannot be inferred from the Git repository alone.

---

## 1. Environment Variables & Deployment Modes

| Variable | Production (`www.foodops.live`) | Dedicated Demo (`demo.foodops.live`) | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.foodops.live` | `https://demo.foodops.live` | Controls canonical links, `robots.txt`, `sitemap.xml`, `metadataBase`, and Open Graph URLs (`src/lib/siteConfig.ts`). |
| `NEXT_PUBLIC_DEMO_MODE` | *(unset / `false`)* | `true` | When unset or `false`, `/login` omits all demo buttons/copy, `seedDemoAccounts()` does not run automatically, and the homepage hides demo banners. |
| `NEXT_PUBLIC_DEMO_URL` | `[TEAM TO INSERT: dedicated demo URL]` | *(unset)* | Displays the subtle `"Try the demo"` link on `/` when set on production. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `[TEAM TO INSERT: monitored team email]` | *(optional)* | Populates clickable `mailto:` links in the shared footer and `/contact`. |
| `DATABASE_URL` | `[TEAM TO INSERT: Postgres connection string]` | Demo/staging DB URL | `prisma/prepare.js` switches `prisma/schema.prisma` from `sqlite` (local dev) to `postgresql` when `DATABASE_URL` begins with `postgresql://` or `postgres://`. |
| `JWT_SECRET` | Secret (>= 32 chars) | Distinct secret | Required for HMAC session signing (`foodops_session`). |

---

## 2. Canonical Host, Domain & Operations Checklist (`[TEAM TO INSERT]`)

1. **Canonical Domain (`www.foodops.live`)**:
   - Configure Vercel Domains so `foodops.live` issues a permanent redirect to `https://www.foodops.live`.
   - ICANN Domain Validation & Contact Email (F48): `[TEAM TO INSERT: Name.com ICANN validation confirmation date and WHOIS/registrant verification contact]`
   - Manual Domain Renewal Owner (before October 2027 expiry, F49): `[TEAM TO INSERT: Named owner + calendar reminder date]`
2. **Database Hosting & Backups (F48 / Privacy Policy)**:
   - Repository state (`prisma/schema.prisma`, `prisma/prepare.js`): Prisma ORM defaults locally to SQLite (`file:./dev.db`) and switches to `postgresql` in production when Vercel provides `DATABASE_URL`.
   - Production provider proof: `[TEAM TO INSERT: Managed PostgreSQL vendor/project name, primary region, and point-in-time / daily backup retention tier]`
3. **Monitoring & Alerting (`GET /api/health`, F24)**:
   - Endpoint returns HTTP 200 `{ "status": "ok" | "degraded", "timestamp": "...", "dbConnected": true | false }` via `SELECT 1`.
   - Alert destination: `[TEAM TO INSERT: Uptime monitor provider + team email / Slack webhook receiving alerts]`
4. **Google Search Console & Analytics (F50, F51)**:
   - Submit sitemap URL: `https://www.foodops.live/sitemap.xml`
   - Search Console owner: `[TEAM TO INSERT: Verified property owner Google account]`
   - Analytics & Speed Insights: `@vercel/analytics` and `@vercel/speed-insights` are wired in `src/app/layout.tsx`. Ensure both are enabled in Vercel Project Settings.

---

## 3. Public Route Vocabulary (F15, F17, F19, F33)

- **Landing page**: `/` (`force-static`, no SSR database queries; live summary counts load dynamically from `GET /api/stats`).
- **Role onboarding**: `/for-donors`, `/for-ngos`, `/for-riders` -> expectations before single CTA button linking to `/register?role=donor|ngo|rider`.
- **Authentication & signup**: `/register` (canonical registration route), `/signup` (HTTP `301` permanent redirect -> `/register` via `next.config.ts`), `/login` (zero demo content in production mode).
- **No `/donate` route**: `/donate` intentionally returns HTTP `404` (`src/app/not-found.tsx`) until a separate public unauthenticated donation flow exists.
- **Trust & information**: `/about`, `/contact`, `/compliance`, `/food-safety`, `/privacy`, `/terms`.
- **SEO & PWA**: `/robots.txt`, `/sitemap.xml`, `/opengraph-image`, `/manifest.json`, `/sw.js`, `/favicon.ico`, `/apple-touch-icon.png`, `/icons/icon-{192,512,maskable-512}.png`.

---

## 4. Security Headers & CSP Rationale (F42–F47)

Configured globally in `next.config.ts` (`poweredByHeader: false`) and supplemented with per-request nonces on dynamic routes (`/login`, `/register`, `/donor/*`, `/ngo/*`, `/volunteer/*`, `/admin/*`) via `src/proxy.ts`:

- `Content-Security-Policy`:
  - `default-src 'self'`
  - `script-src 'self'` + build-time `'sha256-...'` hashes injected into `.next/routes-manifest.json` by `scripts/inject-csp-hashes.mjs` for static App Router Flight hydration scripts, or per-request `'nonce-...'` on dynamic routes — **zero `'unsafe-inline'`** and **zero `'unsafe-eval'`** in production.
  - `style-src 'self'` (Leaflet CSS is bundled locally in `LeafletLocationPicker.tsx` / `LeafletMapPreview.tsx`; Google Fonts CSS `@import` was removed).
  - `img-src 'self' data: blob: https://*.tile.openstreetmap.org`: Required for OpenStreetMap map tiles in Leaflet pickers/previews and local image previews.
  - `connect-src 'self' https://nominatim.openstreetmap.org https://vitals.vercel-insights.com https://va.vercel-scripts.com`: Required for OSM Nominatim address autocomplete/reverse geocoding and Vercel Analytics/Speed Insights telemetry.
  - `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`.
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(self), microphone=(), geolocation=(self)`

---

## 5. Pre-Deploy Verification Command

Run locally after building and starting `npm run start`:

```bash
npm run build && npm test && npm run lint
node scripts/predeploy-check.mjs --url http://127.0.0.1:3000
```
