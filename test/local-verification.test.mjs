import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fingerprint, integrity, credentialProblems, tapCounts, playwrightCounts, overall, summarize, plan, watchSource, IMAGE } from '../scripts/local-verification/core.mjs';
import { verificationReporters } from '../e2e/support/local-verification-reporters.mjs';

test('exact-head integrity rejects dirty, changed, different-branch and different-SHA results', async () => {
  const dir=await mkdtemp(join(tmpdir(),'ifm-integrity-'));
  try {
    const git=(...args)=>execFileSync('git',args,{cwd:dir,stdio:'pipe'}).toString().trim();
    git('init','-q');git('config','user.email','qa@example.invalid');git('config','user.name','Synthetic verifier');
    await writeFile(join(dir,'source.ts'),'export const value = 1;\n');git('add','.');git('commit','-qm','fixture');
    const a=await fingerprint(dir);assert.equal(integrity(a,a,a.head),true);
    await writeFile(join(dir,'source.ts'),'export const value = 2;\n');const b=await fingerprint(dir);
    assert.equal(integrity(a,b,a.head),false);
    for(const bad of [{...a,head:'a'.repeat(40)},{...a,status:'?? private.txt'},{...a,branch:'other'},{...a,digest:'changed'}])assert.equal(integrity(a,bad,a.head),false);
  } finally {await rm(dir,{recursive:true,force:true});}
});

test('transient source edits are observed even when original bytes are restored', async () => {
  const dir=await mkdtemp(join(tmpdir(),'ifm-watch-'));let watcher;
  try{execFileSync('git',['init','-q'],{cwd:dir});await writeFile(join(dir,'source.ts'),'original');watcher=watchSource(dir,['source.ts']);await writeFile(join(dir,'source.ts'),'temporary');await new Promise(r=>setTimeout(r,80));await writeFile(join(dir,'source.ts'),'original');for(let i=0;i<40&&!watcher.changes;i++)await new Promise(r=>setTimeout(r,100));assert.ok(watcher.changes>0);assert.equal(watcher.error,false);}finally{watcher?.close();await rm(dir,{recursive:true,force:true});}
});

test('credential checks report names without copying values', () => {
  assert.deepEqual(credentialProblems({PATH:'/bin',HOME:'/tmp',CI:'true'}),[]);
  const names=credentialProblems({OPENAI_API_KEY:'synthetic-private-marker',STRIPE_SECRET_KEY:'another-marker',GOOGLE_APPLICATION_CREDENTIALS:'/private/key.json'});
  assert.deepEqual(names.sort(),['GOOGLE_APPLICATION_CREDENTIALS','OPENAI_API_KEY','STRIPE_SECRET_KEY']);assert.ok(!JSON.stringify(names).includes('marker'));
});

test('TAP and browser totals preserve failures, skips, cancelled and flaky attempts', () => {
  assert.deepEqual(tapCounts('# tests 8\n# pass 4\n# fail 1\n# cancelled 1\n# skipped 2\n'),{executed:6,passed:4,failed:2,skipped:2});
  assert.equal(tapCounts('process exited before tests'),null);
  assert.deepEqual(playwrightCounts({stats:{expected:5,unexpected:1,flaky:1,skipped:2}}),{executed:7,passed:5,failed:2,skipped:2});
  assert.throws(()=>playwrightCounts({}));
});

test('blocked, limited and invalid runs can never become green', () => {
  const base={integrity:{valid:true},checks:[{status:'PASS'}],limitations:[]};assert.equal(overall(base),'PASS');
  assert.equal(overall({...base,limitations:['Linux renderer unavailable']}),'PARTIAL');
  assert.equal(overall({...base,checks:[{status:'BLOCKED'}]}),'PARTIAL');
  assert.equal(overall({...base,checks:[{status:'FAIL'}]}),'FAIL');
  assert.equal(overall({...base,integrity:{valid:false}}),'INVALID');
  assert.deepEqual(summarize({...base,checks:[{status:'FAIL',tests:{executed:3,passed:2,failed:1,skipped:4}},{status:'BLOCKED'}]}),{checks:{pass:0,fail:1,blocked:1},tests:{executed:3,passed:2,failed:1,skipped:4}});
});

test('local plan covers workflow run commands and never deploys or updates baselines', async () => {
  const steps=plan();const commands=steps.map(s=>s.command);
  for(const name of ['launch-build-check','authenticated-qa']){
    const workflow=await readFile(`.github/workflows/${name}.yml`,'utf8');
    for(const [,command]of workflow.matchAll(/^\s+run: (.+)$/gm)){
      if(command.startsWith('npm ci')||command.startsWith('npm --prefix functions ci')||command.startsWith('npx playwright install')||command==='|')continue;
      assert.ok(commands.includes(command),`Missing workflow command: ${command}`);
    }
  }
  assert.ok(commands.every(c=>! /deploy|update-snapshots|updateSnapshot|stripe|curl/.test(c)));
  assert.match(IMAGE,/v1\.56\.0-noble@sha256:[a-f0-9]{64}$/);
});

test('structured browser reporting is opt-in and retains the original reporter', () => {
  const before=process.env.LOCAL_VERIFY_JSON;
  try{delete process.env.LOCAL_VERIFY_JSON;assert.deepEqual(verificationReporters([['list']]),[['list']]);process.env.LOCAL_VERIFY_JSON='/tmp/synthetic-report.json';assert.deepEqual(verificationReporters([['list']]),[['list'],['json',{outputFile:'/tmp/synthetic-report.json'}]]);}finally{if(before===undefined)delete process.env.LOCAL_VERIFY_JSON;else process.env.LOCAL_VERIFY_JSON=before;}
});
