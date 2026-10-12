// Read-only reconciliation of Firestore payment records against Stripe live mode.
// Not run by CI or deploys. Founder-run only, after approval:
//
//   STRIPE_RECONCILE_KEY=rk_live_...   (a restricted key with READ access to Checkout Sessions,
//                                       Charges, Disputes and Invoices, and nothing else)
//   gcloud auth application-default login   (an account that can read Firestore)
//   node scripts/reconcile-stripe.mjs --project ifyoumind-473fe --since 2026-10-01
//
// It only sends GET requests to Stripe and only reads Firestore. It prints ids, never names,
// emails or card details.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { reconcileWithStripe } = require('../functions/lib/intelligence/revenue-ledger-logic.js');

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, i, all) =>
  value.startsWith('--') ? [...pairs, [value.slice(2), all[i + 1]]] : pairs, []));
const key = process.env.STRIPE_RECONCILE_KEY || '';

function refuse(message) { console.error(`Refusing: ${message}`); process.exit(2); }
if (args.project !== 'ifyoumind-473fe') refuse('pass --project ifyoumind-473fe explicitly.');
if (!/^rk_live_/.test(key)) refuse('STRIPE_RECONCILE_KEY must be a live restricted key (rk_live_…), never a secret key.');
const since = Math.floor(Date.parse(args.since || '') / 1000);
if (!Number.isFinite(since)) refuse('pass --since YYYY-MM-DD.');

async function list(path, query = {}) {
  const out = [];
  let startingAfter;
  do {
    const url = new URL(`https://api.stripe.com/v1/${path}`);
    for (const [k, v] of Object.entries({ limit: '100', 'created[gte]': String(since), ...query })) url.searchParams.set(k, v);
    if (startingAfter) url.searchParams.set('starting_after', startingAfter);
    const response = await fetch(url, { method: 'GET', headers: { authorization: `Bearer ${key}` } });
    if (!response.ok) refuse(`Stripe ${path} returned ${response.status}.`);
    const body = await response.json();
    out.push(...body.data);
    startingAfter = body.has_more ? body.data.at(-1)?.id : undefined;
  } while (startingAfter);
  return out;
}

const [sessions, charges, disputes, invoices] = await Promise.all([
  list('checkout/sessions', { status: 'complete' }),
  list('charges'),
  list('disputes'),
  list('invoices', { status: 'paid' }),
]);

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const db = getFirestore(initializeApp({ projectId: 'ifyoumind-473fe' }, 'reconcile'));
const sinceTs = Timestamp.fromMillis(since * 1000);
const [payments, ledger] = await Promise.all([
  db.collection('stripePayments').where('paidAt', '>=', sinceTs).get(),
  db.collection('stripeLedger').get(),
]);

const result = reconcileWithStripe(
  { payments: payments.docs.map(doc => doc.data()), ledger: ledger.docs.map(doc => doc.data()).filter(e => Number(e.eventCreated ?? e.refundEventCreated) >= since) },
  { sessions, charges, disputes, invoices },
);
console.log(JSON.stringify({ since: args.since, counts: { sessions: sessions.length, charges: charges.length, disputes: disputes.length, invoices: invoices.length }, ...result }, null, 2));
process.exit(result.clean ? 0 : 1);
