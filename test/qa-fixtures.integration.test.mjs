// QA fixture lifecycle and server-side access checks, against the Auth, Firestore and Functions emulators.
// Run with: npm run test:qa-integration
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import {
  FIXTURES, callable, cleanupFixture, cleanupFixtureByEmail, createFixture, latestVerificationLink,
  remainingFixtureUsers, seedCensusCache, signIn,
} from '../e2e/support/fixtures.mjs';

const require = createRequire(import.meta.url);
const created = [];
const make = async (id, options) => { const f = await createFixture(id, options); created.push(f); return f; };

before(seedCensusCache);
after(async () => { for (const f of created) await cleanupFixture(f).catch(() => {}); });

test('a verified fixture is verified by consuming a real verification code', async () => {
  const f = await make(FIXTURES.VERIFIED, { workspace: false });
  // The emulator drops a code once it has been used, as Firebase does.
  assert.equal(await latestVerificationLink(f.email), null);
  const token = JSON.parse(Buffer.from(f.idToken.split('.')[1], 'base64url').toString());
  assert.equal(token.email_verified, true);
  assert.match(f.email, /^f02-verified\.[a-z0-9]+@qa\.ifyoumind\.test$/);
});

test('an unverified fixture has no verification and no workspace', async () => {
  const f = await make(FIXTURES.UNVERIFIED, { verified: false });
  const token = JSON.parse(Buffer.from(f.idToken.split('.')[1], 'base64url').toString());
  assert.equal(token.email_verified, false);
  assert.equal(f.organizationId, '');
  assert.equal(await latestVerificationLink(f.email), null);
});

test('workspace creation goes through the real callable and is idempotent', async () => {
  const f = await make(FIXTURES.FREE_NO_REPORTS);
  const again = await callable('createIntelligenceOrganization', { name: 'Second' }, f.idToken);
  assert.equal(again.result.organizationId, f.organizationId);
  const mine = await callable('getMyIntelligenceOrganization', {}, f.idToken);
  assert.equal(mine.result.organization.role, 'owner');
});

