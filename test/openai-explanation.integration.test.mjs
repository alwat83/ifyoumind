// Run through npm run test:qa-integration. No provider transport or real credentials.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { FIXTURES, callable, cleanupFixture, createFixture, signIn } from '../e2e/support/fixtures.mjs';
import { assertEmulatorEnv } from '../e2e/support/emulator-guard.mjs';

assertEmulatorEnv(process.env);
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { reserveExplanation } = require('./lib/intelligence/explain-synthetic-market');
const app = getApps().find(item => item.name === '[DEFAULT]') ?? initializeApp({ projectId: 'demo-ifyoumind' });
const db = getFirestore(app);
const quota = db.collection('internalExplanationQuota');
const global = quota.doc('global');

after(async () => {
  await db.recursiveDelete(quota);
});

test('Firebase callable verifies auth, rejects other tenants and defaults to deterministic output', async () => {
  const f = await createFixture(FIXTURES.FREE_NO_REPORTS);
  const other = await createFixture(FIXTURES.OTHER_TENANT);
  const name = 'explainSyntheticMarket';
  const data = { organizationId: f.organizationId };
  try {
    assert.equal((await callable(name, data)).error, 'UNAUTHENTICATED');
    assert.equal((await callable(name, data, f.idToken)).error, 'PERMISSION_DENIED');
    await getAuth(app).setCustomUserClaims(f.uid, { admin: true });
    const token = (await signIn(f.email, f.password)).idToken;
    assert.equal((await callable(name, { organizationId: other.organizationId }, token)).error, 'PERMISSION_DENIED');
    assert.equal((await callable(name, { ...data, prompt: 'test injection' }, token)).error, 'INVALID_ARGUMENT');
    const { result } = await callable(name, data, token);
    assert.equal(result.source, 'deterministic');
    assert.equal(result.reason, 'disabled');
    assert.equal(result.synthetic, true);
    assert.equal((await quota.count().get()).data().count, 0);
  } finally {
    await Promise.all([cleanupFixture(f), cleanupFixture(other)]);
  }
});

test('parallel reservations cannot exceed the per-user, global daily or global monthly budgets', async () => {
  const time = new Date('2026-11-13T12:00:00Z');
  const day = '2026-11-13';
  const month = '2026-11';
  const attempts = (uids) => Promise.all(uids.map(uid => reserveExplanation(uid, time)));
  assert.equal((await attempts(Array(7).fill('same-reviewer'))).filter(Boolean).length, 3);
  assert.equal((await global.get()).data().dayCount, 3);

  await global.set({ day, month, dayCount: 19, monthCount: 19 });
  assert.equal((await attempts(['day-1', 'day-2', 'day-3'])).filter(Boolean).length, 1);
  assert.equal((await global.get()).data().dayCount, 20);

  await global.set({ day, month, dayCount: 0, monthCount: 199 });
  assert.equal((await attempts(['month-1', 'month-2', 'month-3'])).filter(Boolean).length, 1);
  assert.equal((await global.get()).data().monthCount, 200);
  assert.equal(await reserveExplanation('day-reset', new Date('2026-11-14T00:00:00Z')), false);
  assert.equal(await reserveExplanation('month-reset', new Date('2026-12-01T00:00:00Z')), true);
  assert.equal(await reserveExplanation('stale', time), false);
  assert.deepEqual((await global.get()).data(), { day: '2026-12-01', month: '2026-12', dayCount: 1, monthCount: 1 });
});
