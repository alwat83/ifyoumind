import { createHash } from 'crypto';
import { MetricFact, MetricKey, SourceKind } from './contracts';

const metricDefinitions: Record<MetricKey, { source: SourceKind; unit: MetricFact['unit'] }> = {
  'stripe.cash_collected_minor': { source: 'stripe', unit: 'currency_minor' },
  'stripe.refunds_minor': { source: 'stripe', unit: 'currency_minor' },
  'ga4.sessions': { source: 'ga4', unit: 'count' },
  'ga4.key_events': { source: 'ga4', unit: 'count' },
  'google_ads.spend_minor': { source: 'google_ads', unit: 'currency_minor' },
  'google_ads.clicks': { source: 'google_ads', unit: 'count' },
  'search_console.clicks': { source: 'search_console', unit: 'count' },
  'search_console.impressions': { source: 'search_console', unit: 'count' },
};

/** Reject malformed facts before any warehouse merge or insight calculation. */
export function validateMetricFact(fact: MetricFact): void {
  const definition = metricDefinitions[fact.metric];
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(fact.date) ? Date.parse(`${fact.date}T00:00:00Z`) : NaN;
  if (fact.schemaVersion !== 1 || !definition || definition.source !== fact.source ||
      definition.unit !== fact.unit || !Number.isSafeInteger(fact.value) || fact.value < 0 ||
      !Number.isFinite(parsedDate) ||
      new Date(parsedDate).toISOString().slice(0, 10) !== fact.date ||
      !fact.organizationId || !fact.connectionId || !fact.sourceAccountId ||
      !fact.reportingTimezone || !fact.sourceUpdatedAt || !fact.observedAt || !fact.syncRunId ||
      !fact.dimensions || typeof fact.dimensions !== 'object' || Array.isArray(fact.dimensions) ||
      Object.entries(fact.dimensions).some(([key, value]) => !key || typeof value !== 'string') ||
      !Array.isArray(fact.qualityFlags) || fact.qualityFlags.some((flag) =>
        !['sampled', 'thresholded', 'partial_period', 'late_data', 'estimated', 'provider_unavailable'].includes(flag))) {
    throw new Error('Invalid metric fact');
  }
  if (fact.unit === 'currency_minor' ? !/^[A-Z]{3}$/.test(fact.currency || '') : fact.currency !== undefined) {
    throw new Error('Metric currency does not match unit');
  }
  try { new Intl.DateTimeFormat('en-US', { timeZone: fact.reportingTimezone }); }
  catch { throw new Error('Invalid reporting timezone'); }
  for (const time of [fact.sourceUpdatedAt, fact.observedAt]) {
    if (!Number.isFinite(Date.parse(time))) throw new Error('Invalid metric timestamp');
  }
}

/** A day's corrected value replaces the old fact rather than adding another row. */
export function metricFactKey(fact: MetricFact): string {
  validateMetricFact(fact);
  const dimensions = Object.entries(fact.dimensions).sort(([a], [b]) => a.localeCompare(b));
  const identity = [fact.schemaVersion, fact.organizationId, fact.connectionId, fact.source,
    fact.sourceAccountId, fact.metric, fact.date, fact.reportingTimezone, fact.currency || '', dimensions];
  return createHash('sha256').update(JSON.stringify(identity)).digest('hex');
}

/** Reconcile repeat and late provider reports by stable key, without double counting. */
export function reconcileFacts(existing: readonly MetricFact[], incoming: readonly MetricFact[]): MetricFact[] {
  const byKey = new Map<string, MetricFact>();
  for (const fact of existing) byKey.set(metricFactKey(fact), fact);
  for (const fact of incoming) {
    const key = metricFactKey(fact);
    const prior = byKey.get(key);
    if (!prior || Date.parse(fact.sourceUpdatedAt) >= Date.parse(prior.sourceUpdatedAt)) {
      byKey.set(key, fact);
    }
  }
  return [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, fact]) => fact);
}

/** Deliberately refuses to combine unrelated measures or currencies. */
export function totalFacts(facts: readonly MetricFact[]): number {
  if (!facts.length) return 0;
  const unique = reconcileFacts([], facts);
  const first = unique[0];
  for (const fact of unique) {
    validateMetricFact(fact);
    if (fact.organizationId !== first.organizationId || fact.metric !== first.metric ||
        fact.unit !== first.unit || fact.currency !== first.currency ||
        fact.reportingTimezone !== first.reportingTimezone) {
      throw new Error('Cannot combine different metrics, tenants, timezones, or currencies');
    }
  }
  const total = unique.reduce((sum, fact) => sum + fact.value, 0);
  if (!Number.isSafeInteger(total)) throw new Error('Metric total exceeds safe integer range');
  return total;
}
