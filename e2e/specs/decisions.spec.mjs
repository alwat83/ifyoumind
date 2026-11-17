// Free decision creation, saved-decision retrieval, ownership and restricted pages.
import { test, expect, expectAccessible, expectNoHorizontalScroll, signInThroughUi } from '../support/test.mjs';
import { callable, FIXTURES, grantAdminClaim } from '../support/fixtures.mjs';

const livingQuestion = 'What is the difference in cost of living between Los Angeles and Birmingham, Alabama, if someone makes $90,000?';

test('a cost-of-living question goes straight to a sourced answer and reopens without creating a duplicate', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_NO_REPORTS);
  await signInThroughUi(page, user, '/login?returnUrl=%2Fapp%2Fdecide');
  const creates = [];
  const unexpected = [];
  page.on('request', request => {
    const url = request.url();
    if (url.endsWith('/createMarketIntelligenceProject') && request.method() === 'POST') creates.push(request.postDataJSON().data);
    if (/openai|createCommercialCheckout|generatePaidDecisionReport/.test(url)) unexpected.push(url);
  });
  const question = page.getByLabel('Your question');
  await question.fill(livingQuestion);
  const submit = page.getByRole('button', { name: 'Show my free brief' });
  const cityScreen = page.getByRole('heading', { name: 'Which cities are you comparing?' });
  await expect(cityScreen).toHaveCount(0);
  await question.press('Tab');
  await expect(submit).toBeFocused();
  await submit.press('Enter');
  await expect(cityScreen).toHaveCount(0);
  await expect(page).toHaveURL(/\/app\/result\/[A-Za-z0-9]+$/);
  const resultUrl = page.url();
  const title = page.getByRole('heading', { name: livingQuestion, exact: true });
  await expect(title).toBeFocused();
  await expect(page.locator('#recommendation')).toContainText('median home value at $810,000 in Los Angeles, CA and $145,000 in Birmingham, AL');
  await expect(page.locator('#recommendation')).toContainText('you’d need actual housing, taxes, transportation, and other recurring expenses');
  await expect(page.getByText('$90,000 annual salary (your input)', { exact: false })).toBeVisible();
  await expect(page.locator('#sources').getByRole('link', { name: 'Open source' }).first()).toHaveAttribute('href', /api\.census\.gov/);
  await expect(page.locator('.next')).toContainText('comparable housing');
  expect(creates).toHaveLength(1);
  expect(creates[0]).toMatchObject({ location: 'Los Angeles, CA', comparisonLocations: ['Birmingham, AL'], decision: livingQuestion });

  const evidence = page.getByRole('region', { name: 'City comparison evidence' });
  const disclosure = evidence.getByText('Show the evidence', { exact: true });
  await expect(evidence.locator('details')).not.toHaveAttribute('open');
  await disclosure.focus();
  await page.keyboard.press('Enter');
  await expect(evidence.getByText(/Partial answer/)).toBeVisible();
  await expect(evidence).toContainText('2024 ACS 5-year estimates (2020–2024)');
  await expect(evidence).toContainText('State FIPS 06 · Place FIPS 44000');
  await expect(evidence).toContainText('State FIPS 01 · Place FIPS 07000');
  await expect(evidence).toContainText('$810,000 − $145,000 = $665,000');
  await expect(evidence.getByRole('link', { name: 'Median home value (B25077_001E) for Birmingham, AL' }))
    .toHaveAttribute('href', 'https://data.census.gov/table/ACSDT5Y2024.B25077?g=160XX00US0107000');

  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await expectNoHorizontalScroll(page);
  }
  await expectAccessible(page);
  await page.reload();
  await expect(title).toBeVisible();
  await page.goBack();
  await expect(question).toHaveValue(livingQuestion);
  await page.reload();
  await expect(question).toHaveValue(livingQuestion);
  expect(creates).toHaveLength(1);
  await submit.click();
  await expect(page).toHaveURL(resultUrl);
  await expect(title).toBeVisible();
  expect(creates).toHaveLength(1);
  await expect(evidence.locator('details')).not.toHaveAttribute('open');
  await disclosure.click();
  await expect(evidence).toContainText('$810,000 − $145,000 = $665,000');
  const { result } = await callable('getRecentMarketIntelligenceProjects', { organizationId: user.organizationId }, user.idToken);
  expect(result.projects.map(project => project.id)).toEqual([resultUrl.split('/').at(-1)]);
  expect(unexpected).toEqual([]);
});

