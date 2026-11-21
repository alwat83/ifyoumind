import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const script = 'test/diagnostics/firestore-transaction-transport.cjs';
const launch = values => spawnSync(process.execPath, ['--test', script], {
  env: { PATH: process.env.PATH, ...values }, encoding: 'utf8', timeout: 5000,
});
test('transaction diagnostic refuses non-demo and non-loopback targets before using a client', () => {
  for (const values of [
    { GCLOUD_PROJECT: 'ifyoumind-473fe', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' },
    { GCLOUD_PROJECT: 'demo-ifyoumind', FIRESTORE_EMULATOR_HOST: 'example.invalid:8080' },
    { GCLOUD_PROJECT: 'demo-ifyoumind' },
  ]) {
    const result = launch(values);
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stdout + result.stderr, /Requires the loopback Firestore emulator/);
  }
});
test('transaction diagnostic refuses credential variables without exposing their values', () => {
  const marker = 'synthetic-secret-that-must-not-be-printed';
  const result = launch({ GCLOUD_PROJECT: 'demo-ifyoumind', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080', OPENAI_API_KEY: marker });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.match(result.stdout + result.stderr, /Credential-bearing environment refused: OPENAI_API_KEY/);
  assert.ok(!(result.stdout + result.stderr).includes(marker));
});
