// Isolated qualification, never a production dependency upgrade or a release authorization.
import { spawn, execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fingerprint, integrity, watchSource, sha256, tapCounts, credentialProblems } from './local-verification/core.mjs';
const root = process.cwd(), expected = process.argv.find(x => x.startsWith('--sha='))?.slice(6);
const before = await fingerprint(root);
if (!/^[a-f0-9]{40}$/.test(expected || '') || before.head !== expected || before.status) throw Error('Requires --sha=<exact clean HEAD>. No dirty-source qualification.');
if (credentialProblems(process.env).length) throw Error('Credential-bearing environment refused; use a credential-free process.');
if (process.env.GCLOUD_PROJECT !== 'demo-ifyoumind' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw Error('Requires already-running loopback demo emulator. Does not start or configure cloud resources.');
const observer = watchSource(root, before.files);
const started = new Date().toISOString(), run = join(root, 'test-results/firestore-reliability/runs', started.replaceAll(':', '-') + '-' + expected.slice(0, 8));
const out = join(run, 'test-results/firestore-reliability');
await mkdir(out, { recursive: true });
const env = { PATH: process.env.PATH, HOME: join(run, 'empty-home'), GCLOUD_PROJECT: 'demo-ifyoumind', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080', METADATA_SERVER_DETECTION: 'none', CI: 'true' };
await mkdir(env.HOME, { recursive: true });
const checks = [];
async function command(id, executable, args, cwd, budget = 90000) {
  const start = Date.now(); let log = '', timedOut = false;
  const child = spawn(executable, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', value => log += value); child.stderr.on('data', value => log += value);
  const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, budget);
  const hard = setTimeout(() => child.kill('SIGKILL'), budget + 10000);
  const code = await new Promise((res, rej) => { child.on('error', rej); child.on('close', res); });
  clearTimeout(timer); clearTimeout(hard);
  await writeFile(join(run, id + '.log'), log);
  const result = { id, command: [executable, ...args].join(' '), code, timedOut, milliseconds: Date.now() - start,
    status: code === 0 && !timedOut ? 'PASS' : 'FAIL', tests: tapCounts(log), log: id + '.log', logSha256: sha256(log) };
  checks.push(result); console.log(JSON.stringify(result)); return result;
}
const candidates = [];
let fatal;
try {
  await cp(join(root, 'test/diagnostics'), join(run, 'test/diagnostics'), { recursive: true });
  await command('harness-safety', process.execPath, ['--test', 'test/firestore-reliability-safety.spec.mjs'], root);
  for (const id of ['locked', 'admin13', 'firestore8', 'current']) {
    const cwd = join(out, id), fn = join(cwd, 'functions');
    await mkdir(fn, { recursive: true });
    for (const file of ['package.json', 'package-lock.json']) await cp(join(root, id === 'locked' ? 'functions' : 'test/fixtures/firestore-reliability/' + id, file), join(fn, file));
    for (const file of ['src', 'test', 'tsconfig.json']) await cp(join(root, 'functions', file), join(fn, file), { recursive: true });
    await mkdir(join(cwd, 'test/diagnostics'), { recursive: true });
    const original = await readFile(join(root, 'test/diagnostics/firestore-transaction-transport.cjs'), 'utf8');
    await writeFile(join(cwd, 'test/diagnostics/firestore-transaction-transport.cjs'), original);
    const item = { id, lockSha256: sha256(await readFile(join(fn, 'package-lock.json'))), diagnosticSha256: sha256(original) };
    candidates.push(item);
    const install = await command(id + '-install', 'npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund', '--userconfig=/dev/null', '--registry=https://registry.npmjs.org'], fn, 180000);
    if (install.status !== 'PASS') { item.status = 'BLOCKED_INSTALL'; continue; }
    item.versions = {};
    for (const name of ['firebase-admin', 'firebase-functions', '@google-cloud/firestore', 'google-gax', 'retry-request', '@grpc/grpc-js']) {
      try { item.versions[name] = JSON.parse(await readFile(join(fn, 'node_modules', name, 'package.json'), 'utf8')).version; } catch { item.versions[name] = 'not top-level'; }
    }
    const build = await command(id + '-build', 'npm', ['run', 'build'], fn);
    if (build.status === 'PASS') await command(id + '-unit', 'npm', ['test'], fn);
    let script = 'test/diagnostics/firestore-transaction-transport.cjs';
    if (['firestore8', 'current'].includes(id)) {
      // Metadata read only: package.json is not exported in newer GAX. SDK and assertions untouched.
      const from = "sdkRequire('google-gax/package.json').version";
      if (original.split(from).length !== 2) throw Error('Metadata adapter anchor changed');
      const adapted = original.replace(from, "JSON.parse(require('node:fs').readFileSync(path.resolve('functions/node_modules/google-gax/package.json'), 'utf8')).version");
      script = 'test/diagnostics/firestore-transaction-metadata.cjs';
      item.metadataAdapter = { from, sha256: sha256(adapted), assertionsChanged: false };
      await writeFile(join(cwd, script), adapted);
    }
    await command(id + '-transport', process.execPath, ['--test', script], cwd);
    item.transport = JSON.parse(await readFile(join(cwd, 'test-results/phase3-reliability/transport.json'), 'utf8'));
    item.status = build.status === 'PASS' && item.transport.status === 'PASS' ? 'CANDIDATE' : 'REJECTED';
  }
  if (candidates.find(c => c.id === 'locked')?.versions) {
    await command('rest-contracts', process.execPath, ['--test', 'test/diagnostics/firestore-rest-candidate.cjs'], run, 110000);
    await command('natural-locked', process.execPath, ['test/diagnostics/firestore-natural-city.cjs', '--candidate=locked'], run, 130000);
  }
} catch (error) { fatal = error.message; }
finally { observer.close(); }
const after = await fingerprint(root);
const valid = integrity(before, after, expected) && observer.changes === 0 && !observer.error;
const observations = {};
for (const name of ['rest-contracts', 'natural-locked']) {
  try { observations[name] = JSON.parse(await readFile(join(out, name + '.json'), 'utf8')); } catch { observations[name] = { status: 'NOT_RECORDED' }; }
}
const report = { observations, commit: expected, branch: before.branch, started, finished: new Date().toISOString(), environment: { node: process.version, platform: process.platform, arch: process.arch,
  npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim(), emulator: 'loopback 8080; demo-ifyoumind; must be started independently' },
  integrity: { valid, before: before.digest, after: after.digest, sourceEvents: observer.changes, watcherError: observer.error }, fatal, candidates, checks,
  status: !valid ? 'INVALID' : (fatal || checks.some(c => c.status === 'FAIL')) ? 'NO_QUALIFIED_CORRECTION' : 'INCOMPLETE_QUALIFICATION',
  limitations: ['No production verification.', 'Natural contention is timing-dependent, not a deterministic fault injection.', 'Rejected candidates do not proceed to full business-logic qualification.', 'No hosted CI; account billing lock remains. No visual/runtime changes.'] };
await writeFile(join(run, 'report.json'), JSON.stringify(report, null, 2) + '\n');
await writeFile(join(run, 'SUMMARY.md'), `# Phase 3B qualification — ${report.status}\n\nCommit: ${expected}\nSource integrity: ${valid ? 'VALID' : 'INVALID'}\n\n| Check | Result | Tests |\n|---|---|---|\n${checks.map(c => `| ${c.id} | ${c.status} | ${c.tests ? JSON.stringify(c.tests) : 'Build/install/probe'} |`).join('\n')}\n\nNo production correction qualifies. Failures remain failures; no new dependency or retry behavior is installed in application source. See report.json and hashed logs.\n`);
console.log(JSON.stringify({ run, status: report.status, checks: checks.map(c => ({ id: c.id, status: c.status, tests: c.tests })), fatal }));
process.exitCode = 1; // Diagnostic gate stays red until a reviewed supported correction passes every contract.
