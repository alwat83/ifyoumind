const { test } = require('node:test');
const assert = require('node:assert/strict');
const { compareMetricWindows } = require('../lib/intelligence/insight-rules');

const fact = (date, value) => ({
  schemaVersion: 1,
  organizationId: 'org-a',
  connectionId: 'ga4',
  source: 'ga4',
  sourceAccountId: 'properties/123',
  metric: 'ga4.sessions',
  date,
  reportingTimezone: 'America/Chicago',
  dimensions: {},
  value,
  unit: 'count',
  qualityFlags: [],
  sourceUpdatedAt: '2026-10-01T12:00:00Z',
  observedAt: '2026-10-01T12:05:00Z',
  syncRunId: 'run-1',
});

test('builds a grounded upward observation', () => {
  const result = compareMetricWindows(
    'ga4.sessions',
    [fact('2026-09-30', 120)],
    [fact('2026-09-23', 100)],
    { from: '2026-09-24', through: '2026-09-30' },
    { from: '2026-09-17', through: '2026-09-23' },
  );
  assert.equal(result.direction, 'up');
  assert.equal(result.changePercent, 20);
  assert.equal(result.evidence.current.value, 120);
  assert.equal(result.evidence.baseline.value, 100);
  assert.equal(result.evidence.sources[0].factKeys.length, 2);
  assert.match(result.title, /20\.0% up/);
});

test('does not invent a percentage when baseline is zero', () => {
  const result = compareMetricWindows(
    'ga4.sessions',
    [fact('2026-09-30', 5)],
    [fact('2026-09-23', 0)],
    { from: '2026-09-24', through: '2026-09-30' },
    { from: '2026-09-17', through: '2026-09-23' },
  );
  assert.equal(result.direction, 'unavailable');
  assert.equal(result.changePercent, null);
  assert.match(result.title, /no comparable/);
});
