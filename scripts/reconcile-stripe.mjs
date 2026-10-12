// Read-only reconciliation of Firestore payment records against Stripe live mode.
// Not run by CI or deploys. Founder-run only (approved 2026-10-12 as read-only):
//
//   1. Stripe Dashboard (live) → Developers → API keys → Create restricted key. Permissions:
//      Checkout Sessions: Read · Charges: Read · Disputes: Read · Invoices: Read · everything else: None.
//   2. A Google account with only the "Cloud Datastore Viewer" role on ifyoumind-473fe:
//      gcloud auth application-default login
//   3. npm --prefix functions run build
//      STRIPE_RECONCILE_KEY=rk_live_... node scripts/reconcile-stripe.mjs --project ifyoumind-473fe --since 2026-10-01
//
// Guarantees (enforced below and by test/reconcile-script.test.mjs):
// - Stripe: only GET requests; the key must be a live restricted key (rk_live_), never a secret
//   key; a key that can also read Customers is refused as broader than needed.
// - Firestore: only collection reads; there is no write call anywhere in this file. Use a
//   viewer-only account so even a bug could not write.
// - Output: Stripe and Firestore ids and counts only. The key, names, emails, addresses and card
//   details are never printed; Stripe error bodies are never printed.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, i, all) =>
  value.startsWith('--') ? [...pairs, [value.slice(2), all[i + 1]]] : pairs, []));
const key = process.env.STRIPE_RECONCILE_KEY || '';

function refuse(message) { console.error(`Refusing: ${message}`); process.exit(2); }
if (args.project !== 'ifyoumind-473fe') refuse('pass --project ifyoumind-473fe explicitly.');
if (!/^rk_live_[A-Za-z0-9]+$/.test(key)) refuse('STRIPE_RECONCILE_KEY must be a live restricted key (rk_live_…), never a secret key.');
const since = Math.floor(Date.parse(args.since || '') / 1000);
if (!Number.isFinite(since)) refuse('pass --since YYYY-MM-DD.');

let logic;
try { logic = require('../functions/lib/intelligence/revenue-ledger-logic.js'); }
catch { refuse('run `npm --prefix functions run build` first.'); }

/** The only network call in this script. GET only; errors report the status, never the body. */
async function stripeGet(path, query = {}) {
  const url = new URL(`https://api.stripe.com/v1/${path}`);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const response = await fetch(url, { method: 'GET', headers: { authorization: `Bearer ${key}` } });
  return { status: response.status, body: response.ok ? await response.json() : null };
}

// Least privilege: Customers hold names and emails and aren't needed here.
const probe = await stripeGet('customers', { limit: '1' });
if (probe.status === 200) refuse('the key can read Customers; create one with only the four Read permissions listed above.');
if (probe.status === 401) refuse('Stripe rejected the key (401).');

async function list(path, query = {}) {
  const out = [];
  let startingAfter;
  do {
    const { status, body } = await stripeGet(path, { limit: '100', 'created[gte]': String(since), ...query, ...(startingAfter ? { starting_after: startingAfter } : {}) });
    if (!body) refuse(`Stripe ${path} returned HTTP ${status}. Check the key's Read permission for it.`);
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
const [payments, ledger] = await Promise.all([
  db.collection('stripePayments').where('paidAt', '>=', Timestamp.fromMillis(since * 1000)).get(),
  db.collection('stripeLedger').get(),
]);

const result = logic.reconcileWithStripe(
  { payments: payments.docs.map(doc => doc.data()),
    ledger: ledger.docs.map(doc => doc.data()).filter(e => Number(e.eventCreated ?? e.refundEventCreated) >= since) },
  { sessions, charges, disputes, invoices },
);
console.log(JSON.stringify({
  since: args.since,
  read: { stripeSessions: sessions.length, stripeCharges: charges.length, stripeDisputes: disputes.length, stripeInvoices: invoices.length,
    firestorePayments: payments.size, firestoreLedger: ledger.size },
  verified: result.verified,
  discrepancies: result.discrepancies,
  clean: result.clean,
}, null, 2));
process.exit(result.clean ? 0 : 1);
