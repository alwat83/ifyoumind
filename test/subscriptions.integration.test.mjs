import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createRequire } from 'node:module';
import { beforeEach, test } from 'node:test';
import { performance } from 'node:perf_hooks';

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const webhookSecret = 'whsec_subscription_fixture';
const catalog = { starter: 'price_StarterFixture', plus: 'price_PlusFixture' };
const account = 'acct_SubscriptionFixture';
const workspace = 'subscription-fixture';
const project = 'fixture-report';
const source = 'decision-reports-v1';
process.env.STRIPE_SECRET_KEY = 'sk_test_fixture';
process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET = webhookSecret;
process.env.SUBSCRIPTION_STRIPE_ACCOUNT = account;
process.env.SUBSCRIPTION_STARTER_PRICE = catalog.starter;
process.env.SUBSCRIPTION_PLUS_PRICE = catalog.plus;
const handlers = require('./lib/index.js');
const { getFirestore } = require('firebase-admin/firestore');
assert.ok(process.env.FIRESTORE_EMULATOR_HOST,'This suite requires the Firestore emulator.');
process.env.CENSUS_API_KEY = 'fixture';
const db = getFirestore();
let org;
let billing;
let docs;
let cents;
let mode;
let sub;
let invoice;
let session;
let charge;
let disputes;
let censusCalls;
let checkoutCalls;
let attempt;
let start;
let end;
let sequence = 0;
const now = () => Math.floor(Date.now()/1000);
const auth = (uid='owner') => ({ uid, token: { email_verified: true } });
const call = (name, data, uid) => handlers[name].run({ data: { organizationId: org.id, ...data }, auth: auth(uid) });

globalThis.fetch = async (url, init) => {
  const u = new URL(url);
  if (u.hostname === 'api.census.gov') {
    censusCalls++;
    const state = u.searchParams.get('in')?.match(/state:(\d+)/)?.[1];
    const fixture = { '08': ['Denver','Boulder'], '48': ['Austin'], '47': ['Nashville'] };
    const rows = (fixture[state] || []).map((name,i) => [
      name+' city', u.pathname.includes('2019') ? '98000' : '100000', '70000', '260000', state, String(i+1),
    ]);
    return Response.json([['NAME','B01003_001E','B19013_001E','B25077_001E','state','place'],...rows]);
  }
  assert.equal(u.hostname,'api.stripe.com');
  if (u.pathname === '/v1/account') return Response.json({ id: account });
  if (u.pathname.startsWith('/v1/prices/')) {
    const id=u.pathname.split('/').at(-1);
    return Response.json({id, livemode:mode, active:true, unit_amount:id===catalog.starter?499:999,
      currency:'usd', recurring:{interval:'month',interval_count:1}});
  }
  if (u.pathname === '/v1/checkout/sessions' && init.method === 'POST') {
    checkoutCalls++;
    assert.equal(init.headers['Stripe-Version'],'2025-02-24.acacia');
    assert.match(init.headers['Idempotency-Key'],/^ifyoumind-subscription-/);
    assert.equal(init.body.get('mode'),'subscription');
    assert.equal(init.body.get('line_items[0][quantity]'),'1');
    assert.equal(init.body.get('line_items[0][price]'),catalog[init.body.get('metadata[offer]')]);
    attempt = init.body.get('metadata[attempt]');
    return Response.json({ ...session, livemode: mode });
  }
  if (u.pathname === '/v1/checkout/sessions/'+session.id) return Response.json(session);
  if (u.pathname === '/v1/subscriptions/'+sub.id) return Response.json(sub);
  if (u.pathname === '/v1/invoices/'+invoice.id) return Response.json(invoice);
  if (u.pathname === '/v1/charges/'+charge.id) return Response.json(charge);
  if (u.pathname === '/v1/disputes') return Response.json({ data:disputes, has_more:false });
  if (u.pathname === '/v1/billing_portal/sessions') {
    assert.equal(init.body.get('customer'),sub.customer);
    return Response.json({ url:'https://billing.stripe.com/p/session/test' });
  }
  throw new Error('unexpected provider route');
};