test('a free decision is created through the real pipeline from the seeded Census cache', async () => {
  const f = await make(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
  const read = await callable('getMarketIntelligenceProject', { organizationId: f.organizationId, projectId: f.projectIds[0] }, f.idToken);
  assert.equal(read.result.decisionReportAccess, 'none');
  assert.equal(read.result.decisionReportPurchased, false);
  assert.equal(read.result.brief.decisionReport, undefined, 'free view never carries the paid report');
  assert.equal(read.result.mode, 'live');
});

test("one account can't read, list, create in, unlock or check out another account's workspace", async () => {
  const owner = await make(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
  const other = await make(FIXTURES.OTHER_TENANT);
  const org = { organizationId: owner.organizationId };
  const attempts = {
    getMarketIntelligenceProject: { ...org, projectId: owner.projectIds[0] },
    getRecentMarketIntelligenceProjects: org,
    getIntelligenceOrganization: org,
    getCommercialStatus: org,
    createMarketIntelligenceProject: { ...org, location: 'Springfield, IL', concept: 'x', decision: 'x' },
    unlockDecisionReportWithPro: { ...org, projectId: owner.projectIds[0] },
    createCommercialCheckout: { ...org, offer: 'report', projectId: owner.projectIds[0] },
    recordProductEvent: { ...org, event: 'app_open' },
  };
  for (const [name, data] of Object.entries(attempts)) {
    const { error } = await callable(name, data, other.idToken);
    assert.equal(error, 'PERMISSION_DENIED', name);
  }
  // Without a token every one of them is refused before any read.
  for (const [name, data] of Object.entries(attempts)) {
    assert.equal((await callable(name, data, null)).error, 'UNAUTHENTICATED', name);
  }
  // Even guessing the id from its own workspace finds nothing.
  const guess = await callable('getMarketIntelligenceProject', { organizationId: other.organizationId, projectId: owner.projectIds[0] }, other.idToken);
  assert.equal(guess.error, 'NOT_FOUND');
});

test('a non-admin account is refused the founder funnel metrics', async () => {
  const f = await make(FIXTURES.RESTRICTED_ROUTE);
  assert.equal((await callable('getProductFunnelMetrics', {}, f.idToken)).error, 'PERMISSION_DENIED');
});

const serverChecksVerification = (() => {
  const file = require.resolve('../functions/lib/intelligence/authorization.js');
  return existsSync(file) && readFileSync(file, 'utf8').includes('requireVerifiedIdentity');
})();

test('an unverified account cannot create decisions or open checkout (server check)', {
  skip: serverChecksVerification ? false : 'server-side email verification arrives with PR #26; until then only the browser guard enforces it',
}, async () => {
  const f = await make(FIXTURES.UNVERIFIED, { verified: false, workspace: true });
  const create = await callable('createMarketIntelligenceProject', { organizationId: f.organizationId, location: 'Springfield, IL', concept: 'x', decision: 'x' }, f.idToken);
  assert.equal(create.error, 'FAILED_PRECONDITION');
  const checkout = await callable('createCommercialCheckout', { organizationId: f.organizationId, offer: 'report', projectId: 'x' }, f.idToken);
  assert.equal(checkout.error, 'FAILED_PRECONDITION');
});

test('cleanup removes exactly one fixture: user, workspace, decisions, owner index and events', async () => {
  const { getFirestore } = require('firebase-admin/firestore');
  const keep = await make(FIXTURES.RETURNING_WITH_REPORT, { decisions: 1 });
  const gone = await createFixture(FIXTURES.EXPIRED_SESSION, { decisions: 1 });
  await callable('recordProductEvent', { organizationId: gone.organizationId, event: 'app_open' }, gone.idToken);
  await cleanupFixture(gone);
  await assert.rejects(signIn(gone.email), /EMAIL_NOT_FOUND|INVALID_LOGIN_CREDENTIALS/);
  const db = getFirestore((await import('firebase-admin/app')).getApp('qa-fixtures'));
  assert.equal((await db.collection('intelligenceOrganizations').doc(gone.organizationId).get()).exists, false);
  assert.equal((await db.collection('intelligenceOrganizations').doc(gone.organizationId).collection('marketProjects').get()).size, 0);
  assert.equal((await db.collection('intelligenceWorkspaceOwners').doc(gone.uid).get()).exists, false);
  assert.equal((await db.collection('productEvents').where('organizationId', '==', gone.organizationId).get()).size, 0);
  // The other fixture is untouched.
  const still = await callable('getMarketIntelligenceProject', { organizationId: keep.organizationId, projectId: keep.projectIds[0] }, (await signIn(keep.email)).idToken);
  assert.ok(still.result);
});

test('a free workspace gets three decisions a month; the fourth is refused and nothing is written', async () => {
  const { getFirestore } = require('firebase-admin/firestore');
  const f = await make(FIXTURES.FREE_LIMIT, { decisions: 3 });
  const fourth = await callable('createMarketIntelligenceProject', {
    organizationId: f.organizationId, location: 'Springfield, IL', concept: 'QA fixture bakery 4', decision: 'Fourth decision',
  }, f.idToken);
  assert.equal(fourth.error, 'RESOURCE_EXHAUSTED');
  assert.match(fourth.message, /used your 3 free decisions this month/);
  const db = getFirestore((await import('firebase-admin/app')).getApp('qa-fixtures'));
  assert.equal((await db.collection('intelligenceOrganizations').doc(f.organizationId).collection('marketProjects').get()).size, 3);
  // Existing decisions stay readable after the limit.
  const read = await callable('getMarketIntelligenceProject', { organizationId: f.organizationId, projectId: f.projectIds[0] }, f.idToken);
  assert.ok(read.result);
  // Another free workspace is not affected.
  const other = await make(FIXTURES.FREE_NO_REPORTS, { decisions: 1 });
  assert.equal(other.projectIds.length, 1);
});

test('decisions from an earlier month do not count toward this month', async () => {
  const { getFirestore, Timestamp } = require('firebase-admin/firestore');
  const f = await make(FIXTURES.FREE_LIMIT);
  const db = getFirestore((await import('firebase-admin/app')).getApp('qa-fixtures'));
  const now = new Date();
  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - 24 * 3600 * 1000);
  // Earlier decisions as the pipeline stores them, dated in the previous month (test data, not an entitlement).
  for (let i = 0; i < 3; i++) {
    await db.collection('intelligenceOrganizations').doc(f.organizationId).collection('marketProjects').add({
      schemaVersion: 2, location: 'Springfield, IL', concept: `Earlier ${i}`, decision: `Earlier ${i}`, comparisonLocations: [],
      mode: 'live', status: 'ready', createdBy: f.uid, createdAt: Timestamp.fromDate(lastMonth),
    });
  }
  for (let i = 0; i < 3; i++) {
    const made = await callable('createMarketIntelligenceProject', {
      organizationId: f.organizationId, location: 'Springfield, IL', concept: `Now ${i}`, decision: `Now ${i}`,
    }, f.idToken);
    assert.ok(made.result, `decision ${i + 1} this month`);
  }
  const refused = await callable('createMarketIntelligenceProject', {
    organizationId: f.organizationId, location: 'Springfield, IL', concept: 'Now 3', decision: 'Now 3',
  }, f.idToken);
  assert.equal(refused.error, 'RESOURCE_EXHAUSTED');
});

test('cleanup refuses addresses that are not fixtures', async () => {
  await assert.rejects(cleanupFixture({ email: 'customer@example.com', uid: 'abc' }), /non-fixture/);
  await assert.rejects(cleanupFixtureByEmail('owner@ifyoumind.com'), /non-fixture/);
});

test('fixtures are independent: the same scenario twice gives two separate accounts', async () => {
  const a = await make(FIXTURES.VERIFIED);
  const b = await make(FIXTURES.VERIFIED);
  assert.notEqual(a.email, b.email);
  assert.notEqual(a.organizationId, b.organizationId);
});

test('no fixture accounts leak once every test has cleaned up', async () => {
  for (const f of created.splice(0)) await cleanupFixture(f);
  assert.deepEqual((await remainingFixtureUsers()).map(u => u.email), []);
});
