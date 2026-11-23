// Tests the actual production hostname branch without contacting that hostname or Google.
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { test, expect, expectAccessible, expectNoHorizontalScroll } from '../support/test.mjs';
const root = resolve('dist/ifyoumind-deploy/browser');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.jpg': 'image/jpeg', '.png': 'image/png' };

test('production-flag path remains consent-gated with sanitized SPA views and private Discovery', async ({ page }) => {
  const tagLoads = [], originReads = [];
  // Every production-origin response is an in-memory fulfillment from reviewed local output.
  // Never use route.continue/fetch here: no production/Google/provider connection is permitted.
  await page.route('https://ifyoumind.com/**', async route => {
    const u = new URL(route.request().url()); originReads.push(u.pathname);
    const routes = { '/': 'index.html', '/pricing': 'app-shell.html', '/privacy-policy': 'privacy-policy.html', '/discover/': 'discover/index.html' };
    const filename = resolve(root, routes[u.pathname] || '.' + u.pathname);
    if (!filename.startsWith(root + '/')) throw Error('Unsafe simulated-origin path');
    const headers = u.pathname.startsWith('/discover/') ? { 'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'; img-src 'self' data:; font-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'none'" } : {};
    await route.fulfill({ status: 200, contentType: types[extname(filename)] || 'application/octet-stream', headers, body: await readFile(filename) });
  });
  await page.route('https://www.googletagmanager.com/**', async route => {
    tagLoads.push(route.request().url());
    await route.fulfill({ contentType: 'text/javascript', body: "window.__gaCalls=Array.from(window.dataLayer||[],a=>Array.from(a));const push=window.dataLayer.push.bind(window.dataLayer);window.dataLayer.push=a=>{window.__gaCalls.push(Array.from(a));return push(a);};" });
  });
  const views = () => page.evaluate(() => (window.__gaCalls || []).filter(a => a[0] === 'event' && a[1] === 'page_view'));
  await page.goto('https://ifyoumind.com/?question=private-synthetic&amount=90000&utm_source=instagram');
  await expect(page.getByRole('button', { name: 'Reveal what changed' })).toBeVisible();
  expect(await page.evaluate(() => typeof window.__IFYOUMIND_ANALYTICS_TEST__)).toBe('undefined');
  expect(tagLoads).toEqual([]);
  await expectAccessible(page); await expectNoHorizontalScroll(page);
  await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
  await expect.poll(async () => (await views()).length).toBe(1);
  expect(tagLoads).toEqual(['https://www.googletagmanager.com/gtag/js?id=G-NRT31062LW']);
  expect(JSON.stringify(await page.evaluate(() => window.__gaCalls))).not.toMatch(/private-synthetic|90000|question=|amount=/);
  await page.getByRole('link', { name: 'Pricing', exact: true }).last().click();
  await expect.poll(async () => (await views()).length).toBe(2);
  expect(tagLoads).toHaveLength(1);
  await page.goBack();
  await expect.poll(async () => (await views()).length).toBe(3);
  await page.getByRole('link', { name: 'Privacy', exact: true }).click();
  await page.getByRole('button', { name: 'Manage analytics preferences' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reject analytics', exact: true }).click();
  expect(await page.evaluate(() => window['ga-disable-G-NRT31062LW'])).toBe(true);
  await page.goto('https://ifyoumind.com/discover/?example=tax');
  await expect(page.getByRole('button', { name: 'Clear & choose another', exact: true })).toBeVisible();
  expect(await page.evaluate(() => typeof window.gtag)).toBe('undefined');
  expect(tagLoads).toHaveLength(1);
  expect(originReads).toContain('/discover/');
});
