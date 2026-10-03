const { test } = require('node:test');
const assert = require('node:assert/strict');

// Reasoning policy tests focus on the statistical primitives used by the reasoning layer.
const { alignObservations, pearson } = require('../lib/intelligence/universal-analysis');

test('reasoning can identify a strong same-direction association', () => {
  const target = [
    { period: '1', geography: 'A', entity: 'X', value: 10 },
    { period: '2', geography: 'A', entity: 'X', value: 20 },
    { period: '3', geography: 'A', entity: 'X', value: 30 },
    { period: '4', geography: 'A', entity: 'X', value: 40 },
  ];
  const candidate = [
    { period: '1', geography: 'A', entity: 'X', value: 2 },
    { period: '2', geography: 'A', entity: 'X', value: 4 },
    { period: '3', geography: 'A', entity: 'X', value: 6 },
    { period: '4', geography: 'A', entity: 'X', value: 8 },
  ];
  const matched = alignObservations(target, candidate);
  assert.equal(pearson(matched.map(x => x.a), matched.map(x => x.b)), 1);
});

test('reasoning can identify an inverse association', () => {
  const target = [1,2,3,4];
  const candidate = [8,6,4,2];
  assert.equal(pearson(target, candidate), -1);
});