beforeEach(async () => {
  const suffix = ++sequence;
  org = db.collection('intelligenceOrganizations').doc(workspace+'-'+suffix);
  billing = org.collection('subscriptionBilling').doc('current');
  docs = org.collection('marketProjects');
  await org.set({ name:'Test workspace' });
  await Promise.all([
    org.collection('members').doc('owner').set({role:'owner',status:'active'}),
    org.collection('members').doc('viewer').set({role:'viewer',status:'active'}),
  ]);
  process.env.SUBSCRIPTION_ENROLLMENT = org.id;
  start=now()-60;
  end=start+30*86400;
  cents=499;
  mode=false;
  censusCalls=0;
  checkoutCalls=0;
  disputes=[];
  charge={ id:'ch_fixture'+suffix,livemode:false,paid:true,customer:'cus_fixture'+suffix,refunded:false,disputed:false };
  sub={ id:'sub_fixture'+suffix,customer:charge.customer,status:'active',livemode:false,current_period_end:end,
    metadata:{source,organizationId:org.id,offer:'starter'} };
  session={ id:'cs_test_fixture'+suffix, status:'open', livemode:false, subscription:sub.id,customer:sub.customer,
    client_reference_id:org.id,url:'https://checkout.stripe.com/c/pay/fixture',metadata:{source} };
  invoice={ id:'in_fixture'+suffix,subscription:sub.id,customer:sub.customer,status:'paid',paid:true,
    livemode:false,amount_paid:cents,currency:'usd',collection_method:'charge_automatically',billing_reason:'subscription_create',
    lines:{has_more:false,data:[{type:'subscription',quantity:1,proration:false,price:{id:catalog.starter},period:{start,end}}]},
    payment_intent:{status:'succeeded',customer:sub.customer,amount_received:cents,currency:'usd',latest_charge:charge} };
});

async function deliver(type, object, { live=false, key=webhookSecret, created=now() }={}) {
  const body=JSON.stringify({ id:'evt_'+sequence+'_'+type, type,created,livemode:live,data:{object} });
  const time=now();
  const signature=createHmac('sha256',key).update(time+'.'+body).digest('hex');
  const reply={code:0,status(code){this.code=code;return this;},send(value){this.body=value;return this;}};
  await handlers.stripeSubscriptionWebhook({method:'POST',rawBody:Buffer.from(body),headers:{'stripe-signature':`t=${time},v1=${signature}`}},reply);
  return reply.code;
}

async function seedProject(id=project, deferred=false) {
  await docs.doc(id).set({ location:'Denver, CO',comparisonLocations:['Boulder, CO','Austin, TX','Nashville, TN'],
    concept:'Coffee shop',decision:'Pick a location',mode:'live',
    brief:deferred?{metrics:[],comparisons:[]}:{metrics:[],comparisons:[],decisionReport:{title:'full'}},
    freeBrief:{metrics:[],comparisons:[]},freeComparisonCount:1,decisionReportGenerationRequired:deferred });
}

async function begin(offer='starter', id=project) {
  await call('createCommercialCheckout',{offer,projectId:id});
  sub.metadata.attempt=attempt;
  sub.metadata.offer=offer;
  session.status='complete';
  session.metadata.attempt=attempt;
  if(offer==='plus'){
    invoice.amount_paid=999;
    invoice.payment_intent.amount_received=999;
    invoice.lines.data[0].price.id=catalog.plus;
  }
}

const paid = () => deliver('invoice.paid',{id:invoice.id});
const status = async () => (await call('getCommercialStatus',{})).subscription;

