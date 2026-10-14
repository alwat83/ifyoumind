// Usage limits on the universal-data functions, against the Auth, Firestore and Functions emulators.
// Run with: npm run test:qa-integration
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { FIXTURES, callable, cleanupFixture, createFixture } from '../e2e/support/fixtures.mjs';

const require = createRequire(import.meta.url);
const created = [];
const make = async (id, options) => { const f = await createFixture(id, options); created.push(f); return f; };
after(async () => { for (const f of created) await cleanupFixture(f).catch(() => {}); });

// Same admin app the fixtures module uses (emulator-only; the fixtures module refuses anything else).
const db = async () => {
  process.env.METADATA_SERVER_DETECTION ??= 'none';
  const { initializeApp, getApps } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  const app = getApps().find(a => a.name === 'qa-fixtures') || initializeApp({ projectId: 'demo-ifyoumind' }, 'qa-fixtures');
  return getFirestore(app);
};
const rows = (n, offset = 0) => Array.from({ length: n }, (_, i) => ({ value: i, period: `p${String(i + offset).padStart(5, '0')}` }));

test('the demo seed is limited to 5 calls a day per user', async () => {
  const f = await make(FIXTURES.FREE_NO_REPORTS);
  for (let i = 0; i < 5; i++) {
    const ok = await callable('seedUniversalDemoData', { organizationId: f.organizationId }, f.idToken);
    assert.ok(ok.result, JSON.stringify(ok));
  }
  const refused = await callable('seedUniversalDemoData', { organizationId: f.organizationId }, f.idToken);
  assert.equal(refused.error, 'RESOURCE_EXHAUSTED');
  // The counter is server-side only.
  const usage = (await (await db()).collection('universalUsage').doc(f.uid).get()).data();
  assert.equal(usage.counts.seedDemo, 5);
});

test('a dataset cannot pass 5,000 observations, through import or single adds', async () => {
  const f = await make(FIXTURES.FREE_NO_REPORTS);
  const ds = await callable('createUniversalDataset', { organizationId: f.organizationId, name: 'Sales', metric: 'net sales', unit: 'currency' }, f.idToken);
  const datasetId = ds.result.id;
  // Pre-fill 4,800 observations directly (as earlier imports would have).
  const firestore = await db();
  const ref = firestore.collection('intelligenceOrganizations').doc(f.organizationId).collection('datasets').doc(datasetId).collection('observations');
  for (let start = 0; start < 4800; start += 400) {
    const batch = firestore.batch();
    for (const row of rows(400, start)) batch.set(ref.doc(), row);
    await batch.commit();
  }
  const ok = await callable('importUniversalObservations', { organizationId: f.organizationId, datasetId, observations: rows(200, 9000) }, f.idToken);
  assert.equal(ok.result.imported, 200);
  const over = await callable('importUniversalObservations', { organizationId: f.organizationId, datasetId, observations: rows(1, 9500) }, f.idToken);
  assert.equal(over.error, 'FAILED_PRECONDITION');
  const single = await callable('addUniversalObservation', { organizationId: f.organizationId, datasetId, value: 1, period: 'x' }, f.idToken);
  assert.equal(single.error, 'FAILED_PRECONDITION');
});

test('nested or oversized dimensions are refused on single adds', async () => {
  const f = await make(FIXTURES.FREE_NO_REPORTS);
  const ds = await callable('createUniversalDataset', { organizationId: f.organizationId, name: 'Visits', metric: 'visits', unit: 'count' }, f.idToken);
  const bad = await callable('addUniversalObservation', { organizationId: f.organizationId, datasetId: ds.result.id, value: 1, period: '2026-01', dimensions: { a: { deep: 'x' } } }, f.idToken);
  assert.equal(bad.error, 'INVALID_ARGUMENT');
  const good = await callable('addUniversalObservation', { organizationId: f.organizationId, datasetId: ds.result.id, value: 1, period: '2026-01', dimensions: { channel: 'web' } }, f.idToken);
  assert.ok(good.result.id);
});

test('a workspace holds at most 50 datasets', async () => {
  const f = await make(FIXTURES.FREE_NO_REPORTS);
  const firestore = await db();
  const col = firestore.collection('intelligenceOrganizations').doc(f.organizationId).collection('datasets');
  const batch = firestore.batch();
  for (let i = 0; i < 50; i++) batch.set(col.doc(`d${i}`), { name: `D${i}`, metric: 'm', unit: 'count', updatedAt: new Date() });
  await batch.commit();
  const refused = await callable('createUniversalDataset', { organizationId: f.organizationId, name: 'One more', metric: 'm', unit: 'count' }, f.idToken);
  assert.equal(refused.error, 'FAILED_PRECONDITION');
});

test('Ask compares at most 12 other datasets, and stores its history without the matched points', async () => {
  const f = await make(FIXTURES.FREE_NO_REPORTS);
  const firestore = await db();
  const col = firestore.collection('intelligenceOrganizations').doc(f.organizationId).collection('datasets');
  for (let i = 0; i < 20; i++) {
    const batch = firestore.batch();
    const ref = col.doc(i === 0 ? 'target' : `other${i}`);
    batch.set(ref, { name: i === 0 ? 'Weekday lunch sales' : `Signal ${i}`, metric: i === 0 ? 'lunch sales' : 'signal', unit: 'count', description: '', updatedAt: new Date(Date.now() - i * 1000) });
    for (let p = 0; p < 6; p++) batch.set(ref.collection('observations').doc(`p${p}`), { value: p * (i + 1) + (i % 3), period: `2026-0${p + 1}` });
    await batch.commit();
  }
  const answer = await callable('askUniversalIntelligence', { organizationId: f.organizationId, question: 'What is driving weekday lunch sales?' }, f.idToken);
  assert.equal(answer.result.status, 'answered', JSON.stringify(answer));
  assert.equal(answer.result.target.id, 'target');
  assert.ok(answer.result.datasetsConsidered <= 1 + 7);
  assert.ok(answer.result.datasetIds.every(id => id === 'target' || Number(id.replace('other', '')) <= 12), 'only the 12 most recently updated companions');
  const history = (await firestore.collection('intelligenceOrganizations').doc(f.organizationId).collection('questions').doc(answer.result.id).get()).data();
  assert.ok(history.evidence.supportingEvidence.every(s => !('evidence' in s) && typeof s.matchedPoints === 'number'));
});

test('another workspace cannot use these functions on mine', async () => {
  const owner = await make(FIXTURES.FREE_NO_REPORTS);
  const other = await make(FIXTURES.OTHER_TENANT);
  for (const [name, data] of [
    ['listUniversalDatasets', {}], ['createUniversalDataset', { name: 'x', metric: 'm', unit: 'count' }], ['askUniversalIntelligence', { question: 'why?' }],
    ['seedUniversalDemoData', {}], ['getRecentUniversalAnalysisRuns', {}],
  ]) {
    const r = await callable(name, { organizationId: owner.organizationId, ...data }, other.idToken);
    assert.equal(r.error, 'PERMISSION_DENIED', name);
  }
  const anon = await callable('listUniversalDatasets', { organizationId: owner.organizationId });
  assert.equal(anon.error, 'UNAUTHENTICATED');
});
