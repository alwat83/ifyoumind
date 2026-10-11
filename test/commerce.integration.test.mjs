// Emulator tests for Pro report entitlements, checkout guards and Stripe webhook fulfilment.
// Run with: npm run test:commerce
import { before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createRequire } from 'node:module';

const WEBHOOK_SECRET = 'whsec_integration_test';
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
process.env.STRIPE_SECRET_KEY = 'sk_test_integration';

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const handlers = require('./lib/index.js');
const { STRIPE_PRICES } = require('./lib/intelligence/stripe-commerce-logic.js');
const { allowancePeriod } = require('./lib/intelligence/report-entitlement-logic.js');
const { getFirestore } = require('firebase-admin/firestore');

const db = () => getFirestore();
const orgs = () => db().collection('intelligenceOrganizations');
let orgId;
let projectCounter = 0;
let stripeRequests = [];
let stripeSubscriptions = {};

// Stand-in for the Stripe REST API: records checkout requests and serves subscriptions.
// Stand-in for the Census ACS API: serves estimates and margins of error for the PLACES fixture.
let censusRequests = [];
let censusDown = false;
const STATE_NAMES_BY_FIPS = { '08': 'Colorado', '48': 'Texas', '37': 'North Carolina', '16': 'Idaho' };
function censusResponse(url) {
  const u = new URL(url);
  censusRequests.push(u);
  if (censusDown) return { ok: false, status: 400, json: async () => ({}) };
  const year = Number(u.pathname.split('/')[2]);
  const vars = u.searchParams.get('get').split(',');
  const state = u.searchParams.get('in').replace('state:', '');
  const rows = Object.entries(PLACES).filter(([, p]) => p.fips === state).map(([location, p], i) => {
    const values = { NAME: `${location.split(',')[0]} city, ${STATE_NAMES_BY_FIPS[state]}` };
    const pop = year === 2019 ? Math.round(p.pop / (1 + p.growth / 100)) : p.pop;
    const est = { B01003_001: pop, B19013_001: p.income, B25077_001: p.home, B19001_001: Math.round(p.pop / 2.4), B01001_001: pop };
    for (let b = 2; b <= 17; b++) est[`B19001_${String(b).padStart(3, '0')}`] = Math.round(est.B19001_001 / 16);
    for (const c of ['011', '012', '013', '014', '035', '036', '037', '038']) est[`B01001_${c}`] = Math.round(pop * 0.04);
    for (const v of vars.slice(1)) {
      const key = v.slice(0, -1);
      values[v] = v.endsWith('M') ? String(Math.max(1, Math.round((est[key] ?? 0) * 0.02))) : String(est[key] ?? -666666666);
    }
    return [...vars.map(v => values[v]), state, String(1000 + i)];
  });
  return { ok: true, status: 200, json: async () => [[...vars, 'state', 'place'], ...rows] };
}

globalThis.fetch = async (url, init = {}) => {
  if (String(url).startsWith('https://api.census.gov/')) return censusResponse(String(url));
  const path = String(url).replace('https://api.stripe.com/v1/', '');
  const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
  if (path === 'checkout/sessions' && init.method === 'POST') {
    stripeRequests.push(new URLSearchParams(String(init.body)));
    return json(200, { id: `cs_${stripeRequests.length}`, url: 'https://checkout.stripe.com/c/pay/x' });
  }
  if (path === 'billing_portal/sessions' && init.method === 'POST') {
    return json(200, { url: 'https://billing.stripe.com/p/session/x' });
  }
  const sub = path.match(/^subscriptions\/(.+)$/);
  if (sub) return stripeSubscriptions[sub[1]] ? json(200, stripeSubscriptions[sub[1]]) : json(404, { error: { message: 'No such subscription' } });
  throw new Error(`Unexpected fetch ${url}`);
};

async function call(name, data, uid = 'owner-uid') {
  try {
    const result = await handlers[name].run({ data, auth: uid ? { uid, token: { email: `${uid}@example.com` } } : undefined });
    return { result };
  } catch (error) {
    return { error: String(error.code) };
  }
}

