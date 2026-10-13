const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ledgerEntryFor, shouldApplyLedgerEvent, mergeLedgerData, revenueSummary, invoiceOrganizationId, LEDGER_EVENT_TYPES, orderingField, reconcileWithStripe, CLOSED_DISPUTE_STATUSES, resolveReversal } =
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

test('a reversal is tied to a purchase only by payment intent, or a customer with exactly one payment', () => {
  const byIntent = new Map([['pi_r', { organizationId: 'org_a', paymentKey: 'session:cs_r' }]]);
  const byCustomer = new Map([
    ['cus_one', [{ organizationId: 'org_b', paymentKey: 'session:cs_b' }]],
    ['cus_many', [{ organizationId: 'org_c', paymentKey: 'session:cs_c1' }, { organizationId: 'org_c', paymentKey: 'invoice:in_c2' }]],
    ['cus_split', [{ organizationId: 'org_d', paymentKey: 'session:cs_d' }, { organizationId: 'org_e', paymentKey: 'session:cs_e' }]],
  ]);
  assert.deepEqual(resolveReversal({ paymentIntentId: 'pi_r', customerId: 'cus_many' }, byIntent, byCustomer),
    { status: 'resolved', organizationId: 'org_a', paymentKey: 'session:cs_r', how: 'payment_intent' }, 'intent wins over customer');
  assert.deepEqual(resolveReversal({ customerId: 'cus_one' }, byIntent, byCustomer),
    { status: 'resolved', organizationId: 'org_b', paymentKey: 'session:cs_b', how: 'only_payment_for_customer' });
  assert.deepEqual(resolveReversal({ customerId: 'cus_many' }, byIntent, byCustomer),
    { status: 'unresolved', organizationId: 'org_c', reason: 'customer_has_several_payments' });
  assert.deepEqual(resolveReversal({ customerId: 'cus_split' }, byIntent, byCustomer),
    { status: 'unresolved', organizationId: null, reason: 'customer_in_several_workspaces' });
  assert.deepEqual(resolveReversal({ paymentIntentId: 'pi_x', customerId: 'cus_x' }, byIntent, byCustomer), { status: 'unmatched' });
});