test('only a canonical settled invoice creates a grant, including invoice-first and duplicate delivery',async()=>{
  await seedProject();
  await assert.rejects(call('createCommercialCheckout',{offer:'starter',projectId:project},'viewer'),{code:'permission-denied'});
  await begin();
  assert.equal((await status()).remaining,0);
  assert.equal(await deliver('invoice.paid',{id:invoice.id},{key:'wrong'}),400);
  assert.equal(await deliver('invoice.paid',{id:invoice.id},{live:true}),503);
  assert.equal(await deliver('invoice.payment_failed',{id:invoice.id}),200);
  assert.equal((await status()).remaining,0);
  invoice.amount_paid=0;
  assert.equal(await paid(),503);
  invoice.amount_paid=cents;
  assert.equal(await paid(),200);
  assert.equal(await paid(),200);
  assert.equal((await status()).remaining,1);
  assert.equal((await billing.collection('periods').get()).size,1);
  assert.equal((await db.collection('stripePayments').doc(invoice.id).get()).data().amountTotal,499);
  assert.equal((await call('createBillingPortalSession',{})).url,'https://billing.stripe.com/p/session/test');
  await assert.rejects(call('createBillingPortalSession',{},'viewer'),{code:'permission-denied'});
});

test('pending Checkout prevents a second plan and does not convert a legacy Pro workspace',async()=>{
  await seedProject();
  await call('createCommercialCheckout',{offer:'starter',projectId:project});
  session.metadata.attempt=attempt;
  assert.equal((await call('createCommercialCheckout',{offer:'starter',projectId:project})).url,session.url);
  await assert.rejects(call('createCommercialCheckout',{offer:'plus',projectId:project}),{code:'failed-precondition'});
  assert.equal(checkoutCalls,1);
  await org.update({plan:'pro'});
  await assert.rejects(call('createCommercialCheckout',{offer:'starter',projectId:project}),{code:'failed-precondition'});
  assert.equal((await call('getCommercialStatus',{})).includedReportsPerMonth,5);
});

test('one credit is reserved before generation and cannot be spent twice',async()=>{
  await seedProject(project,true);
  await seedProject('other',true);
  await assert.rejects(call('generatePaidDecisionReport',{projectId:project}),{code:'failed-precondition'});
  assert.equal(censusCalls,0);
  await begin();
  assert.equal(await paid(),200);
  const results=await Promise.allSettled([project,'other'].map(projectId=>call('generatePaidDecisionReport',{projectId})));
  assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
  assert.equal((await status()).remaining,0);
  const reportId=results[0].status==='fulfilled'?project:'other';
  const saved=await call('getMarketIntelligenceProject',{projectId:reportId});
  assert.equal(saved.brief.comparisons.length,3);
  assert.equal(saved.decisionReportAccess,'pro');
  assert.ok(saved.brief.decisionReport);
  const work=censusCalls;
  await call('generatePaidDecisionReport',{projectId:reportId});
  assert.equal(censusCalls,work);
});

test('Plus grants three and cancellation or failed renewal does not reset credits',async()=>{
  await seedProject();
  await begin('plus');
  assert.equal(await paid(),200);
  await call('generatePaidDecisionReport',{projectId:project});
  assert.equal((await status()).remaining,2);
  assert.equal(await deliver('invoice.payment_failed',{id:invoice.id}),200);
  sub.status='past_due';
  sub.cancel_at=end;
  assert.equal(await deliver('customer.subscription.updated',{id:sub.id}),200);
  assert.equal((await status()).cancelAt,end);
  assert.equal((await status()).remaining,2);
  sub.status='canceled';
  sub.ended_at=now();
  assert.equal(await deliver('customer.subscription.deleted',{id:sub.id}),200);
  assert.equal((await status()).remaining,0);
  assert.equal((await call('getMarketIntelligenceProject',{projectId:project})).decisionReportAccess,'pro');
});

