import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const compiled=ts.transpileModule(fs.readFileSync('src/app/intelligence/sample-report-loading.ts','utf8'),{
  compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022},
}).outputText;
const {loadSampleBeforeDeadline,SampleLoadFailure,sampleFailureCopy}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const signal=()=>new AbortController().signal;

test('successful sample is returned unchanged',async()=>{
  const report={id:'sample',brief:{metrics:[{value:5}]}};
  assert.equal(await loadSampleBeforeDeadline(()=>Promise.resolve(report),signal()),report);
});

test('original callable error is preserved for developer diagnostics',async()=>{
  const error=Object.assign(new Error('INTERNAL: private upstream detail'),{code:'functions/internal'});
  await assert.rejects(loadSampleBeforeDeadline(()=>Promise.reject(error),signal()),e=>e===error);
  const copy=sampleFailureCopy(error,false,false);
  assert.equal(copy.title,'We could not load the sample.');
  assert.doesNotMatch(JSON.stringify(copy),/INTERNAL|private upstream/);
});

test('timeout releases the UI, ignores late success, and permits an independent recovery',async()=>{
  let finish;
  const pending=new Promise(resolve=>{finish=resolve;});
  await assert.rejects(loadSampleBeforeDeadline(()=>pending,signal(),5),e=>e instanceof SampleLoadFailure&&e.kind==='timeout');
  finish({id:'late'});
  assert.deepEqual(await loadSampleBeforeDeadline(()=>Promise.resolve({id:'recovery'}),signal()),{id:'recovery'});
});

test('a late rejection after the UI deadline is observed, not unhandled',async()=>{
  let rejectLate;
  await assert.rejects(loadSampleBeforeDeadline(()=>new Promise((resolve,reject)=>{rejectLate=reject;}),signal(),5),{kind:'timeout'});
  rejectLate(new Error('late transport failure'));
  await new Promise(resolve=>setImmediate(resolve));
});

test('offline abort releases a hanging request and uses connection guidance',async()=>{
  const controller=new AbortController();
  const pending=loadSampleBeforeDeadline(()=>new Promise(()=>{}),controller.signal);
  controller.abort('offline');
  await assert.rejects(pending,e=>e.kind==='offline');
  assert.match(sampleFailureCopy(new SampleLoadFailure('offline'),false,false).title,/offline/);
});

test('destroyed/pre-aborted request does not start the callable',async()=>{
  const controller=new AbortController();controller.abort('cancelled');
  let calls=0;
  await assert.rejects(loadSampleBeforeDeadline(()=>{calls++;return Promise.resolve({});},controller.signal),{kind:'cancelled'});
  assert.equal(calls,0);
});

test('cancelling before the queued load starts also avoids the callable',async()=>{
  const controller=new AbortController();let calls=0;
  const pending=loadSampleBeforeDeadline(()=>{calls++;return Promise.resolve({});},controller.signal);
  controller.abort('cancelled');
  await assert.rejects(pending,{kind:'cancelled'});
  assert.equal(calls,0);
});

test('SDK deadline, offline and repeated failure each have honest next steps',()=>{
  assert.match(sampleFailureCopy({code:'functions/deadline-exceeded'},false,false).title,/taking too long/);
  assert.match(sampleFailureCopy({},true,true).title,/offline/);
  assert.match(sampleFailureCopy({},false,true).title,/still/);
  assert.match(sampleFailureCopy({},false,true).detail,/do not need to register or buy/);
});
