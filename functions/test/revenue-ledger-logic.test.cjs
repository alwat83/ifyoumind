const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ledgerEntryFor, shouldApplyLedgerEvent, mergeLedgerData, revenueSummary, invoiceOrganizationId, LEDGER_EVENT_TYPES, orderingField, reconcileWithStripe, CLOSED_DISPUTE_STATUSES } =
  require('../lib/intelligence/revenue-ledger-logic');

const ev = (type, object, extra = {}) => ({ id: `evt_${type}`, type, created: 1000, livemode: true, data: { object }, ...extra });

test('only renewal, refund and dispute events enter the ledger', () => {
  for (const type of ['checkout.session.completed', 'customer.subscription.updated', 'payment_intent.succeeded', 'invoice.created']) {
    assert.equal(ledgerEntryFor(ev(type, { id: 'x' })), null, type);
  }
  assert.ok(LEDGER_EVENT_TYPES.has('invoice.paid'));
  assert.equal(ledgerEntryFor(ev('invoice.paid', {})), null, 'no id, no entry');
});

test('invoice.paid distinguishes the first Pro payment from a renewal and finds the workspace on any API version', () => {
  const renewal = ledgerEntryFor(ev('invoice.paid', {
    id: 'in_1', billing_reason: 'subscription_cycle', amount_paid: 3900, currency: 'usd', customer: 'cus_1',
    subscription: 'sub_1', payment_intent: 'pi_r1', status_transitions: { paid_at: 990 },
    subscription_details: { metadata: { organizationId: 'org_a' } },
  }));
  assert.equal(renewal.id, 'invoice_in_1');
  assert.deepEqual([renewal.data.renewal, renewal.data.status, renewal.data.organizationId, renewal.data.amountPaid, renewal.data.paidAtSeconds, renewal.data.livemode],
    [true, 'paid', 'org_a', 3900, 990, true]);
  const first = ledgerEntryFor(ev('invoice.paid', { id: 'in_0', billing_reason: 'subscription_create' }));
  assert.equal(first.data.renewal, false);
  assert.equal(invoiceOrganizationId({ parent: { subscription_details: { metadata: { organizationId: 'org_b' } } } }), 'org_b');
  assert.equal(invoiceOrganizationId({ lines: { data: [{ metadata: {} }, { metadata: { organizationId: 'org_c' } }] } }), 'org_c');
  assert.equal(invoiceOrganizationId({}), null);
  const failed = ledgerEntryFor(ev('invoice.payment_failed', { id: 'in_2', attempt_count: 2 }));
  assert.deepEqual([failed.data.status, failed.data.attemptCount, failed.data.paidAtSeconds], ['payment_failed', 2, null]);
});

test('refunds keep the charge cumulative totals; refund updates add status without overwriting them', () => {
  const refunded = ledgerEntryFor(ev('charge.refunded', { id: 'ch_1', amount: 7900, amount_refunded: 7900, refunded: true, payment_intent: 'pi_1', currency: 'usd' }));
  assert.equal(refunded.id, 'charge_ch_1');
  assert.deepEqual([refunded.data.amountRefunded, refunded.data.fullyRefunded, refunded.data.paymentIntentId], [7900, true, 'pi_1']);
  const update = ledgerEntryFor(ev('charge.refund.updated', { id: 're_1', charge: 'ch_1', status: 'failed', amount: 7900, payment_intent: 'pi_1' }));
  assert.equal(update.id, 'charge_ch_1', 'same document as the charge');
  const merged = mergeLedgerData(refunded.data, update);
  assert.deepEqual([merged.amountRefunded, merged.fullyRefunded, merged.lastRefundStatus], [7900, true, 'failed']);
});

test('disputes are keyed by dispute and carry their status', () => {
  const dispute = ledgerEntryFor(ev('charge.dispute.closed', { id: 'dp_1', charge: { id: 'ch_1' }, payment_intent: 'pi_1', amount: 7900, status: 'lost', reason: 'fraudulent' }));
  assert.equal(dispute.id, 'dispute_dp_1');
  assert.deepEqual([dispute.data.chargeId, dispute.data.status], ['ch_1', 'lost']);
});

test('an older event never overwrites a newer one', () => {
  assert.equal(shouldApplyLedgerEvent(1000, undefined), true);
  assert.equal(shouldApplyLedgerEvent(1000, 999), true);
  assert.equal(shouldApplyLedgerEvent(1000, 1000), true);
  assert.equal(shouldApplyLedgerEvent(999, 1000), false);
  assert.equal(shouldApplyLedgerEvent(1000, 'garbage'), true);
});

