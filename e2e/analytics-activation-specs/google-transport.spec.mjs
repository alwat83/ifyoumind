// Real vendor serialization, replayed OFFLINE. No Google/production response is fetched here.
// The public tag snapshot is supplied from ignored local storage; never ship it with the app.
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { expectAccessible, expectNoHorizontalScroll } from '../support/test.mjs';
const root = path.resolve(process.env.GA4_REPLAY_ROOT || 'dist/ifyoumind-ga4-privacy-repair/browser');
const capture = process.env.GA4_REPLAY_TAG;
if (!capture || !fs.existsSync(capture)) throw Error('GA4_REPLAY_TAG must name a locally captured public Google tag; this gate cannot pass without it');
const tag = fs.readFileSync(capture);
const consentKey = 'ifyoumind_cookie_consent';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json' };
const observations = new Map();
test.afterEach(async ({ page }, info) => {
  const r = observations.get(info.testId);
  if (r) {
    const commands = await page.evaluate(() => Array.from(window.dataLayer || [], a => Array.from(a || [])).filter(a => ['config', 'set', 'event'].includes(a[0]))).catch(() => []);
    await info.attach('sanitized-transport-observation', { body: JSON.stringify({ ...r, commands }), contentType: 'application/json' });
    observations.delete(info.testId);
  }
});
const privateMarkers = /synthetic-private|PrivateFixture|90000|question=|email=|accountId=|projectId=|session_id=|#[^ ]+/;
async function replay(page, context, { storedConsent = false, blockTag = false } = {}) {
  const wire = [], loads = [], blocked = [];
  if (storedConsent) await page.addInitScript(key => localStorage.setItem(key, JSON.stringify({ version: 'ga4-analytics-v1', analytics: true, at: Date.now() })), consentKey);
  await context.route('**/*', async route => {
    const req = route.request(), u = new URL(req.url());
    if (u.hostname === 'ifyoumind.com') {
      // Only these app entries/assets exist in this finite local replay. No backend forwarding.
      const filename = path.resolve(root, ['/', '/pricing', '/privacy-policy'].includes(u.pathname) ? 'index.html' : '.' + u.pathname);
      if (!filename.startsWith(root + '/') || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) { blocked.push({ host: u.hostname, path: u.pathname }); return route.abort(); }
      return route.fulfill({ contentType: types[path.extname(filename)] || 'application/octet-stream', body: fs.readFileSync(filename) });
    }
    if (u.hostname === 'www.googletagmanager.com' && u.pathname === '/gtag/js') {
      loads.push(u.searchParams.get('id'));
      return blockTag ? route.abort() : route.fulfill({ contentType: 'text/javascript', body: tag });
    }
    if ((u.hostname === 'google-analytics.com' || u.hostname.endsWith('.google-analytics.com')) && u.pathname.endsWith('/collect')) {
      const common = new URLSearchParams(u.search);
      for (const line of (req.postData() || '').split('\n')) {
        const params = new URLSearchParams(common);
        for (const [k, v] of new URLSearchParams(line)) params.set(k, v);
        // Never retain provider-assigned client/session identifiers, cookies or headers.
        wire.push({ name: params.get('en'), destination: params.get('tid'), location: params.get('dl'), title: params.get('dt'), referrer: params.get('dr'), keys: [...params.keys()].sort() });
      }
      return route.fulfill({ status: 204 });
    }
    blocked.push({ host: u.hostname, path: u.pathname }); return route.abort();
  });
  const result = { wire, loads, blocked }; observations.set(test.info().testId, result); return result;
}
const views = r => r.wire.filter(x => x.name === 'page_view');
function assertPrivate(r) {
  expect(r.loads.every(id => id === 'G-NRT31062LW')).toBe(true);
  for (const hit of r.wire) {
    expect(hit.destination).toBe('G-NRT31062LW');
    expect(JSON.stringify(hit)).not.toMatch(privateMarkers);
    expect(hit.keys).not.toEqual(expect.arrayContaining(['uid', 'ep.email', 'ep.question', 'epn.value', 'cu', 'ep.transaction_id']));
  }
}
test('vendor initialization cannot use the document URL/title; SPA views stay sanitized and consent can be withdrawn', async ({ page, context }) => {
  const r = await replay(page, context);
  await page.goto('https://ifyoumind.com/privacy-policy?question=synthetic-private&email=synthetic@example.test&amount=90000#synthetic-private');
  await page.getByRole('button', { name: 'Allow analytics', exact: true }).waitFor();
  expect(r.loads).toEqual([]); expect(r.wire).toEqual([]);
  await expectAccessible(page); await expectNoHorizontalScroll(page);
  await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
  await expect.poll(() => views(r).length).toBe(1);
  expect(views(r)[0]).toMatchObject({ location: 'https://ifyoumind.com/privacy-policy', title: 'Privacy policy' });
  await page.locator('app-journey-navigation').getByRole('link', { name: 'ifYouMind home', exact: true }).click();
  await expect.poll(() => views(r).length).toBe(2);
  expect(views(r)[1]).toMatchObject({ location: 'https://ifyoumind.com/', title: 'Explore examples' });
  await page.getByRole('link', { name: 'Pricing', exact: true }).last().click();
  await expect.poll(() => views(r).length).toBe(3);
  expect(views(r)[2]).toMatchObject({ location: 'https://ifyoumind.com/pricing', title: 'Pricing' });
  await page.goBack();
  await expect.poll(() => views(r).length).toBe(4);
  expect(views(r)[3]).toMatchObject({ location: 'https://ifyoumind.com/', title: 'Explore examples' });
  await page.getByRole('link', { name: 'Privacy', exact: true }).click();
  await expect.poll(() => views(r).length).toBe(5);
  expect(views(r)[4]).toMatchObject({ location: 'https://ifyoumind.com/privacy-policy', title: 'Privacy policy' });
  await page.getByRole('button', { name: 'Manage analytics preferences', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reject analytics', exact: true }).click();
  expect(await page.evaluate(() => window['ga-disable-G-NRT31062LW'])).toBe(true);
  const count = r.wire.length; await page.waitForTimeout(1200);
  expect(r.wire).toHaveLength(count); expect(r.loads).toEqual(['G-NRT31062LW']); assertPrivate(r);
});
test('stored grant, example and evidence emit only reviewed events, never raw URL or document values', async ({ page, context }) => {
  const r = await replay(page, context, { storedConsent: true });
  await page.goto('https://ifyoumind.com/?question=synthetic-private&accountId=PrivateFixture&amount=90000');
  await expect.poll(() => views(r).length).toBe(1);
  expect(views(r)[0]).toMatchObject({ location: 'https://ifyoumind.com/', title: 'Explore examples' });
  await page.getByRole('button', { name: /mostly school charges/ }).click();
  await page.getByText('Show the evidence', { exact: true }).click();
  // The tag batches hits for about five seconds after the first queued event. The old Reveal button's smooth
  // scroll used to absorb about a second of this before the next step; the statement check does not scroll.
  await expect.poll(() => r.wire.filter(x => x.name === 'free_tax_example_viewed').length, { timeout: 10000 }).toBe(1);
  await expect.poll(() => r.wire.filter(x => x.name === 'evidence_revealed').length, { timeout: 10000 }).toBe(1);
  await page.getByText('Hide the evidence', { exact: true }).click();
  await page.getByText('Show the evidence', { exact: true }).click();
  await page.waitForTimeout(1200);
  expect(views(r)).toHaveLength(1);
  expect(r.wire.filter(x => x.name === 'evidence_revealed')).toHaveLength(1);
  expect(r.wire.every(x => ['page_view', 'free_tax_example_viewed', 'evidence_revealed'].includes(x.name))).toBe(true);
  assertPrivate(r);
});
test('rejection and provider failure never cause collection or block the finding', async ({ page, context }) => {
  const r = await replay(page, context, { blockTag: true });
  await page.goto('https://ifyoumind.com/?question=synthetic-private');
  await page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
  await page.getByRole('button', { name: /mostly school charges/ }).click();
  await expect(page.locator('#discovery-result')).toContainText('$420');
  expect(r.loads).toEqual([]); expect(r.wire).toEqual([]);
  await page.goto('https://ifyoumind.com/privacy-policy');
  await page.getByRole('button', { name: 'Manage analytics preferences', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Allow optional analytics', { exact: true }).check();
  await page.getByRole('dialog').getByRole('button', { name: 'Save preferences', exact: true }).click();
  await expect.poll(() => r.loads.length).toBe(1);
  await page.locator('app-journey-navigation').getByRole('link', { name: 'ifYouMind home', exact: true }).click();
  await page.getByRole('link', { name: 'Pricing', exact: true }).last().click();
  await expect(page).toHaveURL('https://ifyoumind.com/pricing');
  expect(r.wire).toEqual([]);
});
