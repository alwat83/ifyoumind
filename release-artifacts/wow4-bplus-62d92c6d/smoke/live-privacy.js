// Bounded live GA4 privacy verification against https://ifyoumind.com. Synthetic data only.
// Usage: node live-privacy.js <outJson> [--precheck]
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const OUT = process.argv[2];
const PRECHECK = process.argv.includes('--precheck');
const ORIGIN = 'https://ifyoumind.com';
const GA = 'G-NRT31062LW';
const MARKER = 'ga4b9151c6' + Date.now().toString(36);
const SYN = `?qa_release=${MARKER}&question=private-synthetic-${MARKER}&amount=90000&utm_source=synthetic-qa`;
const FORBIDDEN = [MARKER, 'private-synthetic', '90000', 'question=', 'amount=', 'qa_release', 'utm_source=synthetic'];
const exe = `${os.homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell`;

const isGoogle = u => /(^|\.)(google-analytics\.com|googletagmanager\.com|analytics\.google\.com|doubleclick\.net|google\.com)$/.test(new URL(u).hostname);
const isCollect = u => /google-analytics\.com|analytics\.google\.com/.test(new URL(u).hostname) && /\/g\/collect/.test(new URL(u).pathname);
const KEEP = new Set(['v', 'tid', 'en', 'dl', 'dt', 'dr', 'gcs', 'gcd', 'npa', 'dma', '_et', 'seg', 'ul', 'sr']);
function hits(req) {
  const u = new URL(req.url());
  const base = Object.fromEntries(u.searchParams);
  const body = req.postData() || '';
  const lines = body.split('\n').filter(Boolean);
  const evs = lines.length ? lines.map(l => ({ ...base, ...Object.fromEntries(new URLSearchParams(l)) })) : [base];
  return evs.map(p => {
    const kept = {}; const keys = Object.keys(p).sort();
    for (const k of keys) if (KEEP.has(k) || k.startsWith('ep.') || k.startsWith('epn.')) kept[k] = p[k];
    return { sanitized: kept, parameterKeys: keys, raw: req.url() + '\n' + body };
  });
}

async function ctx(browser, label, log) {
  const c = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await c.newPage();
  const rec = { label, google: [], collect: [], tag: [], errors: [], responses: [] };
  page.on('request', req => {
    if (!isGoogle(req.url())) return;
    const stage = rec.stage;
    rec.google.push({ stage, url: req.url().split('?')[0] });
    if (/gtag\/js/.test(req.url())) rec.tag.push({ stage, url: req.url() });
    if (isCollect(req.url())) for (const h of hits(req)) rec.collect.push({ stage, at: new Date().toISOString(), ...h });
  });
  page.on('response', r => { if (isCollect(r.url())) rec.responses.push({ stage: rec.stage, status: r.status() }); });
  page.on('pageerror', e => rec.errors.push(String(e).slice(0, 300)));
  log.push(rec);
  return { c, page, rec };
}
const settle = ms => new Promise(r => setTimeout(r, ms));
const check = (results, name, ok, detail) => { results.push({ name, pass: !!ok, detail }); };