test('refund updates are ordered on their own clock and never touch charge totals', () => {
  const update = ledgerEntryFor({ ...ev('charge.refund.updated', { id: 're_9', charge: 'ch_9', status: 'failed', amount: 500 }), created: 900 });
  const charge = ledgerEntryFor({ ...ev('charge.refunded', { id: 'ch_9', amount: 7900, amount_refunded: 7900, refunded: true }), created: 1000 });
  assert.equal(orderingField(update), 'refundEventCreated');
  assert.equal(orderingField(charge), 'eventCreated');
  const afterCharge = mergeLedgerData(undefined, charge);
  // The older refund update arrives last: still applied (its own clock), totals untouched.
  assert.equal(shouldApplyLedgerEvent(900, afterCharge.refundEventCreated), true);
  const merged = mergeLedgerData(afterCharge, update);
  assert.deepEqual([merged.amountRefunded, merged.eventCreated, merged.refundEventCreated, merged.lastRefundStatus, merged.eventType],
    [7900, 1000, 900, 'failed', 'charge.refunded']);
});

test('closed dispute statuses include inquiries and prevented disputes', () => {
  for (const status of ['won', 'lost', 'warning_closed', 'prevented']) assert.ok(CLOSED_DISPUTE_STATUSES.has(status), status);
  for (const status of ['needs_response', 'under_review', 'warning_needs_response', 'warning_under_review']) assert.ok(!CLOSED_DISPUTE_STATUSES.has(status), status);
});

const live = (fields) => ({ livemode: true, ...fields });

test('genuine paying customers: live only, QA excluded, reversals subtracted, subscriptions matched by customer', () => {
  const payments = [
    live({ offer: 'report', organizationId: 'org_a', paymentIntentId: 'pi_a', fulfilment: 'fulfilled' }),
    live({ offer: 'report', organizationId: 'org_b', paymentIntentId: 'pi_b', fulfilment: 'fulfilled' }),
    live({ offer: 'report', organizationId: 'org_c', paymentIntentId: 'pi_c', fulfilment: 'fulfilled' }),
    // Pro checkouts have no payment intent on current Stripe API versions, only a customer.
    live({ offer: 'pro', organizationId: 'org_d', paymentIntentId: null, customerId: 'cus_d' }),
    live({ offer: 'pro', organizationId: 'org_e', paymentIntentId: null, customerId: 'cus_e' }),
    { offer: 'report', organizationId: 'org_test', livemode: false, paymentIntentId: 'pi_t' },
    live({ offer: 'report', organizationId: 'org_qa', paymentIntentId: 'pi_qa' }),
    live({ offer: 'report', organizationId: 'org_a', paymentIntentId: 'pi_dup', fulfilment: 'duplicate' }),
  ];
  const ledger = [
    live({ kind: 'charge', chargeId: 'ch_b', paymentIntentId: 'pi_b', amountRefunded: 7900, fullyRefunded: true }),
    live({ kind: 'dispute', disputeId: 'dp_c', chargeId: 'ch_c', paymentIntentId: 'pi_c', status: 'lost' }),
    live({ kind: 'charge', chargeId: 'ch_qa', paymentIntentId: 'pi_qa', amountRefunded: 7900, fullyRefunded: true }),
    live({ kind: 'charge', chargeId: 'ch_x', paymentIntentId: 'pi_unknown', customerId: 'cus_unknown', amountRefunded: 100 }),
    { kind: 'charge', livemode: false, chargeId: 'ch_t', paymentIntentId: 'pi_t', amountRefunded: 7900, fullyRefunded: true },
    // org_d: Pro start + one renewal, then its first charge fully refunded → still paying (2 > 1).
    live({ kind: 'invoice', status: 'paid', renewal: true, organizationId: 'org_d', customerId: 'cus_d' }),
    live({ kind: 'charge', chargeId: 'ch_d1', customerId: 'cus_d', amountRefunded: 3900, fullyRefunded: true }),
    // org_e: its only Pro payment is refunded (matched by customer) → not paying.
    live({ kind: 'charge', chargeId: 'ch_e1', customerId: 'cus_e', amountRefunded: 3900, fullyRefunded: true, lastRefundStatus: 'failed' }),
    live({ kind: 'invoice', status: 'paid', renewal: true, organizationId: 'org_qa' }),
    { kind: 'invoice', livemode: false, status: 'paid', renewal: true, organizationId: 'org_d' },
    live({ kind: 'invoice', status: 'payment_failed', renewal: true, organizationId: 'org_d' }),
    live({ kind: 'dispute', disputeId: 'dp_open', chargeId: 'ch_e2', customerId: 'cus_e', status: 'needs_response' }),
    live({ kind: 'dispute', disputeId: 'dp_inq', chargeId: 'ch_e3', customerId: 'cus_e', status: 'warning_closed' }),
  ];
  const summary = revenueSummary({ payments, ledger, excludedOrganizations: new Set(['org_qa']) });
  assert.equal(summary.genuinePayingCustomers, 2, 'org_a and org_d');
  assert.equal(summary.reportPurchases, 3);
  assert.equal(summary.reportPurchasesNetOfFullRefunds, 1, 'only org_a: b refunded, c lost');
  assert.equal(summary.proSubscriptionsStarted, 2);
  assert.equal(summary.proRenewalsPaid, 1, 'QA and test renewals excluded');
  assert.equal(summary.proRenewalPaymentsFailed, 1);
  assert.equal(summary.refundedMinorUnits, 7900 + 3900 + 3900, 'b, d1, e1; QA, test and unmatched excluded');
  assert.equal(summary.refundsFailed, 1);
  assert.equal(summary.disputesOpen, 1, 'warning_closed is closed');
  assert.equal(summary.disputesLost, 1);
  assert.equal(summary.unmatchedLedgerEntries, 1, 'only ch_x');
});

