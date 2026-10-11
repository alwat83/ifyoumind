import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source=fs.readFileSync(new URL('../src/app/auth/email-verification.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {needsTokenRefresh,isEmailVerificationRequired,redirectIfUnverified,VERIFY_EMAIL_MESSAGE}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const backend=fs.readFileSync(new URL('../functions/src/intelligence/authorization.ts',import.meta.url),'utf8');

test('the guard refreshes only a verified account whose token predates verification',()=>{
  assert.equal(needsTokenRefresh(true,false),true);
  assert.equal(needsTokenRefresh(true,undefined),true);
  assert.equal(needsTokenRefresh(true,'true'),true);
  assert.equal(needsTokenRefresh(true,true),false);
  assert.equal(needsTokenRefresh(false,false),false);
  assert.equal(needsTokenRefresh(false,true),false);
});

test('only the backend verify-email refusal is recognised',()=>{
  assert.ok(backend.includes(`'${VERIFY_EMAIL_MESSAGE}'`),'browser and backend messages must match');
  assert.equal(isEmailVerificationRequired({code:'functions/failed-precondition',message:VERIFY_EMAIL_MESSAGE}),true);
  assert.equal(isEmailVerificationRequired({code:'functions/failed-precondition',message:'No Stripe billing account is connected yet.'}),false);
  assert.equal(isEmailVerificationRequired({code:'functions/permission-denied',message:VERIFY_EMAIL_MESSAGE}),false);
  assert.equal(isEmailVerificationRequired(null),false);
  assert.equal(isEmailVerificationRequired(new Error('x')),false);
});

test('a refused call sends the visitor to /verify-email and still rejects; other outcomes do not navigate',async()=>{
  const navigations=[];
  const router={navigate:async(commands)=>{navigations.push(commands);return true;}};
  const refusal={code:'functions/failed-precondition',message:VERIFY_EMAIL_MESSAGE};
  await assert.rejects(redirectIfUnverified(router,async()=>{throw refusal;}),(e)=>e===refusal);
  assert.deepEqual(navigations,[['/verify-email']]);
  assert.equal(await redirectIfUnverified(router,async()=>'ok'),'ok');
  await assert.rejects(redirectIfUnverified(router,async()=>{throw {code:'functions/internal',message:'boom'};}));
  assert.equal(navigations.length,1);
});

const {ensureFreshVerification}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
function fakeUser({verified,afterReload=verified,claim=verified,reloadFails=false,tokenFails=false}){
  const calls={reload:0,refresh:0};
  const user={emailVerified:verified,calls,
    async reload(){calls.reload++;if(reloadFails)throw new Error('offline');user.emailVerified=afterReload;},
    async getIdTokenResult(){if(tokenFails)throw new Error('offline');return {claims:{email_verified:claim}};},
    async getIdToken(force){if(force)calls.refresh++;return 't';}};
  return user;
}

test('a verified account with a current token passes with no network calls',async()=>{
  const u=fakeUser({verified:true});
  assert.equal(await ensureFreshVerification(u),true);
  assert.deepEqual(u.calls,{reload:0,refresh:0});
});

test('a verified account with a token minted before verification is refreshed once',async()=>{
  const u=fakeUser({verified:true,claim:false});
  assert.equal(await ensureFreshVerification(u),true);
  assert.deepEqual(u.calls,{reload:0,refresh:1});
});

test('arriving from the email link: a stale unverified account is reloaded, then refreshed and let through',async()=>{
  const u=fakeUser({verified:false,afterReload:true,claim:false});
  assert.equal(await ensureFreshVerification(u),true);
  assert.deepEqual(u.calls,{reload:1,refresh:1});
});

test('a genuinely unverified account is still refused after one reload',async()=>{
  const u=fakeUser({verified:false});
  assert.equal(await ensureFreshVerification(u),false);
  assert.deepEqual(u.calls,{reload:1,refresh:0});
});

test('network failures never block a verified account and never admit an unverified one',async()=>{
  assert.equal(await ensureFreshVerification(fakeUser({verified:true,tokenFails:true})),true);
  assert.equal(await ensureFreshVerification(fakeUser({verified:false,reloadFails:true})),false);
});
