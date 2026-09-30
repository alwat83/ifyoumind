const { test } = require('node:test');
const assert = require('node:assert/strict');
const { metricFactKey, validateMetricFact, reconcileFacts, totalFacts } = require('../lib/intelligence/metric-facts');
const fact = (overrides = {}) => ({
  schemaVersion: 1, organizationId: 'org-a', connectionId: 'stripe-a', source: 'stripe',
  sourceAccountId: 'acct-a', metric: 'stripe.cash_collected_minor', date: '2026-09-29',
  reportingTimezone: 'America/Chicago', dimensions: { plan: 'premium', channel: 'web' },
  value: 4999, unit: 'currency_minor', currency: 'USD', qualityFlags: [],
  sourceUpdatedAt: '2026-09-30T12:00:00Z', observedAt: '2026-09-30T12:05:00Z',
  syncRunId: 'run-1', ...overrides,
});
test('source corrections replace daily facts under the same stable key', () => {
  const previous = fact();
  const corrected = fact({ value: 3999, syncRunId: 'run-2', sourceUpdatedAt: '2026-09-30T13:00:00Z' });
  assert.equal(metricFactKey(previous), metricFactKey(corrected));
  assert.equal(reconcileFacts([previous], [corrected, corrected]).length, 1);
  assert.equal(totalFacts(reconcileFacts([previous], [corrected])), 3999);
  assert.equal(totalFacts([previous, corrected, corrected]), 3999);
  assert.equal(reconcileFacts([corrected], [previous])[0].value, 3999);
});
test('dimensions are order-independent, while tenant/account/currency are isolated', () => {
  const original = fact();
  assert.equal(metricFactKey(original), metricFactKey(fact({ dimensions: { channel: 'web', plan: 'premium' } })));
  for (const variant of [{ organizationId: 'org-b' }, { sourceAccountId: 'acct-b' }, { currency: 'EUR' }]) {
    assert.notEqual(metricFactKey(original), metricFactKey(fact(variant)));
  }
  assert.throws(() => totalFacts([original, fact({ organizationId: 'org-b' })]));
  assert.throws(() => totalFacts([original, fact({ currency: 'EUR' })]));
});
test('rejects fractional money, negative counts, cross-source metrics, and bad timezones', () => {
  for (const invalid of [{ value: 49.99 }, { value: -1 }, { metric: 'ga4.sessions' },
    { reportingTimezone: 'somewhere' }, { currency: undefined }, { sourceUpdatedAt: 'yesterday' },
    { date: '2026-02-30' }]) {
    assert.throws(() => validateMetricFact(fact(invalid)));
  }
  assert.throws(() => validateMetricFact(fact({ source: 'ga4', metric: 'ga4.sessions', unit: 'count', currency: 'USD' })));
});
test('aggregate rejects overflow and respects source quality flags', () => {
  const partial = fact({ qualityFlags: ['partial_period'] });
  validateMetricFact(partial);
  assert.throws(() => totalFacts([fact({ value: Number.MAX_SAFE_INTEGER }), fact({ dimensions: { plan: 'free' }, value: 1 })]));
  assert.throws(() => validateMetricFact(fact({ qualityFlags: ['invented_flag'] })));
});
