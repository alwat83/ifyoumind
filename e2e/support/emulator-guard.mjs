// Fail-closed checks that every QA fixture and browser test talks to the local
// Firebase emulators for the demo project, never to ifyoumind-473fe or any other real project.
// Imported by the fixture module, the Playwright global setup and `npm run qa:seed`.

export const DEMO_PROJECT = 'demo-ifyoumind';
export const PRODUCTION_PROJECT = 'ifyoumind-473fe';
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

function hostOf(value) {
  return String(value || '').replace(/^https?:\/\//, '').split(':')[0];
}

/**
 * Returns the list of problems with the environment; empty means safe.
 * Kept pure (takes `env`) so test/qa-guard.test.mjs can prove each refusal.
 */
export function emulatorEnvProblems(env = process.env) {
  const problems = [];
  for (const key of ['FIREBASE_AUTH_EMULATOR_HOST', 'FIRESTORE_EMULATOR_HOST']) {
    if (!env[key]) problems.push(`${key} is not set; refusing to reach a real Firebase project.`);
    else if (!LOCAL_HOSTS.has(hostOf(env[key]))) problems.push(`${key}=${env[key]} is not a local emulator.`);
  }
  for (const key of ['GCLOUD_PROJECT', 'GOOGLE_CLOUD_PROJECT', 'FIREBASE_PROJECT', 'QA_PROJECT_ID']) {
    if (env[key] && env[key] !== DEMO_PROJECT) problems.push(`${key}=${env[key]} is not ${DEMO_PROJECT}.`);
  }
  // A credentials file means this shell can reach real Google Cloud resources.
  if (env.GOOGLE_APPLICATION_CREDENTIALS) problems.push('GOOGLE_APPLICATION_CREDENTIALS is set; unset it before running QA fixtures.');
  if (env.QA_BASE_URL && !LOCAL_HOSTS.has(new URL(env.QA_BASE_URL).hostname)) {
    problems.push(`QA_BASE_URL=${env.QA_BASE_URL} is not local.`);
  }
  return problems;
}

export function assertEmulatorEnv(env = process.env) {
  const problems = emulatorEnvProblems(env);
  if (problems.length) {
    throw new Error(`QA fixtures refused to start:\n- ${problems.join('\n- ')}`);
  }
}

/** The app bundle under test must be the local (demo-project) build, never the production one. */
export function bundleProblems(source) {
  const problems = [];
  if (!source.includes(DEMO_PROJECT)) problems.push(`bundle does not reference ${DEMO_PROJECT}`);
  if (source.includes(PRODUCTION_PROJECT)) problems.push(`bundle references the production project ${PRODUCTION_PROJECT}`);
  return problems;
}
