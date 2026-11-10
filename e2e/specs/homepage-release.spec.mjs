import { test, expect, expectAccessible, expectNoHorizontalScroll } from '../support/test.mjs';

test('homepage leads with a sourced comparison and a free working example', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/See the story\.\s*Check the evidence\./);
  const heroAction = page.getByRole('link', { name: 'Try a Free Example', exact: true });
  await expect(heroAction).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole('table', { name: 'City estimates from the public Business sample' })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectAccessible(page);
  await heroAction.click();
  await expect(page.locator('.finding')).toHaveCount(5);
});

test('homepage sample, Business prices, paid intent and registration remain usable', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'View the Full Sample Report', exact: true }).click();
  await expect(page).toHaveURL(/\/sample-report$/);
  await expect(page.locator('#recommendation h2')).toContainText('Austin, TX');
  await page.goto('/');
  const pricing = page.locator('#pricing');
  await expect(pricing).toContainText('$79');
  await expect(pricing).toContainText('$39');
  await expect(pricing).toContainText('Five full reports each month');
  await expect(pricing.getByRole('link', { name: /Business Pro/ })).toHaveAttribute('href', '/register');
  await pricing.getByRole('link', { name: /Decision Report/ }).click();
  await expect(page).toHaveURL(/\/register\?intent=report$/);
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
  await page.goto('/');
  await pricing.getByRole('link', { name: /Business brief/ }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
});

test('homepage report creation and full pricing keep their sign-in return paths', async ({ page }) => {
  for (const [label, destination] of [['Create a Report', '/app/decide'], ['See Pricing', '/app/pricing']]) {
    await page.goto('/');
    await page.getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(url => url.pathname === '/login' && url.searchParams.get('returnUrl') === destination);
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
  }
});
