import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = process.cwd();
const NEXT_DIR = path.join(ROOT, '.next');
const NEXT_APP_DIR = path.join(NEXT_DIR, 'server', 'app');

const BANNED_HTML_PATTERNS = [
  { label: 'Fake metric 24,821', regex: /24,821/ },
  { label: 'Fake metric 4829', regex: /4,?829/ },
  { label: 'Bengaluru / Koramangala / MG Road city leak', regex: /\b(Bengaluru|Bangalore|Koramangala|Indiranagar|MG Road|Whitefield)\b/i },
  { label: 'Old casing FoodOps', regex: /\bFoodOps\b/ },
  { label: 'Banned simulation label LIVE MATCH/STATS', regex: /\bLIVE (MATCH|STATS|TELEMETRY)\b/i },
  { label: 'Unapproved savings percentage claims', regex: /(-18%|-23%|\+31%)/ },
];

const BANNED_CHUNK_PATTERNS = [
  { label: 'Fake metric 24,821', regex: /24,821/ },
  { label: 'Fake metric 4829', regex: /4,?829/ },
  { label: 'Bengaluru / Koramangala / MG Road city leak', regex: /\b(Bengaluru|Bangalore|Koramangala|Indiranagar|MG Road|Whitefield)\b/i },
  { label: 'Banned simulation label LIVE MATCH/STATS', regex: /\bLIVE (MATCH|STATS|TELEMETRY)\b/i },
  { label: 'Unapproved savings percentage claims', regex: /(-18%|-23%|\+31%)/ },
];

