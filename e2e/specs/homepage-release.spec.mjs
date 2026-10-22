import { test, expect, expectAccessible, expectNoHorizontalScroll } from '../support/test.mjs';

test('homepage: Life stays informational and Business paths remain usable', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your question. The evidence. A clearer decision.');
  const life = page.getByRole('link', { name: /For your life/ });
  await life.focus();
  await expect(life).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#life-preview$/);
  await expect(page.locator('#life-preview')).toContainText('does not calculate a result or collect your personal information');
  await expect(page.locator('a[href*="/life/quick-compare"], input, textarea')).toHaveCount(0);
  const business = page.getByRole('link', { name: /For your business/ });
  await business.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#business$/);
  await page.getByRole('link', { name: 'See a real Business report →' }).click();
  await expect(page).toHaveURL(/\/sample-report$/);
  await page.goto('/');
  await expect(page.locator('#pricing')).toContainText('$79');
  await expect(page.locator('#pricing')).toContainText('$39');
  await expect(page.getByRole('link', { name: 'Build a report', exact: true })).toHaveAttribute('href', '/register?intent=report');
  await expect(page.getByRole('link', { name: 'Create an account for Pro' })).toHaveAttribute('href', '/register');
  await page.getByRole('link', { name: 'Build a report', exact: true }).click();
  await expect(page).toHaveURL(/\/register\?intent=report$/);
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
  await page.goto('/');
  await expectNoHorizontalScroll(page);
  await expectAccessible(page);
  await page.screenshot({ path: testInfo.outputPath('homepage.png'), fullPage: true });
  if (testInfo.project.name === 'mobile') {
    await page.setViewportSize({ width: 320, height: 568 });
    await expectNoHorizontalScroll(page);
  }
});
