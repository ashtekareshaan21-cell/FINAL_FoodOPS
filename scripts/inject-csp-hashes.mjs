import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const NEXT_APP_DIR = path.join(ROOT, '.next', 'server', 'app');
const ROUTES_MANIFEST = path.join(ROOT, '.next', 'routes-manifest.json');

function collectHtmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

function sha256Base64(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('base64');
}

function main() {
  if (!fs.existsSync(ROUTES_MANIFEST)) {
    console.warn('[inject-csp-hashes] .next/routes-manifest.json not found; skipping.');
    return;
  }

  const htmlFiles = collectHtmlFiles(NEXT_APP_DIR);
  const scriptHashes = new Set();
  const inlineScriptRegex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    let match;
    inlineScriptRegex.lastIndex = 0;
    while ((match = inlineScriptRegex.exec(html)) !== null) {
      const content = match[1];
      if (content && content.trim().length > 0) {
        scriptHashes.add(`'sha256-${sha256Base64(content)}'`);
      }
    }
  }

  if (scriptHashes.size === 0) {
    console.log('[inject-csp-hashes] No static inline scripts found.');
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(ROUTES_MANIFEST, 'utf8'));
  const hashList = Array.from(scriptHashes).sort().join(' ');
  let updatedCount = 0;

  if (Array.isArray(manifest.headers)) {
    for (const rule of manifest.headers) {
      if (!Array.isArray(rule.headers)) continue;
      for (const hdr of rule.headers) {
        if (hdr.key === 'Content-Security-Policy' && typeof hdr.value === 'string') {
          hdr.value = hdr.value.replace(
            /script-src 'self'[^;]*/,
            `script-src 'self' ${hashList}`
          );
          updatedCount += 1;
        }
      }
    }
  }

  fs.writeFileSync(ROUTES_MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(
    `[inject-csp-hashes] Scanned ${htmlFiles.length} static HTML files; injected ${scriptHashes.size} script hash(es) into ${updatedCount} CSP header rule(s).`
  );
}

main();
