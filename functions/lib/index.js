"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalcTrending = exports.onIdeaCreated = exports.toggleUpvote = exports.moderateDeleteIdea = exports.setAdmin = exports.setModerator = void 0;
const admin = require("firebase-admin");
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-functions/v2/firestore");
admin.initializeApp();
(0, v2_1.setGlobalOptions)({ region: 'us-central1' });
function requireAdmin(req) {
    if (!req.auth || req.auth.token.admin !== true) {
        throw new https_1.HttpsError('permission-denied', 'Admin privileges required.');
    }
}
exports.setModerator = (0, https_1.onCall)(async (req) => {
    requireAdmin(req);
    const { uid, value } = req.data;
    if (!uid)
        throw new https_1.HttpsError('invalid-argument', 'Missing uid');
    const user = await admin.auth().getUser(uid);
    const currentClaims = (user.customClaims || {});
    const newClaims = { ...currentClaims, moderator: !!value };
    await admin.auth().setCustomUserClaims(uid, newClaims);
    return { ok: true };
});
exports.setAdmin = (0, https_1.onCall)(async (req) => {
    requireAdmin(req);
    const { uid, value } = req.data;
    if (!uid)
        throw new https_1.HttpsError('invalid-argument', 'Missing uid');
    const user = await admin.auth().getUser(uid);
    const currentClaims = (user.customClaims || {});
    const newClaims = { ...currentClaims, admin: !!value };
    await admin.auth().setCustomUserClaims(uid, newClaims);
    return { ok: true };
});
exports.moderateDeleteIdea = (0, https_1.onCall)(async (req) => {
    if (!req.auth || (!req.auth.token.admin && !req.auth.token.moderator)) {
        throw new https_1.HttpsError('permission-denied', 'Moderator or admin required.');
    }
    const { ideaId } = req.data;
    if (!ideaId)
        throw new https_1.HttpsError('invalid-argument', 'Missing ideaId');
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
exports.toggleUpvote = (0, https_1.onCall)(async (req) => {
    if (!req.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required.');
    }
    const { ideaId } = req.data;
    if (!ideaId)
        throw new https_1.HttpsError('invalid-argument', 'Missing ideaId');
    const db = admin.firestore();
    const ideaRef = db.collection('ideas').doc(ideaId);
    const userId = req.auth.uid;
    const result = await db.runTransaction(async (tx) => {
        const snap = await tx.get(ideaRef);
        if (!snap.exists)
            throw new https_1.HttpsError('not-found', 'Idea not found');
        const data = snap.data() || {};
        const upvotedBy = data.upvotedBy || [];
        const upvotes = data.upvotes || 0;
        const createdAt = data.createdAt;
        const hasUpvoted = upvotedBy.includes(userId);
        let newUpvotes = upvotes;
        let newUpvotedBy;
        if (hasUpvoted) {
            newUpvotes = Math.max(0, upvotes - 1);
            newUpvotedBy = upvotedBy.filter(id => id !== userId);
        }
        else {
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
        const authorId = data.authorId;
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
exports.onIdeaCreated = (0, firestore_1.onDocumentCreated)('ideas/{ideaId}', async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    const authorId = data.authorId;
    if (!authorId)
        return;
    const db = admin.firestore();
    const userRef = db.collection('users').doc(authorId);
    await userRef.set({ totalIdeas: admin.firestore.FieldValue.increment(1) }, { merge: true });
});
/**
 * Scheduled job to recalculate trendingScore for recent ideas (last 72h) every hour.
 */
exports.recalcTrending = (0, scheduler_1.onSchedule)('every 60 minutes', async () => {
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
//# sourceMappingURL=index.js.map