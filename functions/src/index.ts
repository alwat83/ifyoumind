import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

function requireAdmin(ctx: functions.https.CallableContext) {
  if (!ctx.auth || ctx.auth.token.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Admin privileges required.');
  }
}

export const setModerator = functions.https.onCall(async (data, ctx) => {
  requireAdmin(ctx);
  const { uid, value } = data as { uid: string; value: boolean };
  if (!uid) throw new functions.https.HttpsError('invalid-argument', 'Missing uid');

  const user = await admin.auth().getUser(uid);
  const currentClaims = (user.customClaims || {}) as Record<string, unknown>;
  const newClaims = { ...currentClaims, moderator: !!value };
  await admin.auth().setCustomUserClaims(uid, newClaims);
  return { ok: true };
});

export const setAdmin = functions.https.onCall(async (data, ctx) => {
  requireAdmin(ctx);
  const { uid, value } = data as { uid: string; value: boolean };
  if (!uid) throw new functions.https.HttpsError('invalid-argument', 'Missing uid');

  const user = await admin.auth().getUser(uid);
  const currentClaims = (user.customClaims || {}) as Record<string, unknown>;
  const newClaims = { ...currentClaims, admin: !!value };
  await admin.auth().setCustomUserClaims(uid, newClaims);
  return { ok: true };
});

export const moderateDeleteIdea = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth || (!ctx.auth.token.admin && !ctx.auth.token.moderator)) {
    throw new functions.https.HttpsError('permission-denied', 'Moderator or admin required.');
  }
  const { ideaId } = data as { ideaId: string };
  if (!ideaId) throw new functions.https.HttpsError('invalid-argument', 'Missing ideaId');

  const db = admin.firestore();
  const ideaRef = db.collection('ideas').doc(ideaId);

  // Delete comments for this idea (batched)
  const commentsSnap = await db.collection('comments').where('ideaId', '==', ideaId).get();
  const batch = db.batch();
  commentsSnap.forEach((doc) => batch.delete(doc.ref));
  batch.delete(ideaRef);
  await batch.commit();

  return { ok: true };
});
