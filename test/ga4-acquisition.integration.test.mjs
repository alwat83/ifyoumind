import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHmac } from 'node:crypto';
assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Firestore emulator required; never run against production.');
assert.match(process.env.GCLOUD_PROJECT || '', /^demo-/);
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_analytics_fixture';
process.env.STRIPE_SECRET_KEY = 'sk_test_analytics_fixture';
const require = createRequire(new URL('../functions/package.json', import.meta.url)), handlers = require('./lib/index.js'), { getFirestore, Timestamp } = require('firebase-admin/firestore'), db = getFirestore(), org = db.collection('intelligenceOrganizations').doc('ga4-qa'), auth = { uid: 'ga4-owner', token: { email_verified: true } };
const data = { organizationId: org.id, projectId: 'qa-report', offer: 'report', consentVersion: 'ga4-analytics-v1' };
async function payment(overrides = {}) { await org.collection('marketProjects').doc(data.projectId).set({ decisionReportPurchased: true, stripeCheckoutSessionId: 'cs_live_GA4Fixture' }); await db.collection('stripePayments').doc('cs_live_GA4Fixture').set({ offer: 'report', organizationId: org.id, projectId: data.projectId, checkoutSessionId: 'cs_live_GA4Fixture', livemode: true, currency: 'usd', amountTotal: 7900, paidAt: Timestamp.now(), fulfilment: 'fulfilled', ...overrides }); }
const call = (changes = {}, identity = auth) => handlers.claimVerifiedPurchase.run({ auth: identity, data: { ...data, ...changes } });
beforeEach(async () => { await db.recursiveDelete(org); for (const c of ['analyticsPurchaseClaims', 'stripePayments', 'stripeEvents'])
    for (const doc of (await db.collection(c).get()).docs)
        await doc.ref.delete(); await org.set({ plan: 'free' }); await org.collection('members').doc(auth.uid).set({ role: 'owner', status: 'active' }); await org.collection('marketProjects').doc(data.projectId).set({ question: 'Private question never returned', decisionReportPurchased: false }); });
test('redirect, entitlement, free allowance or missing ledger never establishes payment', async () => { assert.deepEqual(await call(), { confirmed: false }); await org.collection('marketProjects').doc(data.projectId).update({ decisionReportPurchased: true }); assert.deepEqual(await call(), { confirmed: false }); assert.equal((await db.collection('analyticsPurchaseClaims').get()).size, 0); });
test('verified paid receipt yields only count/offer; refresh and concurrency cannot duplicate', async () => { await payment(); const r = await Promise.all([call(), call()]); assert.equal(r.filter(x => x.confirmed).length, 1); assert.deepEqual(r.find(x => x.confirmed), { confirmed: true, offer: 'report' }); assert.deepEqual(await call(), { confirmed: false }); const claims = await db.collection('analyticsPurchaseClaims').get(); assert.equal(claims.size, 1); assert.deepEqual(Object.keys(claims.docs[0].data()).sort(), ['consentVersion', 'createdAt']); assert.equal((await org.get()).get('plan'), 'free'); assert.equal((await db.collection('stripePayments').doc('cs_live_GA4Fixture').get()).get('amountTotal'), 7900); });
test('unpaid/test/foreign/stale/wrong-amount/duplicate or unfulfilled receipts fail closed', async () => { for (const overrides of [{ livemode: false }, { organizationId: 'other' }, { amountTotal: 1 }, { currency: 'eur' }, { paidAt: Timestamp.fromMillis(Date.now() - 86400001) }, { fulfilment: 'duplicate' }, { fulfilment: 'missing' }]) {
    await payment(overrides);
    assert.deepEqual(await call(), { confirmed: false });
} assert.equal((await db.collection('analyticsPurchaseClaims').get()).size, 0); });
test('anonymous, unverified, foreign, disabled and viewer callers cannot claim', async () => { await payment(); await assert.rejects(call({}, null), { code: 'unauthenticated' }); await assert.rejects(call({}, { ...auth, token: { email_verified: false } }), { code: 'permission-denied' }); await assert.rejects(call({}, { uid: 'foreign', token: { email_verified: true } }), { code: 'permission-denied' }); for (const member of [{ role: 'viewer', status: 'active' }, { role: 'owner', status: 'disabled' }]) {
    await org.collection('members').doc(auth.uid).set(member);
    await assert.rejects(call(), { code: 'permission-denied' });
} assert.equal((await db.collection('analyticsPurchaseClaims').get()).size, 0); });
test('consent and request-schema checks happen before writes', async () => { for (const delta of [{ consentVersion: 'old' }, { extra: 'private' }, { projectId: '../escape' }, { offer: 'pro' }])
    await assert.rejects(call(delta), { code: 'invalid-argument' }); assert.equal((await db.collection('analyticsPurchaseClaims').get()).size, 0); });
test('Starter and Plus initial paid-invoice receipts qualify, renewals without checkout do not', async () => { for (const [i, offer] of ['starter', 'plus'].entries()) {
    await org.collection('subscriptionBilling').doc('current').set({ offer, checkout: { id: 'cs_live_Sub' + i, projectId: data.projectId } });
    await db.collection('stripePayments').doc('in_Sub' + i).set({ offer, organizationId: org.id, checkoutSessionId: 'cs_live_Sub' + i, amountTotal: offer === 'starter' ? 499 : 999, currency: 'usd', livemode: true, paidAt: Timestamp.now(), fulfilment: 'credits-granted' });
    assert.deepEqual(await call({ offer }), { confirmed: true, offer });
    assert.deepEqual(await call({ offer }), { confirmed: false });
} });
test('genuine signed webhook processing supplies the receipt; analytics never calls Stripe', async () => { const event = { id: 'evt_ga4_fixture', type: 'checkout.session.completed', created: Math.floor(Date.now() / 1000), livemode: true, data: { object: { id: 'cs_live_GA4Fixture', payment_status: 'paid', amount_total: 7900, currency: 'usd', metadata: { offer: 'report', organizationId: org.id, projectId: data.projectId } } } }; const raw = Buffer.from(JSON.stringify(event)), t = String(Math.floor(Date.now() / 1000)), sig = createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET).update(t + '.' + raw.toString()).digest('hex'); const response = { code: 0, status(n) { this.code = n; return this; }, send() { return this; } }; await handlers.stripeCommercialWebhook({ rawBody: raw, headers: { 'stripe-signature': `t=${t},v1=${sig}` } }, response); assert.equal(response.code, 200); assert.deepEqual(await call(), { confirmed: true, offer: 'report' }); });
