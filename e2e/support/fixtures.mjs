// Deterministic QA fixtures for the Firebase Auth and Firestore emulators (demo-ifyoumind only).
//
// Every account goes through the same steps a real visitor does:
// - sign-up through the Auth REST API the web SDK uses;
// - verification by consuming the real VERIFY_EMAIL out-of-band code the emulator captured
//   (never by setting emailVerified directly);
// - a workspace from the real createIntelligenceOrganization callable;
// - decisions from the real createMarketIntelligenceProject callable.
// Nothing here writes memberships, plans or entitlements directly.
//
// The Admin SDK is used for exactly two things: seeding the shared Census place cache (so no
// test calls api.census.gov) and targeted cleanup of one fixture's own records.
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { DEMO_PROJECT, assertEmulatorEnv } from './emulator-guard.mjs';

const require = createRequire(import.meta.url);

/** Reserved TLD (RFC 2606): fixture mail can never be delivered or collide with a customer. */
export const FIXTURE_DOMAIN = 'qa.ifyoumind.test';
export const FIXTURE_PASSWORD = 'Qa-fixture-password-1';
const API_KEY = 'demo-api-key';
const REGION = 'us-central1';

/** Stable fixture identifiers; tests and reports refer to these. */
export const FIXTURES = Object.freeze({
  UNVERIFIED: 'F01-unverified',
  VERIFIED: 'F02-verified',
  FREE_NO_REPORTS: 'F03-free-empty',
  FREE_WITH_DECISION: 'F04-free-decision',
  RETURNING_WITH_REPORT: 'F05-returning',
  OTHER_TENANT: 'F06-other-tenant',
  RESTRICTED_ROUTE: 'F07-restricted',
  RETURN_URL: 'F08-return-url',
  HOSTILE_RETURN_URL: 'F09-hostile-return-url',
  EXPIRED_SESSION: 'F10-expired-session',
});

/** Cities whose Census figures are pre-seeded. Values are synthetic and only exist in the emulator. */
export const FIXTURE_PLACES = Object.freeze([
  { city: 'Springfield', state: 'IL', stateFips: '17', placeFips: '72000', population: 114000, income: 61000, homeValue: 152000, populationFiveYearsAgo: 116500 },
  { city: 'Madison', state: 'WI', stateFips: '55', placeFips: '48000', population: 270000, income: 77000, homeValue: 345000, populationFiveYearsAgo: 252000 },
  { city: 'Columbus', state: 'OH', stateFips: '39', placeFips: '18000', population: 906000, income: 65000, homeValue: 220000, populationFiveYearsAgo: 879000 },
]);

const hosts = () => ({
  auth: `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`,
  firestore: process.env.FIRESTORE_EMULATOR_HOST,
  functions: `http://${process.env.QA_FUNCTIONS_EMULATOR_HOST || '127.0.0.1:5001'}`,
});

let adminApp;
function admin() {
  assertEmulatorEnv();
  // No credentials exist here; stop the SDK probing the cloud metadata server.
  process.env.METADATA_SERVER_DETECTION ??= 'none';
  if (!adminApp) {
    const { initializeApp, getApps } = require('firebase-admin/app');
    adminApp = getApps().find(app => app.name === 'qa-fixtures') ||
      initializeApp({ projectId: DEMO_PROJECT }, 'qa-fixtures');
  }
  const { getAuth } = require('firebase-admin/auth');
  const { getFirestore } = require('firebase-admin/firestore');
  return { auth: getAuth(adminApp), db: getFirestore(adminApp) };
}

