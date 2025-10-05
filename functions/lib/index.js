"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateDeleteIdea = exports.setAdmin = exports.setModerator = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
admin.initializeApp();
function requireAdmin(ctx) {
    if (!ctx.auth || ctx.auth.token.admin !== true) {
        throw new functions.https.HttpsError('permission-denied', 'Admin privileges required.');
    }
}
exports.setModerator = functions.https.onCall(async (data, ctx) => {
    requireAdmin(ctx);
    const { uid, value } = data;
    if (!uid)
        throw new functions.https.HttpsError('invalid-argument', 'Missing uid');
    const user = await admin.auth().getUser(uid);
    const currentClaims = (user.customClaims || {});
    const newClaims = { ...currentClaims, moderator: !!value };
    await admin.auth().setCustomUserClaims(uid, newClaims);
    return { ok: true };
});
exports.setAdmin = functions.https.onCall(async (data, ctx) => {
    requireAdmin(ctx);
    const { uid, value } = data;
    if (!uid)
        throw new functions.https.HttpsError('invalid-argument', 'Missing uid');
    const user = await admin.auth().getUser(uid);
    const currentClaims = (user.customClaims || {});
    const newClaims = { ...currentClaims, admin: !!value };
    await admin.auth().setCustomUserClaims(uid, newClaims);
    return { ok: true };
});
exports.moderateDeleteIdea = functions.https.onCall(async (data, ctx) => {
    if (!ctx.auth || (!ctx.auth.token.admin && !ctx.auth.token.moderator)) {
        throw new functions.https.HttpsError('permission-denied', 'Moderator or admin required.');
    }
    const { ideaId } = data;
    if (!ideaId)
        throw new functions.https.HttpsError('invalid-argument', 'Missing ideaId');
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
//# sourceMappingURL=index.js.map