async function newOrg(fields = {}) {
  const ref = orgs().doc();
  await ref.set({ name: 'Test workspace', ...fields });
  await ref.collection('members').doc('owner-uid').set({ role: 'owner', status: 'active' });
  await ref.collection('members').doc('viewer-uid').set({ role: 'viewer', status: 'active' });
  return ref.id;
}

async function newProject(organizationId, fields = {}) {
  const id = `project${++projectCounter}`;
  await orgs().doc(organizationId).collection('marketProjects').doc(id).set({
    concept: 'Specialty coffee shop',
    decision: 'Where should I open?',
    location: 'Austin, TX',
    mode: 'live',
    brief: { summary: 'free part', decisionReport: { title: 'paid part' } },
    createdAt: new Date(),
    ...fields,
  });
  return id;
}

const project = async (organizationId, id) =>
  (await orgs().doc(organizationId).collection('marketProjects').doc(id).get()).data();
const org = async (organizationId) => (await orgs().doc(organizationId).get()).data();

let eventCounter = 0;
async function deliver(type, object, { id = `evt_${++eventCounter}`, created = Math.floor(Date.now() / 1000), secret = WEBHOOK_SECRET, livemode = false } = {}) {
  const payload = JSON.stringify({ id, type, created, livemode, data: { object } });
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
  const res = { statusCode: 0, body: '', status(code) { this.statusCode = code; return this; }, send(body) { this.body = body; return this; } };
  const req = { method: 'POST', rawBody: Buffer.from(payload), headers: { 'stripe-signature': `t=${t},v1=${v1}` }, body: JSON.parse(payload) };
  await handlers.stripeCommercialWebhook(req, res);
  return res;
}

before(async () => { orgId = await newOrg(); });
beforeEach(() => { stripeRequests = []; stripeSubscriptions = {}; process.env.STRIPE_SECRET_KEY = 'sk_test_integration'; });

// ---- Report access ----

test('a free workspace sees only the free brief and cannot unlock with Pro', async () => {
  const id = await newProject(orgId);
  const read = await call('getMarketIntelligenceProject', { organizationId: orgId, projectId: id });
  assert.equal(read.result.decisionReportAccess, 'none');
  assert.equal(read.result.brief.decisionReport, undefined);
  assert.equal((await call('unlockDecisionReportWithPro', { organizationId: orgId, projectId: id })).error, 'permission-denied');
  assert.equal((await project(orgId, id)).decisionReportIncludedWithPro, undefined);
});

test('unauthenticated callers and viewers cannot unlock reports', async () => {
  const pro = await newOrg({ plan: 'pro' });
  const id = await newProject(pro);
  assert.equal((await call('unlockDecisionReportWithPro', { organizationId: pro, projectId: id }, null)).error, 'unauthenticated');
  assert.equal((await call('unlockDecisionReportWithPro', { organizationId: pro, projectId: id }, 'viewer-uid')).error, 'permission-denied');
  assert.equal((await call('unlockDecisionReportWithPro', { organizationId: pro, projectId: id }, 'stranger-uid')).error, 'permission-denied');
});

test('Pro unlocks five reports a month, then is refused', async () => {
  const pro = await newOrg({ plan: 'pro' });
  const ids = [];
  for (let i = 0; i < 6; i++) ids.push(await newProject(pro));
  for (let i = 0; i < 5; i++) {
    const r = await call('unlockDecisionReportWithPro', { organizationId: pro, projectId: ids[i] });
    assert.deepEqual(r.result, { unlocked: true, remainingIncludedReports: 4 - i });
  }
  assert.equal((await call('unlockDecisionReportWithPro', { organizationId: pro, projectId: ids[5] })).error, 'resource-exhausted');
  const read = await call('getMarketIntelligenceProject', { organizationId: pro, projectId: ids[0] });
  assert.equal(read.result.decisionReportAccess, 'pro');
  const { evidence: _evidence, ...paidPart } = read.result.brief.decisionReport;
  assert.deepEqual(paidPart, { title: 'paid part' });
  assert.ok(_evidence, 'entitled views carry report evidence');
  const locked = await call('getMarketIntelligenceProject', { organizationId: pro, projectId: ids[5] });
  assert.equal(locked.result.brief.decisionReport, undefined);
  const status = await call('getCommercialStatus', { organizationId: pro });
  assert.equal(status.result.includedReportsPerMonth, 5);
  assert.equal(status.result.usedIncludedReports, 5);
  assert.equal(status.result.remainingIncludedReports, 0);
});

