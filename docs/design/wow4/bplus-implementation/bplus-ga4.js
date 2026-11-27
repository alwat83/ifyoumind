// GA4 semantics for B+ with the real captured public gtag replayed locally; collector hits recorded, never sent.
// Usage: node bplus-ga4.js <distDir> <gtag.js> [live]   (pass "live" to run the same journey on the production build semantics: Reveal button)
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const { resolveFile, exe } = require('./measure.js');
const [, tagFile] = process.argv.slice(2); const tag = fs.readFileSync(tagFile);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
async function setup(b) { const ctx = await b.newContext({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true }); const rec = { google: 0, hits: [] };
  await ctx.route('**/*', async r => { const u = new URL(r.request().url());
    if (u.hostname === 'ifyoumind.com') { const f = resolveFile(decodeURIComponent(u.pathname)); return r.fulfill({ status: 200, contentType: types[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); }
    if (/google|doubleclick/.test(u.hostname)) rec.google++;
    if (u.hostname === 'www.googletagmanager.com' && u.pathname === '/gtag/js') return r.fulfill({ contentType: 'text/javascript', body: tag });
    if (/google-analytics\.com|analytics\.google\.com/.test(u.hostname) && u.pathname.includes('/collect')) { const lines = (r.request().postData() || '').split('\n').filter(Boolean);
      for (const l of (lines.length ? lines : [''])) { const e = { ...Object.fromEntries(u.searchParams), ...Object.fromEntries(new URLSearchParams(l)) }; rec.hits.push({ en: e.en, example: e['ep.example'], dl: e.dl }); } return r.fulfill({ status: 204, body: '' }); }
    return r.abort(); });
  return { ctx, rec, p: await ctx.newPage() }; }
const wait = ms => new Promise(r => setTimeout(r, ms)); const count = (rec, n) => rec.hits.filter(h => h.en === n).length;
(async () => { const b = await chromium.launch({ executablePath: exe }); const out = {};
  for (const choice of ['Allow analytics', 'Reject analytics', null]) { const { ctx, rec, p } = await setup(b); await p.goto('https://ifyoumind.com/?utm_source=instagram&utm_medium=social', { waitUntil: 'load' }); await p.waitForSelector('.statement');
    if (choice) await p.getByRole('button', { name: choice, exact: true }).click();
    await wait(6500); const idle = rec.hits.map(h => h.en);
    const st = p.locator('.statement'); await st.nth(0).tap(); await wait(300); await st.nth(1).tap(); await st.nth(0).tap(); await wait(300);
    await p.locator('.home-evidence summary').click(); await p.locator('.home-evidence summary').click(); await p.locator('.home-evidence summary').click();
    await p.getByRole('button', { name: 'Electricity', exact: true }).click(); await st.nth(0).tap(); await p.getByRole('button', { name: 'Tax bill', exact: true }).click();
    await p.getByRole('button', { name: 'Two cities', exact: true }).click(); await st.nth(2).tap();
    await wait(7000);
    const r = { afterLoadNoInteraction: idle, page_view: count(rec, 'page_view'), free_tax_example_viewed: count(rec, 'free_tax_example_viewed'), free_electricity_example_viewed: count(rec, 'free_electricity_example_viewed'), evidence_revealed: rec.hits.filter(h => h.en === 'evidence_revealed').map(h => h.example), other: [...new Set(rec.hits.map(h => h.en))].filter(n => !['page_view', 'free_tax_example_viewed', 'free_electricity_example_viewed', 'evidence_revealed'].includes(n)), googleRequests: rec.google, utmInDl: rec.hits.some(h => /utm_/.test(h.dl || '')) };
    out[choice || 'pending'] = r; console.log((choice || 'pending (no choice)').padEnd(18), JSON.stringify(r)); await ctx.close(); }
  // Deep link: the old reveal-on-arrival behaviour opens the first statement.
  { const { ctx, p } = await setup(b); await p.goto('https://ifyoumind.com/?example=electricity', { waitUntil: 'load' }); await p.waitForSelector('.statement'); await wait(800);
    const d = await p.evaluate(() => ({ pressed: document.querySelector('.question-option[aria-pressed=true]').textContent.trim(), open: document.querySelector('.statement[aria-expanded=true]')?.textContent.trim(), status: document.querySelector('[role=status]').textContent.trim() })); console.log('deep link', JSON.stringify(d)); out.deepLink = d; await ctx.close(); }
  fs.writeFileSync(process.argv[4] || '/dev/null', JSON.stringify(out, null, 1)); await b.close(); })().catch(e => { console.error(e); process.exit(1); });