test('a saved city brief keeps supported estimates when one receipt is invalid', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
  const id = user.projectIds[0];
  await page.route('**/getMarketIntelligenceProject', async route => {
    const response = await route.fetch();
    const body = await response.json();
    body.result.brief.metrics.find(metric => metric.key === 'homeValue').sourceUrl = 'https://example.test/unsupported';
    await route.fulfill({ response, json: body });
  });
  await signInThroughUi(page, user, '/login?returnUrl=' + encodeURIComponent('/app/result/' + id));
  const evidence = page.getByRole('region', { name: 'City comparison evidence' });
  await evidence.getByText('Show the evidence', { exact: true }).click();
  await expect(evidence.getByText(/Some estimates could not be verified/)).toBeVisible();
  await expect(evidence).toContainText('Population compared with Madison, WI');
  await expect(evidence).not.toContainText('Median home value compared with Madison, WI');
  await expect(evidence.getByRole('link', { name: /Median home value.*Springfield/ })).toHaveCount(0);
  await expect(page.getByText('$152,000', { exact: true })).toHaveCount(0);
});

test('legacy primary evidence cannot turn a secondary estimate into the answer', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
  for (const legacy of [false, true]) {
    await page.route('**/getMarketIntelligenceProject', async route => {
      const response = await route.fetch();
      const body = await response.json();
      const result = body.result;
      result.decision = 'Compare the cost of living between Springfield, Illinois and Madison, Wisconsin';
      for (const metric of result.brief.metrics) metric.sourceUrl = metric.sourceUrl?.replace('/2024/', '/2019/');
      if (legacy) for (const place of result.brief.comparisons) for (const metric of place.metrics) delete metric.sourceUrl;
      await route.fulfill({ response, json: body });
    });
    if (legacy) await page.reload();
    else await signInThroughUi(page, user, '/login?returnUrl=' + encodeURIComponent('/app/result/' + user.projectIds[0]));
    await expect(page.locator('#recommendation h2')).toHaveText('A verified city comparison is unavailable.');
    await expect(page.locator('#recommendation')).toContainText('0 of 3 main-city figures');
    await expect(page.locator('#recommendation')).toContainText('no verified estimates for the main city');
    await expect(page.locator('#signals, #comparison, #sources')).toHaveCount(0);
    await expect(page.getByText('$152,000', { exact: true })).toHaveCount(0);
    await expect(page.getByText('$345,000', { exact: true })).not.toBeVisible();
    const evidence = page.getByRole('region', { name: 'City comparison evidence' });
    await evidence.getByText('Show the evidence', { exact: true }).click();
    await expect(evidence.getByText('How the differences were calculated')).toHaveCount(0);
    if (legacy) {
      await expect(evidence).toContainText('no verified place estimates');
      await expect(evidence.getByRole('link')).toHaveCount(0);
    } else {
      await expect(evidence).toContainText('No difference could be verified');
      await expect(evidence.getByRole('heading', { name: 'Madison, WI' })).toBeVisible();
      await expect(evidence).toContainText('$345,000');
      await expect(evidence.getByRole('heading', { name: 'Springfield, IL' })).toHaveCount(0);
    }
    await page.unroute('**/getMarketIntelligenceProject');
  }
});

test('comparison without salary and a single-city housing question keep their own evidence', async ({ page, fixtures }) => {
  await signInThroughUi(page, await fixtures(FIXTURES.FREE_NO_REPORTS), '/login?returnUrl=%2Fapp%2Fdecide');
  await page.getByLabel('Your question').fill('Compare living costs in Los Angeles vs Birmingham, AL');
  await page.getByRole('button', { name: 'Show my free brief' }).click();
  await expect(page.locator('#recommendation')).toContainText('$145,000 in Birmingham, AL');
  await expect(page.getByText(/annual salary \(your input\)/)).toHaveCount(0);
  await page.getByRole('link', { name: 'Ask another question' }).click();
  await page.getByLabel('Your question').fill('How much does housing cost in Birmingham, Alabama?');
  await page.getByRole('button', { name: 'Show my free brief' }).click();
  await expect(page.locator('#recommendation')).toContainText('median home value at $145,000 in Birmingham, AL');
  await expect(page.locator('#recommendation')).toContainText('check current rent or sale listings');
  await expect(page.locator('#comparison')).toHaveCount(0);
});

test('a vague question stays editable and an ambiguous comparison keeps the recognized city', async ({ page, fixtures }) => {
  await signInThroughUi(page, await fixtures(FIXTURES.FREE_NO_REPORTS), '/login?returnUrl=%2Fapp%2Fdecide');
  const question = page.getByLabel('Your question');
  await question.fill('Can you help me decide?');
  await page.getByRole('button', { name: 'Continue with city data' }).click();
  await expect(question).toBeFocused();
  await expect(page.getByText(/What would you like to compare or find out/)).toBeVisible();
  await expect(page.getByLabel('City and state')).toHaveCount(0);
  await question.fill('Compare Springfield and Birmingham, Alabama');
  await page.getByRole('button', { name: 'Continue with city data' }).click();
  await expect(page.getByLabel('First city')).toHaveValue('');
  await expect(page.getByLabel('Second city')).toHaveValue('Birmingham, AL');
  await page.getByLabel('First city').fill('Springfield, Illinois');
  await page.getByRole('button', { name: 'Show my free brief' }).click();
  await expect(page.locator('#comparison')).toContainText('Springfield, IL');
  await expect(page.locator('#comparison')).toContainText('Birmingham, AL');
});