test('repeat unlocks of the same report spend the allowance once', async () => {
  const pro = await newOrg({ plan: 'pro' });
  const id = await newProject(pro);
  await call('unlockDecisionReportWithPro', { organizationId: pro, projectId: id });
  const again = await call('unlockDecisionReportWithPro', { organizationId: pro, projectId: id });
  assert.deepEqual(again.result, { unlocked: true, remainingIncludedReports: 4 });
  assert.equal((await org(pro)).proReportAllowance.used, 1);
});

test('concurrent unlock requests cannot exceed the allowance', async () => {
  const pro = await newOrg({ plan: 'pro' });
  const ids = [];
  for (let i = 0; i < 10; i++) ids.push(await newProject(pro));
  const results = await Promise.all(ids.map(projectId => call('unlockDecisionReportWithPro', { organizationId: pro, projectId })));
  assert.equal(results.filter(r => r.result).length, 5);
  assert.equal(results.filter(r => r.error === 'resource-exhausted').length, 5);
  assert.equal((await org(pro)).proReportAllowance.used, 5);
  let unlocked = 0;
  for (const id of ids) if ((await project(pro, id)).decisionReportIncludedWithPro) unlocked++;
  assert.equal(unlocked, 5);
});

test('concurrent requests for one report spend one unit', async () => {
  const pro = await newOrg({ plan: 'pro' });
  const id = await newProject(pro);
  const results = await Promise.all(Array.from({ length: 6 }, () => call('unlockDecisionReportWithPro', { organizationId: pro, projectId: id })));
  assert.ok(results.every(r => r.result?.unlocked));
  assert.equal((await org(pro)).proReportAllowance.used, 1);
});

test('the allowance resets in a new calendar month', async () => {
  const pro = await newOrg({ plan: 'pro', proReportAllowance: { period: '2000-01', used: 5 } });
  const id = await newProject(pro);
  const r = await call('unlockDecisionReportWithPro', { organizationId: pro, projectId: id });
  assert.deepEqual(r.result, { unlocked: true, remainingIncludedReports: 4 });
  assert.deepEqual((await org(pro)).proReportAllowance, { period: allowancePeriod(), used: 1 });
});

test('purchased reports stay accessible and never spend Pro allowance', async () => {
  const pro = await newOrg({ plan: 'pro' });
  const id = await newProject(pro, { decisionReportPurchased: true });
  const r = await call('unlockDecisionReportWithPro', { organizationId: pro, projectId: id });
  assert.deepEqual(r.result, { unlocked: true, remainingIncludedReports: 5 });
  assert.equal((await org(pro)).proReportAllowance, undefined);
  await orgs().doc(pro).set({ plan: 'free' }, { merge: true });
  const read = await call('getMarketIntelligenceProject', { organizationId: pro, projectId: id });
  assert.equal(read.result.decisionReportAccess, 'purchased');
  assert.equal(read.result.decisionReportPurchased, true);
});

// ---- Checkout ----

test('checkout uses sandbox prices with a test key and live prices with a live key', async () => {
  const free = await newOrg();
  const id = await newProject(free);
  await call('createCommercialCheckout', { organizationId: free, offer: 'report', projectId: id });
  process.env.STRIPE_SECRET_KEY = 'sk_live_integration';
  await call('createCommercialCheckout', { organizationId: free, offer: 'report', projectId: id });
  await call('createCommercialCheckout', { organizationId: free, offer: 'pro' });
  assert.equal(stripeRequests[0].get('line_items[0][price]'), STRIPE_PRICES.test.report);
  assert.equal(stripeRequests[1].get('line_items[0][price]'), STRIPE_PRICES.live.report);
  assert.equal(stripeRequests[1].get('mode'), 'payment');
  assert.equal(stripeRequests[1].get('metadata[projectId]'), id);
  assert.equal(stripeRequests[1].get('allow_promotion_codes'), 'true');
  assert.equal(stripeRequests[2].get('line_items[0][price]'), STRIPE_PRICES.live.pro);
  assert.equal(stripeRequests[2].get('mode'), 'subscription');
  assert.equal(stripeRequests[2].get('subscription_data[metadata][organizationId]'), free);
});

