// Consumer audit remediation (signed in, emulator only). Controls say what they do.
import { test, expect, signInThroughUi, expectAccessible } from '../support/test.mjs';
import { FIXTURES } from '../support/fixtures.mjs';

test('Account names the data tool honestly and explains how to request a copy or deletion', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.VERIFIED);
  await signInThroughUi(page, user, '/login?returnUrl=%2Faccount');
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole('link', { name: 'Manage my data' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Your saved datasets' })).toHaveAttribute('href', '/data');
  const request = page.locator('#data-request');
  await expect(request).toContainText('To get a copy of your account data, or to delete your account');
  await expect(request).toContainText(user.email);
  await expect(request.getByRole('link', { name: 'support@ifyoumind.com' })).toHaveAttribute('href', /^mailto:support@ifyoumind\.com\?subject=Account%20data%20request$/);
  await expectAccessible(page);
});

test('from a brief, the $79 jump keeps the decision context and stays on Pricing', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
  const target = `/pricing?offer=report&projectId=${user.projectIds[0]}`;
  await signInThroughUi(page, user, `/login?returnUrl=${encodeURIComponent(target)}`);
  await expect(page.getByRole('button', { name: 'Buy Decision Report' })).toBeVisible();
  await page.getByRole('link', { name: /One-time report · \$79/ }).click();
  await expect(page).toHaveURL(new RegExp(`/pricing\\?offer=report&projectId=${user.projectIds[0]}$`));
  await expect(page.getByRole('article', { name: 'One-time Decision Report' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Buy Decision Report' })).toBeInViewport();
});
