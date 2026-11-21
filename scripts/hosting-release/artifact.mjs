// Local-only artifact preparation. No authentication, HTTP, deploy or rollback operation.
import { readFile, readdir, lstat, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { join, resolve, relative, sep } from 'node:path';
import { fingerprint, digestFiles, integrity, sha256 } from '../local-verification/core.mjs';
import { scan } from '../check-production-bundle.mjs';

export const SITE = 'ifyoumind-473fe';
export const REQUIRED = ['production-build', 'production-bundle', 'production-isolation', 'hosting-browser', 'authenticated-browser'];
const keys = (value, allowed) => {
  if (!value || Array.isArray(value) || typeof value !== 'object' || Object.keys(value).some(k => !allowed.includes(k))) throw Error('Unexpected Hosting configuration key or shape');
};
export function hostingOnly(source) {
  const h = source.hosting;
  keys(h, ['public', 'cleanUrls', 'redirects', 'ignore', 'rewrites', 'headers']);
  if (h.public !== 'dist/ifyoumind-deploy/browser' || h.cleanUrls !== true) throw Error('Unexpected reviewed production public path');
  for (const r of h.rewrites || []) {
    keys(r, ['source', 'regex', 'destination']);
    if (!r.destination?.startsWith('/') || r.destination.startsWith('//') || Boolean(r.source) === Boolean(r.regex)) throw Error('Only static, local rewrites allowed');
  }
  const privacy = h.headers?.find(r => r.source === '/discover/**');
  if (!privacy?.headers?.some(v => v.key === 'Content-Security-Policy' && v.value.includes("connect-src 'none'")) || !privacy.headers.some(v => v.key === 'Cache-Control' && v.value === 'no-store')) throw Error('Discovery privacy headers missing');
  return { hosting: { ...h, site: SITE, public: 'public' } };
}
export function validateReport(report, expected) {
  if (!/^[a-f0-9]{40}$/.test(expected) || report.commit !== expected || !report.integrity?.valid || report.developmentStatus !== 'PASS' || !['consumer', 'release'].includes(report.selection?.level)) throw Error('Exact-source Consumer/Release verification required');
  if (report.checks.some(c => ['FAIL', 'BLOCKED'].includes(c.status))) throw Error('Executed failure/blocker cannot be packaged');
  for (const id of REQUIRED) if (!report.checks.some(c => c.id === id && c.status === 'PASS')) throw Error('Required check missing: ' + id);
  if (!report.integrity.before?.clean || !report.integrity.after?.clean || report.integrity.sourceEvents !== 0 || report.integrity.watcherError || report.integrity.before.head !== expected || report.integrity.after.head !== expected || report.integrity.before.digest !== report.integrity.after.digest || report.integrity.snapshotDigest !== report.integrity.before.digest) throw Error('Invalid source integrity record');
}
export async function files(root, prefix = '') {
  if (!(await lstat(join(root, prefix))).isDirectory()) throw Error('Only real directories allowed');
  const result = [];
  for (const entry of (await readdir(join(root, prefix))).sort()) {
    if (!/^[A-Za-z0-9_@+., -]+$/.test(entry) || entry.startsWith('.') || /(?:^|[._-])(?:env|pem|key|map|log)$/i.test(entry)) throw Error('Unsafe or private artifact filename');
    const path = join(prefix, entry), s = await lstat(join(root, path));
    if (s.isDirectory()) result.push(...await files(root, path));
    else if (s.isFile()) { const body = await readFile(join(root, path)); result.push({ path: path.split(sep).join('/'), bytes: body.length, sha256: sha256(body) }); }
    else throw Error('Only regular files/directories allowed');
  }
  return result;
}
export async function verifyArtifact(dir, expected) {
  if (!(await lstat(dir)).isDirectory()) throw Error('Only a real artifact directory allowed');
  for (const name of ['manifest.json', 'firebase.json']) if (!(await lstat(join(dir, name))).isFile()) throw Error('Only regular artifact metadata allowed');
  const m = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
  if (m.schemaVersion !== 1 || m.source !== expected || m.project !== SITE || m.site !== SITE || m.releaseAuthorized !== false) throw Error('Manifest identity mismatch');
  const configBody = await readFile(join(dir, 'firebase.json'));
  if (sha256(configBody) !== m.configSha256) throw Error('Hosting config changed');
  const config = JSON.parse(configBody);
  keys(config, ['hosting']); keys(config.hosting, ['site', 'public', 'cleanUrls', 'redirects', 'ignore', 'rewrites', 'headers']);
  if (config.hosting.site !== SITE || config.hosting.public !== 'public') throw Error('Wrong deployment target');
  const {site, ...h} = config.hosting;
  hostingOnly({hosting:{...h,public:'dist/ifyoumind-deploy/browser'}});
  const actual = await files(join(dir, 'public'));
  if (JSON.stringify(actual) !== JSON.stringify(m.files)) throw Error('Static assets changed, added or removed');
  const top = (await readdir(dir)).sort();
  if (JSON.stringify(top) !== JSON.stringify(['firebase.json', 'manifest.json', 'public'])) throw Error('Unexpected release artifact entries');
  return { source: m.source, project: SITE, files: actual.length, configSha256: m.configSha256, releaseAuthorized: false };
}
export async function prepareArtifact({root, runDir, expected, out}) {
  root = resolve(root); runDir = resolve(runDir); out = resolve(out);
  // Outputs must remain ignored local artifacts; never replace or modify the tested source.
  const rel = relative(join(root, 'test-results'), out);
  if (!rel || rel.startsWith('..') || resolve(out) === resolve(runDir) || out.startsWith(runDir + sep) || runDir.startsWith(out + sep)) throw Error('Output must be a separate ignored test-results directory');
  const before = await fingerprint(root);
  if (before.head !== expected || before.status) throw Error('Expected clean exact source checkout');
  const reportBody = await readFile(join(runDir, 'report.json'));
  const report = JSON.parse(reportBody); validateReport(report, expected);
  const snapshot = join(runDir, 'worktree');
  if (await digestFiles(snapshot, before.files) !== before.digest || before.digest !== report.integrity.before.digest) throw Error('Tested source snapshot changed');
  const sourceConfig = await readFile(join(snapshot, 'firebase.json'));
  const config = hostingOnly(JSON.parse(sourceConfig));
  const publicDir = join(snapshot, 'dist/ifyoumind-deploy/browser');
  const entries = await files(publicDir);
  for (const required of ['index.html', 'app-shell.html', '404.html', 'discover/index.html']) if (!entries.some(e => e.path === required)) throw Error('Missing static entry: ' + required);
  const texts = await Promise.all(entries.filter(e => /\.(js|html|json|txt|webmanifest)$/.test(e.path)).map(async e => [e.path, await readFile(join(publicDir, e.path), 'utf8')]));
  const problems = scan(texts); if (problems.length) throw Error('Production bundle guard rejected artifact');
  await mkdir(out); // Exclusive: existing/partial packages are never silently overwritten.
  for (const e of entries) { const dest = join(out, 'public', e.path); await mkdir(resolve(dest, '..'), {recursive:true}); await copyFile(join(publicDir, e.path), dest); }
  const configBody = JSON.stringify(config, null, 2) + '\n';
  await writeFile(join(out, 'firebase.json'), configBody);
  const manifest = {schemaVersion:1, source:expected, project:SITE, site:SITE, sourceDigest:before.digest, reportSha256:sha256(reportBody), sourceConfigSha256:sha256(sourceConfig), configSha256:sha256(configBody), firebaseTools:'13.35.1', files:entries, releaseAuthorized:false};
  await writeFile(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  const after = await fingerprint(root);
  if (!integrity(before, after, expected) || await digestFiles(snapshot, before.files) !== before.digest) throw Error('Source changed during packaging; artifact invalid');
  return verifyArtifact(out, expected);
}
