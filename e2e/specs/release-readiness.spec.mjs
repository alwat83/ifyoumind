import AxeBuilder from '@axe-core/playwright';
import { test, expect, expectNoHorizontalScroll, signInThroughUi } from '../support/test.mjs';
import { FIXTURES, callable, seedSampleReport } from '../support/fixtures.mjs';

test.beforeAll(seedSampleReport);

async function allWcagChecks(page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map(v => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
}

test('integrated public pages: pricing, report, guides, accessibility and approval screenshots', async ({ page }, testInfo) => {
  for (const [name, path] of [['homepage', '/'], ['sample-report', '/sample-report'], ['guides', '/guides/']]) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    if (path === '/sample-report') {
      await expect(page.locator('#recommendation h2')).toContainText('Austin, TX');
      await expect(page.getByRole('link', { name: 'Business location evidence checklist' })).toHaveAttribute('href', '/guides/choose-business-location-evidence/');
    }
    if (path === '/') {
      await expect(page.locator('#pricing')).toContainText('$79');
      await expect(page.locator('#pricing')).toContainText('$39');
      await expect(page.getByRole('link', { name: 'Decision guides', exact: true })).toHaveAttribute('href', '/guides/');
      await expect(page.locator('a[href*="/life/quick-compare"]')).toHaveCount(0);
    }
    await expectNoHorizontalScroll(page);
    await allWcagChecks(page);
    await page.screenshot({ path: testInfo.outputPath(`${name}-fold.png`), scale: 'css' });
    await page.screenshot({ path: testInfo.outputPath(`${name}-full.png`), fullPage: true, scale: 'css' });
  }
  for (const slug of ['compare-job-offers-relocation', 'choose-business-location-evidence', 'compare-options-with-your-own-data']) {
    await page.goto(`/guides/${slug}/`);
    await expect(page.locator('.prose')).toContainText('in development');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://ifyoumind.com/guides/${slug}/`);
    await expectNoHorizontalScroll(page);
    await allWcagChecks(page);
    await page.screenshot({ path: testInfo.outputPath(`${slug}.png`), fullPage: true, scale: 'css' });
  }
  if (testInfo.project.name === 'mobile') {
    await page.setViewportSize({ width: 320, height: 568 });
    for (const path of ['/', '/sample-report', '/guides/']) {
      await page.goto(path);
      if (path === '/sample-report') await expect(page.locator('#recommendation h2')).toBeVisible();
      await expectNoHorizontalScroll(page);
    }
  }
});

// Paid response is intercepted solely for rendering coverage. Real entitlement/webhook behavior is
// tested separately by commerce.integration.test.mjs, without mutating QA account entitlements.
test('paid-report response contract: full report, copy and print controls remain usable', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
  const sample = await callable('getSampleDecisionReport', {});
  expect(sample.error).toBeUndefined();
  await page.route('**/getMarketIntelligenceProject', route => route.fulfill({
    json: { result: { ...sample.result, id: user.projectIds[0], sample: false, decisionReportPurchased: true, decisionReportAccess: 'purchased' } },
  }));
  await page.addInitScript(() => {
    window.print = () => { window.__releasePrintCalls = (window.__releasePrintCalls || 0) + 1; };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__releaseCopiedText = text; } } });
  });
  await signInThroughUi(page, user, `/login?returnUrl=${encodeURIComponent(`/app/result/${user.projectIds[0]}`)}`);
  await expect(page.getByText('Full report unlocked', { exact: true })).toBeVisible();
  await expect(page.locator('#market-analysis')).toBeVisible();
  await page.getByRole('button', { name: 'Copy as text' }).click();
  await expect.poll(() => page.evaluate(() => window.__releaseCopiedText || '')).toContain('Austin');
  await page.getByRole('button', { name: 'Print / save PDF' }).click();
  expect(await page.evaluate(() => window.__releasePrintCalls)).toBe(1);
  await expectNoHorizontalScroll(page);
  await allWcagChecks(page);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('nav.report-nav')).toBeHidden();
  await expect(page.locator('#market-analysis')).toBeVisible();
});

for (const offer of ['report', 'pro']) {
  // Both callable responses and the destination are intercepted: this verifies browser wiring,
  // never opens a real Stripe session and never changes a billing configuration or entitlement.
  test(`checkout link contract: ${offer} preserves the offer and report identity`, async ({ page, fixtures }, testInfo) => {
    const user = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
    const calls = [];
    await page.route('**/getCommercialStatus', async route => {
      const response = await route.fetch();
      const body = await response.json();
      await route.fulfill({ json: { ...body, result: { ...body.result, checkoutEnabled: true } } });
    });
    await page.route('**/createCommercialCheckout', route => {
      calls.push(route.request().postDataJSON().data);
      return route.fulfill({ json: { result: { url: 'https://checkout.stripe.com/c/pay/qa-release-contract' } } });
    });
    await page.route('https://checkout.stripe.com/**', route => route.fulfill({ contentType: 'text/html', body: '<h1>Intercepted checkout contract — no payment</h1>' }));
    const path = `/app/pricing?offer=${offer}&projectId=${user.projectIds[0]}`;
    await signInThroughUi(page, user, `/login?returnUrl=${encodeURIComponent(path)}`);
    await expect(page.locator('.plans')).toContainText('$79');
    await expect(page.locator('.plans')).toContainText('$39');
    await expect(page.locator('.billing-note').first()).toContainText('Stripe');
    await expectNoHorizontalScroll(page);
    await allWcagChecks(page);
    await page.screenshot({ path: testInfo.outputPath(`pricing-${offer}.png`), fullPage: true, scale: 'css' });
    await page.getByRole('button', { name: offer === 'report' ? 'Buy Decision Report' : 'Get Pro access', exact: true }).click();
    await expect(page).toHaveURL('https://checkout.stripe.com/c/pay/qa-release-contract');
    expect(calls).toEqual([{ organizationId: user.organizationId, offer, projectId: user.projectIds[0] }]);
  });
}