test('checkout refuses already unlocked reports and a second Pro subscription', async () => {
  const pro = await newOrg({ plan: 'pro' });
  const bought = await newProject(pro, { decisionReportPurchased: true });
  const included = await newProject(pro, { decisionReportIncludedWithPro: true });
  assert.equal((await call('createCommercialCheckout', { organizationId: pro, offer: 'report', projectId: bought })).error, 'failed-precondition');
  assert.equal((await call('createCommercialCheckout', { organizationId: pro, offer: 'report', projectId: included })).error, 'failed-precondition');
  assert.equal((await call('createCommercialCheckout', { organizationId: pro, offer: 'pro' })).error, 'failed-precondition');
  const pastDue = await newOrg({ plan: 'free', stripeSubscriptionStatus: 'past_due' });
  assert.equal((await call('createCommercialCheckout', { organizationId: pastDue, offer: 'pro' })).error, 'failed-precondition');
  assert.equal(stripeRequests.length, 0);
});

test('checkout and billing portal reject outsiders', async () => {
  assert.equal((await call('createCommercialCheckout', { organizationId: orgId, offer: 'pro' }, 'stranger-uid')).error, 'permission-denied');
  assert.equal((await call('createCommercialCheckout', { organizationId: orgId, offer: 'pro' }, null)).error, 'unauthenticated');
  assert.equal((await call('createBillingPortalSession', { organizationId: orgId }, 'stranger-uid')).error, 'permission-denied');
});

test('billing portal opens for a workspace with a Stripe customer', async () => {
  const paid = await newOrg({ stripeCustomerId: 'cus_123' });
  assert.equal((await call('createBillingPortalSession', { organizationId: paid })).result.url, 'https://billing.stripe.com/p/session/x');
  assert.equal((await call('createBillingPortalSession', { organizationId: orgId })).error, 'failed-precondition');
});

// ---- Webhook ----

const reportSession = (organizationId, projectId, fields = {}) => ({
  id: `cs_${++eventCounter}`,
  payment_status: 'paid',
  amount_total: 7900,
  currency: 'usd',
  metadata: { organizationId, offer: 'report', projectId },
  ...fields,
});

test('webhook rejects requests without a valid Stripe signature', async () => {
  const id = await newProject(orgId);
  const res = await deliver('checkout.session.completed', reportSession(orgId, id), { secret: 'whsec_wrong' });
  assert.equal(res.statusCode, 400);
  assert.equal((await project(orgId, id)).decisionReportPurchased, undefined);
});

test('a paid report checkout unlocks the report once, even if delivered twice', async () => {
  const free = await newOrg();
  const id = await newProject(free);
  const session = reportSession(free, id);
  const first = await deliver('checkout.session.completed', session, { id: 'evt_dup_report' });
  const second = await deliver('checkout.session.completed', session, { id: 'evt_dup_report' });
  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 200);
  assert.equal(second.body, 'Already processed or processing');
  const data = await project(free, id);
  assert.equal(data.decisionReportPurchased, true);
  assert.equal(data.stripeCheckoutSessionId, session.id);
  const read = await call('getMarketIntelligenceProject', { organizationId: free, projectId: id });
  const { evidence: _evidence, ...paidPart } = read.result.brief.decisionReport;
  assert.deepEqual(paidPart, { title: 'paid part' });
  assert.ok(_evidence, 'entitled views carry report evidence');
});

test('an unpaid checkout does not unlock until the delayed payment succeeds', async () => {
  const free = await newOrg();
  const id = await newProject(free);
  const session = reportSession(free, id, { payment_status: 'unpaid' });
  await deliver('checkout.session.completed', session);
  assert.equal((await project(free, id)).decisionReportPurchased, undefined);
  await deliver('checkout.session.async_payment_succeeded', { ...session, payment_status: 'paid' });
  assert.equal((await project(free, id)).decisionReportPurchased, true);
});

