const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const { copyFileSync, unlinkSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

test('the isolated staging entry initializes Admin and exposes only the approved callable', () => {
  const functions = join(__dirname, '..');
  const entry = join(functions, 'lib', `entry-check-${randomUUID()}.cjs`);
  copyFileSync(join(functions, '..', 'scripts', 'openai-staging-entry.cjs'), entry);
  try {
    execFileSync(process.execPath, ['-e', `
      const assert = require('node:assert/strict');
      const { getApps, getApp } = require('firebase-admin/app');
      const { getFirestore } = require('firebase-admin/firestore');
      const file = require.resolve(process.argv[1]);
      assert.equal(getApps().length, 0);
      const first = require(file);
      const app = getApp();
      assert.ok(getFirestore(app));
      delete require.cache[file];
      assert.equal(require(file).explainSyntheticMarket, first.explainSyntheticMarket);
      assert.equal(getApp(), app);
      assert.deepEqual(Object.keys(first), ['explainSyntheticMarket']);
      const endpoint = first.explainSyntheticMarket.__endpoint;
      assert.equal(endpoint.serviceAccountEmail, 'synthetic-openai@ifyoumind-staging.iam.gserviceaccount.com');
      assert.deepEqual(endpoint.secretEnvironmentVariables, [{ key: 'OPENAI_API_KEY' }]);
      assert.equal(endpoint.timeoutSeconds, 15);
      assert.equal(endpoint.maxInstances, 2);
      assert.equal(endpoint.concurrency, 1);
    `, entry], {
      cwd: functions,
      env: {
        ...process.env,
        GCLOUD_PROJECT: 'ifyoumind-staging',
        FIREBASE_CONFIG: JSON.stringify({ projectId: 'ifyoumind-staging' }),
        SYNTHETIC_OPENAI_STAGING_PROJECT: 'ifyoumind-staging',
        ENABLE_SYNTHETIC_OPENAI_EXPLANATION: 'false',
      },
    });
  } finally {
    unlinkSync(entry);
  }
});
