import { HttpsError } from 'firebase-functions/v2/https';

export type OrganizationRole = 'owner' | 'admin' | 'viewer';
export interface Membership { role: OrganizationRole; status: 'active' | 'disabled'; }
export interface OrganizationScope { organizationId: string; uid: string; role: OrganizationRole; }
export type MembershipReader = (organizationId: string, uid: string) => Promise<unknown>;

export function requireIdentity(uid: string | undefined): string {
  if (!uid) throw new HttpsError('unauthenticated', 'Authentication required.');
  return uid;
}

/**
 * True only inside the local Firebase emulator suite for the demo project
 * (`npm run emulators`), where auth-emulator accounts are unverified.
 * Never true in production: Cloud Functions does not set FUNCTIONS_EMULATOR
 * and the project id is never `demo-ifyoumind` there.
 */
export function isLocalDemoEmulator(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.FUNCTIONS_EMULATOR === 'true' && env.GCLOUD_PROJECT === 'demo-ifyoumind';
}

/**
 * Requires a signed-in caller whose ID token says `email_verified: true`.
 * Call it first in every callable that writes data or touches billing, before
 * any membership read, Firestore write, Census or Stripe request.
 *
 * Protected: createMarketIntelligenceProject, createCommercialCheckout,
 * createBillingPortalSession, unlockDecisionReportWithPro, requestCommercialAccess,
 * createUniversalDataset, addUniversalObservation, importUniversalObservations,
 * seedUniversalDemoData, analyzeUniversalDatasets, reasonAcrossUniversalDatasets,
 * askUniversalIntelligence; and getProductFunnelMetrics, which also requires the
 * admin claim (admins must hold a verified identity, as the /app/growth route already does).
 *
 * Intentionally exempt: getSampleDecisionReport (public sample),
 * stripeCommercialWebhook (Stripe signature, no user),
 * createIntelligenceOrganization (runs before verification),
 * getMyIntelligenceOrganization, getIntelligenceOrganization, getCommercialStatus,
 * recordProductEvent, getRecentMarketIntelligenceProjects,
 * getMarketIntelligenceProject, listUniversalDatasets, getUniversalDataset,
 * getRecentUniversalAnalysisRuns (reads of the caller's own workspace).
 */
export function requireVerifiedIdentity(
  auth: { uid?: string; token?: Record<string, unknown> } | undefined,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const uid = requireIdentity(auth?.uid);
  if (auth?.token?.email_verified !== true && !isLocalDemoEmulator(env)) {
    throw new HttpsError('failed-precondition', 'Verify your email address to continue.');
  }
  return uid;
}

export function validateOrganizationId(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) {
    throw new HttpsError('invalid-argument', 'Invalid organization ID.');
  }
  return value;
}

export async function authorizeOrganization(
  uid: string | undefined,
  organizationId: unknown,
  readMembership: MembershipReader,
  allowedRoles: readonly OrganizationRole[] = ['owner', 'admin', 'viewer'],
): Promise<OrganizationScope> {
  const identity = requireIdentity(uid);
  const id = validateOrganizationId(organizationId);
  const member = await readMembership(id, identity);
  if (!member || typeof member !== 'object') {
    throw new HttpsError('permission-denied', 'Organization access denied.');
  }
  const data = member as Record<string, unknown>;
  if (data.status !== 'active' || !['owner', 'admin', 'viewer'].includes(String(data.role)) ||
      !allowedRoles.includes(data.role as OrganizationRole)) {
    throw new HttpsError('permission-denied', 'Organization access denied.');
  }
  return { organizationId: id, uid: identity, role: data.role as OrganizationRole };
}