test('verified paying customers assume every unresolved reversal applies; the rest need review', () => {
  const payments = [
    live({ checkoutSessionId: 'cs_a', offer: 'report', organizationId: 'org_a', paymentIntentId: 'pi_a', fulfilment: 'fulfilled' }),
    live({ checkoutSessionId: 'cs_b', offer: 'report', organizationId: 'org_b', paymentIntentId: 'pi_b', fulfilment: 'fulfilled' }),
    live({ checkoutSessionId: 'cs_c', offer: 'report', organizationId: 'org_c', paymentIntentId: 'pi_c', fulfilment: 'fulfilled' }),
    // Pro checkouts have no payment intent on current Stripe API versions, only a customer.
    live({ checkoutSessionId: 'cs_d', offer: 'pro', organizationId: 'org_d', paymentIntentId: null, customerId: 'cus_d' }),
    live({ checkoutSessionId: 'cs_e', offer: 'pro', organizationId: 'org_e', paymentIntentId: null, customerId: 'cus_e' }),
    live({ checkoutSessionId: 'cs_f', offer: 'pro', organizationId: 'org_f', paymentIntentId: null, customerId: 'cus_f' }),
    { checkoutSessionId: 'cs_t', offer: 'report', organizationId: 'org_test', livemode: false, paymentIntentId: 'pi_t' },
    live({ checkoutSessionId: 'cs_qa', offer: 'report', organizationId: 'org_qa', paymentIntentId: 'pi_qa' }),
    live({ checkoutSessionId: 'cs_dup', offer: 'report', organizationId: 'org_a', paymentIntentId: 'pi_dup', fulfilment: 'duplicate' }),
  ];
  const ledger = [
    live({ kind: 'charge', chargeId: 'ch_b', paymentIntentId: 'pi_b', amountRefunded: 7900, fullyRefunded: true }),
    live({ kind: 'dispute', disputeId: 'dp_c', chargeId: 'ch_c', paymentIntentId: 'pi_c', status: 'lost' }),
    live({ kind: 'charge', chargeId: 'ch_qa', paymentIntentId: 'pi_qa', amountRefunded: 7900, fullyRefunded: true }),
    live({ kind: 'charge', chargeId: 'ch_x', paymentIntentId: 'pi_unknown', customerId: 'cus_unknown', amountRefunded: 100 }),
    { kind: 'charge', livemode: false, chargeId: 'ch_t', paymentIntentId: 'pi_t', amountRefunded: 7900, fullyRefunded: true },
    // org_d: Pro start + a renewal; one refund by customer only → ambiguous, which payment? Unresolved.
    // Even if it applies, one payment stands: verified.
    live({ kind: 'invoice', invoiceId: 'in_d2', status: 'paid', renewal: true, organizationId: 'org_d', customerId: 'cus_d' }),
    live({ kind: 'charge', chargeId: 'ch_d1', customerId: 'cus_d', amountRefunded: 3900, fullyRefunded: true }),
    // org_e: one Pro payment only, refunded by customer → unambiguous, resolved: not paying.
    live({ kind: 'charge', chargeId: 'ch_e1', customerId: 'cus_e', amountRefunded: 3900, fullyRefunded: true, lastRefundStatus: 'failed' }),
    // org_f: Pro start + renewal, TWO refunds by customer only → both unresolved → needs review.
    live({ kind: 'invoice', invoiceId: 'in_f2', status: 'paid', renewal: true, organizationId: 'org_f', customerId: 'cus_f' }),
    live({ kind: 'charge', chargeId: 'ch_f1', customerId: 'cus_f', amountRefunded: 3900, fullyRefunded: true }),
    live({ kind: 'charge', chargeId: 'ch_f2', customerId: 'cus_f', amountRefunded: 3900, fullyRefunded: true }),
    live({ kind: 'invoice', invoiceId: 'in_qa', status: 'paid', renewal: true, organizationId: 'org_qa' }),
    { kind: 'invoice', invoiceId: 'in_t', livemode: false, status: 'paid', renewal: true, organizationId: 'org_d' },
    live({ kind: 'invoice', invoiceId: 'in_d3', status: 'payment_failed', renewal: true, organizationId: 'org_d' }),
    live({ kind: 'dispute', disputeId: 'dp_open', chargeId: 'ch_d9', customerId: 'cus_d', status: 'needs_response' }),
    live({ kind: 'dispute', disputeId: 'dp_inq', chargeId: 'ch_e3', customerId: 'cus_e', status: 'warning_closed' }),
  ];
  const s = revenueSummary({ payments, ledger, excludedOrganizations: new Set(['org_qa']) });
  assert.equal(s.genuinePayingCustomers, 2, 'org_a and org_d');
  assert.equal(s.payingCustomersNeedingReview, 1, 'org_f');
  assert.equal(s.reportPurchases, 3);
  assert.equal(s.reportPurchasesNetOfFullRefunds, 1, 'org_a only');
  assert.equal(s.proSubscriptionsStarted, 3);
  assert.equal(s.proRenewalsPaid, 2, 'org_d and org_f; QA and test excluded');
  assert.equal(s.proRenewalPaymentsFailed, 1);
  assert.equal(s.refundedMinorUnits, 7900 + 3900, 'resolved only: ch_b and ch_e1');
  assert.equal(s.refundedMinorUnitsUnresolved, 3900 * 3, 'ch_d1, ch_f1, ch_f2');
  assert.equal(s.refundsFailed, 1);
  assert.equal(s.disputesOpen, 1, 'warning_closed is closed');
  assert.equal(s.disputesLost, 1);
  assert.deepEqual(s.unresolvedReversals.map(r => r.id).sort(), ['ch_d1', 'ch_f1', 'ch_f2', 'dp_open']);
  assert.ok(s.unresolvedReversals.every(r => r.reason === 'customer_has_several_payments'));
  assert.equal(s.unmatchedLedgerEntries, 1, 'only ch_x');
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
  const { verified, discrepancies: r } = reconcileWithStripe(records, stripe);
  assert.deepEqual(verified, { paymentsMatched: 1, renewalsMatched: 1, refundsMatched: 1, disputesMatched: 1 });
  assert.deepEqual(r.paymentsMissing, ['cs_missing']);
  assert.deepEqual(r.paymentAmountMismatch, ['cs_amount']);
  assert.deepEqual(r.paymentsNotInStripe, ['cs_ghost']);
  assert.deepEqual(r.renewalsMissing, ['in_missing']);
  assert.deepEqual(r.refundsMissingOrDifferent, ['ch_partial', 'ch_new']);
  assert.deepEqual(r.disputesMissingOrDifferent, ['dp_stale', 'dp_new']);
  assert.equal(reconcileWithStripe(records, stripe).clean, false);
  assert.equal(reconcileWithStripe({ payments: [], ledger: [] }, { sessions: [], invoices: [], charges: [], disputes: [] }).clean, true);
});

