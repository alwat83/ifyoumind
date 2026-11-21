import { watch } from 'node:fs';
import { createHash } from 'node:crypto';
import { readFile, lstat, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, basename } from 'node:path';

export const IMAGE = 'mcr.microsoft.com/playwright:v1.56.0-noble@sha256:35246d87a7c88ea9b771c65d33171b2611b02a8253b4b12ce6f94376c55f99f2';
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
export async function fingerprint(root) {
  const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean).sort();
  return { head: git(root, 'rev-parse', 'HEAD'), branch: git(root, 'branch', '--show-current'), status: git(root, 'status', '--porcelain=v1', '--untracked-files=all'), files, digest: await digestFiles(root, files) };
}
export async function digestFiles(root, files) {
  const h = createHash('sha256');
  for (const file of files) {
    const stat = await lstat(join(root, file));
    if (!stat.isFile()) throw Error(`Refusing non-regular tracked source: ${file}`);
    h.update(file + '\0' + (stat.mode & 0o111 ? 'executable' : 'regular') + '\0');
    h.update(await readFile(join(root, file))); h.update('\0');
  }
  return h.digest('hex');
}
export function integrity(before, after, expected) {
  return /^[a-f0-9]{40}$/.test(expected) && before.head === expected && after.head === expected && !before.status && !after.status && before.branch === after.branch && before.digest === after.digest;
}
export function credentialProblems(env) {
  return Object.keys(env).filter(key => env[key] && (/^(GOOGLE_APPLICATION_CREDENTIALS|FIREBASE_TOKEN|GCP_SA_KEY|GOOGLE_OAUTH_ACCESS_TOKEN|CLOUDSDK_AUTH_ACCESS_TOKEN|CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE)$/.test(key) || /^(OPENAI_API_KEY|STRIPE_.*KEY|AWS_(ACCESS_KEY_ID|SECRET_ACCESS_KEY|SESSION_TOKEN))$/.test(key)));
}
export function tapCounts(log) {
  const result = {};
  for (const [, key, value] of log.replace(/\x1b\[[0-9;]*m/g, '').matchAll(/^# (tests|pass|fail|skipped|cancelled) (\d+)\s*$/gm)) result[key] = Number(value);
  return 'tests' in result ? { executed: result.tests - (result.skipped || 0), passed: result.pass || 0, failed: (result.fail || 0) + (result.cancelled || 0), skipped: result.skipped || 0 } : null;
}
export function playwrightCounts(report) {
  const s = report.stats;
  if (!s) throw Error('Playwright structured statistics missing');
  return { executed: s.expected + s.unexpected + s.flaky, passed: s.expected, failed: s.unexpected + s.flaky, skipped: s.skipped };
}
export function overall(report) {
  if (!report.integrity.valid) return 'INVALID';
  if (report.checks.some(c => c.status === 'FAIL')) return 'FAIL';
  if (report.checks.some(c => c.status === 'BLOCKED') || report.limitations.length) return 'PARTIAL';
  return 'PASS';
}
export function summarize(report) {
  const tests = { executed: 0, passed: 0, failed: 0, skipped: 0 };
  for (const c of report.checks) if (c.tests) for (const k of Object.keys(tests)) tests[k] += c.tests[k];
  return { checks: Object.fromEntries(['PASS', 'FAIL', 'BLOCKED'].map(s => [s.toLowerCase(), report.checks.filter(c => c.status === s).length])), tests };
}
export function markdown(r) {
  const rows = r.checks.map(c => `| ${c.id} | ${c.status} | ${c.tests ? `${c.tests.passed} pass / ${c.tests.failed} fail / ${c.tests.skipped} skip` : 'Check; no test count'} | \`${c.command}\` |`).join('\n');
  return `# Local-first verification — ${r.status}\n\nCandidate: \`${r.commit}\` · Branch: \`${r.branch}\`\n\nStarted: ${r.startedAt} · Finished: ${r.finishedAt}\n\nSource integrity: **${r.integrity.valid ? 'VALID' : 'INVALID — results cannot verify the candidate'}**. SHA, branch, clean status and source-byte fingerprint checked before/after; isolated tracked-source copy also checked.\n\nEnvironment: ${r.environment.platform}/${r.environment.arch}, Node ${r.environment.node}, Java ${r.environment.java}, Playwright ${r.environment.playwright}, browser ${r.environment.browser || 'unavailable'}. Mode: ${r.environment.mode}.\n\nTests: ${r.totals.tests.passed} passed / ${r.totals.tests.failed} failed / ${r.totals.tests.skipped} skipped; ${r.totals.tests.executed} executed. Build/guard checks are counted separately.\n\n| Check | Result | Test counts | Command |\n| --- | --- | --- | --- |\n${rows}\n\n## Limitations\n\n${r.limitations.map(x => '- ' + x).join('\n') || 'None recorded.'}\n\n## Evidence\n\nMachine-readable report: [report.json](report.json). Raw logs, Playwright JSON and screenshot/actual/expected/diff/trace evidence stay in this ignored run directory. Evidence manifest records relative paths, sizes and SHA-256 hashes. Baselines were not updated.\n\nThis is a development gate, not merge/deployment authorization. Human experience review, #118 dependency, #111 live retry, physical devices and spoken assistive technology are separate.\n`;
}
export async function evidence(root, prefix = '') {
  const result = [];
  for (const name of (await readdir(join(root, prefix), { withFileTypes: true })).sort((a,b)=>a.name.localeCompare(b.name))) {
    const rel = join(prefix, name.name);
    if (name.isDirectory()) result.push(...await evidence(root, rel));
    else if (name.isFile() && /\.(png|jpg|zip|json|xml|log)$/.test(name.name)) {
      const body = await readFile(join(root, rel)); result.push({ path: rel, bytes: body.length, sha256: sha256(body) });
    }
  }
  return result;
}
export function plan() {
  const check = (id, command, needs = [], kind = 'check') => ({ id, command, needs, kind });
  return [
    check('functions-build', 'npm --prefix functions run build'),
    check('functions-tests', 'npm --prefix functions test', ['functions-build'], 'tap'),
    check('fast-web', 'npm run test:seo', [], 'tap'),
    check('production-build', 'npm run build'),
    check('production-bundle', 'npm run check:production-bundle', ['production-build']),
    check('production-isolation', 'node scripts/check-discovery-isolation.mjs --production', ['production-build']),
    check('local-build', 'npm run build:local'),
    check('discovery-build', 'npm run build:discovery'),
    check('electricity-build', 'npm run build:electricity'),
    check('unified-build', 'npm run build:unified'),
    check('discovery-isolation', 'node scripts/check-discovery-isolation.mjs --preview', ['discovery-build']),
    check('electricity-isolation', 'node scripts/check-discovery-isolation.mjs --electricity', ['electricity-build']),
    check('unified-isolation', 'node scripts/check-discovery-isolation.mjs --unified', ['unified-build']),
    check('discovery-browser', 'npm run test:discovery', ['discovery-build'], 'browser'),
    check('electricity-browser', 'npm run test:electricity', ['electricity-build'], 'browser'),
    check('unified-browser', 'npm run test:unified', ['unified-build'], 'browser'),
    check('hosting-browser', 'npm run test:discover', ['production-build'], 'browser'),
    check('firestore-rules', 'npm run test:rules', [], 'emulator-tap'),
    check('organizations', 'npm run test:organizations', ['functions-build'], 'emulator-tap'),
    check('commerce-entitlements', 'npm run test:commerce', ['functions-build'], 'emulator-tap'),
    check('fixtures-access', 'npm run test:qa-integration', ['functions-build'], 'emulator-tap'),
    check('authenticated-browser', 'npm run test:e2e', ['functions-build', 'local-build'], 'emulator-browser'),
  ];
}

// Observe transient edits too: a source edit reverted before the final hash is still invalid.
export function watchSource(root, files) {
  const tracked = new Set(files); let changes = 0; let error = false;
  const watcher = watch(root, { recursive: true }, (_event, filename) => {
    if (!filename) { error = true; return; }
    const name = filename.toString().replaceAll('\\', '/');
    if (name === basename(root)) return;
    if (name === '.git' || name.startsWith('.git/')) return;
    if (tracked.has(name)) { changes++; return; }
    if (/^(?:test-results|playwright-report|dist|node_modules|\.angular|functions\/(?:lib|node_modules))(?:\/|$)/.test(name)) return;
    try { execFileSync('git', ['check-ignore', '--quiet', '--', name], { cwd: root, stdio: 'ignore' }); }
    catch { changes++; }
  });
  watcher.on('error', () => { error = true; });
  return { get changes() { return changes; }, get error() { return error; }, close() { watcher.close(); } };
}
