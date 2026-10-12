// An unverified account can sign in but cannot open any protected page.
import { test, expect, signInThroughUi } from '../support/test.mjs';
import { FIXTURES } from '../support/fixtures.mjs';

for (const path of ['/app', '/app/decide?type=business', '/app/pricing', '/app/account', '/app/result/anything']) {
  test(`unverified account is sent to /verify-email from ${path}`, async ({ page, fixtures }) => {
    const user = await fixtures(FIXTURES.UNVERIFIED, { verified: false, workspace: false });
    await signInThroughUi(page, user, `/login?returnUrl=${encodeURIComponent(path)}`);
    await expect(page).toHaveURL(/\/verify-email$/);
    await page.goto(path);
    await expect(page).toHaveURL(/\/verify-email$/);
    await expect(page.getByRole('heading', { name: 'Check your email to continue.' })).toBeVisible();
  });
}
