import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, expectNoHorizontalScroll, signInThroughUi, test } from '../support/test.mjs';
import { FIXTURES } from '../support/fixtures.mjs';

const captureStyle = fileURLToPath(new URL('../support/visual-identity.css', import.meta.url));

test.skip(process.platform !== 'linux', 'Reviewed pixel baselines use the Linux Playwright renderer.');

test.use({ colorScheme: 'light', reducedMotion: 'reduce', deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC' });

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(test.info().project.name === 'mobile'
    ? { width: 390, height: 844 }
    : { width: 1280, height: 900 });
});

async function compare(page, name, ready, options = {}) {
  await expect(ready).toBeVisible();
  await expectNoHorizontalScroll(page);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const info = test.info();
  const filename = `${name}.png`;
  const settings = { animations: 'disabled', caret: 'hide', scale: 'css', stylePath: captureStyle, ...options };
  if (!existsSync(info.snapshotPath(filename, { kind: 'screenshot' }))) {
    // A missing image fails the check. Attach the candidate for human review without
    // treating the screenshot taken by this run as a baseline.
    const path = info.outputPath('baseline-candidates', `${name}-${info.project.name}-${process.platform}.png`);
    await page.screenshot({ ...settings, path, style: readFileSync(captureStyle, 'utf8') });
    await info.attach(`${name}-candidate`, { path, contentType: 'image/png' });
  }
  await expect.soft(page).toHaveScreenshot(filename, { ...settings, maxDiffPixelRatio: 0.002 });
}

test('homepage, Discovery and evidence keep the editorial visual identity', async ({ page }) => {
  await page.goto('/');
  const heroAction = page.getByRole('link', { name: 'Try a Free Example', exact: true });
  await compare(page, 'homepage', heroAction, { fullPage: true });
  await page.goto('/discover/');
  const tax = page.getByRole('button', { name: 'Try property tax example' });
  await compare(page, 'discovery', tax, { fullPage: true });
  await tax.click();
  await page.locator('.finding summary').first().click();
  await compare(page, 'discovery-evidence', page.getByRole('table').first());
  await page.getByRole('button', { name: 'Clear & choose another' }).click();
  await page.getByRole('button', { name: 'Enter property tax numbers' }).click();
  await page.getByLabel('Tax year').fill('2026');
  await page.getByLabel('Annual property tax (USD)').fill('4620');
  await page.getByRole('button', { name: 'Show my result' }).click();
  await compare(page, 'discovery-typed-result', page.getByRole('heading', { name: '$4,620.00 in 2026 property tax.' }), { fullPage: true });
});

test('registration and static recovery keep the public design', async ({ page, consoleErrors }) => {
  await page.goto('/register');
  await compare(page, 'registration', page.getByLabel('Email'), { fullPage: true });
  consoleErrors.allow.push(/status of 404/);
  const response = await page.goto('/missing-visual-fixture');
  expect(response.status()).toBe(404);
  await compare(page, 'not-found', page.getByRole('heading', { name: 'Page not found' }));
});

test('sample, loading and retry use the report design', async ({ page, consoleErrors }) => {
  const sampleEndpoint = '**/getSampleDecisionReport';
  await page.route(sampleEndpoint, async route => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({ json: { result: { ...body.result, createdAt: '2026-11-13T12:00:00Z' } } });
  });
  await page.goto('/sample-report');
  await compare(page, 'report', page.locator('#recommendation'));
  await page.unroute(sampleEndpoint);
  consoleErrors.allow.push(/Public sample report failed|status of 503/);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route(sampleEndpoint, async route => {
    await gate;
    await route.fulfill({ status: 503, json: { error: { status: 'UNAVAILABLE', message: 'Local visual fixture' } } });
  });
  try {
    await page.goto('/sample-report', { waitUntil: 'domcontentloaded' });
    await compare(page, 'report-loading', page.getByText('Loading the sample report…'));
  } finally {
    release();
  }
  await compare(page, 'report-retry', page.getByRole('alert'));
});

test('workspace, eligible pricing and Account feel connected', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_NO_REPORTS, { runId: `visual-${test.info().project.name}` });
  await signInThroughUi(page, user);
  await compare(page, 'dashboard-empty', page.getByText(/Nothing to manage yet/), { fullPage: true });
  await page.route('**/getCommercialStatus', async route => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({ json: { ...body, result: { ...body.result, subscriptionOffers: true } } });
  });
  await page.goto('/app/pricing');
  await compare(page, 'pricing', page.getByRole('region', { name: 'Monthly subscriptions' }), { fullPage: true });
  await page.goto('/app/account');
  await compare(page, 'account', page.getByRole('heading', { name: 'Account details' }), { fullPage: true });
});
