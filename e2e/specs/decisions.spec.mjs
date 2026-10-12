// Free decision creation, saved-decision retrieval, ownership and restricted pages.
import { test, expect, signInThroughUi } from '../support/test.mjs';
import { FIXTURES } from '../support/fixtures.mjs';

test('a verified free user creates a decision through the app and sees the free brief', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_NO_REPORTS, { workspace: false });
  await signInThroughUi(page, user);
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('heading', { name: 'What are you trying to figure out?' })).toBeVisible();
  await expect(page.getByText('Nothing to manage yet')).toBeVisible();

  await page.goto('/app/decide?type=business');
  await expect(page.getByRole('heading', { name: 'Where are you looking?' })).toBeVisible();
  await page.getByLabel(/Main location/).fill('Springfield, IL');
  await page.getByLabel(/Compare with other places/).fill('Madison, WI; Columbus, OH');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel(/Your business/).fill('Neighbourhood bakery');
  await page.getByLabel('The question you want answered').fill('Should the bakery open in Springfield?');
  await page.getByRole('button', { name: 'Show me what the data says' }).click();

  await expect(page).toHaveURL(/\/app\/result\/[A-Za-z0-9]+$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Should the bakery open in Springfield?' })).toBeVisible();
  await expect(page.getByText('Sources cited')).toBeVisible();
  await expect(page.getByText(/What the \$79 report adds/)).toBeVisible();
});

test('a returning user finds the saved decision and reopens its report', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.RETURNING_WITH_REPORT, { decisions: 1 });
  await signInThroughUi(page, user);
  await expect(page.getByRole('heading', { name: 'Your decisions' })).toBeVisible();
  await page.locator(`a[href="/app/result/${user.projectIds[0]}"]`).click();
  await expect(page.getByRole('heading', { level: 1, name: /QA fixture decision 1/ })).toBeVisible();
  await expect(page.getByText('Sources cited')).toBeVisible();
});

test("another account's decision never loads, even with its exact id", async ({ page, fixtures, consoleErrors }) => {
  const owner = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
  const intruder = await fixtures(FIXTURES.OTHER_TENANT);
  consoleErrors.allow.push(/not found|permission/i);
  await signInThroughUi(page, intruder, `/login?returnUrl=${encodeURIComponent(`/app/result/${owner.projectIds[0]}`)}`);
  await expect(page).toHaveURL(new RegExp(`/app/result/${owner.projectIds[0]}$`));
  await expect(page.locator('.state.error')).toBeVisible();
  await expect(page.getByText('QA fixture decision 1')).toHaveCount(0);
  await expect(page.getByText('Sources cited')).toHaveCount(0);
});

test('a non-admin account sees no founder metrics on /app/growth', async ({ page, fixtures, consoleErrors }) => {
  const user = await fixtures(FIXTURES.RESTRICTED_ROUTE);
  consoleErrors.allow.push(/status of 403/);
  await signInThroughUi(page, user);
  await expect(page).toHaveURL(/\/app$/);
  await page.goto('/app/growth');
  await expect(page.locator('.notice.error')).toBeVisible();
  await expect(page.locator('.notice.error')).not.toBeEmpty();
});

test('the fourth free decision this month is refused with a clear message', async ({ page, fixtures, consoleErrors }) => {
  const user = await fixtures(FIXTURES.FREE_LIMIT, { decisions: 3 });
  consoleErrors.allow.push(/status of 429|resource-exhausted|Too Many Requests/i);
  await signInThroughUi(page, user);
  await expect(page.getByRole('heading', { name: 'Your decisions' })).toBeVisible();
  await page.goto('/app/decide?type=business');
  await page.getByLabel(/Main location/).fill('Springfield, IL');
  await page.getByLabel(/Compare with other places/).fill('Madison, WI');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel(/Your business/).fill('Fourth bakery');
  await page.getByLabel('The question you want answered').fill('A fourth decision this month?');
  await page.getByRole('button', { name: 'Show me what the data says' }).click();
  await expect(page.locator('p.error')).toContainText('used your 3 free decisions this month');
  await expect(page).toHaveURL(/\/app\/decide/);
});
