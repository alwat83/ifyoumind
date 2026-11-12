// Accessibility, sideways scrolling and navigation on desktop and mobile, signed out and signed in.
import { test, expect, expectAccessible, expectNoHorizontalScroll, signInThroughUi } from '../support/test.mjs';
import { FIXTURES } from '../support/fixtures.mjs';

for (const path of ['/', '/login', '/register', '/register?intent=report']) {
  test(`public page ${path} is accessible and fits the viewport`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expectNoHorizontalScroll(page);
    await expectAccessible(page);
  });
}

test('homepage navigation reaches sign-in and registration', async ({ page }) => {
  await page.goto('/');
  if (test.info().project.name === 'mobile') {
    await page.locator('summary').filter({ hasText: 'Menu' }).click();
  }
  await page.getByRole('link', { name: 'Sign In', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/');
  await page.getByRole('link', { name: 'View a Sample Report', exact: true }).click();
  await expect(page).toHaveURL(/\/sample-report$/);
  await page.getByRole('link', { name: 'Start free', exact: true }).first().click();
  await expect(page).toHaveURL(/\/register$/);
});

test('signed-in pages are accessible, fit the viewport and the app navigation works', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
  await signInThroughUi(page, user);
  await expect(page.getByRole('heading', { name: 'Your decisions' })).toBeVisible();
  for (const path of ['/app', '/app/decide?type=business', `/app/result/${user.projectIds[0]}`, '/app/pricing', '/app/account', '/verify-email']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expectNoHorizontalScroll(page);
    await expectAccessible(page);
  }
  await page.goto('/app');
  const nav = page.locator('nav.topbar');
  await nav.getByRole('link', { name: 'Account' }).click();
  await expect(page).toHaveURL(/\/app\/account$/);
  await page.goto('/app');
  const pricing = nav.getByRole('link', { name: 'Pricing' });
  if (test.info().project.name === 'mobile') {
    // By design the phone header drops Pricing (≤560 px); the report's upgrade panel links to it.
    await expect(pricing).toBeHidden();
    await page.goto('/app/pricing');
  } else {
    await pricing.click();
  }
  await expect(page).toHaveURL(/\/app\/pricing$/);
  await expect(page.getByText('If you cancel Pro, reports you already unlocked with it stay unlocked.')).toBeVisible();
});
