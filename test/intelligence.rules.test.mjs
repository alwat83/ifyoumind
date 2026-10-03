import { before, after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
let env;
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-ifyoumind', firestore: {
    host: '127.0.0.1', port: 8080, rules: await readFile('firestore.rules', 'utf8'),
  }});
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'intelligenceOrganizations/org-a'), { name: 'A' }),
      setDoc(doc(db, 'intelligenceOrganizations/org-b'), { name: 'B' }),
      setDoc(doc(db, 'intelligenceOrganizations/org-a/members/alice'), { role: 'owner', status: 'active' }),
      setDoc(doc(db, 'intelligenceOrganizations/org-a/members/disabled'), { role: 'owner', status: 'disabled' }),
      setDoc(doc(db, 'intelligenceOrganizations/org-a/pulseReports/day'), { summary: 'Report' }),
      setDoc(doc(db, 'intelligenceOrganizations/org-b/pulseReports/day'), { summary: 'Private' }),
      setDoc(doc(db, 'intelligenceOrganizations/org-a/connections/stripe'), { secretRef: 'private' }),
    ]);
  });
});
after(async () => { await env?.cleanup(); });
test('active member reads their own organization and Pulse', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertSucceeds(getDoc(doc(db, 'intelligenceOrganizations/org-a')));
  await assertSucceeds(getDoc(doc(db, 'intelligenceOrganizations/org-a/pulseReports/day')));
});
test('authenticated user cannot read another tenant', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertFails(getDoc(doc(db, 'intelligenceOrganizations/org-b')));
  await assertFails(getDoc(doc(db, 'intelligenceOrganizations/org-b/pulseReports/day')));
});
test('anonymous and disabled members cannot read', async () => {
  for (const context of [env.unauthenticatedContext(), env.authenticatedContext('disabled')]) {
    await assertFails(getDoc(doc(context.firestore(), 'intelligenceOrganizations/org-a')));
  }
});
test('client cannot create tenant or elevate membership', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(db, 'intelligenceOrganizations/new'), { name: 'New' }));
  await assertFails(setDoc(doc(db, 'intelligenceOrganizations/org-b/members/alice'), { role: 'owner', status: 'active' }));
  await assertFails(setDoc(doc(db, 'intelligenceOrganizations/org-a/members/alice'), { role: 'admin', status: 'active' }));
});
test('members cannot write Pulse or read private connection state', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(db, 'intelligenceOrganizations/org-a/pulseReports/day'), { summary: 'Fake' }));
  await assertFails(getDoc(doc(db, 'intelligenceOrganizations/org-a/connections/stripe')));
});