test('reconciliation lists every difference between Firestore and Stripe live records', () => {
  const records = {
    payments: [
      live({ checkoutSessionId: 'cs_ok', amountTotal: 7900 }),
      live({ checkoutSessionId: 'cs_amount', amountTotal: 3900 }),
      live({ checkoutSessionId: 'cs_ghost', amountTotal: 7900 }),
      { checkoutSessionId: 'cs_test', amountTotal: 7900, livemode: false },
    ],
    ledger: [
      live({ kind: 'invoice', invoiceId: 'in_ok', status: 'paid' }),
      live({ kind: 'charge', chargeId: 'ch_ok', amountRefunded: 7900 }),
      live({ kind: 'charge', chargeId: 'ch_partial', amountRefunded: 1000 }),
      live({ kind: 'dispute', disputeId: 'dp_ok', status: 'won' }),
      live({ kind: 'dispute', disputeId: 'dp_stale', status: 'needs_response' }),
    ],
  };
  const stripe = {
    sessions: [
      live({ id: 'cs_ok', payment_status: 'paid', amount_total: 7900, metadata: { offer: 'report' } }),
      live({ id: 'cs_amount', payment_status: 'paid', amount_total: 7900, metadata: { offer: 'report' } }),
      live({ id: 'cs_missing', payment_status: 'paid', amount_total: 3900, metadata: { offer: 'pro' } }),
      live({ id: 'cs_unpaid', payment_status: 'unpaid', amount_total: 7900, metadata: { offer: 'report' } }),
      live({ id: 'cs_other', payment_status: 'paid', amount_total: 100, metadata: {} }),
    ],
    invoices: [
      live({ id: 'in_ok', status: 'paid', billing_reason: 'subscription_cycle' }),
      live({ id: 'in_missing', status: 'paid', billing_reason: 'subscription_cycle' }),
      live({ id: 'in_first', status: 'paid', billing_reason: 'subscription_create' }),
    ],
    charges: [
      live({ id: 'ch_ok', amount_refunded: 7900 }),
      live({ id: 'ch_partial', amount_refunded: 7900 }),
      live({ id: 'ch_new', amount_refunded: 500 }),
      live({ id: 'ch_none', amount_refunded: 0 }),
    ],
    disputes: [live({ id: 'dp_ok', status: 'won' }), live({ id: 'dp_stale', status: 'lost' }), live({ id: 'dp_new', status: 'needs_response' })],
  };
  const r = reconcileWithStripe(records, stripe);
  assert.deepEqual(r.paymentsMissing, ['cs_missing']);
  assert.deepEqual(r.paymentAmountMismatch, ['cs_amount']);
  assert.deepEqual(r.paymentsNotInStripe, ['cs_ghost']);
  assert.deepEqual(r.renewalsMissing, ['in_missing']);
  assert.deepEqual(r.refundsMissingOrDifferent, ['ch_partial', 'ch_new']);
  assert.deepEqual(r.disputesMissingOrDifferent, ['dp_stale', 'dp_new']);
  assert.equal(r.clean, false);
  assert.equal(reconcileWithStripe({ payments: [], ledger: [] }, { sessions: [], invoices: [], charges: [], disputes: [] }).clean, true);
});