function walkFiles(dir, extFilter) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, extFilter));
    } else if (entry.isFile() && extFilter(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function checkBuildArtifacts() {
  const failures = [];

  if (!fs.existsSync(NEXT_DIR)) {
    failures.push('.next build output directory is missing. Run build first.');
    return failures;
  }

  // 1. Check sw.js and manifest.json static hygiene
  const swPath = path.join(ROOT, 'public', 'sw.js');
  const swText = fs.readFileSync(swPath, 'utf8');
  if (swText.includes('/globals.css')) {
    failures.push('public/sw.js still references /globals.css (404 asset).');
  }
  if (!swText.includes("'/api/'")) {
    failures.push("public/sw.js must explicitly skip caching '/api/'.");
  }

  const manifestPath = path.join(ROOT, 'public', 'manifest.json');
  const manifestText = fs.readFileSync(manifestPath, 'utf8');
  if (manifestText.includes('/file.svg')) {
    failures.push('public/manifest.json still references placeholder /file.svg.');
  }

  // 2. Check static HTML outputs for banned strings and inline styles
  const htmlFiles = walkFiles(NEXT_APP_DIR, (n) => n.endsWith('.html'));
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const rel = path.relative(ROOT, file);
    for (const { label, regex } of BANNED_HTML_PATTERNS) {
      if (regex.test(html)) {
        failures.push(`Banned content (${label}) found in ${rel}`);
      }
    }
    if (/https:\/\/fonts\.googleapis\.com/i.test(html)) {
      failures.push(`External Google Fonts CSS found in ${rel}`);
    }
    if (/unpkg\.com\/leaflet/i.test(html)) {
      failures.push(`External unpkg Leaflet CSS found in ${rel}`);
    }
  }

  // 3. Check static client JS chunks
  const chunkDir = path.join(NEXT_DIR, 'static', 'chunks');
  const jsFiles = walkFiles(chunkDir, (n) => n.endsWith('.js'));
  for (const file of jsFiles) {
    const js = fs.readFileSync(file, 'utf8');
    const rel = path.relative(ROOT, file);
    for (const { label, regex } of BANNED_CHUNK_PATTERNS) {
      if (regex.test(js)) {
        failures.push(`Banned content (${label}) found in chunk ${rel}`);
      }
    }
  }

  // 4. First-view JS budget on homepage (index.html)
  const indexHtmlPath = path.join(NEXT_APP_DIR, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    failures.push('Expected static .next/server/app/index.html for homepage / (check if / accidentally became dynamic).');
  } else {
    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    const scriptMatches = [...indexHtml.matchAll(/<script[^>]+src="(\/_next\/static\/[^"]+)"/g)];
    let totalRaw = 0;
    let totalGzip = 0;
    const chunkReport = [];
    for (const m of scriptMatches) {
      const srcPath = m[1].replace(/^\/_next\//, '');
      const diskPath = path.join(NEXT_DIR, srcPath);
      if (fs.existsSync(diskPath)) {
        const buf = fs.readFileSync(diskPath);
        const gz = zlib.gzipSync(buf).length;
        totalRaw += buf.length;
        totalGzip += gz;
        chunkReport.push({ file: srcPath, rawKb: buf.length / 1024, gzKb: gz / 1024 });
        if (gz / 1024 > 100) {
          failures.push(`First-view chunk ${srcPath} exceeds 100 KB gzip (${(gz / 1024).toFixed(1)} KB)`);
        }
      }
    }
    console.log(
      `[budget] Homepage first-view JS scripts (${chunkReport.length}): raw=${(totalRaw / 1024).toFixed(1)} KB, gzip=${(totalGzip / 1024).toFixed(1)} KB`
    );
    for (const c of chunkReport) {
      console.log(`  - ${c.file}: raw=${c.rawKb.toFixed(1)} KB, gzip=${c.gzKb.toFixed(1)} KB`);
    }
    if (totalGzip / 1024 > 200) {
      failures.push(`Homepage total first-view JS exceeds 200 KB gzip (${(totalGzip / 1024).toFixed(1)} KB)`);
    }
  }

  return failures;
}

async function checkLiveServer(baseUrl) {
  const failures = [];
  const expectDemo = process.env.EXPECT_DEMO_MODE === 'true';

  const get = async (pathname, opts = {}) => {
    const res = await fetch(`${baseUrl}${pathname}`, {
      redirect: opts.redirect || 'follow',
    });
    const text = await res.text();
    return { res, text };
  };

  // Routes expecting HTTP 200
  const okRoutes = [
    '/',
    '/robots.txt',
    '/sitemap.xml',
    '/api/health',
    '/api/stats',
    '/compliance',
    '/food-safety',
    '/privacy',
    '/terms',
    '/about',
    '/contact',
    '/for-donors',
    '/for-ngos',
    '/for-riders',
    '/login',
    '/register',
    '/register?role=ngo',
    '/opengraph-image',
    '/manifest.json',
    '/sw.js',
    '/favicon.ico',
  ];

  for (const route of okRoutes) {
    const { res, text } = await get(route);
    if (res.status !== 200) {
      failures.push(`Expected HTTP 200 for ${route}, got ${res.status}`);
    }
    if (route === '/') {
      const h = res.headers;
      if (h.get('x-frame-options') !== 'DENY') failures.push('Missing/wrong X-Frame-Options on /');
      if (h.get('x-content-type-options') !== 'nosniff') failures.push('Missing/wrong X-Content-Type-Options on /');
      if (!h.get('referrer-policy')) failures.push('Missing Referrer-Policy on /');
      if (!h.get('permissions-policy')) failures.push('Missing Permissions-Policy on /');
      const csp = h.get('content-security-policy') || '';
      if (!csp || csp.includes('unsafe-inline') || csp.includes('unsafe-eval')) {
        failures.push(`Weak or missing CSP on /: ${csp}`);
      }
      if (h.get('x-powered-by')) {
        failures.push('X-Powered-By header should be suppressed.');
      }
      if (!text.includes('rel="canonical"') || !text.includes('application/ld+json')) {
        failures.push('Homepage missing canonical link or JSON-LD structured data.');
      }
      if ((text.match(/<h1[\s>]/gi) || []).length !== 1) {
        failures.push(`Homepage must have exactly one <h1>; found ${(text.match(/<h1[\s>]/gi) || []).length}`);
      }
    }
    if (route === '/robots.txt') {
      if (!text.includes('Disallow: /api/') || !text.includes('Sitemap:')) {
        failures.push('robots.txt missing expected Disallow: /api/ or Sitemap:');
      }
    }
    if (route === '/sitemap.xml') {
      if (!text.includes('/compliance') || !text.includes('/for-donors')) {
        failures.push('sitemap.xml missing expected public routes.');
      }
    }
    if (route === '/api/health') {
      if (!res.headers.get('cache-control')?.includes('no-store')) {
        failures.push('/api/health must return Cache-Control: no-store');
      }
      const data = JSON.parse(text);
      if (typeof data.dbConnected !== 'boolean' || !data.timestamp) {
        failures.push('/api/health missing required fields.');
      }
    }
    if (route === '/api/stats') {
      if (!res.headers.get('cache-control')?.includes('no-store')) {
        failures.push('/api/stats must return Cache-Control: no-store');
      }
      const stats = JSON.parse(text);
      for (const k of ['rescuesCompleted', 'kgRescued', 'co2eAbatedKg', 'waterPreservedL', 'activeRescues', 'divertedWeightKg', 'asOf']) {
        if (!(k in stats)) failures.push(`/api/stats missing field ${k}`);
      }
    }
    if (route === '/login' && !expectDemo) {
      const demoMatches = text.match(/demo/gi) || [];
      if (demoMatches.length > 0) {
        failures.push(`Production /login must contain zero "demo" matches; found ${demoMatches.length}`);
      }
      if (text.includes('ADMIN_FOODOPS') || text.includes('donor@foodops.org')) {
        failures.push('Production /login contains demo credentials.');
      }
    }
  }

  // SW cached URLs must all return HTTP 200
  const swText = fs.readFileSync(path.join(ROOT, 'public', 'sw.js'), 'utf8');
  const assetsMatch = swText.match(/ASSETS\s*=\s*\[([\s\S]*?)\]/);
  if (assetsMatch) {
    const assetUrls = [...assetsMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    for (const u of assetUrls) {
      const { res } = await get(u);
      if (res.status !== 200) {
        failures.push(`SW pre-cache URL ${u} returned HTTP ${res.status}`);
      }
    }
  }

  // Redirect check: /signup -> 301 /register
  const signupRes = await fetch(`${baseUrl}/signup`, { redirect: 'manual' });
  if (signupRes.status !== 301 || !signupRes.headers.get('location')?.endsWith('/register')) {
    failures.push(`Expected 301 redirect from /signup to /register, got ${signupRes.status} (${signupRes.headers.get('location')})`);
  }

  // Branded 404 check: /nonexistent-check and /donate
  for (const missingPath of ['/nonexistent-check', '/donate']) {
    const { res, text } = await get(missingPath);
    if (res.status !== 404) {
      failures.push(`Expected HTTP 404 for ${missingPath}, got ${res.status}`);
    }
    if (!text.includes('This page does not exist')) {
      failures.push(`Expected branded 404 copy on ${missingPath}`);
    }
  }

  return failures;
}

async function main() {
  const args = process.argv.slice(2);
  const urlFlagIdx = args.indexOf('--url');
  const baseUrl = urlFlagIdx !== -1 ? args[urlFlagIdx + 1]?.replace(/\/+$/, '') : null;

  const failures = [...checkBuildArtifacts()];
  if (baseUrl) {
    console.log(`[live] Verifying endpoints against ${baseUrl}...`);
    failures.push(...(await checkLiveServer(baseUrl)));
  }

  if (failures.length > 0) {
    console.error('\nPre-deploy verification FAILED:');
    for (const f of failures) {
      console.error(`  - ${f}`);
    }
    process.exit(1);
  }

  console.log('\nPre-deploy verification PASSED cleanly.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