async function json(response) {
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!response.ok) {
    const message = body?.error?.message || body?.error?.status || text;
    const error = new Error(`${response.status} ${message}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

const post = (url, body, headers = {}) => fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  body: JSON.stringify(body),
}).then(json);

const identity = (method) =>
  `${hosts().auth}/identitytoolkit.googleapis.com/v1/accounts:${method}?key=${API_KEY}`;

export function newRunId() {
  return `${Date.now().toString(36)}${randomBytes(3).toString('hex')}`;
}

/** Stable, recognisable and unique per run: `f04-free-decision.<run>@qa.ifyoumind.test`. */
export function fixtureEmail(fixtureId, runId) {
  if (!Object.values(FIXTURES).includes(fixtureId) && !/^T\d{2}-[a-z0-9-]+$/.test(fixtureId)) {
    throw new Error(`Unknown fixture id ${fixtureId}`);
  }
  return `${fixtureId.toLowerCase()}.${runId}@${FIXTURE_DOMAIN}`;
}

export function isFixtureEmail(email) {
  return typeof email === 'string' && email.toLowerCase().endsWith(`@${FIXTURE_DOMAIN}`);
}

/** Calls a deployed-shape callable on the Functions emulator, exactly as the web SDK does. */
export async function callable(name, data, idToken) {
  const response = await fetch(`${hosts().functions}/${DEMO_PROJECT}/${REGION}/${name}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(idToken ? { authorization: `Bearer ${idToken}` } : {}) },
    body: JSON.stringify({ data }),
  });
  const body = await response.json().catch(() => ({}));
  if (body.error) return { error: body.error.status, message: body.error.message };
  return { result: body.result };
}

export async function signIn(email, password = FIXTURE_PASSWORD) {
  return post(identity('signInWithPassword'), { email, password, returnSecureToken: true });
}

/** The emulator's captured outbox: verification links that a real visitor would receive by email. */
export async function outbox(email) {
  const body = await fetch(`${hosts().auth}/emulator/v1/projects/${DEMO_PROJECT}/oobCodes`).then(json);
  return (body.oobCodes || []).filter(code => code.email === email);
}

export async function latestVerificationLink(email) {
  const codes = (await outbox(email)).filter(code => code.requestType === 'VERIFY_EMAIL');
  return codes.at(-1) || null;
}

/**
 * Creates one fixture account and the state its scenario needs.
 * options.verified   consume a real verification code (default true)
 * options.workspace  create the workspace through the real callable (default: verified)
 * options.decisions  number of decisions created through the real callable (default 0)
 */
export async function createFixture(fixtureId, options = {}) {
  assertEmulatorEnv();
  const runId = options.runId || newRunId();
  const email = fixtureEmail(fixtureId, runId);
  const verified = options.verified ?? true;
  const fixture = { fixtureId, runId, email, password: FIXTURE_PASSWORD, uid: '', idToken: '', organizationId: '', projectIds: [] };

  const signUp = await post(identity('signUp'), { email, password: FIXTURE_PASSWORD, returnSecureToken: true });
  fixture.uid = signUp.localId;
  fixture.idToken = signUp.idToken;
  await post(identity('update'), { idToken: signUp.idToken, displayName: `QA ${fixtureId}`, returnSecureToken: true });

  if (verified) {
    await post(identity('sendOobCode'), { requestType: 'VERIFY_EMAIL', idToken: fixture.idToken });
    const link = await latestVerificationLink(email);
    if (!link) throw new Error(`No verification code captured for ${email}`);
    await post(identity('update'), { oobCode: link.oobCode });
    // A fresh sign-in mints a token whose email_verified claim reflects the verification.
    fixture.idToken = (await signIn(email)).idToken;
  }

  if (options.workspace ?? verified) {
    const created = await callable('createIntelligenceOrganization', { name: 'My ifYouMind' }, fixture.idToken);
    if (created.error) throw new Error(`Workspace creation failed: ${created.error} ${created.message}`);
    fixture.organizationId = created.result.organizationId;
  }

  for (let i = 0; i < (options.decisions || 0); i++) {
    const [primary, ...others] = FIXTURE_PLACES;
    const made = await callable('createMarketIntelligenceProject', {
      organizationId: fixture.organizationId,
      location: `${primary.city}, ${primary.state}`,
      comparisonLocations: others.map(place => `${place.city}, ${place.state}`),
      concept: `QA fixture bakery ${i + 1}`,
      decision: `QA fixture decision ${i + 1}: where should the bakery open?`,
    }, fixture.idToken);
    if (made.error) throw new Error(`Decision creation failed: ${made.error} ${made.message}`);
    fixture.projectIds.push(made.result.id);
  }

  fixture.cleanup = () => cleanupFixture(fixture);
  return fixture;
}

