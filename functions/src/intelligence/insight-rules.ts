import { DateWindow, InsightEvidence, MetricFact, MetricKey } from './contracts';
import { metricFactKey, totalFacts } from './metric-facts';

export interface ComparisonObservation {
  title: string;
  direction: 'up' | 'down' | 'flat' | 'unavailable';
  changePercent: number | null;
  evidence: InsightEvidence;
}

export function compareMetricWindows(
  metric: MetricKey,
  currentFacts: readonly MetricFact[],
  baselineFacts: readonly MetricFact[],
  currentWindow: DateWindow,
  baselineWindow: DateWindow,
  ruleVersion = 'window-comparison-v1',
): ComparisonObservation {
  const current = totalFacts(currentFacts);
  const baseline = totalFacts(baselineFacts);
  const organizationId = currentFacts[0]?.organizationId || baselineFacts[0]?.organizationId || '';
  if (!organizationId) throw new Error('Comparison requires metric facts');

  const allFacts = [...currentFacts, ...baselineFacts];
  const first = allFacts[0];
  const qualityFlags = [...new Set(allFacts.flatMap((fact) => fact.qualityFlags))];
  const freshnessAt = allFacts
    .map((fact) => fact.observedAt)
    .sort()
    .at(-1) || new Date(0).toISOString();

  const changePercent = baseline > 0 ? ((current - baseline) / baseline) * 100 : null;
  const direction =
    changePercent === null ? 'unavailable' :
    Math.abs(changePercent) < 0.05 ? 'flat' :
    changePercent > 0 ? 'up' : 'down';

  const label = metric === 'ga4.sessions' ? 'Sessions' : metric;
  const title =
    direction === 'unavailable'
      ? `${label} has no comparable prior-period baseline yet.`
      : direction === 'flat'
        ? `${label} was essentially flat versus the previous period.`
        : `${label} was ${Math.abs(changePercent!).toFixed(1)}% ${direction} versus the previous period.`;

  return {
    title,
    direction,
    changePercent,
    evidence: {
      organizationId,
      ruleVersion,
      metric,
      current: { value: current, sampleSize: currentFacts.length, window: currentWindow },
      baseline: { value: baseline, sampleSize: baselineFacts.length, window: baselineWindow },
      sources: [{
        connectionId: first.connectionId,
        source: first.source,
        sourceAccountId: first.sourceAccountId,
        metric,
        window: { from: baselineWindow.from, through: currentWindow.through },
        factKeys: allFacts.map(metricFactKey),
        freshnessAt,
        qualityFlags,
      }],
      interpretation: 'observation',
    },
  };
}
