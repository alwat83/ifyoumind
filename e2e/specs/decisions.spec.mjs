// Free decision creation, saved-decision retrieval, ownership and restricted pages.
import { test, expect, expectAccessible, expectNoHorizontalScroll, signInThroughUi } from '../support/test.mjs';
import { FIXTURES, grantAdminClaim } from '../support/fixtures.mjs';

test('a verified free user creates a decision through the app and sees the free brief', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_NO_REPORTS, { workspace: false });
  await signInThroughUi(page, user);
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('heading', { name: 'What are you trying to figure out?' })).toBeVisible();
  await expect(page.getByText('Nothing to manage yet')).toBeVisible();

  await page.goto('/app/decide?type=business');
  const question = page.getByLabel('Your question');
  await expect(question).toHaveValue('Should I open this business here?');
  await question.fill('Should the bakery open in Springfield?');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Which city are you looking at?' })).toBeFocused();
  await expect(page.getByText('Should the bakery open in Springfield?', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Comparison city 1')).toHaveCount(0);
  await expect(page.getByLabel('Business or idea')).toHaveCount(0);
  await page.getByLabel('City and state').fill('Springfield, IL');
  await page.getByRole('button', { name: 'Add business details' }).click();
  await page.getByLabel(/Business or idea/).fill('Neighbourhood bakery');

  await page.getByRole('button', { name: 'Edit question' }).click();
  await expect(question).toHaveValue('Should the bakery open in Springfield?');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByLabel('City and state')).toHaveValue('Springfield, IL');
  await page.getByRole('button', { name: 'Show my free brief' }).click();

  await expect(page).toHaveURL(/\/app\/result\/[A-Za-z0-9]+$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Should the bakery open in Springfield?' })).toBeVisible();
  await expect(page.getByText('Sources cited')).toBeVisible();
  await expect(page.getByText(/What the \$79 report adds/)).toBeVisible();
  await expect(page.getByText('Comparison takeaways: where your main city leads and where it trails')).toHaveCount(0);
});

