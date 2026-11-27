// Serve a dist folder as https://ifyoumind.com (no network to production or Google) and measure
// hero CTA vs consent banner geometry. Usage: node measure.js <distDir> <outDir> [cssFile] [label]
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path'); const os = require('os');
const main = require.main === module;
const [root, outDir, cssFile, label = 'run'] = main ? process.argv.slice(2) : [process.argv[2]];
const css = main && cssFile ? fs.readFileSync(cssFile, 'utf8') : '';
const exe = `${os.homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.jpg': 'image/jpeg', '.png': 'image/png', '.txt': 'text/plain', '.xml': 'application/xml' };
const R = path.resolve(root);
function resolveFile(p) {
  const c = [p, p + '.html', path.join(p, 'index.html')].map(x => path.join(R, x));
  for (const f of c) if (f.startsWith(R) && fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  return path.join(R, p === '/' ? 'index.html' : 'app-shell.html');
}
async function serve(ctx, google) {
  await ctx.route('https://ifyoumind.com/**', async r => { const u = new URL(r.request().url()); const f = resolveFile(decodeURIComponent(u.pathname)); await r.fulfill({ status: 200, contentType: types[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); });
  await ctx.route(/googletagmanager|google-analytics|analytics\.google|doubleclick/, r => { google.push(r.request().url().split('?')[0]); return r.fulfill({ status: 204, body: '' }); });
  await ctx.route(/^https:\/\/(?!ifyoumind\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)/, r => r.abort());
}
const VIEWS = [[1280, 800], [390, 844], [414, 715], [390, 664], [375, 667], [375, 553], [360, 640], [320, 568], [320, 460]];
module.exports = { serve, resolveFile, exe };
if (require.main === module) (async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch({ executablePath: exe });
  const rows = [];
  for (const [w, h] of VIEWS) {
    const mobile = w < 800;
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
    const google = []; await serve(ctx, google);
    const p = await ctx.newPage();
    await p.goto('https://ifyoumind.com/', { waitUntil: 'networkidle' });
    if (css) await p.addStyleTag({ content: css });
    await p.waitForTimeout(400);
    const m = await p.evaluate(() => {
      const q = s => document.querySelector(s); const r = e => e && e.getBoundingClientRect();
      const cta = r(q('.first-action')), ban = r(q('.cookie-consent-banner')), sup = r(q('.hero-entry>p')), h1 = r(q('#hero-title'));
      const btns = [...document.querySelectorAll('.cookie-consent-banner button')].map(e => { const x = e.getBoundingClientRect(); return { t: e.innerText.trim(), w: Math.round(x.width), h: Math.round(x.height), top: Math.round(x.top), bottom: Math.round(x.bottom) }; });
      const link = r(q('.cookie-consent-banner a'));
      return { ctaTop: Math.round(cta.top), ctaBottom: Math.round(cta.bottom), supTop: Math.round(sup.top), h1Top: Math.round(h1.top), bannerTop: ban ? Math.round(ban.top) : null, bannerH: ban ? Math.round(ban.height) : 0, btns, linkBottom: link && Math.round(link.bottom), overflowX: document.documentElement.scrollWidth > innerWidth, H: innerHeight, W: innerWidth };
    });
    m.gap = m.bannerTop == null ? null : m.bannerTop - m.ctaBottom;
    m.ctaFullyVisible = m.ctaBottom <= (m.bannerTop ?? m.H) && m.ctaTop >= 0;
    m.controlsInViewport = m.btns.every(x => x.bottom <= m.H && x.top >= 0);
    m.google = google.length;
    rows.push({ vp: `${w}x${h}`, ...m });
    await p.screenshot({ path: path.join(outDir, `${label}-${w}x${h}.png`) });
    await ctx.close();
  }
  await b.close();
  fs.writeFileSync(path.join(outDir, `${label}.json`), JSON.stringify(rows, null, 1));
  for (const r of rows) console.log(r.vp.padEnd(9), 'cta', r.ctaTop + '-' + r.ctaBottom, 'banner', r.bannerTop, 'h' + r.bannerH, 'gap', r.gap, r.ctaFullyVisible ? 'CTA-OK' : 'CTA-COVERED', r.controlsInViewport ? 'ctrls-ok' : 'CTRLS-OFF', 'btn', r.btns.map(x => x.w + 'x' + x.h).join(','), r.overflowX ? 'OVERFLOW' : '', 'google', r.google);
})();