test('a second payment for a bought report is flagged, not overwritten', async () => {
  const free = await newOrg();
  const id = await newProject(free);
  const original = reportSession(free, id);
  await deliver('checkout.session.completed', original);
  await deliver('checkout.session.completed', reportSession(free, id));
  assert.equal((await project(free, id)).stripeCheckoutSessionId, original.id);
  const reviews = await db().collection('billingReviews').where('organizationId', '==', free).get();
  assert.equal(reviews.size, 1);
  assert.equal(reviews.docs[0].data().kind, 'duplicate_report_payment');
});

test('Pro checkout grants Pro only when Stripe reports an active subscription', async () => {
  const free = await newOrg();
  stripeSubscriptions.sub_incomplete = { id: 'sub_incomplete', status: 'incomplete', customer: 'cus_1' };
  await deliver('checkout.session.completed', { id: 'cs_pro_1', subscription: 'sub_incomplete', metadata: { organizationId: free, offer: 'pro' } });
  assert.notEqual((await org(free)).plan, 'pro');
  stripeSubscriptions.sub_active = { id: 'sub_active', status: 'active', customer: 'cus_1', cancel_at_period_end: false };
  await deliver('checkout.session.completed', { id: 'cs_pro_2', subscription: 'sub_active', metadata: { organizationId: free, offer: 'pro' } });
  const data = await org(free);
  assert.equal(data.plan, 'pro');
  assert.equal(data.stripeSubscriptionId, 'sub_active');
  assert.equal(data.stripeCustomerId, 'cus_1');
});

test('cancellation keeps Pro until the period ends, then removes it but keeps unlocked reports', async () => {
  const pro = await newOrg({ plan: 'pro', stripeSubscriptionId: 'sub_main', stripeSubscriptionStatus: 'active', stripeSubscriptionEventCreated: 100 });
  const included = await newProject(pro, { decisionReportIncludedWithPro: true });
  const meta = { organizationId: pro, offer: 'pro' };
  await deliver('customer.subscription.updated', { id: 'sub_main', status: 'active', cancel_at_period_end: true, customer: 'cus_m', metadata: meta }, { created: 200 });
  assert.equal((await org(pro)).plan, 'pro');
  assert.equal((await org(pro)).stripeCancelAtPeriodEnd, true);
  await deliver('customer.subscription.deleted', { id: 'sub_main', status: 'canceled', customer: 'cus_m', metadata: meta }, { created: 300 });
  assert.equal((await org(pro)).plan, 'free');
  const read = await call('getMarketIntelligenceProject', { organizationId: pro, projectId: included });
  assert.equal(read.result.decisionReportAccess, 'pro');
  assert.equal((await call('unlockDecisionReportWithPro', { organizationId: pro, projectId: await newProject(pro) })).error, 'permission-denied');
});

test('an older subscription event cannot undo a newer one', async () => {
  const pro = await newOrg({ plan: 'free', stripeSubscriptionId: 'sub_x', stripeSubscriptionStatus: 'canceled', stripeSubscriptionEventCreated: 500 });
  await deliver('customer.subscription.updated', { id: 'sub_x', status: 'active', metadata: { organizationId: pro, offer: 'pro' } }, { created: 400 });
  assert.equal((await org(pro)).plan, 'free');
});

test('cancelling a duplicate subscription does not end the current one', async () => {
  const pro = await newOrg({ plan: 'pro', stripeSubscriptionId: 'sub_current', stripeSubscriptionStatus: 'active', stripeSubscriptionEventCreated: 100 });
  await deliver('customer.subscription.deleted', { id: 'sub_duplicate', status: 'canceled', metadata: { organizationId: pro, offer: 'pro' } }, { created: 200 });
  const data = await org(pro);
  assert.equal(data.plan, 'pro');
  assert.equal(data.stripeSubscriptionId, 'sub_current');
});

