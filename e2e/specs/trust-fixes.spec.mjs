// Work Package 1 trust fixes: an honest summary instead of a counted verdict, the answer before the
// offer, password recovery, and linked Terms and Privacy at sign-up.
import { test, expect, signInThroughUi } from '../support/test.mjs';
import { FIXTURES, outbox, fixtureEmail, newRunId } from '../support/fixtures.mjs';

test('a free result opens with what the figures show, then the evidence, then the offer', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
  await signInThroughUi(page, user, `/login?returnUrl=${encodeURIComponent(`/decisions/${user.projectIds[0]}?intent=report`)}`);
  await expect(page).toHaveURL(new RegExp(`/decisions/${user.projectIds[0]}`));
  const summary = page.locator('#recommendation');
  await expect(summary.getByText('What the figures show')).toBeVisible();
  await expect(summary.locator('h2')).not.toHaveText(/favorable|caution|mixed/i);
  await expect(summary).toContainText('cannot recommend a location');
  await expect(page.getByText('Executive recommendation')).toHaveCount(0);
  await expect(page.getByText('What supports it')).toHaveCount(0);
  await expect(summary.locator('h2')).not.toHaveText(/about the same|no clear difference|equivalent/i);

  // The summary headline is on the first screen; the $79 prompt comes after the comparison.
  const viewport = page.viewportSize();
  const headlineTop = (await summary.locator('h2').boundingBox()).y;
  expect(headlineTop).toBeLessThan(viewport.height);
  const evidence = page.getByRole('region', { name: 'City comparison evidence' });
  await expect(evidence.locator('details')).not.toHaveAttribute('open');
  await evidence.getByText('Show the evidence', { exact: true }).click();
  await expect(evidence.getByText('How the differences were calculated')).toBeVisible();
  await expect(evidence).toContainText('The brief does not show margins of error or test statistical significance');
  const prompt = page.locator('.intent-prompt');
  await expect(prompt).toBeVisible();
  const order = await page.evaluate(() => {
    const at = selector => [...document.querySelectorAll('article.report *')].indexOf(document.querySelector(selector));
    return { summary: at('#recommendation'), evidence: at('.city-evidence'), comparison: at('#comparison'), prompt: at('.intent-prompt') };
  });
  expect(order.summary).toBeLessThan(order.evidence);
  expect(order.evidence).toBeLessThan(order.comparison);
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
  await expect(page.locator('#business .example-label')).toHaveText('Made-up example');
  await page.getByRole('button', { name: /mostly school charges/ }).click();
  const card = page.locator('#business');
  await expect(card.getByText('Made-up example', { exact: true })).toBeVisible();
  await card.getByRole('button', { name: 'Compare cities', exact: true }).click();
  await card.locator('.home-evidence summary').click();
  await expect(card).toContainText(/from the public sample report/i);
  await expect(card).toContainText('$93,658');
  await expect(page.getByRole('link', { name: 'View the Full Sample Report', exact: true })).toHaveAttribute('href', '/sample-report');
  await expect(card).toContainText(/city-level estimates/i);
  await expect(card).toContainText('Check local demand, competition, and rent');
  await page.getByRole('link', { name: 'Understand Your Bills', exact: true }).click();
  await expect(page.getByText('Your bills stay in this browser tab.', { exact: true })).toBeVisible();
  await expect(page.getByText('Two supported CSV formats today. No PDFs, scans or other file types.', { exact: true })).toBeVisible();
});
