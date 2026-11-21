import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { plan } from '../scripts/local-verification/core.mjs';
import { LEVELS, verificationSelection, developmentStatus, selectionMarkdown, assertRiskScope } from '../scripts/local-verification/levels.mjs';

test('default release preflight retains every existing workflow check and strict diagnostic', () => {
  assert.deepEqual(verificationSelection().selected, plan());
  assert.equal(verificationSelection().selected.at(-1).command, 'npm run diagnose:transactions');
});
test('each fixed risk profile closes its prerequisites and lists every omitted check as NOT_RUN', () => {
  for (const level of LEVELS) {
    const s=verificationSelection(level), ids=new Set(s.selected.map(c=>c.id));
    for (const c of s.selected) for (const dep of c.needs) assert.ok(ids.has(dep));
    assert.equal(s.selected.length+s.notRun.length,plan().length);
    assert.ok(s.notRun.every(c=>c.status==='NOT_RUN'));
    assert.equal(s.releaseAuthorized,false);
    assert.ok(s.knownUnresolvedFailures.every(c=>c.status==='UNRESOLVED'&&c.releaseBlocker));
    assert.ok(s.manualGates.some(c=>/branch protections/.test(c)));
  }
  assert.throws(()=>verificationSelection('consumer; deploy'));
});
test('sensitive backend level retains authentication, billing, quota, rules and full strict recovery', () => {
  const s=verificationSelection('backend').selected;
  for(const id of ['functions-tests','firestore-rules','organizations','commerce-entitlements','fixtures-access','authenticated-browser','transaction-transport']) assert.ok(s.some(c=>c.id===id));
});
test('prototype and consumer levels do not turn omitted backend failures into passing release evidence', () => {
  const s=verificationSelection('prototype');assert.ok(s.notRun.some(c=>c.id==='transaction-transport'));
  const r={selection:s,integrity:{valid:true},checks:[{status:'PASS'}]};
  assert.equal(developmentStatus(r),'PASS');
  const text=selectionMarkdown(r);assert.match(text,/NO-GO/);assert.match(text,/not passes/);assert.match(text,/transaction-read-abort/);
  for(const [status,expected]of [['FAIL','FAIL'],['BLOCKED','BLOCKED']])assert.equal(developmentStatus({...r,checks:[{status}]}),expected);
  assert.equal(developmentStatus({...r,integrity:{valid:false}}),'INVALID');
});
test('runner propagates the selected profile to Docker and preserves source/credential guards', async()=>{
  const source=await readFile('scripts/verify-local.mjs','utf8');
  assert.match(source,/manifest\.selection\.level/);assert.match(source,/sourceEvents/);assert.match(source,/credentialProblems/);
  assert.doesNotMatch(source,/update-snapshots|--privileged/);
});

test('lower levels cannot verify backend, authentication, rules, routing or runner changes', () => {
  for(const path of ['functions/src/intelligence/subscriptions.ts','firestore.rules','firebase.json','.github/workflows/authenticated-qa.yml','scripts/verify-local.mjs','scripts/local-verification/levels.mjs','src/app/auth/login.ts','src/app/intelligence/monetization.service.ts','src/app/auth.guard.ts','src/app/app.routes.ts','src/app/app.config.ts','src/environments/environment.ts','src/app/intelligence/intelligence.routes.ts']) {
    assert.throws(()=>assertRiskScope('prototype',[path]));
    assert.throws(()=>assertRiskScope('consumer',[path]));
    assert.equal(assertRiskScope('backend',[path]).minimumLevel,'backend');
  }
  assert.equal(assertRiskScope('consumer',['src/app/intelligence/pricing.component.html','src/app/intelligence/pricing.component.scss']).sensitivePaths.length,0);
});
