import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

export type UniversalUnit =
  | 'count' | 'percent' | 'currency' | 'rate' | 'index' | 'temperature'
  | 'distance' | 'duration' | 'score' | 'other';

function cleanText(value: unknown, label: string, max = 160): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new HttpsError('invalid-argument', `${label} must contain 1–${max} characters.`);
  }
  return value.trim();
}

function optionalText(value: unknown, max = 160): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > max) {
    throw new HttpsError('invalid-argument', 'Invalid text value.');
  }
  return value.trim();
}

export const createUniversalDataset = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid, request.data?.organizationId, readMembership, ['owner', 'admin'],
  );

  const name = cleanText(request.data?.name, 'Dataset name');
  const metric = cleanText(request.data?.metric, 'Metric');
  const unit = cleanText(request.data?.unit, 'Unit', 40);
  const sourceLabel = optionalText(request.data?.sourceLabel, 120) || 'Manual';
  const description = optionalText(request.data?.description, 500);

  const ref = organizations().doc(scope.organizationId).collection('datasets').doc();
  await ref.set({
    schemaVersion: 1,
    name,
    metric,
    unit,
    sourceLabel,
    description,
    createdBy: scope.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { id: ref.id };
});

export const addUniversalObservation = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid, request.data?.organizationId, readMembership, ['owner', 'admin'],
  );

  const datasetId = cleanText(request.data?.datasetId, 'Dataset ID', 128);
  if (!/^[A-Za-z0-9_-]+$/.test(datasetId)) {
    throw new HttpsError('invalid-argument', 'Invalid dataset ID.');
  }

  const datasetRef = organizations().doc(scope.organizationId).collection('datasets').doc(datasetId);
  if (!(await datasetRef.get()).exists) throw new HttpsError('not-found', 'Dataset not found.');

  const value = Number(request.data?.value);
  if (!Number.isFinite(value)) throw new HttpsError('invalid-argument', 'Observation value must be numeric.');

  const period = cleanText(request.data?.period, 'Period', 40);
  const geography = optionalText(request.data?.geography, 160);
  const entity = optionalText(request.data?.entity, 160);
  const note = optionalText(request.data?.note, 500);

  const ref = datasetRef.collection('observations').doc();
  await ref.set({
    schemaVersion: 1,
    datasetId,
    value,
    period,
    geography,
    entity,
    note,
    dimensions: request.data?.dimensions && typeof request.data.dimensions === 'object'
      ? request.data.dimensions : {},
    observedAt: Timestamp.now(),
    createdBy: scope.uid,
  });

  await datasetRef.set({ updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return { id: ref.id };
});

export const listUniversalDatasets = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid, request.data?.organizationId, readMembership,
  );

  const snapshot = await organizations()
    .doc(scope.organizationId)
    .collection('datasets')
    .orderBy('updatedAt', 'desc')
    .limit(100)
    .get();

  const datasets = [];
  for (const doc of snapshot.docs) {
    const countSnapshot = await doc.ref.collection('observations').count().get();
    const data = doc.data();
    datasets.push({
      id: doc.id,
      name: data.name,
      metric: data.metric,
      unit: data.unit,
      sourceLabel: data.sourceLabel,
      description: data.description || null,
      observationCount: countSnapshot.data().count,
      updatedAt: data.updatedAt?.toDate?.().toISOString?.() || null,
    });
  }

  return { datasets };
});

export const getUniversalDataset = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid, request.data?.organizationId, readMembership,
  );
  const datasetId = cleanText(request.data?.datasetId, 'Dataset ID', 128);

  const ref = organizations().doc(scope.organizationId).collection('datasets').doc(datasetId);
  const dataset = await ref.get();
  if (!dataset.exists) throw new HttpsError('not-found', 'Dataset not found.');

  const observations = await ref.collection('observations').orderBy('period', 'asc').limit(500).get();
  const datasetData = dataset.data() || {};
  return {
    dataset: { id: dataset.id, ...datasetData },
    observations: observations.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
  };
});
