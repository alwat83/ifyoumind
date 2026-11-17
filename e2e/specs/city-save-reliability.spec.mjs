import { test, expect, signInThroughUi } from '../support/test.mjs';
import { callable, FIXTURES } from '../support/fixtures.mjs';

test('retrying after a lost successful city creation response reopens the original brief', async ({ page, fixtures, consoleErrors }) => {
  const account = await fixtures(FIXTURES.FREE_NO_REPORTS);
  await signInThroughUi(page, account, '/login?returnUrl=%2Fapp%2Fdecide');
  const route = '**/createMarketIntelligenceProject';
  consoleErrors.allow.push(/503|Service Unavailable/);
  let lostId;
  await page.route(route, async request => {
    const saved = await request.fetch();
    const body = await saved.json();
    expect(saved.status()).toBe(200);
    lostId = body.result.id;
    await request.fulfill({ status: 503, json: { error: { status: 'UNAVAILABLE', message: 'Synthetic lost reply' } } });
  }, { times: 1 });
  const question = page.getByLabel('Your question');
  await question.fill('Compare Los Angeles and Birmingham, Alabama');
  const submit = page.getByRole('button', { name: 'Show my free brief' });
  await submit.click();
  await expect(page.getByText(/Your entries are still here/)).toBeVisible();
  expect(lostId).toBeTruthy();
  const requestData = { organizationId: account.organizationId };
  const afterLoss = await callable('getRecentMarketIntelligenceProjects', requestData, account.idToken);
  expect(afterLoss.result.projects.map(project => project.id)).toEqual([lostId]);
  await submit.click();
  await expect(page).toHaveURL(/\/app\/result\/[A-Za-z0-9]+$/);
  const afterRetry = await callable('getRecentMarketIntelligenceProjects', requestData, account.idToken);
  const ids = afterRetry.result.projects.map(project => project.id);
  expect(ids).toEqual([lostId]);
  expect(page.url().split('/').at(-1)).toBe(lostId);
});
