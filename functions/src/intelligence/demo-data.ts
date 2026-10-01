import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

interface DemoDataset {
  id: string;
  name: string;
  metric: string;
  unit: string;
  description: string;
  values: number[];
}

const periods = [
  '2025-01','2025-02','2025-03','2025-04','2025-05','2025-06',
  '2025-07','2025-08','2025-09','2025-10','2025-11','2025-12',
  '2026-01','2026-02','2026-03','2026-04','2026-05','2026-06',
];

const demo: DemoDataset[] = [
  {
    id: 'demo-home-price',
    name: 'Median Home Price',
    metric: 'median_home_price',
    unit: 'currency',
    description: 'Synthetic demo data for testing ifYouMind universal reasoning.',
    values: [310,312,315,318,322,326,329,333,338,341,345,350,354,359,365,369,374,381],
  },
  {
    id: 'demo-household-income',
    name: 'Median Household Income',
    metric: 'median_household_income',
    unit: 'currency',
    description: 'Synthetic demo data for testing ifYouMind universal reasoning.',
    values: [71,71.5,72,72.4,73,73.6,74,74.4,75.1,75.5,76.2,77,77.5,78.1,79,79.4,80.2,81],
  },
  {
    id: 'demo-population-growth',
    name: 'Population Growth Index',
    metric: 'population_growth_index',
    unit: 'index',
    description: 'Synthetic demo data for testing ifYouMind universal reasoning.',
    values: [100,100.4,100.9,101.3,101.8,102.1,102.8,103.2,103.9,104.3,104.9,105.4,105.8,106.5,107.1,107.5,108.2,109],
  },
  {
    id: 'demo-crime-rate',
    name: 'Crime Rate',
    metric: 'crime_rate',
    unit: 'rate',
    description: 'Synthetic demo data for testing ifYouMind universal reasoning.',
    values: [8.2,8.0,8.1,7.8,7.7,7.6,7.4,7.5,7.2,7.0,6.9,6.8,6.7,6.6,6.4,6.5,6.2,6.0],
  },
];

export const seedUniversalDemoData = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid,
    request.data?.organizationId,
    readMembership,
    ['owner', 'admin'],
  );

  const root = organizations().doc(scope.organizationId);
  const batch = getFirestore().batch();

  for (const dataset of demo) {
    const datasetRef = root.collection('datasets').doc(dataset.id);
    batch.set(datasetRef, {
      schemaVersion: 1,
      name: dataset.name,
      metric: dataset.metric,
      unit: dataset.unit,
      sourceLabel: 'ifYouMind Demo',
      description: dataset.description,
      createdBy: scope.uid,
      isDemo: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    periods.forEach((period, index) => {
      const observationRef = datasetRef.collection('observations').doc(period);
      batch.set(observationRef, {
        schemaVersion: 1,
        datasetId: dataset.id,
        value: dataset.values[index],
        period,
        geography: 'Demo ZIP 35000',
        entity: 'Demo City',
        note: 'Synthetic demo observation. Not real-world data.',
        dimensions: { demo: 'true' },
        observedAt: Timestamp.now(),
        createdBy: scope.uid,
        importSource: 'demo_seed',
      }, { merge: true });
    });
  }

  await batch.commit();

  return {
    datasetIds: demo.map((dataset) => dataset.id),
    targetDatasetId: 'demo-home-price',
    observationCount: demo.length * periods.length,
  };
});
