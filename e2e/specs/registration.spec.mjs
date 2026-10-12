// Registration validation and the real email-verification flow (Auth emulator captures the email).
import { test, expect, newIsolatedContext, pathOf, expectAccessible } from '../support/test.mjs';
import { fixtureEmail, newRunId, outbox, latestVerificationLink, FIXTURE_PASSWORD } from '../support/fixtures.mjs';

test('empty and malformed registration shows inline errors and creates no account', async ({ page }) => {
  const email = fixtureEmail('T01-invalid-signup', newRunId());
  await page.goto('/register');
  await page.getByRole('button', { name: 'Create free account' }).click();
  await expect(page.getByText('Enter your name.')).toBeVisible();
  await expect(page.getByText(/Enter an email address like/)).toBeVisible();
  await expect(page.getByText('Use at least 6 characters.')).toBeVisible();
  await expect(page.getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Name')).toBeFocused();

  await page.getByLabel('Name').fill('QA');
  await page.getByLabel('Email').fill('not-an-email');
  await page.getByLabel('Password').fill('12345');
  await page.getByRole('button', { name: 'Create free account' }).click();
  await expect(page.getByText(/Enter an email address like/)).toBeVisible();
  await expect(page.getByText('Use at least 6 characters.')).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
  await expectAccessible(page);
  expect(await outbox(email)).toEqual([]);
});

test('sign-up verifies by email; the link opened in another browser keeps the $79 intent', async ({ page, browser, fixtures }) => {
  const email = fixtureEmail('T02-email-signup', newRunId());
  fixtures.trackEmail(email);
  await page.goto('/register?intent=report');
  await page.getByLabel('Name').fill('QA T02');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(FIXTURE_PASSWORD);
  await page.getByRole('button', { name: 'Create free account' }).click();
  await expect(page).toHaveURL(/\/verify-email$/);
  const account = { email, password: FIXTURE_PASSWORD };

  // Before verifying, "I've verified" refuses and protected pages stay closed.
  await page.getByRole('button', { name: "I've verified, continue" }).click();
  await expect(page.getByRole('status')).toHaveText(/Not verified yet/);
  await page.goto('/app/decide?type=business');
  await expect(page).toHaveURL(/\/verify-email$/);

  // The verification email: exactly one, carrying the market-analysis continue URL with the intent.
  const link = await latestVerificationLink(email);
  expect(link, 'verification email captured').toBeTruthy();
  const continueUrl = new URL(new URL(link.oobLink).searchParams.get('continueUrl'));
  expect(continueUrl.pathname + continueUrl.search).toBe('/app/decide?type=business&intent=report');

  // A different browser (no shared storage) opens the link, then follows the continue URL.
  const other = await newIsolatedContext(browser);
  const phone = await other.newPage();
  const verified = await phone.request.get(link.oobLink, { maxRedirects: 0 });
  expect(verified.status()).toBeLessThan(400);
  await phone.goto(continueUrl.pathname + continueUrl.search);
  await expect(phone).toHaveURL(/\/login\?returnUrl=/);
  await phone.getByLabel('Email').fill(account.email);
  await phone.getByLabel('Password').fill(account.password);
  await phone.getByRole('button', { name: 'Sign in' }).click();
  await expect.poll(() => pathOf(phone)).toBe('/app/decide?type=business&intent=report');
  await other.close();

  // Back in the first browser, the same account continues without a new sign-in.
  await page.goto('/verify-email');
  await page.getByRole('button', { name: "I've verified, continue" }).click();
  await expect.poll(() => pathOf(page)).toBe('/app/decide?type=business&intent=report');
});
