const { test } = require('node:test');
const assert = require('node:assert/strict');
const { alignObservations, observationKey, pearson } = require('../lib/intelligence/universal-analysis');

test('universal observations align on period geography and entity', () => {
  const left = [
    { period: '2026-01', geography: '35242', entity: 'Birmingham', value: 100 },
    { period: '2026-02', geography: '35242', entity: 'Birmingham', value: 110 },
    { period: '2026-01', geography: '90001', entity: 'Los Angeles', value: 200 },
  ];
  const right = [
    { period: '2026-01', geography: '35242', entity: 'Birmingham', value: 10 },
    { period: '2026-02', geography: '35242', entity: 'Birmingham', value: 9 },
    { period: '2026-01', geography: '90002', entity: 'Los Angeles', value: 20 },
  ];
  const matched = alignObservations(left, right);
  assert.equal(matched.length, 2);
  assert.deepEqual(matched.map(x => x.period), ['2026-01', '2026-02']);
});

test('context matching is case and whitespace insensitive', () => {
  assert.equal(
    observationKey({ period: '2026', geography: ' Birmingham ', entity: 'ZIP 35242', value: 1 }),
    observationKey({ period: '2026', geography: 'birmingham', entity: 'zip 35242', value: 2 }),
  );
});

test('pearson requires at least three paired observations', () => {
  assert.equal(pearson([1, 2], [2, 4]), null);
  assert.equal(pearson([1, 2, 3], [2, 4, 6]), 1);
});