/**
 * Removes exactly one fixture's records: its Auth user, the workspace it owns, its owner index
 * and its product events. Refuses anything that isn't a fixture address. No wildcard deletes.
 */
export async function cleanupFixture({ email, uid }) {
  assertEmulatorEnv();
  if (!isFixtureEmail(email) || !uid) throw new Error(`Refusing to clean up non-fixture account ${email}`);
  const { auth, db } = admin();
  let user = null;
  try { user = await auth.getUser(uid); } catch { /* already removed */ }
  if (user && !isFixtureEmail(user.email)) throw new Error(`Refusing: uid ${uid} is not a fixture account`);

  const index = await db.collection('intelligenceWorkspaceOwners').doc(uid).get();
  const organizationId = index.data()?.organizationId;
  if (organizationId) {
    const orgRef = db.collection('intelligenceOrganizations').doc(organizationId);
    const org = await orgRef.get();
    if (org.exists && org.data()?.createdBy !== uid) {
      throw new Error(`Refusing: workspace ${organizationId} was not created by fixture ${uid}`);
    }
    const events = await db.collection('productEvents').where('organizationId', '==', organizationId).get();
    await Promise.all(events.docs.map(doc => doc.ref.delete()));
    await db.recursiveDelete(orgRef);
    await index.ref.delete();
  }
  if (user) await auth.deleteUser(uid);
}

/** Cleanup for an account the browser created; a no-op if it was never created. */
export async function cleanupFixtureByEmail(email) {
  if (!isFixtureEmail(email)) throw new Error(`Refusing to clean up non-fixture account ${email}`);
  const { auth } = admin();
  let user;
  try { user = await auth.getUserByEmail(email); } catch { return; }
  await cleanupFixture({ email, uid: user.uid });
}

/** Fixture accounts still present, for leak checks after a run. */
export async function remainingFixtureUsers() {
  const { auth } = admin();
  const found = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    found.push(...page.users.filter(user => isFixtureEmail(user.email)));
    pageToken = page.pageToken;
  } while (pageToken);
  return found;
}

/** Seeds the shared Census place cache the real decision pipeline reads before calling Census. */
export async function seedCensusCache() {
  const { db } = admin();
  const { FieldValue } = require('firebase-admin/firestore');
  const normalize = value => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  await Promise.all(FIXTURE_PLACES.map(place => {
    const id = `acs5-2024-2019-${place.stateFips}-${normalize(place.city).replace(/\s+/g, '_')}`;
    const populationChangePct = Number((((place.population - place.populationFiveYearsAgo) / place.populationFiveYearsAgo) * 100).toFixed(1));
    return db.collection('censusPlaceCache').doc(id).set({
      location: `${place.city}, ${place.state}`,
      population: place.population,
      income: place.income,
      homeValue: place.homeValue,
      populationFiveYearsAgo: place.populationFiveYearsAgo,
      populationChangePct,
      placeFips: place.placeFips,
      stateFips: place.stateFips,
      sourceYears: [2019, 2024],
      qaFixture: true,
      cachedAt: FieldValue.serverTimestamp(),
    });
  }));
}

/** Disables an account, as an administrator suspending it would; its session must stop working. */
export async function disableAccount(uid) {
  const { auth } = admin();
  const user = await auth.getUser(uid);
  if (!isFixtureEmail(user.email)) throw new Error('Refusing to disable a non-fixture account');
  await auth.updateUser(uid, { disabled: true });
}
