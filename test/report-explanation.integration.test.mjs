import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
const require=createRequire(new URL('../functions/package.json',import.meta.url));
const {initializeApp,getApps}=require('firebase-admin/app');
const {getFirestore}=require('firebase-admin/firestore');
const {reserveReportExplanation}=require('../functions/lib/intelligence/explain-decision-report');
const {projectReportEvidence}=require('../functions/lib/intelligence/report-explanation');
assert.equal(process.env.GCLOUD_PROJECT,'demo-ifyoumind');
assert.ok(process.env.FIRESTORE_EMULATOR_HOST?.startsWith('127.0.0.1:'));
if(!getApps().length)initializeApp({projectId:'demo-ifyoumind'});
const db=getFirestore(),org=db.collection('intelligenceOrganizations').doc('report-ai-fixture'),internal=db.collection('internalReportExplanation');
const url='https://api.census.gov/data/2024/acs/acs5?get=NAME%2CB01003_001E%2CB19013_001E%2CB25077_001E&for=place%3A123&in=state%3A08';
const fixture=()=>({mode:'live',location:'Fixture, CO',decisionReportPurchased:true,brief:{metrics:[{key:'income',value:62000,unit:'USD',sourceUrl:url}],comparisons:[]}});
let env,packet;
const date=new Date('2026-11-21T12:00:00Z');
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ifyoumind',firestore:{host:'127.0.0.1',port:Number(process.env.FIRESTORE_EMULATOR_HOST.split(':').at(-1)),rules:await readFile('firestore.rules','utf8')}});});
after(async()=>{await env.cleanup();});
beforeEach(async()=>{await db.recursiveDelete(internal);await db.recursiveDelete(org);await org.set({plan:'free'});await org.collection('members').doc('owner').set({role:'owner',status:'active'});await org.collection('marketProjects').doc('report').set(fixture());packet=projectReportEvidence(fixture());});
const reserve=(project='report',uid='owner',when=date)=>reserveReportExplanation(org.id,project,uid,packet,when);

test('same-report concurrent and repeated reservations allow exactly one provider attempt',async()=>{
 const results=await Promise.all([reserve(),reserve()]);assert.deepEqual(results.map(x=>x.state).sort(),['previous-attempt','reserved']);assert.equal((await reserve()).state,'previous-attempt');assert.equal((await internal.doc('global').get()).get('monthCount'),1);assert.equal((await internal.where('state','==','reserved').get()).size,1);
});
test('different reports respect a user daily cap; no report entitlement/credit is consumed',async()=>{
 for(let i=0;i<4;i++)await org.collection('marketProjects').doc('r'+i).set(fixture());
 for(let i=0;i<3;i++)assert.equal((await reserve('r'+i)).state,'reserved');assert.equal((await reserve('r3')).state,'limit');
 assert.deepEqual((await org.get()).data(),{plan:'free'});assert.deepEqual((await org.collection('marketProjects').doc('report').get()).data(),fixture());
});
test('global monthly ceiling reserves at most the modeled $1, including concurrent requests',async()=>{
 await internal.doc('global').set({day:'2026-11-21',month:'2026-11',dayCount:0,monthCount:199,reservedMicroUsd:995000});await org.collection('marketProjects').doc('other').set(fixture());
 const r=await Promise.all([reserve(),reserve('other')]);assert.deepEqual(r.map(x=>x.state).sort(),['limit','reserved']);const g=(await internal.doc('global').get()).data();assert.equal(g.monthCount,200);assert.equal(g.reservedMicroUsd,1000000);
});
test('UTC day/month rollover preserves forward-only windows and cannot reset newer usage',async()=>{
 assert.equal((await reserve()).state,'reserved');await org.collection('marketProjects').doc('december').set(fixture());assert.equal((await reserve('december','owner',new Date('2026-12-01T00:00:00Z'))).state,'reserved');await org.collection('marketProjects').doc('stale').set(fixture());assert.equal((await reserve('stale')).state,'limit');assert.equal((await internal.doc('global').get()).get('month'),'2026-12');
});
test('authorization, changed visibility, stale evidence and malformed counters fail before any reservation',async()=>{
 for(const uid of ['foreign','disabled'])assert.equal((await reserve('report',uid)).state,'denied');
 await org.collection('marketProjects').doc('report').update({decisionReportPurchased:false,freeComparisonCount:0,freeBrief:{metrics:[],comparisons:[]}});assert.equal((await reserve()).state,'denied');await org.collection('marketProjects').doc('report').set(fixture());
 const changed=fixture();changed.brief.metrics[0].value=99999;await org.collection('marketProjects').doc('report').set(changed);assert.equal((await reserve()).state,'denied');await org.collection('marketProjects').doc('report').set(fixture());
 await internal.doc('global').set({day:'2026-11-21',month:'2026-11',dayCount:-1,monthCount:0});assert.equal((await reserve()).state,'limit');assert.equal((await internal.where('state','==','reserved').get()).size,0);
});
test('complete cached result and failed/uncertain latches never spend again',async()=>{
 assert.equal((await reserve()).state,'reserved');const job=(await internal.where('state','==','reserved').get()).docs[0];await job.ref.update({state:'complete',selection:{lead:'p0.income',observations:[],nextStep:'costs'}});assert.equal((await reserve()).state,'cached');await job.ref.update({state:'failed'});assert.equal((await reserve()).state,'previous-attempt');assert.equal((await internal.doc('global').get()).get('monthCount'),1);
});
test('quota/job documents are denied to anonymous, member and site-admin clients',async()=>{
 for(const ctx of [env.unauthenticatedContext(),env.authenticatedContext('owner',{admin:true,email_verified:true})]){const client=ctx.firestore();await assertFails(getDoc(doc(client,'internalReportExplanation/global')));await assertFails(getDocs(collection(client,'internalReportExplanation')));await assertFails(setDoc(doc(client,'internalReportExplanation/global'),{monthCount:0}));}
 assert.equal((await internal.get()).size,0);
});
test('global daily bound blocks another buyer and disabled membership cannot reserve',async()=>{
 await internal.doc('global').set({day:'2026-11-21',month:'2026-11',dayCount:20,monthCount:20,reservedMicroUsd:100000});assert.equal((await reserve()).state,'limit');await org.collection('members').doc('owner').update({status:'disabled'});assert.equal((await reserve()).state,'denied');assert.equal((await internal.get()).size,1);
});

test('free-brief AI reservations preserve project access, billing records and report allowances',async()=>{
 const p={...fixture(),decisionReportPurchased:false,decisionReportGenerationRequired:true};
 await org.collection('marketProjects').doc('report').set(p);
 assert.equal((await reserve()).state,'reserved');
 assert.deepEqual((await org.collection('marketProjects').doc('report').get()).data(),p);
 assert.equal((await org.collection('subscriptionBilling').get()).size,0);
 assert.equal((await org.collection('internalUsage').get()).size,0);
});

test('inconsistent or excessive dollar reservations fail closed without resetting budget',async()=>{
 for(const reservedMicroUsd of [undefined,-1,NaN,1000001,5000]){
  const value={day:'2026-11-21',month:'2026-11',dayCount:0,monthCount:0,...(reservedMicroUsd===undefined?{}:{reservedMicroUsd})};
  await internal.doc('global').set(value);
  assert.equal((await reserve()).state,'limit');
  assert.equal((await internal.where('state','==','reserved').get()).size,0);
 }
});
