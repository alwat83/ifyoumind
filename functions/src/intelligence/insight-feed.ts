import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';
import { MetricFact } from './contracts';
import { compareMetricWindows } from './insight-rules';

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

function dateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(date: string, offset: number): string {
  const cursor = new Date(`${date}T12:00:00Z`);
  cursor.setUTCDate(cursor.getUTCDate() + offset);
  return cursor.toISOString().slice(0, 10);
}

export const getIntelligenceInsightFeed = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid,
    request.data?.organizationId,
    readMembership,
  );

  const connection = (await organizations()
    .doc(scope.organizationId)
    .collection('connections')
    .doc('ga4')
    .get()).data();

  if (connection?.status !== 'connected' || typeof connection.reportingTimezone !== 'string') {
    return { insights: [] };
  }

  const reportingTimezone = connection.reportingTimezone as string;
  const today = dateInTimeZone(new Date(), reportingTimezone);
  const currentThrough = addDays(today, -1);
  const currentFrom = addDays(currentThrough, -6);
  const baselineThrough = addDays(currentFrom, -1);
  const baselineFrom = addDays(baselineThrough, -6);

  const snapshot = await organizations()
    .doc(scope.organizationId)
    .collection('metricFacts')
    .where('metric', 'in', ['ga4.sessions', 'ga4.key_events'])
    .limit(200)
    .get();

  const facts = snapshot.docs.map((doc) => doc.data() as MetricFact);
  const insights = [];

  for (const metric of ['ga4.sessions', 'ga4.key_events'] as const) {
    const metricFacts = facts.filter((fact) => fact.metric === metric);
    const currentFacts = metricFacts.filter((fact) => fact.date >= currentFrom && fact.date <= currentThrough);
    const baselineFacts = metricFacts.filter((fact) => fact.date >= baselineFrom && fact.date <= baselineThrough);
    if (!currentFacts.length) continue;

    const observation = compareMetricWindows(
      metric,
      currentFacts,
      baselineFacts,
      { from: currentFrom, through: currentThrough },
      { from: baselineFrom, through: baselineThrough },
    );

    insights.push({
      id: `${metric}-7d`,
      metric,
      title: observation.title,
      direction: observation.direction,
      changePercent: observation.changePercent,
      currentValue: observation.evidence.current.value,
      baselineValue: observation.evidence.baseline.value,
      currentWindow: observation.evidence.current.window,
      baselineWindow: observation.evidence.baseline.window,
      freshnessAt: observation.evidence.sources[0]?.freshnessAt || null,
      qualityFlags: observation.evidence.sources[0]?.qualityFlags || [],
      source: 'Google Analytics 4',
    });
  }

  insights.sort((a, b) => {
    const magnitudeA = Math.abs(a.changePercent ?? 0);
    const magnitudeB = Math.abs(b.changePercent ?? 0);
    return magnitudeB - magnitudeA;
  });

  return { insights };
});
