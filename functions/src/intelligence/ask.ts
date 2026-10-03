import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';
import { MetricFact } from './contracts';
import { compareMetricWindows } from './insight-rules';
import { totalFacts } from './metric-facts';

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

type AskIntent = 'traffic_change' | 'traffic_total' | 'key_events' | 'unsupported';

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

function classify(question: string): AskIntent {
  const text = question.toLowerCase();
  if (/key event|conversion|convert/.test(text)) return 'key_events';
  if (/traffic|session|visitor/.test(text) && /change|compare|week|up|down|trend|doing/.test(text)) {
    return 'traffic_change';
  }
  if (/traffic|session|visitor/.test(text)) return 'traffic_total';
  return 'unsupported';
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export const askIntelligence = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid,
    request.data?.organizationId,
    readMembership,
  );

  const question: unknown = request.data?.question;
  if (typeof question !== 'string' || !question.trim() || question.trim().length > 500) {
    throw new HttpsError('invalid-argument', 'Question must contain 1–500 characters.');
  }

  const connection = (await organizations()
    .doc(scope.organizationId)
    .collection('connections')
    .doc('ga4')
    .get()).data();

  const intent = classify(question.trim());
  if (intent === 'unsupported') {
    return {
      intent,
      answer: 'I can answer traffic and key-event questions from GA4 right now. As more sources are connected, I’ll be able to answer across search, ads, revenue, and other business data.',
      evidence: null,
      suggestedQuestions: [
        'How was traffic this week?',
        'How many sessions did we have?',
        'How many key events did we get?',
      ],
    };
  }

  if (connection?.status !== 'connected' || typeof connection.reportingTimezone !== 'string') {
    return {
      intent,
      answer: 'Connect Google Analytics 4 first so I have traffic data to answer from.',
      evidence: null,
      suggestedQuestions: [],
    };
  }

  const reportingTimezone = connection.reportingTimezone as string;
  const today = dateInTimeZone(new Date(), reportingTimezone);
  const currentThrough = addDays(today, -1);
  const currentFrom = addDays(currentThrough, -6);
  const baselineThrough = addDays(currentFrom, -1);
  const baselineFrom = addDays(baselineThrough, -6);
  const metric = intent === 'key_events' ? 'ga4.key_events' : 'ga4.sessions';

  const snapshot = await organizations()
    .doc(scope.organizationId)
    .collection('metricFacts')
    .where('metric', '==', metric)
    .limit(100)
    .get();

  const facts = snapshot.docs.map((doc) => doc.data() as MetricFact);
  const currentFacts = facts.filter((fact) => fact.date >= currentFrom && fact.date <= currentThrough);
  const baselineFacts = facts.filter((fact) => fact.date >= baselineFrom && fact.date <= baselineThrough);

  if (!currentFacts.length) {
    return {
      intent,
      answer: 'I don’t have enough synced data for that question yet.',
      evidence: null,
      suggestedQuestions: [],
    };
  }

  let answer: string;
  let evidence: unknown;

  if (intent === 'traffic_change') {
    const comparison = compareMetricWindows(
      'ga4.sessions',
      currentFacts,
      baselineFacts,
      { from: currentFrom, through: currentThrough },
      { from: baselineFrom, through: baselineThrough },
    );
    answer = comparison.title;
    evidence = comparison.evidence;
  } else {
    const total = totalFacts(currentFacts);
    const label = intent === 'key_events' ? 'key events' : 'sessions';
    answer = `You had ${formatNumber(total)} ${label} from ${currentFrom} through ${currentThrough}.`;
    evidence = {
      metric,
      current: {
        value: total,
        sampleSize: currentFacts.length,
        window: { from: currentFrom, through: currentThrough },
      },
      factKeys: currentFacts.map((fact) => fact.date),
      source: 'ga4',
      sourceAccountId: connection.sourceAccountId,
      freshnessAt: connection.lastSyncedAt?.toDate?.().toISOString?.() || null,
    };
  }

  const historyRef = organizations().doc(scope.organizationId).collection('questions').doc();
  await historyRef.set({
    question: question.trim(),
    answer,
    intent,
    evidence,
    askedBy: scope.uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    id: historyRef.id,
    intent,
    answer,
    evidence,
    suggestedQuestions: [
      'How was traffic this week?',
      'How many sessions did we have?',
      'How many key events did we get?',
    ],
  };
});

export const getRecentIntelligenceQuestions = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid,
    request.data?.organizationId,
    readMembership,
  );

  const snapshot = await organizations()
    .doc(scope.organizationId)
    .collection('questions')
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  return {
    questions: snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        question: data.question,
        answer: data.answer,
        intent: data.intent,
        createdAt: data.createdAt?.toDate?.().toISOString?.() || null,
      };
    }),
  };
});
