// WCAG 2.2 SC 2.4.11 (Focus Not Obscured, Minimum): with the consent banner pending, keyboard focus on
// registration fields must not be hidden behind it. Serves reviewed local Hosting output under the production
// hostname; no production, Firebase or Google connection.
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';
import { test, expect } from '../support/test.mjs';
const root = resolve(process.env.GA4_LAYOUT_ROOT || 'dist/ifyoumind-deploy/browser');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.jpg': 'image/jpeg', '.png': 'image/png' };
const isFile = f => stat(f).then(s => s.isFile(), () => false);
async function fileFor(pathname) {
  for (const candidate of [pathname, pathname + '.html', join(pathname, 'index.html')]) {
    const f = resolve(root, '.' + candidate);
    if (f.startsWith(root + '/') && await isFile(f)) return f;
  }
  return resolve(root, 'app-shell.html');
}
const viewports = [[1280, 800], [390, 844], [390, 664], [375, 553], [320, 568]];

for (const [width, height] of viewports) {
  test(`${width}x${height}: focused registration fields stay clear of the pending consent banner`, async ({ browser }, info) => {
    test.skip(info.project.name !== 'mobile', 'Each case sets its own viewport; run once.');
    const mobile = width < 800;
    const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
    const tagLoads = [];
    await context.route('**/*', async route => {
      const u = new URL(route.request().url());
      if (u.hostname === 'ifyoumind.com') { const f = await fileFor(decodeURIComponent(u.pathname)); return route.fulfill({ status: 200, contentType: types[extname(f)] || 'application/octet-stream', body: await readFile(f) }); }
      if (/googletagmanager|google-analytics/.test(u.hostname)) tagLoads.push(u.href);
      if (/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return route.continue();
      return route.abort();
    });
    const page = await context.newPage();
    await page.goto('https://ifyoumind.com/register');
    const banner = page.getByRole('region', { name: 'Optional analytics' });
    await expect(banner).toBeVisible();
    await page.getByLabel('Name', { exact: true }).focus();
    for (const label of ['Email', 'Password']) {
      await page.keyboard.press('Tab');
      const field = page.getByLabel(label, { exact: true });
      await expect(field).toBeFocused();
      await expect.poll(async () => {
        const [f, b] = await Promise.all([field.boundingBox(), banner.boundingBox()]);
        return f.y + f.height <= b.y + 1 && f.y >= 0;
      }, { message: `${label} must be fully visible above the banner` }).toBe(true);
    }
    expect(await page.evaluate(() => localStorage.getItem('ifyoumind_cookie_consent'))).toBeNull();
    expect(tagLoads).toEqual([]);
    await context.close();
  });
}
