// Shared by the auth guard and the services that call email-verified Cloud Functions.
// Kept free of Angular runtime imports so test/email-verification.test.mjs can run it directly.

/** Exact message the backend's requireVerifiedIdentity() sends with failed-precondition. */
export const VERIFY_EMAIL_MESSAGE = 'Verify your email address to continue.';

/**
 * True when Firebase says the account is verified but the cached ID token was minted
 * before verification, so callables would still be refused until the token is refreshed.
 */
export function needsTokenRefresh(userVerified: boolean, claimVerified: unknown): boolean {
  return userVerified === true && claimVerified !== true;
}

/** True for the callable error a protected function returns to an unverified caller. */
export function isEmailVerificationRequired(error: unknown): boolean {
  const e = error as { code?: unknown; message?: unknown } | null;
  return !!e && e.code === 'functions/failed-precondition' &&
    typeof e.message === 'string' && e.message.includes(VERIFY_EMAIL_MESSAGE);
}

/** Runs a protected callable; sends the visitor to /verify-email if it was refused for that reason. */
export async function redirectIfUnverified<T>(
  router: { navigate(commands: unknown[]): Promise<boolean> },
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (isEmailVerificationRequired(error)) void router.navigate(['/verify-email']);
    throw error;
  }
}