test('a returning user can open account and reopen a saved decision', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.RETURNING_WITH_REPORT, { decisions: 1 });
  await signInThroughUi(page, user);
  await expect(page.getByRole('heading', { name: 'Your decisions' })).toBeVisible();
  await page.locator('nav.topbar').getByRole('link', { name: 'Account', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/account$/);
  await expect(page.getByRole('heading', { name: 'Account details' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to your decisions', exact: true }).click();
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

test('founder metrics warn when the QA exclusion list is missing and keep the counts visible', async ({ page, fixtures }) => {
  const founder = await fixtures(FIXTURES.RESTRICTED_ROUTE);
  await grantAdminClaim(founder.uid);
  await signInThroughUi(page, founder);
  await expect(page).toHaveURL(/\/app$/);
  await page.goto('/app/growth');
  const audit = page.locator('.qa-exclusion');
  await expect(audit).toContainText(/QA and test activity excluded: \d+ workspace\(s\), \d+ event\(s\), \d+ payment\(s\), of which \d+ live/);
  await expect(audit).toContainText('Warning: The QA exclusion list (adminConfig/qaExclusion) has not been created');
  await expect(audit).toHaveClass(/error/);
});

test('the fourth free decision this month is refused with a clear message', async ({ page, fixtures, consoleErrors }) => {
  const user = await fixtures(FIXTURES.FREE_LIMIT, { decisions: 3 });
  consoleErrors.allow.push(/status of 429|resource-exhausted|Too Many Requests/i);
  await signInThroughUi(page, user);
  await expect(page.getByRole('heading', { name: 'Your decisions' })).toBeVisible();
  await page.goto('/app/decide?type=business');
  await page.getByLabel('Your question').fill('A fourth decision this month?');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('City and state').fill('Springfield, IL');
  await page.getByRole('button', { name: 'Show my free brief' }).click();
  await expect(page.getByRole('alert')).toContainText('used your 3 free decisions this month');
  await expect(page.getByRole('link', { name: 'Open your saved decisions' })).toBeVisible();
  await expect(page).toHaveURL(/\/app\/decide/);
});


test('comparison validates two distinct places and keeps entries through a retry', async ({ page, fixtures, consoleErrors }) => {
  const user = await fixtures(FIXTURES.FREE_NO_REPORTS);
  consoleErrors.allow.push(/status of 503/);
  await signInThroughUi(page, user, '/login?returnUrl=%2Fapp%2Fdecide%3Ftype%3Dcompare');
  await expect(page.getByLabel('Your question')).toHaveValue('How do these cities compare?');
  await page.getByRole('button', { name: 'Continue' }).click();
  const first = page.getByLabel('First city');
  const second = page.getByLabel('Second city');
  const brief = page.getByRole('button', { name: 'Show my free brief' });
  await first.fill('Springfield');
  await brief.click();
  await expect(first).toBeFocused();
  await expect(first).toHaveAttribute('aria-invalid', 'true');
  await first.fill('Springfield, Illinois');
  await brief.click();
  await expect(second).toBeFocused();
  await expect(page.getByText('Add a second city to compare.')).toBeVisible();
  await second.fill('Springfield, IL');
  await brief.click();
  await expect(second).toBeFocused();
  await expect(page.getByText('Choose a different city.')).toBeVisible();
  await second.fill('Madi');
  const suggestion = page.getByRole('button', { name: 'Madison, WI' });
  await second.press('Tab');
  await expect(suggestion).toBeFocused();
  await suggestion.press('Enter');
  await expect(second).toBeFocused();
  await expect(second).toHaveValue('Madison, WI');

  const endpoint = '**/createMarketIntelligenceProject';
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let requests = 0;
  await page.route(endpoint, async route => {
    requests++;
    await gate;
    await route.fulfill({ status: 503, json: { error: { status: 'UNAVAILABLE', message: 'Synthetic upstream outage' } } });
  });
  try {
    await brief.click();
    await expect(page.getByRole('button', { name: 'Building your brief…' })).toBeDisabled();
    await expect(page.getByRole('status')).toContainText('Looking up public data');
  } finally { release(); }
  await expect(page.getByRole('alert')).toContainText('Your entries are still here');
  await expect(page.getByRole('alert')).toBeFocused();
  await expect(first).toHaveValue('Springfield, Illinois');
  await expect(second).toHaveValue('Madison, WI');
  expect(requests).toBe(1);
  await expectNoHorizontalScroll(page);
  await expectAccessible(page);
  await page.unroute(endpoint);
  await brief.click();
  await expect(page).toHaveURL(/\/app\/result\//);
  await expect(page.getByRole('heading', { level: 1, name: 'How do these cities compare?' })).toBeVisible();
  await expect(page.getByText('Madison, WI', { exact: true }).first()).toBeVisible();
});

test('a bill question opens private Discovery without a location or transmitting the question', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_NO_REPORTS);
  await signInThroughUi(page, user, '/login?returnUrl=%2Fapp%2Fdecide');
  const question = page.getByLabel('Your question');
  await question.fill('Why did my property taxes increase?');
  await expect(page.getByLabel('City and state')).toHaveCount(0);
  await expect(page.getByText('A city isn’t needed.', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Try the property tax example' }).click();
  await expect(page).toHaveURL(/\/discover\/\?example=tax$/);
  await expect(page.getByRole('heading', { name: 'Your total rose by $420.00.', exact: true })).toBeVisible();
  await page.goto('/app/decide');
  await question.fill('What changed on my electric bill?');
  await page.getByRole('link', { name: 'Try the electricity example' }).click();
  await expect(page).toHaveURL(/\/discover\/\?example=electricity$/);
  await expect(page.locator('.finding').first()).toBeVisible();
});
