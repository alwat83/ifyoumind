const test = require('node:test');
const assert = require('node:assert/strict');
const { parseFredObservations } = require('../lib/intelligence/fred-observations');

test('FRED parses valid observations, skips missing and nonnumeric values, oldest first', () => {
  assert.deepEqual(parseFredObservations({ observations: [
    { date: '2026-03-01', value: '321.4' },
    { date: '2026-02-01', value: '.' },
    { date: '2026-01-01', value: '320.2' },
    { date: 'bad-date', value: '999' },
    { date: '2025-12-01', value: '' },
  ] }), [
    { date: '2026-01-01', value: 320.2 },
    { date: '2026-03-01', value: 321.4 },
  ]);
});

test('FRED rejects unexpected responses', () => {
  assert.throws(() => parseFredObservations({ error: 'bad key' }), /Unexpected FRED response/);
});

test('FRED rejects payloads with no numeric values', () => {
  assert.throws(() => parseFredObservations({ observations: [
    { date: '2026-02-01', value: '.' },
  ] }), /No numeric observations/);
});
