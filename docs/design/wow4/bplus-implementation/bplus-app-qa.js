// B+ app QA: built dist served as https://ifyoumind.com with the real pending consent banner (no stored consent).
// Geometry/hit-testing of every primary control, tap flow, keyboard/focus, reduced motion, axe (serious+critical, WCAG 2.1 AA).
// Usage: node bplus-app-qa.js <distDir> <outDir> <axe.min.js>
const { chromium } = require('playwright'); const fs = require('fs'); const { serve, exe } = require('./measure.js');
const [, outDir, axePath] = process.argv.slice(2); fs.mkdirSync(outDir, { recursive: true });
const VIEWS = [[1280, 800], [390, 844], [414, 715], [390, 664], [375, 667], [375, 553], [360, 640], [320, 568]];
const CONTROLS = '.question-option, .statement';
async function geometry(page) {
  return page.evaluate(sel => {
    const banner = document.querySelector('.cookie-consent-banner'); const top = banner ? banner.getBoundingClientRect().top : innerHeight;
    const els = [...document.querySelectorAll(sel)].map(el => { const r = el.getBoundingClientRect();
      const rad = Math.min(r.height / 2, parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0) + 1; const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + rad, r.top + r.height / 2], [r.right - rad, r.top + r.height / 2], [r.left + r.width / 2, r.top + 2], [r.left + r.width / 2, r.bottom - 2]];
      const hit = pts.every(([x, y]) => { const t = document.elementFromPoint(x, y); return t && (t === el || el.contains(t)); });
      return { name: el.textContent.trim().slice(0, 28), w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom), hit }; });
    return { bannerTop: Math.round(top), bannerH: banner ? Math.round(banner.getBoundingClientRect().height) : 0, els, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  }, CONTROLS);
}
(async () => {
  const b = await chromium.launch({ executablePath: exe }); const report = { geometry: [], tap: [], keyboard: {}, axe: {}, motion: {} };
  for (const [w, h] of VIEWS) { const m = w < 800, vp = `${w}x${h}`;
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: m, hasTouch: m }); const google = []; await serve(ctx, google);
    const p = await ctx.newPage(); await p.goto('https://ifyoumind.com/', { waitUntil: 'load' }); await p.waitForSelector('.cookie-consent-banner'); await p.waitForSelector('.statement'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    const g = await geometry(p); const st = g.els.filter(e => e.name.startsWith('“')), ex = g.els.filter(e => !e.name.startsWith('“'));
    const lowest = Math.max(...st.map(e => e.bottom)), exClear = ex.every(e => e.bottom <= g.bannerTop);
    const row = { vp, bannerTop: g.bannerTop, bannerH: g.bannerH, statementsBottom: lowest, clearance: g.bannerTop - lowest, statementTargets: st.map(e => `${e.w}x${e.h}`), statementsHit: st.every(e => e.hit), exampleTargets: ex.map(e => `${e.w}x${e.h}`), examplesAboveBanner: exClear, examplesHitWhenVisible: ex.filter(e => e.bottom <= g.bannerTop).every(e => e.hit), overflow: g.overflow, google: google.length, controls: g.els };
    report.geometry.push(row); console.log(vp.padEnd(8), 'banner', g.bannerH, 'statements clearance', row.clearance, 'targets', row.statementTargets.join(' '), 'hit', row.statementsHit, '| examples above banner', exClear, ex.map(e => `${e.w}x${e.h}`).join(' '), '| overflow', g.overflow, 'google', google.length);
    await p.screenshot({ path: `${outDir}/bplus-${vp}-pending.png` });
    const first = p.locator('.statement').first(); if (m) await first.tap(); else await first.click(); await p.waitForTimeout(1200);
    const t = await p.evaluate(() => { const top = document.querySelector('.cookie-consent-banner')?.getBoundingClientRect().top ?? innerHeight; const v = document.querySelector('.statement-check:not([hidden]) .verdict').getBoundingClientRect(); const f = document.querySelector('.statement-check:not([hidden]) .check-finding').getBoundingClientRect();
      return { expanded: document.querySelector('.statement').getAttribute('aria-expanded'), verdictVisible: v.top >= 0 && v.bottom <= top, findingVisible: f.top >= 0 && f.bottom <= top, status: document.querySelector('[role=status]').textContent.trim() }; });
    report.tap.push({ vp, ...t }); console.log('   tap', JSON.stringify(t)); await p.screenshot({ path: `${outDir}/bplus-${vp}-after.png` });
    if (vp === '390x664' || vp === '1280x800') { await p.addScriptTag({ path: axePath }); const r = await p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] })).violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, t: v.nodes.map(n => n.target.join(' ')).slice(0, 3) })));
      report.axe[vp] = r; console.log('   axe', JSON.stringify(r)); }
    await ctx.close(); }
  // Keyboard + focus visibility with pending banner at 390x664; then reduced motion.
  for (const [w, h, rm] of [[390, 664, 'no-preference'], [1280, 800, 'reduce']]) { const vp = `${w}x${h}`;
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: rm }); await serve(ctx, []); const p = await ctx.newPage(); await p.goto('https://ifyoumind.com/', { waitUntil: 'load' }); await p.waitForSelector('.statement');
    const stops = []; for (let i = 0; i < 30; i++) { await p.keyboard.press('Tab'); const s = await p.evaluate(() => { const a = document.activeElement, r = a.getBoundingClientRect(), cs = getComputedStyle(a), top = document.querySelector('.cookie-consent-banner')?.getBoundingClientRect().top ?? innerHeight;
        return { cls: a.className.toString().split(' ')[0], name: (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 30), outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2, visible: r.top >= 0 && r.bottom <= top }; }); stops.push(s); if (s.cls === 'statement' && stops.filter(x => x.cls === 'statement').length === 3) break; }
    const ours = stops.filter(s => ['question-option', 'statement'].includes(s.cls));
    await p.keyboard.press('Enter'); await p.waitForTimeout(rm === 'reduce' ? 50 : 900);
    const after = await p.evaluate(() => { const a = document.activeElement; const panel = document.getElementById(a.getAttribute('aria-controls')); return { focusStays: a.classList.contains('statement'), expanded: a.getAttribute('aria-expanded'), panelShown: panel && !panel.hidden, status: document.querySelector('[role=status]').textContent.trim(), anim: getComputedStyle(panel.querySelector('.check-finding')).animationName, opacity: getComputedStyle(panel.querySelector('.check-finding')).opacity }; });
    report.keyboard[vp] = { order: stops.map(s => s.cls + ':' + s.name), ours, after }; console.log('kbd', vp, rm, 'stops to last statement', stops.length, 'ours', ours.map(s => `${s.name}|outline=${s.outline}|vis=${s.visible}`).join(' ; ')); console.log('   enter', JSON.stringify(after));
    await ctx.close(); }
  fs.writeFileSync(`${outDir}/qa.json`, JSON.stringify(report, null, 1)); await b.close();
})().catch(e => { console.error(e); process.exit(1); });
