import { HttpsError } from 'firebase-functions/v2/https';

export type OrganizationRole = 'owner' | 'admin' | 'viewer';
export interface Membership { role: OrganizationRole; status: 'active' | 'disabled'; }
export interface OrganizationScope { organizationId: string; uid: string; role: OrganizationRole; }
export type MembershipReader = (organizationId: string, uid: string) => Promise<unknown>;

export function requireIdentity(uid: string | undefined): string {
  if (!uid) throw new HttpsError('unauthenticated', 'Authentication required.');
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
