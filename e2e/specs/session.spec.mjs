// Sign-out and sessions that expire or can no longer be refreshed.
import { test, expect, signInThroughUi } from '../support/test.mjs';
import { FIXTURES, disableAccount } from '../support/fixtures.mjs';

test('signing out ends the session and protected pages need sign-in again', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.VERIFIED);
  await signInThroughUi(page, user);
  await expect(page).toHaveURL(/\/app$/);
  await page.goto('/app/account');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/app');
  await expect(page).toHaveURL(/\/login$/);
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
  await expect(page).toHaveURL(/\/app$/);
  await disableAccount(user.uid);
  await expireStoredSession(page);
  await page.goto('/app/account');
  await expect(page).toHaveURL(/\/login\?returnUrl=%2Fapp%2Faccount$/);
});

test('a session with an invalid refresh token is signed out and sent to sign-in', async ({ page, fixtures, consoleErrors }) => {
  const user = await fixtures(FIXTURES.EXPIRED_SESSION);
  consoleErrors.allow.push(/INVALID_REFRESH_TOKEN|invalid-refresh|token-expired|400 \(Bad Request\)|Failed to load resource/i);
  await signInThroughUi(page, user);
  await expect(page).toHaveURL(/\/app$/);
  await expireStoredSession(page, 'not-a-valid-refresh-token');
  await page.goto('/app/pricing');
  await expect(page).toHaveURL(/\/login\?returnUrl=%2Fapp%2Fpricing$/);
});
