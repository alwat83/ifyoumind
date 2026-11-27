// Offline diagnosis of GA4 tag batching around consent withdrawal. Real captured public tag, built app served as
// https://ifyoumind.com, every collector request recorded and answered locally (nothing reaches Google).
// Usage: node withdraw-probe.cjs <distDir> <gtag.js> <outJson>
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const exe = process.env.PW_CHROMIUM || undefined; // optional explicit Chromium path
const [root, tagFile, out] = process.argv.slice(2);
const tag = fs.readFileSync(tagFile); const R = path.resolve(root);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };
const file = p => [p, p + '.html', path.join(p, 'index.html')].map(x => path.join(R, x)).find(x => fs.existsSync(x) && fs.statSync(x).isFile()) || path.join(R, p === '/' ? 'index.html' : 'app-shell.html');
const settle = ms => new Promise(r => setTimeout(r, ms));
async function setup(b) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const t0 = Date.now(); const hits = [];
  await ctx.route('**/*', async route => {
    const req = route.request(), u = new URL(req.url());
    if (u.hostname === 'ifyoumind.com') { const f = file(decodeURIComponent(u.pathname)); return route.fulfill({ status: 200, contentType: types[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); }
    if (u.hostname === 'www.googletagmanager.com' && u.pathname === '/gtag/js') return route.fulfill({ contentType: 'text/javascript', body: tag });
    if (/google-analytics\.com|analytics\.google\.com/.test(u.hostname) && u.pathname.includes('/collect')) {
      const lines = (req.postData() || '').split('\n').filter(Boolean);
      for (const l of (lines.length ? lines : [''])) { const e = { ...Object.fromEntries(u.searchParams), ...Object.fromEntries(new URLSearchParams(l)) }; hits.push({ at: Date.now() - t0, en: e.en, dl: e.dl, gcs: e.gcs, cid: e.cid ? 'present' : 'absent' }); }
      return route.fulfill({ status: 204, body: '' });
    }
    if (/fonts\.(googleapis|gstatic)\.com/.test(u.hostname)) return route.continue();
    return route.abort();
  });
  const page = await ctx.newPage();
  return { ctx, page, hits, now: () => Date.now() - t0 };
}
async function consented(page) {
  await page.goto('https://ifyoumind.com/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
  await settle(8000); // let the initial page_view batch flush
}
async function withdrawViaUi(page) {
  // Same path a visitor uses: footer Privacy link is SPA; use the preferences dialog.
  await page.getByRole('link', { name: 'Privacy', exact: true }).last().click();
  await settle(300);
  await page.getByRole('button', { name: 'Manage analytics preferences' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reject analytics', exact: true }).click();
}
(async () => {
  const b = await chromium.launch({ executablePath: exe }); const report = {};
  // E1: batching delay while consented, no withdrawal.
  { const { ctx, page, hits, now } = await setup(b); await consented(page); const n = hits.length;
    const t = now(); await page.getByRole('button', { name: 'Reveal what changed' }).click(); await settle(12000);
    report.E1_batchDelay = { triggeredAt: t, hits: hits.slice(n) }; await ctx.close(); }
  // E2: event queued, withdraw within window, stay on visible page 20s.
  { const { ctx, page, hits, now } = await setup(b); await consented(page); const n = hits.length;
    const t = now(); await page.getByRole('button', { name: 'Reveal what changed' }).click(); await settle(200);
    await withdrawViaUi(page); const tw = now(); await settle(20000);
    report.E2_withdrawStay = { triggeredAt: t, withdrawnAt: tw, disabled: await page.evaluate(() => window['ga-disable-G-NRT31062LW']), hits: hits.slice(n) }; await ctx.close(); }
  // E3: event queued, withdraw within window, then navigate away (full document unload).
  { const { ctx, page, hits, now } = await setup(b); await consented(page); const n = hits.length;
    const t = now(); await page.getByRole('button', { name: 'Reveal what changed' }).click(); await settle(200);
    await withdrawViaUi(page); const tw = now(); await settle(300);
    await page.goto('https://ifyoumind.com/pricing', { waitUntil: 'networkidle' }); await settle(5000);
    report.E3_withdrawUnload = { triggeredAt: t, withdrawnAt: tw, hits: hits.slice(n) }; await ctx.close(); }
  // E4: event queued, withdraw, then tab hidden (visibilitychange), page stays loaded.
  { const { ctx, page, hits, now } = await setup(b); await consented(page); const n = hits.length;
    const t = now(); await page.getByRole('button', { name: 'Reveal what changed' }).click(); await settle(200);
    await withdrawViaUi(page); const tw = now(); await settle(300);
    const p2 = await ctx.newPage(); await p2.goto('about:blank'); await p2.bringToFront();
    await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('pagehide')); });
    await settle(5000);
    report.E4_withdrawHidden = { triggeredAt: t, withdrawnAt: tw, hits: hits.slice(n) }; await ctx.close(); }
  // E5: candidate discard: additionally signal consent denied to the tag at withdrawal, then unload.
  { const { ctx, page, hits, now } = await setup(b); await consented(page); const n = hits.length;
    const t = now(); await page.getByRole('button', { name: 'Reveal what changed' }).click(); await settle(200);
    await page.evaluate(() => window.gtag && window.gtag('consent', 'update', { analytics_storage: 'denied' }));
    await withdrawViaUi(page); const tw = now(); await settle(300);
    await page.goto('https://ifyoumind.com/pricing', { waitUntil: 'networkidle' }); await settle(5000);
    report.E5_deniedThenUnload = { triggeredAt: t, withdrawnAt: tw, hits: hits.slice(n) }; await ctx.close(); }
  // E6: control: no event in the window, withdraw, unload -> expect nothing.
  { const { ctx, page, hits, now } = await setup(b); await consented(page); const n = hits.length;
    await withdrawViaUi(page); await settle(300); await page.goto('https://ifyoumind.com/pricing', { waitUntil: 'networkidle' }); await settle(5000);
    report.E6_controlNoQueue = { hits: hits.slice(n) }; await ctx.close(); }
  await b.close();
  fs.writeFileSync(out, JSON.stringify(report, null, 1));
  for (const [k, v] of Object.entries(report)) console.log(k, JSON.stringify({ ...v, hits: v.hits.map(h => `${h.at}ms ${h.en} ${h.dl} gcs=${h.gcs} cid=${h.cid}`) }));
})().catch(e => { console.error(e); process.exit(1); });
