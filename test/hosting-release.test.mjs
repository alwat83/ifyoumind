import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, cp, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fingerprint } from '../scripts/local-verification/core.mjs';
import { hostingOnly, validateReport, files, prepareArtifact, verifyArtifact, REQUIRED } from '../scripts/hosting-release/artifact.mjs';
const source = JSON.parse(await readFile('firebase.json', 'utf8'));
const sha = 'a'.repeat(40);
const validReport = () => ({commit:sha, developmentStatus:'PASS', selection:{level:'consumer'}, checks:REQUIRED.map(id=>({id,status:'PASS'})), integrity:{valid:true,before:{head:sha,clean:true,digest:'digest'},after:{head:sha,clean:true,digest:'digest'},snapshotDigest:'digest',sourceEvents:0,watcherError:false}});

test('isolated config contains only reviewed static Hosting with explicit site and privacy headers', () => {
  const config = hostingOnly(source);
  assert.deepEqual(Object.keys(config), ['hosting']);
  assert.equal(config.hosting.site, 'ifyoumind-473fe'); assert.equal(config.hosting.public, 'public');
  assert.deepEqual(config.hosting.headers, source.hosting.headers);
  assert.deepEqual(config.hosting.redirects, source.hosting.redirects);
  for (const field of ['functions','firestore','storage']) assert.equal(config[field], undefined);
});
test('rejects hooks, multiple sites, target overrides, missing privacy and backend rewrites', () => {
  for (const patch of [{predeploy:['echo wrong']},{site:'other'},{target:'other'},{public:'elsewhere'},{headers:[]},{rewrites:[{source:'**',function:'foo'}]},{rewrites:[{source:'**',run:{serviceId:'foo'}}]},{rewrites:[{source:'**',destination:'//remote'}]}]) assert.throws(()=>hostingOnly({hosting:{...source.hosting,...patch}}));
  assert.throws(()=>hostingOnly({hosting:[source.hosting]}));
});
test('requires exact clean full consumer checks; failures, changed source and lower levels stay rejected', () => {
  validateReport(validReport(), sha);
  for (const bad of [r=>r.commit='b'.repeat(40),r=>r.developmentStatus='FAIL',r=>r.selection.level='prototype',r=>r.checks.pop(),r=>r.checks.push({id:'other',status:'FAIL'}),r=>r.integrity.before.clean=false,r=>r.integrity.after.head='b'.repeat(40),r=>r.integrity.sourceEvents=1,r=>r.integrity.snapshotDigest='changed']) {const r=validReport();bad(r);assert.throws(()=>validateReport(r,sha));}
});
test('asset enumeration rejects symlinks and private or hidden files', async () => {
  const dir=await mkdtemp(join(tmpdir(),'ifm-artifact-files-'));
  try { for (const name of ['.env','secret.pem','app.js.map']) {await writeFile(join(dir,name),'synthetic');await assert.rejects(files(dir));await rm(join(dir,name));} await symlink('/tmp',join(dir,'link'));await assert.rejects(files(dir));await assert.rejects(files(join(dir,'link'))); } finally {await rm(dir,{recursive:true,force:true});}
});

async function fixture(fn) {
  const root=await mkdtemp(join(tmpdir(),'ifm-hosting-package-'));
  try {
    const git=(...args)=>execFileSync('git',args,{cwd:root,stdio:'pipe'}).toString().trim();
    git('init','-q');git('config','user.email','qa@example.invalid');git('config','user.name','Synthetic verifier');
    await writeFile(join(root,'.gitignore'),'test-results/\n');await writeFile(join(root,'firebase.json'),JSON.stringify(source));git('add','.');git('commit','-qm','synthetic fixture');
    const before=await fingerprint(root), expected=before.head, runDir=join(root,'test-results/run'), snapshot=join(runDir,'worktree'), out=join(root,'test-results/package');
    await mkdir(snapshot,{recursive:true});for(const file of before.files)await cp(join(root,file),join(snapshot,file));
    const pub=join(snapshot,'dist/ifyoumind-deploy/browser');await mkdir(join(pub,'discover'),{recursive:true});
    for(const name of ['index.html','404.html','app-shell.html','discover/index.html'])await writeFile(join(pub,name),'ifyoumind-473fe synthetic fixture');
    const report=validReport();report.commit=expected;for(const v of ['before','after'])report.integrity[v]={head:expected,clean:true,digest:before.digest};report.integrity.snapshotDigest=before.digest;
    await writeFile(join(runDir,'report.json'),JSON.stringify(report));
    await fn({root,runDir,out,expected,pub,snapshot});
  } finally {await rm(root,{recursive:true,force:true});}
}
test('packages exact tested static assets and refuses overwrite, different source or unsafe output', async () => fixture(async ctx => {
  const r=await prepareArtifact(ctx);assert.equal(r.files,4);assert.equal(r.releaseAuthorized,false);
  assert.deepEqual(await verifyArtifact(ctx.out,ctx.expected),r);
  await assert.rejects(prepareArtifact(ctx));
  await assert.rejects(prepareArtifact({...ctx,expected:sha}));
  await assert.rejects(prepareArtifact({...ctx,out:join(ctx.runDir,'nested')}));
}));
test('source mutation and dirty checkout cannot be packaged', async () => fixture(async ctx => {
  await writeFile(join(ctx.snapshot,'firebase.json'),'changed');await assert.rejects(prepareArtifact(ctx),/snapshot changed/);
  await writeFile(join(ctx.root,'untracked.txt'),'synthetic');await assert.rejects(prepareArtifact(ctx),/clean exact/);
}));
test('local or incomplete production build cannot be packaged', async () => fixture(async ctx => {
  await writeFile(join(ctx.pub,'index.html'),'demo-ifyoumind');await assert.rejects(prepareArtifact(ctx),/bundle guard/);
  await rm(join(ctx.pub,'app-shell.html'));await assert.rejects(prepareArtifact(ctx),/Missing static entry/);
}));
test('verification rejects changed, additional or removed assets, wrong targets and extra resource configs', async () => fixture(async ctx => {
  await prepareArtifact(ctx);const path=join(ctx.out,'public/index.html');const original=await readFile(path);
  await writeFile(path,'changed');await assert.rejects(verifyArtifact(ctx.out,ctx.expected));await writeFile(path,original);
  await writeFile(join(ctx.out,'public/extra.js'),'extra');await assert.rejects(verifyArtifact(ctx.out,ctx.expected));await rm(join(ctx.out,'public/extra.js'));
  await writeFile(join(ctx.out,'functions.json'),'{}');await assert.rejects(verifyArtifact(ctx.out,ctx.expected));await rm(join(ctx.out,'functions.json'));
  await assert.rejects(verifyArtifact(ctx.out,sha));
  await writeFile(join(ctx.out,'firebase.json'),'{}');await assert.rejects(verifyArtifact(ctx.out,ctx.expected));
}));
