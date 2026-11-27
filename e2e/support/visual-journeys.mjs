import { expect, signInThroughUi, test } from './test.mjs';
import { FIXTURES } from './fixtures.mjs';

// Shared navigation/readiness for native functional review and strict Linux pixels.
export function registerVisualJourneys(compare, prefix = '') {
test.use({ colorScheme: 'light', reducedMotion: 'reduce', deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC' });

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(test.info().project.name === 'mobile'
    ? { width: 390, height: 844 }
    : { width: 1280, height: 900 });
});

test(prefix + 'homepage, Discovery and evidence keep the editorial visual identity', async ({ page }) => {
  await page.goto('/');
  const heroAction = page.getByRole('button', { name: /mostly school charges/ });
  await compare(page, 'homepage', heroAction, { fullPage: true });
  await heroAction.click();
  await compare(page, 'homepage-revealed', page.locator('.statement-check:not([hidden]) .check-finding'), { fullPage: true });
  await page.goto('/discover/');
  const tax = page.getByRole('button', { name: 'Try property tax example' });
  await compare(page, 'discovery', tax, { fullPage: true });
  await tax.click();
  await page.locator('.finding summary').first().click();
  await compare(page, 'discovery-evidence', page.getByRole('table').first());
});

test(prefix + 'registration and static recovery keep the public design', async ({ page, consoleErrors }) => {
  await page.goto('/register');
  await compare(page, 'registration', page.getByLabel('Email'), { fullPage: true });
  consoleErrors.allow.push(/status of 404/);
  const response = await page.goto('/missing-visual-fixture');
  expect(response.status()).toBe(404);
  await compare(page, 'not-found', page.getByRole('heading', { name: 'Page not found' }));
});

test(prefix + 'public pricing uses the existing consumer design without private billing', async ({ page }) => {
  await page.goto('/pricing');
  await compare(page, 'public-pricing', page.getByRole('link', { name: 'Try a free example' }), { fullPage: true });
});

test(prefix + 'sample, loading and retry use the report design', async ({ page, consoleErrors }) => {
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

test(prefix + 'workspace, eligible pricing and Account feel connected', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_NO_REPORTS, { runId: `visual-${prefix ? 'readiness-' : ''}${test.info().project.name}` });
  await signInThroughUi(page, user);
  await compare(page, 'dashboard-empty', page.getByText('No saved city decisions yet.', { exact: true }), { fullPage: true });
  await page.route('**/getCommercialStatus', async route => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({ json: { ...body, result: { ...body.result, subscriptionOffers: true } } });
  });
  await page.goto('/pricing');
  await compare(page, 'pricing', page.getByRole('region', { name: 'Monthly subscriptions' }), { fullPage: true });
  await page.goto('/account');
  await compare(page, 'account', page.getByRole('heading', { name: 'Account details' }), { fullPage: true });
});

test(prefix + 'decision question and place share the editorial identity', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_NO_REPORTS, { workspace: false });
  await signInThroughUi(page, user, '/login?returnUrl=%2Fdecide%3Ftype%3Dbusiness');
  const question = page.getByLabel('Your question');
  await expect(question).toHaveValue('Should I open this business here?');
  await compare(page, 'decision-question', question, { fullPage: true });
  await page.getByRole('button', { name: 'Continue' }).click();
  const city = page.getByLabel('City and state');
  await expect(city).toBeVisible();
  await page.getByRole('heading', { name: 'Which city are you looking at?' }).blur();
  await compare(page, 'decision-place', city, { fullPage: true });
});

test(prefix + 'a local tax question shows its evidence limit before an optional example', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_NO_REPORTS, { workspace: false });
  await signInThroughUi(page, user, '/login?returnUrl=%2Fdecide');
  const question = page.getByLabel('Your question');
  await question.fill('What are the property taxes in Birmingham?');
  await question.blur();
  await compare(page, 'decision-local-tax', page.getByRole('heading', { name: /verified property tax rates/ }), { fullPage: true });
});

}
