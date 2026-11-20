import { test, expect, expectAccessible, expectNoHorizontalScroll, signInThroughUi } from '../support/test.mjs';
import { FIXTURES } from '../support/fixtures.mjs';

test('homepage opens the interactive demo and the complete free example', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Make sense of your numbers.');
  await expect(page.getByRole('heading', { name: 'Why did my property taxes go up?' })).toBeInViewport({ ratio: 1 });
  await expect(page.locator('#discovery-result')).toContainText('$420 more than the year before.');
  await expectNoHorizontalScroll(page);
  await expectAccessible(page);
  const proof = page.locator('.home-evidence');
  await proof.locator('summary').click();
  await expect(proof.locator('.evidence-lead')).toHaveText('($240.00 ÷ $420.00) × 100 = 57.1%');
  await page.getByRole('link', { name: 'Open the full tax example' }).click();
  await expect(page).toHaveURL(/\/discover\/\?example=tax$/);
  await expect(page.locator('.finding')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'Your total rose by $420.00.', exact: true })).toBeVisible();
});

test('homepage comparison, sample report, paid intent and free registration remain usable', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Compare cities', exact: true }).click();
  await page.locator('.home-evidence summary').click();
  const cityPreview = page.getByRole('table', { name: 'City estimates from the public Business sample' });
  const incomeRow = cityPreview.getByRole('row', { name: /Median household income/ });
  await expect(incomeRow).toContainText('$93,658');
  await expect(incomeRow).toContainText('$82,068');
  await expect(page.locator('.home-evidence')).toContainText('The full report compares Austin, Charlotte, and Nashville.');
  await page.getByRole('link', { name: 'View the Full Sample Report', exact: true }).click();
  await expect(page).toHaveURL(/\/sample-report$/);
  // The current production sample uses comparison cards rather than the unmerged #82 proof-income table.
  // Assert the actual full-report comparison and official source links, not a future-only DOM shape.
  const comparisons = page.locator('#comparison .comparison-grid');
  await expect(comparisons).toContainText('Austin, TX');
  await expect(comparisons).toContainText('Charlotte, NC');
  await expect(comparisons).toContainText('Nashville, TN');
  await expect(page.locator('#sources a').first()).toHaveAttribute('href', /^https:/);
  await expect(page.locator('#recommendation h2')).toContainText('Austin, TX');
  await page.getByRole('link', { name: 'Get this report for your cities · $79', exact: true }).first().click();
  await expect(page).toHaveURL(/\/register\?intent=report$/);
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
  await page.goto('/sample-report');
  await page.getByRole('link', { name: 'Start free', exact: true }).first().click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
});

test('homepage free brief keeps its return path and pricing opens publicly', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
  await page.goto('/');
  await page.getByRole('link', { name: 'Start a Free Brief', exact: true }).click();
  await expect(page).toHaveURL(url => url.pathname === '/login' && url.searchParams.get('returnUrl') === '/decide?type=business');
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
  const briefSignIn = page.url();
  await page.goto('/');
  await page.locator('.site-footer').getByRole('link', { name: 'Pricing', exact: true }).click();
  await expect(page).toHaveURL(/\/pricing$/);
  await expect(page.getByRole('heading', { name: 'One-time Decision Report' })).toBeVisible();

  await signInThroughUi(page, user, briefSignIn);
  await expect(page).toHaveURL(/\/decide\?type=business$/);
  await expect(page.getByLabel('Your question')).toHaveValue('Should I open this business here?');
});