test('a rejected extracted city opens the existing editor with both candidates', async ({ page, fixtures, consoleErrors }) => {
  consoleErrors.allow.push(/status of 404/i);
  await signInThroughUi(page, await fixtures(FIXTURES.FREE_NO_REPORTS), '/login?returnUrl=%2Fapp%2Fdecide');
  const endpoint = '**/createMarketIntelligenceProject';
  await page.route(endpoint, route => route.fulfill({ status: 404, json: { error: { status: 'NOT_FOUND', message: 'Synthetic Census mismatch' } } }), { times: 1 });
  await page.getByLabel('Your question').fill('Compare Birmingham, Alabama with Madison, WI');
  await page.getByRole('button', { name: 'Show my free brief' }).click();
  await expect(page.getByRole('alert')).toBeFocused();
  await expect(page.getByRole('alert')).toContainText('We couldn’t match one of those places');
  await expect(page.getByLabel('First city')).toHaveValue('Birmingham, AL');
  await expect(page.getByLabel('Second city')).toHaveValue('Madison, WI');
  await page.getByRole('button', { name: 'Show my free brief' }).click();
  await expect(page).toHaveURL(/\/app\/result\//);
});

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
  await expect(page.locator('#comparison').getByRole('heading', { name: 'Madison, WI' })).toBeVisible();
});

test('local property tax questions preserve the question and do not pretend a sample is an answer', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_NO_REPORTS);
  await signInThroughUi(page, user, '/login?returnUrl=%2Fapp%2Fdecide');
  const question = page.getByLabel('Your question');
  const asked = 'What are the property taxes in Birmingham?';
  const marketCalls = [];
  page.on('request', request => {
    if (/createMarketIntelligenceProject|createIntelligenceOrganization/.test(request.url())) marketCalls.push(request.url());
  });
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await question.fill(asked);
    await expect(question).toHaveValue(asked);
    await expect(question).toBeFocused();
    await expect(page.getByRole('heading', { name: /don’t have verified property tax rates/ })).toBeVisible();
    await expect(page.getByText(/Confirm the state and county/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with city data' })).toHaveCount(0);
    await expect(page.getByLabel('City and state')).toHaveCount(0);
    await expect(page.getByText(/\$420/)).toHaveCount(0);
    await expectNoHorizontalScroll(page);
  }
  await expectAccessible(page);
  await question.press('Tab');
  const sample = page.getByRole('link', { name: 'See a made-up property tax example' });
  await expect(sample).toBeFocused();
  expect(marketCalls).toEqual([]);
  await sample.press('Enter');
  await expect(page).toHaveURL(/\/discover\/\?example=tax$/);
  await expect(page.getByRole('heading', { name: 'Your total rose by $420.00.', exact: true })).toBeVisible();
});

test('bill analysis leads to private Discovery; property checks and tariffs show their limits', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_NO_REPORTS);
  await signInThroughUi(page, user, '/login?returnUrl=%2Fapp%2Fdecide');
  const question = page.getByLabel('Your question');
  await question.fill('Compare property taxes and electricity bills');
  await expect(page.getByRole('group', { name: 'Optional made-up examples' }).getByRole('link')).toHaveCount(2);
  await question.fill('Am I overpaying my property taxes?');
  await expect(page.getByRole('heading', { name: /can’t verify what a property should owe/ })).toBeVisible();
  await expect(page.getByText(/exemptions for the tax year/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open private Bill Discovery' })).toHaveCount(0);
  await question.fill('What are electricity rates in Birmingham?');
  await expect(page.getByRole('heading', { name: /don’t have verified electricity rates/ })).toBeVisible();
  await question.fill('Why did my property taxes increase?');
  await expect(page.getByLabel('City and state')).toHaveCount(0);
  await expect(page.getByText(/two property tax statements for the same property/)).toBeVisible();
  await expectAccessible(page);
  await page.getByRole('link', { name: 'Open private Bill Discovery' }).click();
  await expect(page).toHaveURL(/\/discover\/$/);
  await expect(page.getByRole('button', { name: 'Use a property tax CSV' })).toBeVisible();
  await expect(page.locator('.finding')).toHaveCount(0);
  await page.getByRole('button', { name: 'Use a property tax CSV' }).click();
  await expect(page.getByText(/remove names/i).first()).toBeVisible();
  await page.goto('/app/decide');
  await question.fill('What changed on my electric bill?');
  await expect(page.getByText(/two comparable electricity statements/)).toBeVisible();
  await page.getByRole('link', { name: 'See a made-up electricity example' }).click();
  await expect(page).toHaveURL(/\/discover\/\?example=electricity$/);
  await expect(page.locator('.finding').first()).toBeVisible();
});
