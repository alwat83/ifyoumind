import * as admin from 'firebase-admin';
import {
  onCall,
  CallableRequest,
  HttpsError,
} from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

admin.initializeApp();
setGlobalOptions({ region: 'us-central1' });

function requireAdmin(req: CallableRequest<any>) {
  if (!req.auth || req.auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Admin privileges required.');
  }
}

export const setModerator = onCall(async (req) => {
  requireAdmin(req);
  const { uid, value } = req.data as { uid: string; value: boolean };
  if (!uid) throw new HttpsError('invalid-argument', 'Missing uid');

  const user = await admin.auth().getUser(uid);
  const currentClaims = (user.customClaims || {}) as Record<string, unknown>;
  const newClaims = { ...currentClaims, moderator: !!value };
  await admin.auth().setCustomUserClaims(uid, newClaims);
  return { ok: true };
});

export const setAdmin = onCall(async (req) => {
  requireAdmin(req);
  const { uid, value } = req.data as { uid: string; value: boolean };
  if (!uid) throw new HttpsError('invalid-argument', 'Missing uid');

  const user = await admin.auth().getUser(uid);
  const currentClaims = (user.customClaims || {}) as Record<string, unknown>;
  const newClaims = { ...currentClaims, admin: !!value };
  await admin.auth().setCustomUserClaims(uid, newClaims);
  return { ok: true };
});

export const moderateDeleteIdea = onCall(async (req) => {
  if (!req.auth || (!req.auth.token.admin && !req.auth.token.moderator)) {
    throw new HttpsError('permission-denied', 'Moderator or admin required.');
  }
  const { ideaId } = req.data as { ideaId: string };
  if (!ideaId) throw new HttpsError('invalid-argument', 'Missing ideaId');

  const db = admin.firestore();
  const ideaRef = db.collection('ideas').doc(ideaId);
  const commentsSnap = await db.collection('comments').where('ideaId', '==', ideaId).get();
  const batch = db.batch();
  commentsSnap.forEach((doc) => batch.delete(doc.ref));
  batch.delete(ideaRef);
  await batch.commit();
  return { ok: true };
});

export const toggleUpvote = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  const { ideaId } = req.data as { ideaId: string };
  if (!ideaId) throw new HttpsError('invalid-argument', 'Missing ideaId');

  const db = admin.firestore();
  const ideaRef = db.collection('ideas').doc(ideaId);
  const userId = req.auth.uid;
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ideaRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Idea not found');
    const data = snap.data() || {};
    const upvotedBy: string[] = data.upvotedBy || [];
    const upvotes: number = data.upvotes || 0;
    const createdAt: admin.firestore.Timestamp | undefined = data.createdAt;
    const hasUpvoted = upvotedBy.includes(userId);
    const newUpvotes = hasUpvoted ? Math.max(0, upvotes - 1) : upvotes + 1;
    const newUpvotedBy = hasUpvoted ? upvotedBy.filter((id) => id !== userId) : [...upvotedBy, userId];
    let trendingScore = data.trendingScore || 0;
    if (createdAt instanceof admin.firestore.Timestamp) {
      const hours = (Date.now() - createdAt.toDate().getTime()) / (1000 * 60 * 60);
      trendingScore = newUpvotes / (hours + 1);
    }
    tx.update(ideaRef, {
      upvotes: newUpvotes,
      upvotedBy: newUpvotedBy,
      trendingScore,
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
    });
    const authorId = data.authorId as string | undefined;
    if (authorId) {
      tx.set(db.collection('users').doc(authorId), {
        totalUpvotes: admin.firestore.FieldValue.increment(hasUpvoted ? -1 : 1),
      }, { merge: true });
    }
    return { upvoted: !hasUpvoted, upvotes: newUpvotes };
  });
  return result;
});

export const onIdeaCreated = onDocumentCreated('ideas/{ideaId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;
  const authorId = data.authorId as string | undefined;
  if (!authorId) return;
  await admin.firestore().collection('users').doc(authorId).set(
    { totalIdeas: admin.firestore.FieldValue.increment(1) },
    { merge: true },
  );
});

export const recalcTrending = onSchedule('every 60 minutes', async () => {
  const db = admin.firestore();
  const cutoff = Date.now() - 72 * 60 * 60 * 1000;
  const ideasSnap = await db.collection('ideas').where('createdAt', '>=', new Date(cutoff)).limit(500).get();
  const batch = db.batch();
  ideasSnap.forEach((docSnap) => {
    const d = docSnap.data();
    const createdAt = d.createdAt instanceof admin.firestore.Timestamp ? d.createdAt.toDate() : new Date();
    const hours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    batch.update(docSnap.ref, { trendingScore: (d.upvotes || 0) / (hours + 1) });
  });
  await batch.commit();
});

export {
  createIntelligenceOrganization,
  getIntelligenceOrganization,
  getMyIntelligenceOrganization,
} from './intelligence/organizations';
