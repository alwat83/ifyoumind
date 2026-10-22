// Run inside firebase emulators:exec --project demo-ifyoumind --only auth,firestore,functions.
import { spawnSync } from 'node:child_process';
import { assertEmulatorEnv, DEMO_PROJECT } from './emulator-guard.mjs';

assertEmulatorEnv();
const stages = [
  ['Firestore rules', ['--test', 'test/intelligence.rules.test.mjs']],
  ['Organizations', ['--test', 'test/organizations.integration.test.mjs']],
  ['Commerce (Stripe REST intercepted)', ['--test', 'test/commerce.integration.test.mjs']],
  ['QA fixtures and usage limits', ['--test', '--test-concurrency=1', 'test/qa-fixtures.integration.test.mjs', 'test/universal-limits.integration.test.mjs']],
  ['Desktop/mobile browser suite', ['node_modules/@playwright/test/cli.js', 'test', '--config', 'e2e/playwright.config.mjs', '--workers=2']],
];
for (const [name, args] of stages) {
  // CI normally starts a fresh emulator for each suite. Preserve that isolation here too.
  // The guard above rejects cloud projects/hosts before these demo-only reset requests.
  for (const url of [
    `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${DEMO_PROJECT}/databases/(default)/documents`,
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${DEMO_PROJECT}/accounts`,
  ]) {
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Local emulator reset failed: ${response.status}`);
  }
  console.log(`RELEASE STAGE: ${name}`);
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