// Shapes copied from the ifYouMind Stripe SANDBOX (test mode), 2026-10-13: ids, amounts and links only.
test('sandbox shapes: a report refund matches by payment intent; a Pro refund matches only by customer', () => {
  const payments = [
    // Report checkout: the session carries the charge's payment intent.
    live({ checkoutSessionId: 'cs_test_a1UaDdVd', offer: 'report', organizationId: 'org_sbx', paymentIntentId: 'pi_3UOko3CZjBRiXCDe0I5i3njV', customerId: null, fulfilment: 'fulfilled' }),
    // Pro checkout: payment_intent is null on the session; only the customer links it.
    live({ checkoutSessionId: 'cs_test_a1G2PqT0', offer: 'pro', organizationId: 'org_sbx', paymentIntentId: null, customerId: 'cus_VPTo1VEVpgsPZ1', invoiceId: 'in_1UOeqnCZjBRiXCDer8lWgagM' }),
  ];
  const refunds = [
    live({ kind: 'charge', chargeId: 'ch_3UOko3CZjBRiXCDe03z0xlPs', paymentIntentId: 'pi_3UOko3CZjBRiXCDe0I5i3njV', customerId: null, amountRefunded: 7900, fullyRefunded: true }),
    live({ kind: 'charge', chargeId: 'ch_3UOeqnCZjBRiXCDe0mmlL8Dk', paymentIntentId: 'pi_3UOeqnCZjBRiXCDe0vTBtexQ', customerId: 'cus_VPTo1VEVpgsPZ1', amountRefunded: 3900, fullyRefunded: true }),
  ];
  const s = revenueSummary({ payments, ledger: refunds, excludedOrganizations: new Set() });
  assert.equal(s.refundedMinorUnits, 7900 + 3900, 'both resolved: report by intent, Pro by its only payment for that customer');
  assert.deepEqual(s.unresolvedReversals, []);
  assert.equal(s.genuinePayingCustomers, 0, 'both purchases fully refunded');
  // A Pro renewal for the same customer makes the Pro refund ambiguous: it is no longer guessed.
  const withRenewal = revenueSummary({ payments, ledger: [...refunds, live({ kind: 'invoice', invoiceId: 'in_renewal', status: 'paid', renewal: true, organizationId: 'org_sbx', customerId: 'cus_VPTo1VEVpgsPZ1' })], excludedOrganizations: new Set() });
  assert.deepEqual(withRenewal.unresolvedReversals.map(r => r.id), ['ch_3UOeqnCZjBRiXCDe0mmlL8Dk']);
  assert.equal(withRenewal.refundedMinorUnitsUnresolved, 3900);
  // Report refunded (resolved) leaves Pro start + renewal; even if the ambiguous refund applies, one stands.
  assert.equal(withRenewal.genuinePayingCustomers, 1, 'conservative: still paying with the ambiguous refund applied');
  assert.equal(withRenewal.payingCustomersNeedingReview, 0);
});
