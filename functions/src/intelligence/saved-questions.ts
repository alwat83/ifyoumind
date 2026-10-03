import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

export const saveIntelligenceQuestion = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid,
    request.data?.organizationId,
    readMembership,
  );

  const question: unknown = request.data?.question;
  if (typeof question !== 'string' || !question.trim() || question.trim().length > 500) {
    throw new HttpsError('invalid-argument', 'Question must contain 1–500 characters.');
  }

  const normalized = question.trim().replace(/\s+/g, ' ');
  const id = Buffer.from(normalized.toLowerCase()).toString('base64url').slice(0, 120);
  const ref = organizations().doc(scope.organizationId).collection('savedQuestions').doc(id);

  await ref.set({
    question: normalized,
    savedBy: scope.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return { id, question: normalized };
});

export const deleteSavedIntelligenceQuestion = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid,
    request.data?.organizationId,
    readMembership,
  );

  const id: unknown = request.data?.id;
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,120}$/.test(id)) {
    throw new HttpsError('invalid-argument', 'Invalid saved question.');
  }

  await organizations().doc(scope.organizationId).collection('savedQuestions').doc(id).delete();
  return { ok: true };
});

export const getSavedIntelligenceQuestions = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid,
    request.data?.organizationId,
    readMembership,
  );

  const snapshot = await organizations()
    .doc(scope.organizationId)
    .collection('savedQuestions')
    .orderBy('updatedAt', 'desc')
    .limit(30)
    .get();

  return {
    questions: snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        question: data.question,
        updatedAt: data.updatedAt?.toDate?.().toISOString?.() || null,
      };
    }),
  };
});
