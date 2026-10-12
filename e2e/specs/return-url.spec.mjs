// Protected-route redirects and the #37 return-URL rules, with a real signed-in account.
import { test, expect, newIsolatedContext, pathOf, signInThroughUi } from '../support/test.mjs';
import { FIXTURES } from '../support/fixtures.mjs';

const KEPT = ['/app/decide?type=business&intent=report', '/app/pricing?offer=report', '/app/account', '/app/result/abc123'];
// /app is the default destination, so it needs no return URL.
const NOT_KEPT = ['/app', '/app/growth', '/app/data', '/app/ask', '/app/advanced'];

for (const path of KEPT) {
  test(`signed out, ${path} goes to sign-in and remembers the page`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
    expect(new URL(page.url()).searchParams.get('returnUrl')).toBe(path);
  });
}

for (const path of NOT_KEPT) {
  test(`signed out, ${path} goes to sign-in without a return URL`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  });
}

test('valid return URLs are restored after email sign-in', async ({ browser, fixtures }) => {
  const user = await fixtures(FIXTURES.RETURN_URL, { decisions: 1 });
  const cases = [
    ['/app/decide?type=business&intent=report', '/app/decide?type=business&intent=report'],
    [`/app/result/${user.projectIds[0]}`, `/app/result/${user.projectIds[0]}`],
    ['/app/pricing?offer=report&checkout=success', '/app/pricing?offer=report'],
  ];
  for (const [requested, expected] of cases) {
    const context = await newIsolatedContext(browser);
    const page = await context.newPage();
    await page.goto(requested);
    await expect(page).toHaveURL(/\/login\?returnUrl=/);
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect.poll(() => pathOf(page), { message: requested }).toBe(expected);
    await context.close();
  }
});

test('unknown query parameters are dropped and the page is kept', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.RETURN_URL);
  await signInThroughUi(page, user, `/login?returnUrl=${encodeURIComponent('/app/decide?type=business&next=https://evil.example&checkout=success')}`);
  await expect.poll(() => pathOf(page)).toBe('/app/decide?type=business');
});

const HOSTILE = [
  '//evil.example', 'https://evil.example/app', '/\\evil.example', '/app%2F..%2Flogin', '%2F%2Fevil.example',
  'javascript:alert(1)', '/app/../login', '/app#//evil.example', '/app/result/%00', `/app/${'a'.repeat(600)}`,
  ' /app',
];

test('hostile or malformed return URLs always land on /app inside the site', async ({ browser, fixtures }) => {
  const user = await fixtures(FIXTURES.HOSTILE_RETURN_URL);
  const origin = new URL(test.info().project.use.baseURL).origin;
  for (const value of HOSTILE) {
    const context = await newIsolatedContext(browser);
    const page = await context.newPage();
    await signInThroughUi(page, user, `/login?returnUrl=${encodeURIComponent(value)}`);
    await expect.poll(() => new URL(page.url()).pathname, { message: value }).toBe('/app');
    expect(new URL(page.url()).origin).toBe(origin);
    expect(context.externalRequests, value).toEqual([]);
    await context.close();
  }
});
