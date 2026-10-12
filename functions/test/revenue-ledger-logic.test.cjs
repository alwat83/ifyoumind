const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ledgerEntryFor, shouldApplyLedgerEvent, mergeLedgerData, revenueSummary, invoiceOrganizationId, LEDGER_EVENT_TYPES } =
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

test('revenue summary counts only live, non-excluded, non-refunded, non-lost payments', () => {
  const payments = [
    { offer: 'report', organizationId: 'org_a', livemode: true, paymentIntentId: 'pi_a', fulfilment: 'fulfilled' },
    { offer: 'report', organizationId: 'org_b', livemode: true, paymentIntentId: 'pi_b', fulfilment: 'fulfilled' },
    { offer: 'report', organizationId: 'org_c', livemode: true, paymentIntentId: 'pi_c', fulfilment: 'fulfilled' },
    { offer: 'pro', organizationId: 'org_d', livemode: true, paymentIntentId: null },
    { offer: 'report', organizationId: 'org_test', livemode: false, paymentIntentId: 'pi_t' },
    { offer: 'report', organizationId: 'org_qa', livemode: true, paymentIntentId: 'pi_qa' },
    { offer: 'report', organizationId: 'org_a', livemode: true, paymentIntentId: 'pi_dup', fulfilment: 'duplicate' },
  ];
  const ledger = [
    { kind: 'charge', livemode: true, paymentIntentId: 'pi_b', amountRefunded: 7900, fullyRefunded: true },
    { kind: 'dispute', livemode: true, paymentIntentId: 'pi_c', status: 'lost' },
    { kind: 'charge', livemode: true, paymentIntentId: 'pi_qa', amountRefunded: 7900, fullyRefunded: true },
    { kind: 'charge', livemode: true, paymentIntentId: 'pi_unknown', amountRefunded: 100 },
    { kind: 'charge', livemode: false, paymentIntentId: 'pi_t', amountRefunded: 7900, fullyRefunded: true },
    { kind: 'invoice', livemode: true, status: 'paid', renewal: true, organizationId: 'org_d', paymentIntentId: 'pi_r' },
    { kind: 'invoice', livemode: true, status: 'paid', renewal: true, organizationId: 'org_qa' },
    { kind: 'invoice', livemode: false, status: 'paid', renewal: true, organizationId: 'org_d' },
    { kind: 'invoice', livemode: true, status: 'payment_failed', renewal: true, organizationId: 'org_d' },
  ];
  const summary = revenueSummary({ payments, ledger, excludedOrganizations: new Set(['org_qa']) });
  assert.equal(summary.genuinePayingCustomers, 2, 'org_a (report) and org_d (Pro); b refunded, c lost, test and QA excluded');
  assert.equal(summary.reportPurchases, 3, 'live, non-QA, duplicates excluded');
  assert.equal(summary.reportPurchasesNetOfFullRefunds, 2);
  assert.equal(summary.proSubscriptionsStarted, 1);
  assert.equal(summary.proRenewalsPaid, 1);
  assert.equal(summary.proRenewalPaymentsFailed, 1);
  assert.equal(summary.refundedMinorUnits, 7900, 'QA, test and unmatched refunds excluded');
  assert.equal(summary.disputesLost, 1);
  assert.equal(summary.unmatchedLedgerEntries, 1, 'only pi_unknown');
});
