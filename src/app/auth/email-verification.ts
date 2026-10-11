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

/** The parts of a Firebase User the guard needs; kept structural so tests can pass a fake. */
export interface VerifiableUser {
  readonly emailVerified: boolean;
  reload(): Promise<void>;
  getIdTokenResult(): Promise<{ claims: Record<string, unknown> }>;
  getIdToken(forceRefresh?: boolean): Promise<string>;
}

/**
 * Resolves whether the account is verified, as fresh as one network round trip allows.
 * An account still marked unverified is reloaded once, so a visitor arriving from the
 * email's continue link isn't sent back to /verify-email. A verified account whose ID
 * token predates verification gets one forced refresh, so protected callables accept it.
 * Network failures never block: the cached state is used and the backend still checks.
 */
export async function ensureFreshVerification(user: VerifiableUser): Promise<boolean> {
  if (!user.emailVerified) {
    try { await user.reload(); } catch { return false; }
    if (!user.emailVerified) return false;
  }
  try {
    const token = await user.getIdTokenResult();
    if (needsTokenRefresh(user.emailVerified, token.claims['email_verified'])) {
      await user.getIdToken(true);
    }
  } catch {
    // Offline or token service unavailable: let navigation proceed; the backend still checks.
  }
  return true;
}
