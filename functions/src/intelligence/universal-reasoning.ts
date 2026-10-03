import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';
import { alignObservations, pearson, UniversalObservation } from './universal-analysis';

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

interface DatasetView {
  id: string;
  name: string;
  metric: string;
  unit: string;
  sourceLabel: string;
  observations: UniversalObservation[];
}

interface Signal {
  datasetId: string;
  datasetName: string;
  source: string;
  correlation: number;
  magnitude: 'strong' | 'moderate' | 'weak' | 'little';
  direction: 'same_direction' | 'opposite_direction';
  matchedObservations: number;
  evidence: ReturnType<typeof alignObservations>;
}

function magnitude(r: number): Signal['magnitude'] {
  const value = Math.abs(r);
  if (value >= .8) return 'strong';
  if (value >= .5) return 'moderate';
  if (value >= .3) return 'weak';
  return 'little';
}

function confidence(signals: Signal[]): 'low' | 'medium' | 'high' {
  if (!signals.length) return 'low';
  const strongest = Math.max(...signals.map((signal) => Math.abs(signal.correlation)));
  const sample = Math.max(...signals.map((signal) => signal.matchedObservations));
  const independentSources = new Set(signals.map((signal) => signal.source)).size;

  if (strongest >= .7 && sample >= 24 && independentSources >= 2) return 'high';
  if (strongest >= .5 && sample >= 12) return 'medium';
  return 'low';
}

async function loadDataset(organizationId: string, id: string): Promise<DatasetView> {
  const ref = organizations().doc(organizationId).collection('datasets').doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new HttpsError('not-found', 'Dataset not found.');

  const data = snapshot.data()!;
  const observations = await ref.collection('observations').orderBy('period', 'asc').limit(500).get();
  return {
    id,
    name: data.name,
    metric: data.metric,
    unit: data.unit,
    sourceLabel: data.sourceLabel || 'Unknown source',
    observations: observations.docs.map((doc) => doc.data() as UniversalObservation),
  };
}

export const reasonAcrossUniversalDatasets = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid,
    request.data?.organizationId,
    readMembership,
  );

  const ids: unknown = request.data?.datasetIds;
  const targetId: unknown = request.data?.targetDatasetId;

  if (!Array.isArray(ids) || ids.length < 2 || ids.length > 8 ||
      ids.some((id) => typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id))) {
    throw new HttpsError('invalid-argument', 'Choose between 2 and 8 datasets.');
  }
  if (typeof targetId !== 'string' || !ids.includes(targetId)) {
    throw new HttpsError('invalid-argument', 'Choose one selected dataset as the target.');
  }

  const datasets = await Promise.all((ids as string[]).map((id) => loadDataset(scope.organizationId, id)));
  const target = datasets.find((dataset) => dataset.id === targetId)!;
  const signals: Signal[] = [];

  for (const candidate of datasets.filter((dataset) => dataset.id !== target.id)) {
    const evidence = alignObservations(target.observations, candidate.observations);
    const correlation = pearson(
      evidence.map((point) => point.a),
      evidence.map((point) => point.b),
    );

    if (correlation === null) continue;

    signals.push({
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

  signals.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  const meaningful = signals.filter((signal) => Math.abs(signal.correlation) >= .3);
  const strongest = meaningful[0] || null;
  const supporting = strongest
    ? meaningful.filter((signal) => signal.direction === strongest.direction).slice(0, 4)
    : [];
  const oppositeDirections = strongest
    ? meaningful.filter((signal) => signal.direction !== strongest.direction).slice(0, 3)
    : [];
  const conclusion = strongest
    ? `${strongest.datasetName} has the strongest observed relationship with ${target.name}: a ${strongest.magnitude} ${strongest.direction === 'same_direction' ? 'same-direction' : 'inverse'} association (r=${strongest.correlation.toFixed(2)}) across ${strongest.matchedObservations} compatible observations.`
    : `The selected data does not yet show a meaningful measurable relationship with ${target.name}.`;

  const interpretation = strongest
    ? `Changes in ${strongest.datasetName} are statistically associated with changes in ${target.name} in the overlapping data. Treat this as a candidate explanatory signal, not a causal finding.`
    : `More overlapping observations or additional datasets are needed before ifYouMind can identify a useful explanatory signal for ${target.name}.`;

  const result = {
    target: {
      id: target.id,
      name: target.name,
      metric: target.metric,
      unit: target.unit,
      source: target.sourceLabel,
    },
    conclusion,
    interpretation,
    confidence: confidence(supporting),
    supportingEvidence: supporting,
    counterEvidence: oppositeDirections,
    allSignals: signals,
    reasoningPolicy: {
      causalClaimAllowed: false,
      alignmentRule: 'period + geography + entity',
      minimumPairsForCorrelation: 3,
      meaningfulCorrelationThreshold: .3,
    },
    limitations: [
      'Observed association does not establish causation.',
      'Confounding variables may explain part or all of a relationship.',
      'Only observations matching period, geography, and entity are compared.',
      'A high correlation can still be misleading when the sample is small or the source definitions differ.',
    ],
  };

  const runRef = organizations().doc(scope.organizationId).collection('analysisRuns').doc();
  await runRef.set({
    schemaVersion: 1,
    targetDatasetId: target.id,
    datasetIds: ids,
    result,
    createdBy: scope.uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ...result, analysisRunId: runRef.id };
});

export const getRecentUniversalAnalysisRuns = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid,
    request.data?.organizationId,
    readMembership,
  );

  const snapshot = await organizations()
    .doc(scope.organizationId)
    .collection('analysisRuns')
    .orderBy('createdAt', 'desc')
    .limit(12)
    .get();

  return {
    runs: snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        targetDatasetId: data.targetDatasetId,
        datasetIds: data.datasetIds,
        conclusion: data.result?.conclusion || '',
        confidence: data.result?.confidence || 'low',
        targetName: data.result?.target?.name || 'Unknown target',
        createdAt: data.createdAt?.toDate?.().toISOString?.() || null,
      };
    }),
  };
});
