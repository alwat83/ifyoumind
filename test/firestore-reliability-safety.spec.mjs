import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { emulatorOnly } = require('./diagnostics/firestore-emulator-only.cjs');
const safe = { GCLOUD_PROJECT: 'demo-ifyoumind', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' };
test('diagnostics refuse remote, production and missing emulator configurations', () => {
  emulatorOnly(safe);
  for (const env of [{}, { ...safe, GCLOUD_PROJECT: 'ifyoumind-473fe' }, { ...safe, FIRESTORE_EMULATOR_HOST: 'example.com:8080' }]) assert.throws(() => emulatorOnly(env));
});
test('diagnostics refuse credential-bearing environments without echoing values', () => {
  for (const key of ['GOOGLE_APPLICATION_CREDENTIALS', 'CLOUDSDK_AUTH_ACCESS_TOKEN', 'FIREBASE_TOKEN', 'OPENAI_API_KEY', 'STRIPE_SECRET_KEY', 'AWS_SESSION_TOKEN']) {
    assert.throws(() => emulatorOnly({ ...safe, [key]: 'must-not-be-printed' }), error => !error.message.includes('must-not-be-printed'));
  }
});
test('CLI entry points fail before any SDK import or network access outside demo mode', () => {
  for (const file of ['firestore-natural-city.cjs', 'firestore-rest-candidate.cjs']) {
    const child = spawnSync(process.execPath, ['test/diagnostics/' + file], { env: { PATH: process.env.PATH, GCLOUD_PROJECT: 'ifyoumind-473fe' }, encoding: 'utf8' });
    assert.notEqual(child.status, 0); assert.match(child.stderr, /No cloud fallback/); assert.doesNotMatch(child.stderr, /MODULE_NOT_FOUND/);
  }
});
