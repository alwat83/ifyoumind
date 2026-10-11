const { test } = require('node:test');
const assert = require('node:assert/strict');
const { summarizePayments } = require('../lib/intelligence/growth-metrics');

const at = (iso) => ({ toDate: () => new Date(iso) });

test('live and test payments are counted separately', () => {
  const summary = summarizePayments([
    { offer: 'report', livemode: true, amountTotal: 7900, currency: 'usd', paidAt: at('2026-10-11T10:00:00Z'), organizationId: 'org1' },
    { offer: 'pro', livemode: true, amountTotal: 3900, currency: 'usd', paidAt: at('2026-10-12T10:00:00Z'), organizationId: 'org2' },
    { offer: 'report', livemode: false, amountTotal: 7900, currency: 'usd', paidAt: at('2026-10-12T11:00:00Z') },
  ]);
  assert.deepEqual(summary.live, { payments: 2, reports: 1, pro: 1, grossByCurrency: { USD: 11800 } });
  assert.deepEqual(summary.test, { payments: 1, reports: 1, pro: 0, grossByCurrency: { USD: 7900 } });
  assert.equal(summary.recentLive.length, 2);
  assert.equal(summary.recentLive[0].offer, 'pro');
});

test('gross revenue is never summed across currencies', () => {
  const summary = summarizePayments([
    { offer: 'report', livemode: true, amountTotal: 7900, currency: 'usd' },
    { offer: 'report', livemode: true, amountTotal: 10522, currency: 'sgd' },
  ]);
  assert.deepEqual(summary.live.grossByCurrency, { USD: 7900, SGD: 10522 });
});

test('payments without a livemode flag are treated as test payments', () => {
  const summary = summarizePayments([{ offer: 'report', amountTotal: 7900, currency: 'usd' }]);
  assert.equal(summary.live.payments, 0);
  assert.equal(summary.test.payments, 1);
  assert.deepEqual(summary.recentLive, []);
});