test('subscription.created and unrelated events are acknowledged without changes', async () => {
  const free = await newOrg();
  const res = await deliver('customer.subscription.created', { id: 'sub_new', status: 'incomplete', metadata: { organizationId: free, offer: 'pro' } });
  assert.equal(res.statusCode, 200);
  assert.notEqual((await org(free)).plan, 'pro');
  assert.equal((await deliver('charge.refunded', { id: 'ch_1' })).statusCode, 200);
});

// ---- Stripe-confirmed payment records (growth reporting) ----

const payment = async (sessionId) => (await db().collection('stripePayments').doc(sessionId).get()).data();

test('a paid report is recorded once as a confirmed payment, flagged live or test', async () => {
  const free = await newOrg();
  const liveSession = reportSession(free, await newProject(free));
  await deliver('checkout.session.completed', liveSession, { id: 'evt_live_pay', livemode: true });
  await deliver('checkout.session.completed', liveSession, { id: 'evt_live_pay', livemode: true });
  const live = await payment(liveSession.id);
  assert.equal(live.offer, 'report');
  assert.equal(live.livemode, true);
  assert.equal(live.amountTotal, 7900);
  assert.equal(live.fulfilment, 'fulfilled');
  const testSession = reportSession(free, await newProject(free));
  await deliver('checkout.session.completed', testSession);
  assert.equal((await payment(testSession.id)).livemode, false);
});

test('unpaid checkouts are not recorded until the delayed payment succeeds', async () => {
  const free = await newOrg();
  const session = reportSession(free, await newProject(free), { payment_status: 'unpaid' });
  await deliver('checkout.session.completed', session);
  assert.equal(await payment(session.id), undefined);
  await deliver('checkout.session.async_payment_succeeded', { ...session, payment_status: 'paid' });
  assert.equal((await payment(session.id)).fulfilment, 'fulfilled');
});

test('a duplicate report payment is recorded as money received and marked duplicate', async () => {
  const free = await newOrg();
  const id = await newProject(free);
  await deliver('checkout.session.completed', reportSession(free, id));
  const second = reportSession(free, id);
  await deliver('checkout.session.completed', second);
  assert.equal((await payment(second.id)).fulfilment, 'duplicate');
});

test('Pro is recorded as a payment only when the subscription grants Pro', async () => {
  const free = await newOrg();
  stripeSubscriptions.sub_pay_incomplete = { id: 'sub_pay_incomplete', status: 'incomplete', customer: 'cus_p' };
  await deliver('checkout.session.completed', { id: 'cs_pay_pro_1', subscription: 'sub_pay_incomplete', amount_total: 3900, currency: 'usd', metadata: { organizationId: free, offer: 'pro' } });
  assert.equal(await payment('cs_pay_pro_1'), undefined);
  stripeSubscriptions.sub_pay_active = { id: 'sub_pay_active', status: 'active', customer: 'cus_p' };
  await deliver('checkout.session.completed', { id: 'cs_pay_pro_2', subscription: 'sub_pay_active', amount_total: 3900, currency: 'usd', metadata: { organizationId: free, offer: 'pro' } }, { livemode: true });
  const pro = await payment('cs_pay_pro_2');
  assert.equal(pro.offer, 'pro');
  assert.equal(pro.livemode, true);
  assert.equal(pro.subscriptionId, 'sub_pay_active');
});

test('the growth dashboard reports confirmed payments, not browser returns', async () => {
  const admin = { uid: 'admin-uid', token: { admin: true } };
  const result = await handlers.getProductFunnelMetrics.run({ data: { days: 30 }, auth: admin });
  assert.ok(result.confirmedPayments.live.payments >= 2);
  assert.ok(result.confirmedPayments.test.payments >= 1);
  assert.ok(result.confirmedPayments.recentLive.every((row) => row.checkoutSessionId));
  await assert.rejects(
    handlers.getProductFunnelMetrics.run({ data: { days: 30 }, auth: { uid: 'owner-uid', token: {} } }),
    (error) => error.code === 'permission-denied',
  );
});

// ---- Decision Reports compare up to three places on every plan ----

