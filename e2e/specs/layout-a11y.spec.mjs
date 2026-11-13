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
  await expect(page.getByRole('heading', { name: 'One-time Decision Report' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Get Pro access' })).toHaveCount(0);
});

test('shared app surfaces retain editorial headings, mobile fit and keyboard focus', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await signInThroughUi(page, user);
  await expect(page.getByRole('heading', { name: 'Your decisions' })).toBeVisible();

  for (const [path, control] of [
    ['/app', 'Start a decision'],
    ['/app/decide?type=business', 'Main location'],
    ['/app/pricing', 'Choose a decision'],
    ['/app/account', 'Save profile'],
    ['/app/data', 'Choose a CSV'],
    ['/app/ask', 'Question'],
    ['/app/advanced', 'Dataset name'],
  ]) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCSS('font-family', /Instrument Serif/);
    await expect(page.getByLabel(control, { exact: false }).or(page.getByRole('link', { name: control, exact: true }))
      .or(page.getByRole('button', { name: control, exact: true })).first()).toBeAttached();
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expectNoHorizontalScroll(page);
    }
    await page.keyboard.press('Tab');
    const focus = page.locator(':focus-visible').first();
    await expect(focus).toBeVisible();
    await expect(focus).toHaveCSS('outline-style', 'solid');
    await expect(focus).toHaveCSS('transition-duration', '0s');
    await expectAccessible(page);
  }

  await page.goto('/app/data');
  await page.getByLabel('Choose a CSV').focus();
  await expect(page.locator('.dropzone')).toHaveCSS('outline-style', 'solid');
});

test('password recovery fits 320px with a long account address', async ({ page, fixtures }) => {
  const user = await fixtures('T32-long-password-recovery-address', { workspace: false });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByRole('button', { name: /forgot password/i }).click();
  await expect(page.getByRole('status')).toContainText('If an account exists for');
  await expectNoHorizontalScroll(page);
});

test('the Workspace navigation keeps Ask and Advanced on valid app routes', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.VERIFIED);
  await signInThroughUi(page, user);
  await expect(page).toHaveURL(/\/app$/);
  await page.goto('/app/ask');
  const nav = page.getByRole('navigation', { name: 'Workspace' });
  await expect(nav.getByRole('link', { name: 'Ask' })).toHaveAttribute('aria-current', 'page');
  await nav.getByRole('link', { name: 'Advanced' }).click();
  await expect(page).toHaveURL(/\/app\/advanced$/);
  await expect(nav.getByRole('link', { name: 'Advanced' })).toHaveAttribute('aria-current', 'page');
  await nav.getByRole('link', { name: 'My data' }).click();
  await expect(page).toHaveURL(/\/app\/data$/);
});
