import { test, expect, expectAccessible, expectNoHorizontalScroll } from '../support/test.mjs';

test('homepage opens the interactive demo and the complete free example', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/See the story\.\s*Check the evidence\./);
  const heroAction = page.getByRole('link', { name: 'Try a Free Example', exact: true });
  await expect(heroAction).toBeInViewport({ ratio: 1 });
  await expect(page.locator('#discovery-result')).toContainText('57.1%');
  await expectNoHorizontalScroll(page);
  await expectAccessible(page);
  await heroAction.click();
  await expect(page).toHaveURL(/\/#business$/);
  await page.getByRole('link', { name: 'Explore the property-tax example' }).click();
  await expect(page).toHaveURL(/\/discover\/\?example=tax$/);
  await expect(page.locator('.finding')).toHaveCount(3);
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

test('homepage report creation and full pricing keep their sign-in return paths', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Create a Report', exact: true }).click();
  await expect(page).toHaveURL(url => url.pathname === '/login' && url.searchParams.get('returnUrl') === '/app/decide');
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();

  await page.goto('/');
  await page.getByRole('link', { name: 'Pricing (sign-in required)', exact: true }).click();
  await expect(page).toHaveURL(url => url.pathname === '/login' && url.searchParams.get('returnUrl') === '/app/pricing');
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
});
