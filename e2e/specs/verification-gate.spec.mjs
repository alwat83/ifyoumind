// An unverified account can sign in but cannot open any protected page.
import { test, expect, signInThroughUi } from '../support/test.mjs';
import { FIXTURES } from '../support/fixtures.mjs';

for (const path of ['/decisions', '/decide?type=business', '/account', '/decisions/anything']) {
  test(`unverified account is sent to /verify-email from ${path}`, async ({ page, fixtures }) => {
    const user = await fixtures(FIXTURES.UNVERIFIED, { verified: false, workspace: false });
    await signInThroughUi(page, user, `/login?returnUrl=${encodeURIComponent(path)}`);
    await expect(page).toHaveURL(/\/verify-email(?:\?|$)/);
    await page.goto(path);
    await expect(page).toHaveURL(/\/verify-email(?:\?|$)/);
    await expect(page.getByRole('heading', { name: 'Check your email to continue.' })).toBeVisible();
  });
}

test('unverified readers can inspect public pricing without workspace or billing requests', async ({ page, fixtures }) => {
  const viewer = await fixtures(FIXTURES.UNVERIFIED, { verified: false, workspace: false });
  await signInThroughUi(page, viewer);
  await expect(page).toHaveURL(/\/verify-email/);
  const privateRequests = [];
  page.on('request', request => {
    if (/getMyIntelligenceOrganization|getCommercialStatus|getMarketIntelligenceProject|createCommercialCheckout/.test(request.url())) {
      privateRequests.push(request.url());
    }
  });
  await page.goto('/app/pricing?checkout=success&offer=report&projectId=private-test-marker');
  await expect(page).toHaveURL(/\/pricing\?/);
  await expect(page.getByRole('link', { name: 'Try a free example' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Buy Decision Report' })).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('Your payment is complete');
  expect(privateRequests).toEqual([]);
});