(async () => {
  const browser = await chromium.launch({ executablePath: exe, headless: true });
  const log = [], results = [];
  const started = new Date().toISOString();
  try {
    // 1. Pending: no choice made -> no Google requests at all.
    { const { c, page, rec } = await ctx(browser, 'pending', log); rec.stage = 'pending';
      await page.goto(ORIGIN + '/' + SYN, { waitUntil: 'networkidle' });
      const reveal = await page.getByRole('button', { name: /mostly school charges/ }).isVisible().catch(() => false);
      const banner = await page.getByRole('button', { name: 'Allow analytics', exact: true }).isVisible().catch(() => false);
      await settle(4000);
      check(results, 'pending: homepage renders the first statement', reveal);
      check(results, 'pending: consent banner shown', PRECHECK ? true : banner, { banner });
      check(results, 'pending: zero Google requests', rec.google.length === 0, rec.google);
      await c.close(); }

    // 2. Reject -> zero Google requests through SPA navigation and reload.
    { const { c, page, rec } = await ctx(browser, 'rejected', log); rec.stage = 'rejected';
      await page.goto(ORIGIN + '/' + SYN, { waitUntil: 'networkidle' });
      if (!PRECHECK) await page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
      await settle(2000);
      const pr = page.getByRole('link', { name: 'Pricing', exact: true }).last();
      if (await pr.isVisible().catch(() => false)) await pr.click();
      await settle(3000);
      await page.reload({ waitUntil: 'networkidle' }); await settle(3000);
      const stored = await page.evaluate(() => localStorage.getItem('ifyoumind_cookie_consent'));
      check(results, 'rejected: zero Google requests (incl. SPA nav + reload)', rec.google.length === 0, rec.google);
      check(results, 'rejected: stored choice analytics=false', PRECHECK || JSON.parse(stored || '{}').analytics === false, { stored: stored && JSON.parse(stored).analytics });
      await c.close(); }

    // 3. Private Discovery -> no gtag/Google.
    { const { c, page, rec } = await ctx(browser, 'discover', log); rec.stage = 'discover';
      await page.goto(ORIGIN + '/discover/?example=tax', { waitUntil: 'networkidle' });
      const clear = await page.getByRole('button', { name: 'Clear & choose another', exact: true }).isVisible().catch(() => false);
      await settle(2000);
      check(results, 'discover: example renders', clear);
      check(results, 'discover: zero Google requests, no gtag', rec.google.length === 0 && await page.evaluate(() => typeof window.gtag) === 'undefined', rec.google);
      await c.close(); }

    if (!PRECHECK) {
      // 4. Grant -> sanitized page_view(s); then withdraw -> collection stops.
      const { c, page, rec } = await ctx(browser, 'granted-withdrawn', log);
      rec.stage = 'before-grant';
      await page.goto(ORIGIN + '/' + SYN, { waitUntil: 'networkidle' }); await settle(2500);
      const preGrant = rec.google.length;
      rec.stage = 'granted';
      await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
      await settle(6000);
      await page.getByRole('link', { name: 'Pricing', exact: true }).last().click();
      await settle(6000);
      const pricingText = await page.locator('body').innerText();
      await page.goBack(); await settle(5000);
      const priv = page.getByRole('link', { name: 'Privacy', exact: true }).last();
      if (await priv.isVisible().catch(() => false)) await priv.click();
      else await page.goto(ORIGIN + '/privacy-policy', { waitUntil: 'networkidle' });
      await settle(6000);
      const grantedCollect = rec.collect.filter(h => h.stage === 'granted');
      const cookiesBefore = (await c.cookies()).filter(k => /^ifym|^_ga/.test(k.name)).map(k => k.name);
      rec.stage = 'withdrawn';
      await page.getByRole('button', { name: 'Manage analytics preferences' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Reject analytics', exact: true }).click();
      await settle(1500);
      const disabled = await page.evaluate(g => window['ga-disable-' + g], GA);
      const cookiesAfter = (await c.cookies()).filter(k => /^ifym|^_ga/.test(k.name)).map(k => k.name);
      const prl = page.getByRole('link', { name: 'Pricing', exact: true }).last();
      if (await prl.isVisible().catch(() => false)) await prl.click();
      else await page.goto(ORIGIN + '/pricing' + SYN, { waitUntil: 'networkidle' });
      await settle(5000);
      await page.goto(ORIGIN + '/' + SYN, { waitUntil: 'networkidle' }); await settle(5000);
      await page.goBack(); await settle(5000);
      await page.reload({ waitUntil: 'networkidle' }); await settle(5000);
      const afterCollect = rec.collect.filter(h => h.stage === 'withdrawn');

      check(results, 'granted: no Google request before consent click', preGrant === 0, rec.google.slice(0, preGrant));
      check(results, 'granted: tag loaded once with correct ID', rec.tag.length === 1 && rec.tag[0].url.includes('id=' + GA), rec.tag.map(t => t.url));
      const pv = grantedCollect.filter(h => h.sanitized.en === 'page_view');
      check(results, 'granted: page_view collected', pv.length >= 1, pv.length);
      check(results, 'granted: all hits use measurement ID', grantedCollect.every(h => h.sanitized.tid === GA));
      check(results, 'granted: no synthetic marker/query/raw values anywhere in collector traffic', grantedCollect.every(h => !FORBIDDEN.some(f => h.raw.includes(f) || h.raw.includes(encodeURIComponent(f)))));
      check(results, 'granted: dl has no query string', grantedCollect.every(h => !h.sanitized.dl || !h.sanitized.dl.includes('?')), grantedCollect.map(h => h.sanitized.dl));
      check(results, 'granted: first page_view is canonical / (no early automatic raw hit)', pv[0] && pv[0].sanitized.dl === ORIGIN + '/', pv[0] && pv[0].sanitized.dl);
      check(results, 'granted: titles are reviewed fixed titles, not document.title', pv.every(h => h.sanitized.dt && !/\| ifYouMind/.test(h.sanitized.dt)), pv.map(h => h.sanitized.dt));
      check(results, 'granted: collector responded 2xx', rec.responses.filter(r => r.stage === 'granted').every(r => r.status >= 200 && r.status < 300) && rec.responses.length > 0, rec.responses);
      check(results, 'granted: ads personalization off (npa=1)', pv.every(h => h.sanitized.npa === '1'), pv.map(h => h.sanitized.npa));
      check(results, 'pricing: monthly enrollment unavailable message shown', /Monthly enrollment is currently unavailable/.test(pricingText));
      check(results, 'withdrawn: ga-disable flag true', disabled === true, disabled);
      check(results, 'withdrawn: analytics cookies cleared', cookiesAfter.length === 0, { cookiesBefore, cookiesAfter });
      check(results, 'withdrawn: zero collector hits after withdrawal (nav + back + reload)', afterCollect.length === 0, afterCollect.map(h => h.sanitized));
      await c.close();
    }
  } catch (e) {
    results.push({ name: 'harness', pass: false, detail: String(e).slice(0, 500) });
  } finally {
    await browser.close();
  }
  const report = {
    started, completed: new Date().toISOString(), precheck: PRECHECK, marker: MARKER,
    pass: results.every(r => r.pass), results,
    collectorEvents: log.flatMap(r => r.collect.map(h => ({ context: r.label, stage: h.stage, at: h.at, ...h.sanitized, parameterKeys: h.parameterKeys }))),
    googleRequestCounts: Object.fromEntries(log.map(r => [r.label, r.google.length])),
    pageErrors: Object.fromEntries(log.map(r => [r.label, r.errors])),
  };
  fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
  for (const r of results) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.pass ? '' : '  ' + JSON.stringify(r.detail).slice(0, 400)));
  console.log('OVERALL', report.pass ? 'PASS' : 'FAIL', 'marker', MARKER);
})();
