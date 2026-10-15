// Work Package 1 trust fixes: an honest summary instead of a counted verdict, the answer before the
// offer, password recovery, and linked Terms and Privacy at sign-up.
import { test, expect, signInThroughUi } from '../support/test.mjs';
import { FIXTURES, outbox, fixtureEmail, newRunId } from '../support/fixtures.mjs';

test('a free result opens with what the figures show, then the evidence, then the offer', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
  await signInThroughUi(page, user, `/login?returnUrl=${encodeURIComponent(`/app/result/${user.projectIds[0]}?intent=report`)}`);
  await expect(page).toHaveURL(new RegExp(`/app/result/${user.projectIds[0]}`));
  const summary = page.locator('#recommendation');
  await expect(summary.getByText('What the figures show')).toBeVisible();
  await expect(summary.locator('h2')).not.toHaveText(/favorable|caution|mixed/i);
  await expect(summary).toContainText('cannot recommend a location');
  await expect(page.getByText('Executive recommendation')).toHaveCount(0);
  await expect(page.getByText('What supports it')).toHaveCount(0);
  await expect(page.locator('.findings li').first()).toBeVisible();
  await expect(page.locator('.findings .method')).toContainText('None of these differences has been tested for statistical significance');
  await expect(summary.locator('h2')).not.toHaveText(/about the same|no clear difference|equivalent/i);

  // The summary headline is on the first screen; the $79 prompt comes after the comparison.
  const viewport = page.viewportSize();
  const headlineTop = (await summary.locator('h2').boundingBox()).y;
  expect(headlineTop).toBeLessThan(viewport.height);
  const prompt = page.locator('.intent-prompt');
  await expect(prompt).toBeVisible();
  const order = await page.evaluate(() => {
    const at = selector => [...document.querySelectorAll('article.report *')].indexOf(document.querySelector(selector));
    return { summary: at('#recommendation'), comparison: at('#comparison'), prompt: at('.intent-prompt') };
  });
  expect(order.summary).toBeLessThan(order.comparison);
  expect(order.comparison).toBeLessThan(order.prompt);
});

test('forgot password sends a reset email without revealing whether the account exists', async ({ page, fixtures, consoleErrors }) => {
  // The Auth emulator answers an unknown address with HTTP 400 (EMAIL_NOT_FOUND); production, with
  // email enumeration protection on, does not. Either way the page must show the same message.
  consoleErrors.allow.push(/status of 400/);
  const user = await fixtures(FIXTURES.VERIFIED, { workspace: false });
  await page.goto('/login');
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.getByRole('status')).toHaveText(/Enter your email address above/);

  await page.getByLabel('Email').fill(user.email);
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.getByRole('status')).toHaveText(new RegExp(`If an account exists for ${user.email.replace(/[.+]/g, '\\$&')}`));
  await expect.poll(async () => (await outbox(user.email)).filter(code => code.requestType === 'PASSWORD_RESET').length).toBe(1);

  const stranger = fixtureEmail('T03-no-account', newRunId());
  await page.getByLabel('Email').fill(stranger);
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.getByRole('status')).toHaveText(/If an account exists for/);
});

test('sign-up links the Terms and the Privacy Policy', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms-of-conduct');
  await expect(page.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy-policy');
});

test('the homepage shows a real sample finding and claims no uploaded-data analysis', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('.demo-card');
  await expect(card).toContainText('From the real sample report');
  await expect(card).toContainText('$93,658');
  await expect(card.getByRole('link', { name: /See the full sample report/ })).toHaveAttribute('href', '/sample-report');
  await expect(page.locator('body')).not.toContainText(/your own data/i);
});
