import * as admin from 'firebase-admin';
import { onCall, CallableRequest, HttpsError } from 'firebase-functions/v2/https';
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

  // Delete comments for this idea (batched)
  const commentsSnap = await db.collection('comments').where('ideaId', '==', ideaId).get();
  const batch = db.batch();
  commentsSnap.forEach((doc) => batch.delete(doc.ref));
  batch.delete(ideaRef);
  await batch.commit();

  return { ok: true };
});

/**
 * Callable to toggle an upvote on an idea. Ensures atomic consistency and prevents client-side manipulation of upvotes & trendingScore.
 * Input: { ideaId: string }
 * Returns: { upvoted: boolean, upvotes: number }
 */
export const toggleUpvote = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
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
    let newUpvotes = upvotes;
    let newUpvotedBy: string[];
    if (hasUpvoted) {
      newUpvotes = Math.max(0, upvotes - 1);
      newUpvotedBy = upvotedBy.filter(id => id !== userId);
    } else {
      newUpvotes = upvotes + 1;
      newUpvotedBy = [...upvotedBy, userId];
    }

    // Trending score simple recalculation (upvotes / (hours + 1))
    let trendingScore = data.trendingScore || 0;
    if (createdAt instanceof admin.firestore.Timestamp) {
      const hours = (Date.now() - createdAt.toDate().getTime()) / (1000 * 60 * 60);
      trendingScore = newUpvotes / (hours + 1);
    }

    tx.update(ideaRef, {
      upvotes: newUpvotes,
      upvotedBy: newUpvotedBy,
      trendingScore,
      lastActivity: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user stats (increment/decrement totalUpvotes received for author)
    const authorId = data.authorId as string | undefined;
    if (authorId) {
      const authorRef = db.collection('users').doc(authorId);
      tx.set(authorRef, {
        totalUpvotes: admin.firestore.FieldValue.increment(hasUpvoted ? -1 : 1)
      }, { merge: true });
    }

    return { upvoted: !hasUpvoted, upvotes: newUpvotes };
  });

  return result;
});

/**
 * Firestore trigger: when a new idea document is created, increment author's totalIdeas.
 */
export const onIdeaCreated = onDocumentCreated('ideas/{ideaId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;
  const authorId = data.authorId as string | undefined;
  if (!authorId) return;
  const db = admin.firestore();
  const userRef = db.collection('users').doc(authorId);
  await userRef.set({ totalIdeas: admin.firestore.FieldValue.increment(1) }, { merge: true });
});

/**
 * Scheduled job to recalculate trendingScore for recent ideas (last 72h) every hour.
 */
export const recalcTrending = onSchedule('every 60 minutes', async () => {
  const db = admin.firestore();
  const cutoff = Date.now() - (72 * 60 * 60 * 1000);
  const ideasSnap = await db.collection('ideas')
    .where('createdAt', '>=', new Date(cutoff))
    .limit(500)
    .get();

  const batch = db.batch();
  ideasSnap.forEach(docSnap => {
    const d = docSnap.data();
    const createdAt = d.createdAt instanceof admin.firestore.Timestamp ? d.createdAt.toDate() : new Date();
    const hours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    const upvotes = d.upvotes || 0;
    const trendingScore = upvotes / (hours + 1);
    batch.update(docSnap.ref, { trendingScore });
  });
  await batch.commit();
});



