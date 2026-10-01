import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';
import { MetricFact } from './contracts';
import { totalFacts } from './metric-facts';

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

function dateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(date: string, offset: number): string {
  const cursor = new Date(`${date}T12:00:00Z`);
  cursor.setUTCDate(cursor.getUTCDate() + offset);
  return cursor.toISOString().slice(0, 10);
}

export const getIntelligenceDashboardMetrics = onCall(async (request) => {
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
    return { ga4: null };
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
    .where('metric', '==', 'ga4.sessions')
    .limit(100)
    .get();

  const facts = snapshot.docs.map((doc) => doc.data() as MetricFact);
  const currentFacts = facts.filter((fact) => fact.date >= currentFrom && fact.date <= currentThrough);
  const baselineFacts = facts.filter((fact) => fact.date >= baselineFrom && fact.date <= baselineThrough);
  const current = totalFacts(currentFacts);
  const baseline = totalFacts(baselineFacts);
  const changePercent = baseline > 0 ? ((current - baseline) / baseline) * 100 : null;

  return {
    ga4: {
      sessions: current,
      baselineSessions: baseline,
      changePercent,
      currentWindow: { from: currentFrom, through: currentThrough },
      baselineWindow: { from: baselineFrom, through: baselineThrough },
      sampleSize: currentFacts.length,
      lastSyncedAt: connection.lastSyncedAt?.toDate?.().toISOString?.() || null,
      accountLabel: typeof connection.accountLabel === 'string' ? connection.accountLabel : null,
    },
  };
});
