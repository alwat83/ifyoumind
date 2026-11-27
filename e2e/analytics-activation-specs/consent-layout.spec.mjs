// Short-phone first impression: the hero CTA and every consent choice are visible together, before any choice.
// Serves the reviewed local Hosting output under the production hostname; no production or Google connection.
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { test, expect, expectAccessible, expectNoHorizontalScroll } from '../support/test.mjs';
const root = resolve(process.env.GA4_LAYOUT_ROOT || 'dist/ifyoumind-deploy/browser');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.jpg': 'image/jpeg', '.png': 'image/png' };
const viewports = [[390, 664], [375, 667], [375, 553], [360, 640], [320, 568]];

for (const [width, height] of viewports) {
  test(`${width}x${height}: CTA and equal consent choices are visible before any choice`, async ({ browser }, info) => {
    test.skip(info.project.name !== 'mobile', 'Each case sets its own viewport; run once.');
    const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const tagLoads = [];
    await context.route('https://ifyoumind.com/**', async route => {
      const u = new URL(route.request().url());
      const filename = resolve(root, u.pathname === '/' ? 'index.html' : '.' + u.pathname);
      if (!filename.startsWith(root + '/')) throw Error('Unsafe simulated-origin path');
      await route.fulfill({ status: 200, contentType: types[extname(filename)] || 'application/octet-stream', body: await readFile(filename) });
    });
    await context.route(/googletagmanager|google-analytics/, route => { tagLoads.push(route.request().url()); return route.abort(); });
    await page.goto('https://ifyoumind.com/');
    const cta = page.getByRole('button', { name: 'Reveal what changed' });
    const banner = page.getByRole('region', { name: 'Optional analytics' });
    const allow = banner.getByRole('button', { name: 'Allow analytics', exact: true });
    const reject = banner.getByRole('button', { name: 'Reject analytics', exact: true });
    const manage = banner.getByRole('button', { name: 'Manage', exact: true });
    await expect(cta).toBeVisible(); await expect(banner).toBeVisible();
    const box = async l => (await l.boundingBox());
    const [c, b, a, r, m] = await Promise.all([cta, banner, allow, reject, manage].map(box));
    expect(c.y).toBeGreaterThanOrEqual(0);
    expect(c.y + c.height).toBeLessThanOrEqual(b.y);
    for (const control of [a, r, m]) { expect(control.y).toBeGreaterThanOrEqual(b.y); expect(control.y + control.height).toBeLessThanOrEqual(height); expect(control.height).toBeGreaterThanOrEqual(44); }
    expect(Math.abs(a.width - r.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(a.height - r.height)).toBeLessThanOrEqual(1);
    await expectNoHorizontalScroll(page); await expectAccessible(page);
    // The CTA is usable without making an analytics choice, and using it loads nothing from Google.
    await cta.click({ trial: true }); await cta.click();
    await expect(page.locator('#discovery-result')).toContainText('$420');
    expect(await page.evaluate(() => localStorage.getItem('ifyoumind_cookie_consent'))).toBeNull();
    expect(tagLoads).toEqual([]);
    await context.close();
  });
}
