// Emit route-specific initial metadata after Angular builds. This is head generation, not SSR.
const fs = require('node:fs');
const path = require('node:path');
const pages = require('../src/public-pages.json');
const homeSchema = require('../src/site-structured-data.json');
const SITE = 'https://ifyoumind.com';
const escapeHtml = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function metadataHtml(shell, page) {
  const title = page?.title || 'ifYouMind';
  const description = page?.description || 'Sign in to manage your ifYouMind decisions and reports.';
  const canonical = page ? `${SITE}${page.path}` : null;
  const head = `
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="${page ? 'index,follow' : 'noindex,nofollow'}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ifYouMind">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
${canonical ? `<link rel="canonical" href="${canonical}">\n<meta property="og:url" content="${canonical}">` : ''}
${page?.path === '/' ? `<script id="page-structured-data" type="application/ld+json">${JSON.stringify(homeSchema).replace(/</g, '\\u003c')}</script>` : ''}
`;
  return shell.replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'][^>]*>/gi, '')
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace('</head>', `${head}</head>`);
}

function buildSeo(dir) {
  const shell = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  for (const page of pages) {
    const filename = page.path === '/' ? 'index.html' : `${page.path.slice(1)}.html`;
    fs.writeFileSync(path.join(dir, filename), metadataHtml(shell, page));
  }
  fs.writeFileSync(path.join(dir, 'app-shell.html'), metadataHtml(shell, null));
  fs.writeFileSync(path.join(dir, '404.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Page not found | ifYouMind</title></head><body><main><h1>Page not found</h1><p>This address does not match a public ifYouMind page.</p><p><a href="/">Home</a> · <a href="/guides/">Decision guides</a> · <a href="/sample-report">Business sample report</a></p></main></body></html>\n');
  console.log(`Built initial metadata for ${pages.length} public routes, a private app shell and a 404 page.`);
}

if (require.main === module) buildSeo(process.argv[2] || 'dist/ifyoumind-deploy/browser');
module.exports = { metadataHtml, buildSeo };