test('a dispute arriving before the invoice holds unused credits and a win restores them',async()=>{
  await seedProject();
  await begin();
  charge.disputed=true;
  disputes=[{status:'needs_response'}];
  assert.equal(await deliver('charge.dispute.created',{charge:charge.id}),200);
  assert.equal(await paid(),200);
  assert.equal((await status()).remaining,0);
  disputes=[{status:'won'}];
  assert.equal(await deliver('charge.dispute.closed',{charge:charge.id}),200);
  assert.equal((await status()).remaining,1);
  charge.refunded=true;
  assert.equal(await deliver('charge.refunded',{id:charge.id}),200);
  assert.equal((await status()).remaining,0);
});

test('enrolled Free preview only fetches its first comparison and prior one-time access remains usable',async()=>{
  const input={location:'Denver, CO',concept:'Coffee shop',decision:'Pick a location',comparisonLocations:['Boulder, CO','Austin, TX','Nashville, TN']};
  await db.recursiveDelete(db.collection('censusPlaceCache'));
  const before=performance.now();
  const preview=await call('createMarketIntelligenceProject',input);
  const previewMs=performance.now()-before;
  assert.equal(preview.brief.comparisons.length,1);
  assert.equal(preview.brief.decisionReport,undefined);
  assert.equal((await docs.doc(preview.id).get()).data().brief.decisionReport,undefined);
  assert.equal(censusCalls,4);
  await docs.doc(preview.id).update({decisionReportPurchased:true});
  const generateAt=performance.now();
  const cpuBefore=process.cpuUsage();
  await call('generatePaidDecisionReport',{projectId:preview.id});
  const cpu=process.cpuUsage(cpuBefore);
  const generationMs=performance.now()-generateAt;
  assert.equal(censusCalls,8);
  const report=await call('getMarketIntelligenceProject',{projectId:preview.id});
  assert.equal(report.decisionReportAccess,'purchased');
  assert.equal(report.brief.comparisons.length,3);
  const warm=await call('createMarketIntelligenceProject',{...input,comparisonLocations:['Boulder, CO']});
  await docs.doc(warm.id).update({decisionReportPurchased:true});
  const warmAt=performance.now();
  await call('generatePaidDecisionReport',{projectId:warm.id});
  assert.equal(censusCalls,8);
  console.info(JSON.stringify({meter:'local-emulator',previewMs:Math.round(previewMs),coldGenerationMs:Math.round(generationMs),
    coldGenerationCpuMs:Math.round((cpu.user+cpu.system)/1000),warmGenerationMs:Math.round(performance.now()-warmAt),
    previewCensusRequests:4,coldGenerationCensusRequests:4,warmGenerationCensusRequests:0,
    representativeReportBytes:Buffer.byteLength(JSON.stringify(report.brief))}));
});

test('a successful renewal starts a new invoice-aligned window and preserves the old report',async()=>{
  start=now()-30*86400-5;
  end=now()-5;
  invoice.lines.data[0].period={start,end};
  await seedProject();
  await begin();
  assert.equal(await paid(),200);
  assert.equal((await status()).remaining,0);
  assert.equal(await deliver('invoice.payment_failed',{id:invoice.id}),200);
  assert.equal((await status()).remaining,0);
  invoice.id='in_renewal'+sequence;
  invoice.billing_reason='subscription_cycle';
  invoice.lines.data[0].period={start:now()-5,end:now()+30*86400};
  charge.id='ch_renewal'+sequence;
  assert.equal(await paid(),200);
  assert.equal(await paid(),200);
  assert.equal((await billing.collection('periods').get()).size,2);
  assert.equal((await status()).remaining,1);
  await call('generatePaidDecisionReport',{projectId:project});
  assert.equal((await status()).remaining,0);
});

test('subscription and one-time checkout serialize on the same decision',async()=>{
  await seedProject();
  await call('createCommercialCheckout',{offer:'starter',projectId:project});
  await assert.rejects(call('createCommercialCheckout',{offer:'report',projectId:project}),{code:'failed-precondition'});
  assert.equal(checkoutCalls,1);
});
