// Static guarantees for the founder-run Stripe reconciliation: it can only read.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const source = readFileSync('scripts/reconcile-stripe.mjs', 'utf8');
const code = source.split('\n').filter(line => !line.trim().startsWith('//')).join('\n');

test('the reconciliation script never writes to Stripe or Firestore', () => {
  assert.equal((code.match(/fetch\(/g) || []).length, 1, 'one network call site');
  assert.match(code, /fetch\(url, \{ method: 'GET'/);
  assert.doesNotMatch(code, /method:\s*'(POST|PUT|PATCH|DELETE)'/i);
  const firestoreCode = code.replace(/searchParams\.set\(/g, '');
  for (const write of ['.set(', '.update(', '.delete(', '.add(', '.create(', 'batch(', 'runTransaction', 'recursiveDelete', 'bulkWriter', 'writeFile', 'appendFile']) {
    assert.ok(!firestoreCode.includes(write), `no ${write}`);
  }
  assert.doesNotMatch(code, /stripe-commerce-logic|monetization|report-entitlement/, 'no entitlement code is loaded');
});

test('the key is never printed and error bodies are never printed', () => {
  for (const line of code.split('\n').filter(l => /console\.(log|error)/.test(l))) {
    assert.doesNotMatch(line, /\$\{key\}|[(,]\s*key\b|authorization|body/, line.trim());
  }
  assert.match(code, /body: response\.ok \? await response\.json\(\) : null/, 'failed responses are discarded');
});

test('it refuses a secret key, a missing project and a missing date before any request', () => {
  const run = env => spawnSync(process.execPath, ['scripts/reconcile-stripe.mjs', '--project', 'ifyoumind-473fe', '--since', '2026-10-01'],
    { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8' });
  for (const key of ['', 'sk_live_abc', 'rk_test_abc', 'pk_live_abc', 'rk_live_abc; echo']) {
    const r = run({ STRIPE_RECONCILE_KEY: key });
    assert.equal(r.status, 2, key);
    assert.match(r.stderr, /restricted key/);
    assert.ok(!r.stderr.includes('abc'), 'the key is not echoed');
  }
  const noProject = spawnSync(process.execPath, ['scripts/reconcile-stripe.mjs'], { env: { PATH: process.env.PATH, STRIPE_RECONCILE_KEY: 'rk_live_abc' }, encoding: 'utf8' });
  assert.equal(noProject.status, 2);
  assert.match(noProject.stderr, /--project/);
});
