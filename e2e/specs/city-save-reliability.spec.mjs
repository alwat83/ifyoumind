import { randomUUID } from 'node:crypto';
import { test, expect, signInThroughUi } from '../support/test.mjs';
import { callable, FIXTURES } from '../support/fixtures.mjs';

test('retrying after a lost successful city creation response reopens the original brief', async ({ page, fixtures, consoleErrors }) => {
  const account = await fixtures(FIXTURES.FREE_NO_REPORTS);
  await signInThroughUi(page, account, '/login?returnUrl=%2Fdecide');
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
  await page.reload();
  await expect(question).toHaveValue('Compare Los Angeles and Birmingham, Alabama');
  await submit.click();
  await expect(page).toHaveURL(/\/decisions\/[A-Za-z0-9]+$/);
  const afterRetry = await callable('getRecentMarketIntelligenceProjects', requestData, account.idToken);
  const ids = afterRetry.result.projects.map(project => project.id);
  expect(ids).toEqual([lostId]);
  expect(page.url().split('/').at(-1)).toBe(lostId);
  const evidence = page.getByRole('region', { name: 'City comparison evidence' });
  await expect(evidence.locator('details')).not.toHaveAttribute('open');
  await evidence.getByText('Show the evidence', { exact: true }).click();
  await expect(evidence).toContainText('$810,000 − $145,000 = $665,000');
  await expect(evidence.getByRole('link', { name: 'Median home value (B25077_001E) for Birmingham, AL' }))
    .toHaveAttribute('href', 'https://data.census.gov/table/ACSDT5Y2024.B25077?g=160XX00US0107000');
});

const createCity = (account, requestId, overrides = {}) => callable('createMarketIntelligenceProject', {
  organizationId: account.organizationId,
  location: 'Los Angeles, CA',
  comparisonLocations: ['Birmingham, AL'],
  concept: 'Location comparison',
  decision: 'Compare Los Angeles and Birmingham',
  requestId,
  ...overrides,
}, account.idToken);

test('concurrent retries share the last free slot and can replay after the limit', async ({ fixtures }) => {
  const account = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 2 });
  const key = randomUUID();
  const copies = await Promise.all(Array.from({ length: 4 }, () => createCity(account, key)));
  const id = copies[0].result?.id;
  expect(id, JSON.stringify(copies)).toBeTruthy();
  expect(copies.map(copy => copy.result?.id)).toEqual(Array(4).fill(id));
  const replay = await createCity(account, key.toUpperCase(), { location: ' Los Angeles, California ' });
  expect(replay.result?.id).toBe(id);
  expect((await createCity(account, key, { decision: 'A different question' })).error).toBe('FAILED_PRECONDITION');
  expect((await createCity(account, randomUUID())).error).toBe('RESOURCE_EXHAUSTED');
  const list = await callable('getRecentMarketIntelligenceProjects', { organizationId: account.organizationId }, account.idToken);
  expect(new Set(list.result.projects.map(project => project.id))).toEqual(new Set([...account.projectIds, id]));
  const legacy = await callable('getMarketIntelligenceProject', { organizationId: account.organizationId, projectId: account.projectIds[0] }, account.idToken);
  expect(legacy.result?.id).toBe(account.projectIds[0]);
});

test('concurrent independent saves cannot exceed the workspace allowance', async ({ fixtures }) => {
  const account = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 2 });
  const results = await Promise.all([createCity(account, randomUUID()), createCity(account, randomUUID()), createCity(account)]);
  expect(results.filter(result => result.result), JSON.stringify(results)).toHaveLength(1);
  expect(results.filter(result => result.error === 'RESOURCE_EXHAUSTED')).toHaveLength(2);
});

test('a rejected save leaves the key reusable and replay requires workspace authorization', async ({ fixtures }) => {
  const owner = await fixtures(FIXTURES.FREE_NO_REPORTS);
  const other = await fixtures(FIXTURES.OTHER_TENANT);
  const key = randomUUID();
  expect((await createCity(owner, key, { location: 'Los Angeles' })).error).toBe('INVALID_ARGUMENT');
  const saved = await createCity(owner, key);
  expect(saved.result?.id).toBeTruthy();
  expect((await createCity(other, key, { organizationId: owner.organizationId })).error).toBe('PERMISSION_DENIED');
  expect((await createCity({ ...owner, idToken: undefined }, key)).error).toBe('UNAUTHENTICATED');
  const separate = await createCity(other, key);
  expect(separate.result?.id).toBeTruthy();
  expect(separate.result.id).not.toBe(saved.result.id);
});

test('a deliberate new decision is not treated as a retry just because its question matches', async ({ page, fixtures }) => {
  const account = await fixtures(FIXTURES.FREE_NO_REPORTS);
  await signInThroughUi(page, account, '/login?returnUrl=%2Fdecide');
  const question = 'Compare Los Angeles and Birmingham, Alabama';
  const submit = async () => {
    await page.getByLabel('Your question').fill(question);
    await page.getByRole('button', { name: 'Show my free brief' }).click();
    await expect(page).toHaveURL(/\/decisions\/[A-Za-z0-9]+$/);
    return page.url().split('/').at(-1);
  };
  const first = await submit();
  await page.getByRole('link', { name: 'Ask another question' }).click();
  const second = await submit();
  expect(second).not.toBe(first);
  const { result } = await callable('getRecentMarketIntelligenceProjects', { organizationId: account.organizationId }, account.idToken);
  expect(new Set(result.projects.map(project => project.id))).toEqual(new Set([first, second]));
});