const PLACES = {
  'Denver, CO': { fips: '08', pop: 718877, income: 94718, home: 616000, growth: 1.9 },
  'Austin, TX': { fips: '48', pop: 979539, income: 93658, home: 555300, growth: 3 },
  'Raleigh, NC': { fips: '37', pop: 482295, income: 82424, home: 410100, growth: 5.2 },
  'Boise, ID': { fips: '16', pop: 236634, income: 76351, home: 470800, growth: 4.1 },
};
async function seedCensus() {
  for (const [location, p] of Object.entries(PLACES)) {
    const city = location.split(',')[0].toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, '_');
    await db().collection('censusPlaceCache').doc(`acs5-2024-2019-${p.fips}-${city}`).set({
      location, population: p.pop, income: p.income, homeValue: p.home,
      populationFiveYearsAgo: p.pop, populationChangePct: p.growth, placeFips: '1', stateFips: p.fips,
    });
  }
}
const createDecision = (organizationId) => call('createMarketIntelligenceProject', {
  organizationId, location: 'Denver, CO', concept: 'Specialty coffee shop', decision: 'Where should I open?',
  comparisonLocations: ['Austin, TX', 'Raleigh, NC', 'Boise, ID'],
});

test('a free decision shows one comparison but a paid report compares all three places', async () => {
  await seedCensus();
  const free = await newOrg();
  const created = await createDecision(free);
  assert.equal(created.error, undefined);
  assert.deepEqual(created.result.comparisonLocations, ['Austin, TX']);
  assert.deepEqual(created.result.reportOnlyLocations, ['Raleigh, NC', 'Boise, ID']);
  assert.equal(created.result.brief.comparisons.length, 1);
  assert.equal(created.result.brief.decisionReport, undefined);

  const stored = await project(free, created.result.id);
  assert.equal(stored.comparisonLocations.length, 3);
  assert.equal(stored.brief.comparisons.length, 3);
  assert.equal(stored.freeBrief.comparisons.length, 1);
  assert.equal(stored.freeBrief.decisionReport, undefined);

  const locked = await call('getMarketIntelligenceProject', { organizationId: free, projectId: created.result.id });
  assert.equal(locked.result.brief.comparisons.length, 1);
  assert.equal(locked.result.brief.decisionReport, undefined);
  assert.equal(JSON.stringify(locked.result.brief).includes('Raleigh'), false);

  await deliver('checkout.session.completed', reportSession(free, created.result.id));
  const paid = await call('getMarketIntelligenceProject', { organizationId: free, projectId: created.result.id });
  assert.equal(paid.result.decisionReportPurchased, true);
  assert.deepEqual(paid.result.comparisonLocations, ['Austin, TX', 'Raleigh, NC', 'Boise, ID']);
  assert.deepEqual(paid.result.reportOnlyLocations, []);
  assert.equal(paid.result.brief.comparisons.length, 3);
  assert.equal(paid.result.brief.decisionReport.comparisonFindings.length, 3);
  const income = paid.result.brief.decisionReport.marketAnalysis.rankings.find((r) => r.metric === 'Median household income');
  assert.equal(income.ordered.length, 4);
});

test('Pro decisions still show all three comparisons in the brief, and Pro unlock reveals the full report', async () => {
  await seedCensus();
  const pro = await newOrg({ plan: 'pro' });
  const created = await createDecision(pro);
  assert.equal(created.result.brief.comparisons.length, 3);
  assert.deepEqual(created.result.reportOnlyLocations, []);
  assert.equal((await project(pro, created.result.id)).freeBrief, null);
  await call('unlockDecisionReportWithPro', { organizationId: pro, projectId: created.result.id });
  const unlocked = await call('getMarketIntelligenceProject', { organizationId: pro, projectId: created.result.id });
  assert.equal(unlocked.result.brief.decisionReport.comparisonFindings.length, 3);
});

