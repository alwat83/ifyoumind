import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authorizeOrganization, requireIdentity } from './authorization';

// Dedicated domain: no legacy users/profile fields grant membership.
const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

export const createIntelligenceOrganization = onCall(async (request) => {
  const uid = requireIdentity(request.auth?.uid);
  const name: unknown = request.data?.name;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) {
    throw new HttpsError('invalid-argument', 'Organization name must contain 1–120 characters.');
  }
  // One initial workspace per identity. Transaction makes repeated requests idempotent.
  const db = getFirestore();
  const index = db.collection('intelligenceWorkspaceOwners').doc(uid);
  const candidate = organizations().doc();
  const organizationId = await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(index);
    if (existing.exists) {
      const id: unknown = existing.data()?.organizationId;
      if (typeof id !== 'string') throw new HttpsError('internal', 'Invalid workspace index.');
      const member = await transaction.get(organizations().doc(id).collection('members').doc(uid));
      if (member.data()?.status !== 'active' || member.data()?.role !== 'owner') {
        throw new HttpsError('permission-denied', 'Workspace access denied.');
      }
      return id;
    }
    transaction.create(candidate, { name: name.trim(), createdBy: uid, schemaVersion: 1,
      createdAt: FieldValue.serverTimestamp() });
    transaction.create(candidate.collection('members').doc(uid), {
      role: 'owner', status: 'active', createdAt: FieldValue.serverTimestamp(),
    });
    transaction.create(index, { organizationId: candidate.id });
    return candidate.id;
  });
  return { organizationId };
});

export const getIntelligenceOrganization = onCall(async (request) => {
  const scope = await authorizeOrganization(request.auth?.uid, request.data?.organizationId, readMembership);
  const snapshot = await organizations().doc(scope.organizationId).get();
  if (!snapshot.exists) throw new HttpsError('not-found', 'Organization not found.');
  return { organizationId: scope.organizationId, name: snapshot.data()?.name, role: scope.role };
});
