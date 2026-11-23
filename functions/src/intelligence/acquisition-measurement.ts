/** Non-financial, consented conversion count; Stripe ledger remains the revenue authority. */
import { createHash } from 'node:crypto';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';
const CONSENT = 'ga4-analytics-v1';
const offers = ['report', 'starter', 'plus'];
export const claimVerifiedPurchase = onCall({ maxInstances: 2, concurrency: 10, timeoutSeconds: 15 }, async (request) => {
    if (!request.auth?.uid)
        throw new HttpsError('unauthenticated', 'Sign in first.');
    if (request.auth.token.email_verified !== true)
        throw new HttpsError('permission-denied', 'Verify your account.');
    const d = request.data;
    if (!d || typeof d !== 'object' || Array.isArray(d) || Object.keys(d).sort().join(',') !== 'consentVersion,offer,organizationId,projectId' || d.consentVersion !== CONSENT || !offers.includes(d.offer) || typeof d.projectId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(d.projectId))
        throw new HttpsError('invalid-argument', 'A consented purchase context is required.');
    const db = getFirestore(), organizations = db.collection('intelligenceOrganizations');
    const scope = await authorizeOrganization(request.auth.uid, d.organizationId, async (id, uid) => (await organizations.doc(id).collection('members').doc(uid).get()).data(), ['owner', 'admin']);
    const org = organizations.doc(scope.organizationId), project = (await org.collection('marketProjects').doc(d.projectId).get()).data();
    if (!project)
        return { confirmed: false };
    let paymentRef;
    if (d.offer === 'report') {
        if (project.decisionReportPurchased !== true || !/^cs_live_[A-Za-z0-9]+$/.test(project.stripeCheckoutSessionId || ''))
            return { confirmed: false };
        paymentRef = db.collection('stripePayments').doc(project.stripeCheckoutSessionId);
    }
    else {
        const billing = (await org.collection('subscriptionBilling').doc('current').get()).data();
        if (!billing || billing.offer !== d.offer || billing.checkout?.projectId !== d.projectId || !/^cs_live_[A-Za-z0-9]+$/.test(billing.checkout?.id || ''))
            return { confirmed: false };
        const receipts = await db.collection('stripePayments').where('checkoutSessionId', '==', billing.checkout.id).limit(2).get();
        if (receipts.size !== 1)
            return { confirmed: false };
        paymentRef = receipts.docs[0].ref;
    }
    const key = createHash('sha256').update(paymentRef.id).digest('hex'), claim = db.collection('analyticsPurchaseClaims').doc(key);
    return db.runTransaction(async (tx) => {
        const [receipt, prior] = await tx.getAll(paymentRef, claim), p = receipt.data();
        const paidAt = p?.paidAt?.toMillis?.();
        if (prior.exists || !p || p.livemode !== true || p.organizationId !== scope.organizationId || p.offer !== d.offer || p.currency !== 'usd' || p.amountTotal !== ({ report: 7900, starter: 499, plus: 999 } as Record<string, number>)[d.offer] || !Number.isFinite(paidAt) || Date.now() - paidAt < 0 || Date.now() - paidAt > 86400000 || p.fulfilment !== (d.offer === 'report' ? 'fulfilled' : 'credits-granted') || d.offer === 'report' && p.projectId !== d.projectId)
            return { confirmed: false };
        tx.create(claim, { createdAt: FieldValue.serverTimestamp(), consentVersion: CONSENT });
        return { confirmed: true, offer: d.offer as 'report' | 'starter' | 'plus' };
    }, { maxAttempts: 3 });
});
