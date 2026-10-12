// Safety rails around the QA fixture system: it can only run against local emulators, and none of it
// can reach the production bundle or production client code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { emulatorEnvProblems, bundleProblems } from '../e2e/support/emulator-guard.mjs';
import { scan } from '../scripts/check-production-bundle.mjs';

const local = { FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' };

test('fixtures run only against local emulators for the demo project', () => {
  assert.deepEqual(emulatorEnvProblems(local), []);
  assert.deepEqual(emulatorEnvProblems({ ...local, GCLOUD_PROJECT: 'demo-ifyoumind' }), []);
  const refusals = [
    {},
    { FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' },
    { ...local, FIRESTORE_EMULATOR_HOST: 'firestore.googleapis.com:443' },
    { ...local, FIREBASE_AUTH_EMULATOR_HOST: '10.0.0.5:9099' },
    { ...local, GCLOUD_PROJECT: 'ifyoumind-473fe' },
    { ...local, GOOGLE_CLOUD_PROJECT: 'some-other-project' },
    { ...local, GOOGLE_APPLICATION_CREDENTIALS: '/keys/admin.json' },
    { ...local, QA_BASE_URL: 'https://ifyoumind.com' },
  ];
  for (const env of refusals) assert.ok(emulatorEnvProblems(env).length > 0, JSON.stringify(env));
});

test('browser tests refuse the production bundle', () => {
  assert.deepEqual(bundleProblems('projectId:"demo-ifyoumind"'), []);
  assert.ok(bundleProblems('projectId:"ifyoumind-473fe"').length > 0);
  assert.ok(bundleProblems('projectId:"demo-ifyoumind",x:"ifyoumind-473fe"').length > 0);
});

test('the production bundle check rejects emulator config and fixture strings', () => {
  assert.deepEqual(scan([['main.js', 'projectId:"ifyoumind-473fe"']]), []);
  assert.ok(scan([['main.js', 'projectId:"demo-ifyoumind"']]).length > 0, 'local config');
  assert.ok(scan([['main.js', 'ifyoumind-473fe qa.ifyoumind.test']]).length > 0, 'fixture domain');
  assert.ok(scan([['main.js', 'ifyoumind-473fe /emulator/v1/projects/x/oobCodes']]).length > 0, 'emulator endpoint');
});

function sources(dir) {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sources(path) : /\.(ts|html)$/.test(name) && !name.endsWith('.spec.ts') ? [path] : [];
  });
}

test('application code never imports QA fixtures or the local Firebase config', () => {
  for (const file of sources('src')) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /e2e\/|qa\.ifyoumind\.test|oobCodes|firebase-admin/, file);
    if (!file.endsWith('firebase.config.local.ts')) assert.doesNotMatch(text, /firebase\.config\.local/, file);
  }
  const angular = JSON.parse(readFileSync('angular.json', 'utf8'));
  const configs = angular.projects.ifyoumind.architect.build.configurations;
  assert.equal(angular.projects.ifyoumind.architect.build.defaultConfiguration, 'production');
  assert.equal(configs.production.fileReplacements, undefined, 'production build uses the real Firebase config');
  assert.equal(configs.local.fileReplacements[0].with, 'src/app/firebase.config.local.ts');
});

test('local builds never land in the deploy directory', () => {
  const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts;
  assert.match(scripts['build:local'], /--output-path dist\/ifyoumind-local/);
  assert.equal(JSON.parse(readFileSync('firebase.json', 'utf8')).hosting.public, 'dist/ifyoumind-deploy/browser');
});

test('no emulator exception weakens the verification gate', () => {
  const guard = readFileSync('src/app/auth.guard.ts', 'utf8');
  assert.doesNotMatch(guard, /useLocalEmulators/);
  const register = readFileSync('src/app/auth/register/register.component.ts', 'utf8');
  assert.doesNotMatch(register, /useLocalEmulators/);
  assert.match(register, /await this\.sendVerification\(credential\.user\);\s*await this\.router\.navigate\(\['\/verify-email'\]\)/);
});
