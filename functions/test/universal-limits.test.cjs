const { test } = require('node:test');
const assert = require('node:assert/strict');
const { nextUsage, assertObservationRoom, cleanDimensions, DAILY_QUOTAS, UNIVERSAL_LIMITS } = require('../lib/intelligence/universal-limits');
const { withoutEvidence } = require('../lib/intelligence/universal-reasoning');

const day = new Date('2026-10-14T12:00:00Z');

test('daily quota counts per action, resets on a new UTC day, refuses at the limit', () => {
  let r = nextUsage(undefined, 'ask', day);
  assert.deepEqual(r, { allowed: true, record: { day: '2026-10-14', counts: { ask: 1 }, expiresAt: new Date('2026-10-16T00:00:00Z') } });
  r = nextUsage({ day: '2026-10-14', counts: { ask: DAILY_QUOTAS.ask - 1, seedDemo: 2 } }, 'ask', day);
  assert.equal(r.allowed, true);
  assert.equal(r.record.counts.ask, DAILY_QUOTAS.ask);
  assert.equal(r.record.counts.seedDemo, 2, 'other actions are untouched');
  assert.equal(nextUsage({ day: '2026-10-14', counts: { ask: DAILY_QUOTAS.ask } }, 'ask', day).allowed, false);
  assert.deepEqual(nextUsage({ day: '2026-10-13', counts: { ask: 999 } }, 'ask', day).record.counts, { ask: 1 }, 'a new day starts at zero');
  assert.equal(nextUsage({ day: 7, counts: 'junk' }, 'seedDemo', day).allowed, true, 'malformed stored data is treated as empty');
});

test('observation room: refuses only what would pass the cap', () => {
  assert.doesNotThrow(() => assertObservationRoom(UNIVERSAL_LIMITS.observationsPerDataset - 400, 400));
  assert.throws(() => assertObservationRoom(UNIVERSAL_LIMITS.observationsPerDataset - 399, 400), /can hold up to 5,000/);
  assert.throws(() => assertObservationRoom(UNIVERSAL_LIMITS.observationsPerDataset, 1));
});

test('dimensions: strings only, at most 20 pairs, bounded lengths', () => {
  assert.deepEqual(cleanDimensions(undefined), {});
  assert.deepEqual(cleanDimensions({ ' region ': ' West ' }), { region: 'West' });
  assert.throws(() => cleanDimensions({ nested: { a: 1 } }), /invalid dimensions/);
  assert.throws(() => cleanDimensions(['a']), /invalid dimensions/);
  assert.throws(() => cleanDimensions(Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`k${i}`, 'v']))), /more than 20/);
  assert.throws(() => cleanDimensions({ k: 'x'.repeat(201) }), /invalid dimensions/);
});

test('stored analysis results drop the matched points but keep the conclusion', () => {
  const result = { conclusion: 'c', allSignals: [{ datasetId: 'a', correlation: 0.5, evidence: [1, 2, 3] }], supportingEvidence: [], counterEvidence: [{ evidence: [1] }] };
  const stored = withoutEvidence(result);
  assert.equal(stored.conclusion, 'c');
  assert.deepEqual(stored.allSignals, [{ datasetId: 'a', correlation: 0.5, matchedPoints: 3 }]);
  assert.deepEqual(stored.counterEvidence, [{ matchedPoints: 1 }]);
  assert.equal(result.allSignals[0].evidence.length, 3, 'the response itself is not modified');
});
