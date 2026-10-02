import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';
import { alignObservations, pearson, UniversalObservation } from './universal-analysis';

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

interface DatasetCandidate {
  id: string;
  name: string;
  metric: string;
  unit: string;
  sourceLabel: string;
  description: string;
  observations: UniversalObservation[];
}

function terms(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((term) => term.length >= 3 && !['what','why','how','does','with','from','this','that','seem','seems','driving','drive','explain','affect','change','changing'].includes(term));
}

function lexicalScore(question: string, dataset: DatasetCandidate): number {
  const q = new Set(terms(question));
  const haystack = [
    ...terms(dataset.name),
    ...terms(dataset.metric),
    ...terms(dataset.description),
  ];
  let score = 0;
  for (const term of haystack) {
    if (q.has(term)) score += dataset.name.toLowerCase().includes(term) ? 4 : 2;
  }
  const phrase = dataset.name.toLowerCase();
  if (question.toLowerCase().includes(phrase)) score += 10;
  return score;
}

function magnitude(r: number): 'strong' | 'moderate' | 'weak' | 'little' {
  const value = Math.abs(r);
  if (value >= .8) return 'strong';
  if (value >= .5) return 'moderate';
  if (value >= .3) return 'weak';
  return 'little';
}

function confidence(signals: Array<{ correlation:number; matchedObservations:number; source:string }>): 'low'|'medium'|'high' {
  if (!signals.length) return 'low';
  const strongest = Math.max(...signals.map((signal) => Math.abs(signal.correlation)));
  const sample = Math.max(...signals.map((signal) => signal.matchedObservations));
  const sources = new Set(signals.map((signal) => signal.source)).size;
  if (strongest >= .7 && sample >= 24 && sources >= 2) return 'high';
  if (strongest >= .5 && sample >= 12) return 'medium';
  return 'low';
}

export const askUniversalIntelligence = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid,
    request.data?.organizationId,
    readMembership,
  );

  const question: unknown = request.data?.question;
  if (typeof question !== 'string' || !question.trim() || question.trim().length > 500) {
    throw new HttpsError('invalid-argument', 'Question must contain 1–500 characters.');
  }

  const datasetSnapshot = await organizations()
    .doc(scope.organizationId)
    .collection('datasets')
    .orderBy('updatedAt', 'desc')
    .limit(100)
    .get();

  if (datasetSnapshot.empty) {
    return {
      status: 'no_data',
      answer: 'I need at least two datasets before I can reason across your data.',
      suggestions: ['Open Canvas and load the demo data', 'Import a CSV'],
    };
  }

  const datasets: DatasetCandidate[] = [];
  for (const doc of datasetSnapshot.docs) {
    const data = doc.data();
    const observations = await doc.ref.collection('observations').orderBy('period', 'asc').limit(500).get();
    datasets.push({
      id: doc.id,
      name: data.name || doc.id,
      metric: data.metric || '',
      unit: data.unit || 'other',
      sourceLabel: data.sourceLabel || 'Unknown source',
      description: data.description || '',
      observations: observations.docs.map((observation) => observation.data() as UniversalObservation),
    });
  }

  if (datasets.length < 2) {
    return {
      status: 'not_enough_data',
      answer: 'I found only one dataset. Add at least one more dataset so I can look for relationships.',
      suggestions: ['Add another dataset in Canvas', 'Import another CSV'],
    };
  }

  const ranked = datasets
    .map((dataset) => ({ dataset, score: lexicalScore(question.trim(), dataset) }))
    .sort((a, b) => b.score - a.score || b.dataset.observations.length - a.dataset.observations.length);

  const best = ranked[0];
  const tied = ranked.filter((candidate) => candidate.score === best.score && candidate.score > 0);

  if (best.score <= 0 || tied.length > 1) {
    return {
      status: 'needs_target',
      answer: best.score <= 0
        ? 'I could not confidently tell which dataset you want me to explain.'
        : 'Your question matches more than one dataset equally well.',
      targetChoices: ranked.slice(0, 6).map(({ dataset }) => ({
        id: dataset.id,
        name: dataset.name,
        metric: dataset.metric,
        unit: dataset.unit,
      })),
      suggestions: ranked.slice(0, 4).map(({ dataset }) => `What seems to be driving ${dataset.name}?`),
    };
  }

  const target = best.dataset;
  const candidates = datasets.filter((dataset) => dataset.id !== target.id);
  const scoredSignals = [];

  for (const candidate of candidates) {
    const evidence = alignObservations(target.observations, candidate.observations);
    const correlation = pearson(
      evidence.map((point) => point.a),
      evidence.map((point) => point.b),
    );
    if (correlation === null) continue;
    scoredSignals.push({
      datasetId: candidate.id,
      datasetName: candidate.name,
      source: candidate.sourceLabel,
      correlation,
      magnitude: magnitude(correlation),
      direction: correlation >= 0 ? 'same_direction' : 'opposite_direction',
      matchedObservations: evidence.length,
      evidence,
    });
  }

  scoredSignals.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  const selectedSignals = scoredSignals.slice(0, 7);
  const meaningful = selectedSignals.filter((signal) => Math.abs(signal.correlation) >= .3);
  const strongest = meaningful[0] || null;
  const supporting = strongest
    ? meaningful.filter((signal) => signal.direction === strongest.direction).slice(0, 4)
    : [];
  const counter = strongest
    ? meaningful.filter((signal) => signal.direction !== strongest.direction).slice(0, 3)
    : [];

  const answer = strongest
    ? `${strongest.datasetName} is the strongest observed signal associated with ${target.name}: a ${strongest.magnitude} ${strongest.direction === 'same_direction' ? 'same-direction' : 'inverse'} relationship across ${strongest.matchedObservations} compatible observations. This is an association, not proof of cause.`
    : `I found ${target.name}, but the available overlapping datasets do not yet show a meaningful measurable relationship with it.`;

  const result = {
    status: 'answered',
    answer,
    target: {
      id: target.id,
      name: target.name,
      metric: target.metric,
      unit: target.unit,
      source: target.sourceLabel,
    },
    confidence: confidence(supporting),
    supportingEvidence: supporting,
    counterEvidence: counter,
    datasetsConsidered: 1 + selectedSignals.length,
    datasetIds: [target.id, ...selectedSignals.map((signal) => signal.datasetId)],
    limitations: [
      'Observed association does not establish causation.',
      'Only observations matching period, geography, and entity are compared.',
      'Other unselected or unavailable variables may explain part of the relationship.',
    ],
    suggestions: [
      `What else is related to ${target.name}?`,
      `Which signal has the strongest relationship with ${target.name}?`,
    ],
  };

  const historyRef = organizations().doc(scope.organizationId).collection('questions').doc();
  await historyRef.set({
    question: question.trim(),
    answer,
    intent: 'universal_reasoning',
    evidence: result,
    askedBy: scope.uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { id: historyRef.id, ...result };
});