test('a free decision with one comparison is unchanged', async () => {
  await seedCensus();
  const free = await newOrg();
  const created = await call('createMarketIntelligenceProject', {
    organizationId: free, location: 'Denver, CO', concept: 'Gym', decision: 'Open here?', comparisonLocations: ['Austin, TX'],
  });
  assert.equal(created.result.brief.comparisons.length, 1);
  assert.deepEqual(created.result.reportOnlyLocations, []);
  assert.equal((await project(free, created.result.id)).freeBrief, null);
});

// ---- Paid-report evidence (margins of error, target market, difference checks) ----

async function clearEvidenceCache() {
  const docs = await db().collection('censusPlaceCache').get();
  await Promise.all(docs.docs.filter(d => d.id.startsWith('acs5detail')).map(d => d.ref.delete()));
}

test('report evidence is fetched only for entitled views, then stored so it never changes silently', async () => {
  await seedCensus();
  await clearEvidenceCache();
  const org = await newOrg();
  const created = await createDecision(org);
  assert.equal(created.error, undefined);
  assert.equal(JSON.stringify(created.result).includes('evidence'), false);

  censusRequests = [];
  const free = await call('getMarketIntelligenceProject', { organizationId: org, projectId: created.result.id });
  assert.equal(free.result.brief.decisionReport, undefined);
  assert.equal(censusRequests.length, 0, 'a free brief never triggers the extra Census requests');
  assert.equal((await project(org, created.result.id)).reportEvidence, undefined);

  await orgs().doc(org).collection('marketProjects').doc(created.result.id).update({ decisionReportPurchased: true });
  const paid = await call('getMarketIntelligenceProject', { organizationId: org, projectId: created.result.id });
  const evidence = paid.result.brief.decisionReport.evidence;
  assert.equal(evidence.status, 'ready');
  assert.deepEqual(evidence.places.map(p => p.location), ['Denver, CO', 'Austin, TX', 'Raleigh, NC', 'Boise, ID']);
  assert.equal(evidence.comparisons.length, 3 * 6);
  assert.ok(evidence.places.every(p => p.medianIncome.moe > 0 && p.affordable.length === 4));
  assert.ok(censusRequests.every(u => u.searchParams.get('get').split(',').length <= 50));
  assert.ok(censusRequests.some(u => u.pathname.startsWith('/data/2019/')), 'the earlier period is fetched for change');
  assert.match(evidence.plainText, /Source: U\.S\. Census Bureau/);
  const narrative = paid.result.brief.decisionReport.marketAnalysis.plainText;
  assert.doesNotMatch(narrative, /margins of error not checked/, 'the paid narrative follows the difference tests');
  const findings = paid.result.brief.decisionReport.comparisonFindings.flatMap(f => f.findings).join(' ');
  assert.match(findings, /real difference at 90% confidence|within the margin of error/);
  assert.ok((await project(org, created.result.id)).reportEvidence, 'stored after the first entitled view');

  censusRequests = [];
  const again = await call('getMarketIntelligenceProject', { organizationId: org, projectId: created.result.id });
  assert.equal(censusRequests.length, 0, 'stored evidence is reused');
  assert.deepEqual(again.result.brief.decisionReport.evidence, evidence);
});

test('when Census is down, the paid report still loads with evidence marked unavailable, and retries later', async () => {
  await seedCensus();
  await clearEvidenceCache();
  const org = await newOrg();
  const created = await createDecision(org);
  await orgs().doc(org).collection('marketProjects').doc(created.result.id).update({ decisionReportPurchased: true });

  censusDown = true;
  try {
    const down = await call('getMarketIntelligenceProject', { organizationId: org, projectId: created.result.id });
    assert.equal(down.error, undefined);
    assert.ok(down.result.brief.decisionReport.marketAnalysis, 'the rest of the paid report is unaffected');
    assert.equal(down.result.brief.decisionReport.evidence.status, 'unavailable');
    assert.match(down.result.brief.decisionReport.evidence.message, /temporarily unavailable/);
    assert.equal((await project(org, created.result.id)).reportEvidence, undefined, 'an unavailable result is not stored');
  } finally {
    censusDown = false;
  }
  const recovered = await call('getMarketIntelligenceProject', { organizationId: org, projectId: created.result.id });
  assert.equal(recovered.result.brief.decisionReport.evidence.status, 'ready');
});
