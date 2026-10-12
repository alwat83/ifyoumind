const { test } = require('node:test');
const assert = require('node:assert/strict');
const { authorizeOrganization, requireVerifiedIdentity } = require('../lib/intelligence/authorization');
const denied = (code) => (error) => error.code === code;

test('anonymous requests never reach membership storage', async () => {
  await assert.rejects(authorizeOrganization(undefined, 'org-a', () => { throw Error('called'); }), denied('unauthenticated'));
});
test('rejects malformed tenant paths before storage access', async () => {
  for (const id of ['../org-b', '', null, 42, 'org/a', 'a'.repeat(129)]) {
    await assert.rejects(authorizeOrganization('alice', id, () => { throw Error('called'); }), denied('invalid-argument'));
  }
});
test('tenant membership is checked against the authenticated identity', async () => {
  const reader = async (org, uid) => org === 'org-a' && uid === 'alice' ? { role: 'owner', status: 'active' } : undefined;
  assert.deepEqual(await authorizeOrganization('alice', 'org-a', reader), { organizationId: 'org-a', uid: 'alice', role: 'owner' });
  await assert.rejects(authorizeOrganization('alice', 'org-b', reader), denied('permission-denied'));
  await assert.rejects(authorizeOrganization('bob', 'org-a', reader), denied('permission-denied'));
});
test('missing, disabled, and corrupt membership cannot grant access', async () => {
  for (const member of [undefined, {}, 'owner', { role: 'owner' }, { role: 'owner', status: 'disabled' }, { role: 'superadmin', status: 'active' }]) {
    await assert.rejects(authorizeOrganization('alice', 'org-a', async () => member), denied('permission-denied'));
  }
});
test('viewer may read but cannot enter an owner/admin-only operation', async () => {
  const reader = async () => ({ role: 'viewer', status: 'active' });
  assert.equal((await authorizeOrganization('alice', 'org-a', reader)).role, 'viewer');
  await assert.rejects(authorizeOrganization('alice', 'org-a', reader, ['owner', 'admin']), denied('permission-denied'));
});

const throwsCode = (fn, code) => assert.throws(fn, denied(code));

test('verified identity: anonymous callers are unauthenticated', () => {
  for (const auth of [undefined, {}, { token: { email_verified: true } }, { uid: '', token: { email_verified: true } }]) {
    throwsCode(() => requireVerifiedIdentity(auth), 'unauthenticated');
  }
});
test('verified identity: anything but email_verified === true is refused', () => {
  for (const token of [undefined, {}, { email_verified: false }, { email_verified: 'true' }, { email_verified: 1 }, { email_verified: null }]) {
    assert.throws(() => requireVerifiedIdentity({ uid: 'alice', token }),
      (error) => error.code === 'failed-precondition' && error.message === 'Verify your email address to continue.');
  }
});
test('verified identity: a verified token returns the uid', () => {
  assert.equal(requireVerifiedIdentity({ uid: 'alice', token: { email_verified: true } }), 'alice');
});
test('verified identity: no environment, including the emulator, bypasses the check', () => {
  const saved = { ...process.env };
  try {
    Object.assign(process.env, { FUNCTIONS_EMULATOR: 'true', GCLOUD_PROJECT: 'demo-ifyoumind' });
    throwsCode(() => requireVerifiedIdentity({ uid: 'alice', token: {} }), 'failed-precondition');
    throwsCode(() => requireVerifiedIdentity({ uid: 'alice', token: { email_verified: false } }), 'failed-precondition');
    assert.equal(requireVerifiedIdentity({ uid: 'alice', token: { email_verified: true } }), 'alice');
  } finally {
    process.env = saved;
  }
});
