// Sign-out and sessions that expire or can no longer be refreshed.
import { test, expect, signInThroughUi } from '../support/test.mjs';
import { FIXTURES, disableAccount } from '../support/fixtures.mjs';

test('signing out ends the session and protected pages need sign-in again', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.VERIFIED);
  await signInThroughUi(page, user);
  await expect(page).toHaveURL(/\/decisions$/);
  await page.goto('/account');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/decisions');
  await expect(page).toHaveURL(/\/login$/);
});

test('signed-in readers can go home and return to their decisions with the same session', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
  await signInThroughUi(page, user);
  await page.getByRole('link', { name: 'ifYouMind home', exact: true }).first().click();
  await expect(page).toHaveURL(/\/$/);
  const shortcut = page.locator('.quick-saved');
  let decisions = shortcut;
  if (!(await shortcut.isVisible())) {
    const menu = page.locator('.mobile-navigation summary');
    if (await menu.isVisible()) await menu.click();
    decisions = page.getByRole('link', { name: 'Your decisions', exact: true });
  }
  await expect(decisions).toHaveAttribute('href', '/decisions');
  await decisions.click();
  await expect(page).toHaveURL(/\/decisions$/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your decisions' })).toBeVisible();

  const id = user.projectIds[0];
  await page.goto(`/app/result/${id}?intent=report#market-analysis`);
  await expect(page).toHaveURL(url =>
    url.pathname === `/decisions/${id}` && url.search === '?intent=report' && url.hash === '#market-analysis');
});

/** Marks the stored Firebase session as expired so the next load must refresh it. */
async function expireStoredSession(page, refreshToken) {
  await page.evaluate(async (replacement) => {
    const db = await new Promise((resolve, reject) => {
      const open = indexedDB.open('firebaseLocalStorageDb');
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const store = db.transaction('firebaseLocalStorage', 'readwrite').objectStore('firebaseLocalStorage');
    const rows = await new Promise(resolve => { const all = store.getAll(); all.onsuccess = () => resolve(all.result); });
    const row = rows.find(entry => String(entry.fbase_key).startsWith('firebase:authUser:'));
    row.value.stsTokenManager.expirationTime = 0;
    if (replacement) row.value.stsTokenManager.refreshToken = replacement;
    await new Promise(resolve => { const put = db.transaction('firebaseLocalStorage', 'readwrite').objectStore('firebaseLocalStorage').put(row); put.onsuccess = resolve; });
  }, refreshToken);
}

test('an expired session for a disabled account is signed out and sent to sign-in', async ({ page, fixtures, consoleErrors }) => {
  const user = await fixtures(FIXTURES.EXPIRED_SESSION);
  consoleErrors.allow.push(/user-disabled|USER_DISABLED|400 \(Bad Request\)|Failed to load resource/i);
  await signInThroughUi(page, user);
  await expect(page).toHaveURL(/\/decisions$/);
  await disableAccount(user.uid);
  await expireStoredSession(page);
  await page.goto('/account');
  await expect(page).toHaveURL(/\/login\?returnUrl=%2Faccount$/);
});

test('a session with an invalid refresh token is signed out and sent to sign-in', async ({ page, fixtures, consoleErrors }) => {
  const user = await fixtures(FIXTURES.EXPIRED_SESSION);
  consoleErrors.allow.push(/INVALID_REFRESH_TOKEN|invalid-refresh|token-expired|400 \(Bad Request\)|Failed to load resource/i);
  await signInThroughUi(page, user);
  await expect(page).toHaveURL(/\/decisions$/);
  await expireStoredSession(page, 'not-a-valid-refresh-token');
  await page.goto('/account');
  await expect(page).toHaveURL(/\/login\?returnUrl=%2Faccount$/);
});

for (const delayed of [false, true]) {
  test(`public pricing clears private details after sign-out${delayed ? ' while billing is still loading' : ''}`, async ({ page, context, fixtures }) => {
    const viewer = await fixtures(FIXTURES.VERIFIED);
    let billingStarted;
    const started = new Promise(resolve => { billingStarted = resolve; });
    let releaseBilling;
    const gate = new Promise(resolve => { releaseBilling = resolve; });
    await page.route('**/getCommercialStatus', async route => {
      const response = await route.fetch();
      const body = await response.json();
      billingStarted();
      if (delayed) await gate;
      await route.fulfill({ json: { result: { ...body.result, plan: 'pro', includedReportsPerMonth: 5 } } });
    });
    try {
      await signInThroughUi(page, viewer, '/login?returnUrl=%2Fpricing');
      await started;
      if (!delayed) await expect(page.getByText('Legacy Pro · $39/month')).toBeVisible();
      const account = await context.newPage();
      await account.goto('/account');
      await account.getByRole('button', { name: 'Sign out' }).click();
      await expect(page.getByRole('link', { name: 'Try a free example' })).toBeVisible();
      if (delayed) {
        const finished = page.waitForResponse(response => response.url().includes('getCommercialStatus'));
        releaseBilling();
        await finished;
        await page.evaluate(() => new Promise(requestAnimationFrame));
      }
      await expect(page.getByText('Legacy Pro · $39/month')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Account', exact: true })).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Try a free example' })).toBeVisible();
    } finally {
      releaseBilling();
    }
  });
}
