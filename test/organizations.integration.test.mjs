import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const handlers = require('./lib/index.js');
const { getAuth } = require('firebase-admin/auth');
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, updateDoc } from 'firebase/firestore';
let env, alice, bob, organizationId;
async function signup() {
  const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }), signal: AbortSignal.timeout(10000),
  });
  assert.equal(response.status, 200);
  return response.json();
}
async function call(name, data, token) {
  try {
    const verified = token ? await getAuth().verifyIdToken(token) : undefined;
    const result = await handlers[name].run({ data, auth: verified ? { uid: verified.uid, token: verified } : undefined });
    return { result };
  } catch (error) {
    return { error: { status: String(error.code).replaceAll('-', '_').toUpperCase() } };
  }
}
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-ifyoumind', firestore: { host: '127.0.0.1', port: 8080 } });
  alice = await signup(); bob = await signup();
});
after(async () => { await env?.cleanup(); });
test('anonymous callers cannot create workspaces', async () => {
  assert.equal((await call('createIntelligenceOrganization', { name: 'A' })).error.status, 'UNAUTHENTICATED');
});
test('invalid names do not create workspaces', async () => {
  for (const name of ['', '  ', 42, 'a'.repeat(121)]) {
    assert.equal((await call('createIntelligenceOrganization', { name }, alice.idToken)).error.status, 'INVALID_ARGUMENT');
  }
});
test('authenticated creation is idempotent and returns owner scope', async () => {
  const results = await Promise.all([1, 2].map(() => call('createIntelligenceOrganization', { name: 'A' }, alice.idToken)));
  organizationId = results[0].result.organizationId;
  assert.equal(results[1].result.organizationId, organizationId);
  const read = await call('getIntelligenceOrganization', { organizationId }, alice.idToken);
  assert.deepEqual(read.result, { organizationId, name: 'A', role: 'owner' });
});
test('other identities cannot supply owner privileges to access a tenant', async () => {
  const response = await call('getIntelligenceOrganization', { organizationId, uid: alice.localId, role: 'owner' }, bob.idToken);
  assert.equal(response.error.status, 'PERMISSION_DENIED');
});
test('disabled owner cannot read or restore access through create', async () => {
  await env.withSecurityRulesDisabled(context => updateDoc(
    doc(context.firestore(), `intelligenceOrganizations/${organizationId}/members/${alice.localId}`), { status: 'disabled' },
  ));
  assert.equal((await call('getIntelligenceOrganization', { organizationId }, alice.idToken)).error.status, 'PERMISSION_DENIED');
  assert.equal((await call('createIntelligenceOrganization', { name: 'A' }, alice.idToken)).error.status, 'PERMISSION_DENIED');
});
