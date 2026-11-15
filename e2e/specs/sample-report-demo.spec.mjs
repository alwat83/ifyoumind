import AxeBuilder from '@axe-core/playwright';
import { test, expect, expectNoHorizontalScroll, signInThroughUi } from '../support/test.mjs';
import { FIXTURES, seedSampleReport } from '../support/fixtures.mjs';

test.beforeAll(seedSampleReport);

test('public sample can be printed without registration while preserving the paid offer', async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => { window.__samplePrintCalls = (window.__samplePrintCalls || 0) + 1; };
  });
  await page.goto('/sample-report');
  await expect(page.locator('#recommendation h2')).toContainText('Austin, TX');
  const offer = page.locator('.report-offer').filter({ has: page.getByRole('heading', { name: 'Get this analysis for your own question.' }) });
  await expect(offer.getByRole('link', { name: 'Get this report for your cities · $79' })).toHaveAttribute('href', '/register?intent=report');
  await expect(offer.getByRole('link', { name: 'Start free', exact: true })).toHaveAttribute('href', '/register');
  const printButton = offer.getByRole('button', { name: 'Print / save this sample' });
  await printButton.focus();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.__samplePrintCalls)).toBe(1);
  await expect(page).toHaveURL(/\/sample-report$/);
  await expectNoHorizontalScroll(page);
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(a11y.violations.map(v => v.id)).toEqual([]);
  await page.emulateMedia({ media: 'print' });
  await expect(offer).toBeHidden();
  await expect(page.locator('#market-analysis')).toBeVisible();
  await expect(page.locator('#recommendation h2')).toContainText('Austin, TX');
});

test('signed-in sample visitor can start a brief or continue with report intent', async ({ page, fixtures }) => {
  const visitor = await fixtures(FIXTURES.FREE_NO_REPORTS);
  await signInThroughUi(page, visitor);
  await expect(page).toHaveURL(/\/app$/);

  // A fresh load must restore the current session before choosing link targets.
  await page.goto('/sample-report');
  const reportLink = page.getByRole('link', { name: 'Get this report for your cities · $79' });
  const freeLink = page.getByRole('link', { name: 'Start free', exact: true });
  for (const position of [0, 1]) {
    await expect(freeLink.nth(position)).toHaveAttribute('href', '/app/decide?type=business');
    await expect(reportLink.nth(position)).toHaveAttribute('href', '/app/decide?type=business&intent=report');
  }
  await reportLink.last().click();
  await expect(page).toHaveURL(/\/app\/decide\?type=business&intent=report$/);
  await expect(page.getByRole('textbox', { name: 'Your question' })).not.toHaveValue('');
});

test('the sample report offer preserves decision context through email verification', async ({ page, fixtures }) => {
  const visitor = await fixtures(FIXTURES.UNVERIFIED, { verified: false, workspace: false });
  await signInThroughUi(page, visitor);
  await expect(page).toHaveURL(/\/verify-email/);
  await page.goto('/sample-report');
  await page.getByRole('link', { name: 'Get this report for your cities · $79' }).last().click();
  await expect(page).toHaveURL(/\/verify-email\?returnUrl=/);
  expect(new URL(page.url()).searchParams.get('returnUrl')).toBe('/app/decide?type=business&intent=report');
});
