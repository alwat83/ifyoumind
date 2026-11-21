#!/usr/bin/env node
// Credential-free, exact-source verification. No deploy, cloud operation or baseline update.
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { access, lstat, copyFile, cp, mkdir, readFile, writeFile, symlink, chmod } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { platform, arch, homedir } from 'node:os';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import { IMAGE, git, fingerprint, digestFiles, integrity, credentialProblems, tapCounts, playwrightCounts, overall, summarize, markdown, evidence, plan, sha256, watchSource } from './local-verification/core.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const option = name => args.find(x => x.startsWith(name + '='))?.slice(name.length + 1);
const exists = path => access(path).then(() => true, () => false);
const version = (command, argv) => { try { return execFileSync(command, argv, { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).trim().split('\n')[0]; } catch { return 'unavailable'; } };
const ports = [4000, 4300, 4313, 4314, 4315, 4316, 4400, 4500, 5001, 8080, 9099, 9150];
async function occupied(port) { return new Promise(resolve => { const socket=net.connect({port,host:'127.0.0.1'}); const finish=value=>{socket.destroy();resolve(value);};socket.setTimeout(500,()=>finish(false));socket.once('connect',()=>finish(true));socket.once('error',()=>finish(false)); }); }
async function execute(command, cwd, env, log, timeout = 600000) {
  const stream = createWriteStream(log, { mode: 0o600 });
  const started=Date.now();
  return new Promise(resolve => {
    const child=spawn('/bin/sh',['-c',command],{cwd,env,detached:true,stdio:['ignore','pipe','pipe']});
    child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});
    let timedOut=false,spawnError=false;
    const stop=()=>{try{process.kill(-child.pid,'SIGTERM');}catch{}};
    const timer=setTimeout(()=>{timedOut=true;stop();},timeout);
    const hardTimer=setTimeout(()=>{try{process.kill(-child.pid,'SIGKILL');}catch{}},timeout+10000);
    const interrupt=()=>stop();process.once('SIGINT',interrupt);process.once('SIGTERM',interrupt);
    child.once('error',()=>{spawnError=true;});
    child.once('close',(code,signal)=>{clearTimeout(timer);clearTimeout(hardTimer);process.removeListener('SIGINT',interrupt);process.removeListener('SIGTERM',interrupt);stream.end(()=>resolve({exitCode:code,signal,timedOut,spawnError,durationMs:Date.now()-started}));});
  });
}
async function deps(root) {
  const versions={};
  for(const prefix of ['', 'functions']) {
    const lock=JSON.parse(await readFile(join(root,prefix,'package-lock.json'),'utf8'));
    const pkg=JSON.parse(await readFile(join(root,prefix,'package.json'),'utf8'));
    for(const name of Object.keys({...pkg.dependencies,...pkg.devDependencies})){
      const actual=JSON.parse(await readFile(join(root,prefix,'node_modules',name,'package.json'),'utf8')).version;
      if(actual!==lock.packages['node_modules/'+name]?.version)throw Error(`Installed dependency does not match lockfile: ${prefix || 'app'}/${name}`);
      versions[(prefix || 'app')+'/'+name]=actual;
    }
  }
  return versions;
}
async function runSuite(worktree, out, environment, install=false) {
  const checks=[];const limitations=[];await mkdir(join(out,'evidence'),{recursive:true});await mkdir(join(out,'home'),{recursive:true});
  // A new HOME has no ADC, Firebase login or cloud CLI config. No inherited credentials.
  const env={PATH:process.env.PATH,HOME:join(out,'home'),TMPDIR:process.env.TMPDIR || '/tmp',CI:'true',NO_COLOR:'1',NG_CLI_ANALYTICS:'false',FIREBASE_CLI_DISABLE_TELEMETRY:'1',GCLOUD_PROJECT:'demo-ifyoumind',GOOGLE_CLOUD_PROJECT:'demo-ifyoumind',METADATA_SERVER_DETECTION:'none',TZ:'UTC'};
  if(process.env.JAVA_HOME)env.JAVA_HOME=process.env.JAVA_HOME;
  env.FIREBASE_EMULATORS_PATH=process.env.FIREBASE_EMULATORS_PATH || join(homedir(),'.cache/firebase/emulators');
  env.PLAYWRIGHT_BROWSERS_PATH=process.env.PLAYWRIGHT_BROWSERS_PATH || join(homedir(),platform()==='darwin'?'Library/Caches/ms-playwright':'.cache/ms-playwright');
  if(install){for(const [id,command] of [['app-install','npm ci'],['functions-install','npm --prefix functions ci']]){console.log(`[${id}] starting`);const result=await execute(command,worktree,env,join(out,'evidence',id+'.log'));checks.push({id,command,...result,status:result.exitCode===0?'PASS':'FAIL'});}}
  try{environment.dependencies=await deps(worktree);}catch(e){checks.push({id:'locked-dependencies',command:'Compare installed direct dependencies to both lockfiles',status:'FAIL',detail:e.message});return{checks,limitations};}
  checks.push({id:'locked-dependencies',command:'Compare installed direct dependencies to both lockfiles',status:'PASS'});
  const require=createRequire(join(worktree,'package.json'));
  const pw=require('@playwright/test');environment.playwright=require('@playwright/test/package.json').version;
  if(environment.mode==='docker'&&environment.playwright!=='1.56.0')throw Error('Pinned Docker image does not match the locked Playwright package.');
  let browserReady=false;
  for(const channel of (option('--browser')==='chrome'?['chrome']:option('--browser')==='chromium'?[undefined]:[undefined,'chrome'])){
    try{const b=await pw.chromium.launch({headless:true,...(channel?{channel}:{})});environment.browser=b.version();environment.browserChannel=channel || 'pinned-chromium';await b.close();if(channel)env.QA_BROWSER_CHANNEL=channel;browserReady=true;break;}catch{}
  }
  if(!browserReady)limitations.push('No usable local Chromium/Chrome. Browser checks are BLOCKED; install the pinned Playwright browser or use the optional Linux container.');
  if(environment.browserChannel==='chrome')limitations.push('Installed Chrome fallback used; it is not the pinned Linux Playwright renderer. Functional browser checks remain useful; Linux pixel parity is not established.');
  if(platform()!=='linux')limitations.push('Linux-only visual cases are explicitly skipped on this native OS. Native screenshots do not approve Linux baselines.');
  if(process.versions.node.split('.')[0]!=='20')limitations.push('Native/container Node major differs from current hosted workflow Node 20 (Functions declares Node 22). Actual versions are recorded.');
  if(!environment.java.includes('21.'))limitations.push('Java differs from hosted Java 21; actual local emulator results are recorded, without claiming identical environment parity.');
  const busy=(await Promise.all(ports.map(async p=>await occupied(p)?p:null))).filter(Boolean);
  const javaReady=environment.java!=='unavailable';
  for(const step of plan()){
    const item={...step};
    const unmet=step.needs.filter(id=>checks.find(c=>c.id===id)?.status!=='PASS');
    if(unmet.length || (step.kind.includes('browser')&&!browserReady) || (step.kind.startsWith('emulator')&&!javaReady) || ((step.kind.includes('browser')||step.kind.startsWith('emulator'))&&busy.length)){
      checks.push({...item,status:'BLOCKED',detail:unmet.length?'Failed prerequisites: '+unmet.join(', '):busy.length?'Required local ports already occupied; no processes were killed: '+busy.join(', '):'Browser or Java prerequisite unavailable'});continue;
    }
    console.log(`[${step.id}] starting`);
    const json=join(out,'evidence',step.id+'.json');
    const result=await execute(step.command,worktree,{...env,...(step.kind.includes('browser')?{LOCAL_VERIFY_JSON:json}:{})},join(out,'evidence',step.id+'.log'));
    Object.assign(item,result,{status:result.exitCode===0&&!result.timedOut?'PASS':'FAIL'});
    if(step.kind.includes('browser')){
      try{item.tests=playwrightCounts(JSON.parse(await readFile(json,'utf8')));}catch{item.status='FAIL';item.detail='Structured browser result missing or unreadable; no pass inferred.';}
    }else if(step.kind.includes('tap')){
      item.tests=tapCounts(await readFile(join(out,'evidence',step.id+'.log'),'utf8'));
      if(!item.tests){item.status='FAIL';item.detail='Structured TAP totals missing; no pass inferred.';}
    }
    if(item.tests?.failed)item.status='FAIL';checks.push(item);console.log(`[${step.id}] ${item.status}`);
    await writeFile(join(out,'progress.json'),JSON.stringify({checks,limitations},null,2)+'\n');
  }
  for(const dir of ['test-results','playwright-report'])if(await exists(join(worktree,dir)))await cp(join(worktree,dir),join(out,'evidence',dir),{recursive:true});
  return{checks,limitations};
}
async function main(){
  if(args.some(a=>!/^--(?:help|docker|install|expected-sha=[a-f0-9]{40}|browser=(?:auto|chromium|chrome)|inside=.+)$/.test(a)))throw Error('Unknown argument; see --help. Snapshot updates and arbitrary commands are unsupported.');
  if(args.includes('--help')){console.log('npm run verify:local -- --expected-sha=<40-char SHA> [--docker] [--install] [--browser=auto|chromium|chrome]\nReports and isolated sources: ignored test-results/local-first/<run-id>. Docker absence/daemon restrictions fall back to native with explicit limits. No baseline updates.');return;}
  if(option('--inside')){
    if(platform()!=='linux'||process.env.LOCAL_VERIFY_CONTAINER!=='1')throw Error('Internal container mode requires the isolated Linux container.');
    const manifest=JSON.parse(await readFile(option('--inside'),'utf8'));const environment={...manifest.environment,platform:platform(),arch:arch(),node:process.version,npm:version('npm',['--version']),java:version('java',['-version']),mode:'docker',image:IMAGE};
    // java writes its version on stderr; metadata collection below handles that.
    environment.java=javaVersion();
    const result=await runSuite(root,'/run',environment,true);await writeFile('/run/container-result.json',JSON.stringify({...result,environment,sourceDigest:await digestFiles(root,manifest.source.files)},null,2));return;
  }
  const expected=option('--expected-sha');if(!expected||!/^[a-f0-9]{40}$/.test(expected))throw Error('Supply --expected-sha=<full reviewed commit>; no implicit moving HEAD.');
  const id=new Date().toISOString().replace(/[:.]/g,'-')+'-'+expected.slice(0,8);const out=join(root,'test-results/local-first',id);await mkdir(out,{recursive:true});
  const before=await fingerprint(root);const environment={platform:platform(),arch:arch(),node:process.version,npm:version('npm',['--version']),java:javaVersion(),mode:'native'};
  const report={schemaVersion:1,commit:expected,branch:before.branch,startedAt:new Date().toISOString(),environment,integrity:{valid:false,before:{head:before.head,digest:before.digest,clean:!before.status}},checks:[],limitations:[],releaseAuthorized:false};
  let snapshot, watcher;
  try{
    if(before.head!==expected||before.status)throw Error('Candidate SHA mismatch or working tree is not clean. No checks executed.');
    watcher=watchSource(root,before.files);
    const credentials=credentialProblems(process.env);if(credentials.length)throw Error('Credential-bearing environment detected (names only): '+credentials.join(', '));
    snapshot=join(out,'worktree');await mkdir(snapshot,{recursive:true});
    for(const file of before.files){const dest=join(snapshot,file);await mkdir(resolve(dest,'..'),{recursive:true});await copyFile(join(root,file),dest);const mode=(await lstat(join(root,file))).mode;await chmod(dest,mode & 0o111 ? 0o755 : 0o644);}
    if(await digestFiles(snapshot,before.files)!==before.digest)throw Error('Source changed while preparing the isolated copy.');
    // Detect only a local Docker daemon. Never use a paid/remote Docker endpoint or mount credentials.
    environment.docker={requested:args.includes('--docker'),installed:version('docker',['--version'])!=='unavailable',available:false};
    if(environment.docker.requested&&environment.docker.installed){
      const endpoint=version('docker',['context','inspect','--format','{{.Endpoints.docker.Host}}']);
      const local=/^(unix|npipe):\/\//.test(process.env.DOCKER_HOST||endpoint);
      environment.docker.available=local&&version('docker',['info','--format','{{.ServerVersion}}'])!=='unavailable';
    }
    let result;
    if(environment.docker.requested&&environment.docker.available){
      await writeFile(join(out,'container-manifest.json'),JSON.stringify({source:before,environment}));
      const childEnv={PATH:process.env.PATH,HOME:process.env.HOME,...(process.env.DOCKER_HOST?{DOCKER_HOST:process.env.DOCKER_HOST}:{})};
      const build=await execute('docker build --platform linux/amd64 -t ifyoumind-local-verify:pw1.56.0 scripts/local-verification',root,childEnv,join(out,'docker-build.log'));
      if(build.exitCode!==0)throw Error('Optional Linux image build failed; see ignored docker-build.log. No native substitution for an executed failing check.');
      const uid=process.getuid?.()??1000,gid=process.getgid?.()??1000;await mkdir(join(out,'home'),{recursive:true});
      const command=['docker','run','--rm','--init','--platform','linux/amd64','--shm-size=1g','--user',`${uid}:${gid}`,'-e','HOME=/run/home','-e','LOCAL_VERIFY_CONTAINER=1','-v',`${out}:/run`,'-w','/run/worktree','ifyoumind-local-verify:pw1.56.0','node','scripts/verify-local.mjs','--inside=/run/container-manifest.json'];
      // Arguments are passed directly; host paths never become shell code.
      const status=await new Promise(resolve=>{const p=spawn(command[0],command.slice(1),{env:childEnv,stdio:'inherit'});p.once('error',()=>resolve(1));p.once('close',resolve);});if(status!==0)throw Error('Linux verification process failed before a complete report.');
      result=JSON.parse(await readFile(join(out,'container-result.json'),'utf8'));if(result.sourceDigest!==before.digest)throw Error('Isolated Linux source changed during verification.');report.environment=result.environment;
    }else{
      if(environment.docker.requested)report.limitations.push('Docker was requested but no usable local daemon is available. Native fallback executed; Docker path was not tested.');
      if(!args.includes('--install')){for(const p of ['node_modules','functions/node_modules'])await symlink(join(root,p),join(snapshot,p),'dir');}
      result=await runSuite(snapshot,out,environment,args.includes('--install'));
    }
    report.checks=result.checks;report.limitations.push(...result.limitations);
  }catch(e){report.checks.push({id:'verification-preflight',command:'Validate exact source and environment',status:'BLOCKED',detail:e.message});report.limitations.push(e.message);}
  finally{
    // Allow coalesced filesystem notifications to arrive before closing the watcher.
    await new Promise(resolve=>setTimeout(resolve,1200));
    const after=await fingerprint(root);const copiedDigest=snapshot&&await exists(snapshot)?await digestFiles(snapshot,before.files).catch(()=>null):null;
    report.integrity.after={head:after.head,digest:after.digest,clean:!after.status};report.integrity.snapshotDigest=copiedDigest;
    report.integrity.sourceEvents=watcher?.changes ?? 0;report.integrity.watcherError=watcher?.error ?? true;watcher?.close();
    report.integrity.valid=integrity(before,after,expected)&&copiedDigest===before.digest&&!report.integrity.sourceEvents&&!report.integrity.watcherError;
    report.finishedAt=new Date().toISOString();report.status=overall(report);report.totals=summarize(report);
    report.workflowHashes={launch:sha256(await readFile(join(root,'.github/workflows/launch-build-check.yml'))),qa:sha256(await readFile(join(root,'.github/workflows/authenticated-qa.yml')))};
    report.evidence=await evidence(join(out,'evidence')).catch(()=>[]);
    await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n',{mode:0o600});await writeFile(join(out,'SUMMARY.md'),markdown(report));
    console.log(`\n${report.status}: ${relative(root,out)}/SUMMARY.md\n${JSON.stringify(report.totals)}`);
    process.exitCode=report.status==='PASS'?0:report.status==='INVALID'?3:report.status==='FAIL'?1:2;
  }
}
function javaVersion(){const r=spawnSync('java',['-version'],{encoding:'utf8'});return r.status===0?(r.stderr||r.stdout).trim().split('\n')[0]:'unavailable';}
main().catch(e=>{console.error(e.message);process.exitCode=3;});
