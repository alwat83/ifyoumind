// Fails if the production bundle carries emulator-only configuration, QA fixtures or test hooks.
// Run after `npm run build` (CI does). Usage: node scripts/check-production-bundle.mjs [dir]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] || 'dist/ifyoumind-deploy/browser';

/** Strings that must never ship to ifyoumind.com. */
export const FORBIDDEN = [
  ['demo-ifyoumind', 'emulator project id (local Firebase config was bundled)'],
  ['demo-api-key', 'emulator API key'],
  ['qa.ifyoumind.test', 'QA fixture address domain'],
  ['Qa-fixture-password', 'QA fixture password'],
  ['/emulator/v1/projects', 'Auth emulator admin endpoint'],
  ['e2e/support', 'test support module'],
  ['METADATA_SERVER_DETECTION', 'fixture Admin SDK code'],
];

export function scan(files) {
  const problems = [];
  let hasProductionProject = false;
  for (const [name, text] of files) {
    if (text.includes('ifyoumind-473fe')) hasProductionProject = true;
    for (const [needle, why] of FORBIDDEN) if (text.includes(needle)) problems.push(`${name}: contains "${needle}" (${why})`);
  }
  if (!hasProductionProject) problems.push('no file references the production project ifyoumind-473fe');
  return problems;
}

function walk(root) {
  return readdirSync(root).flatMap(name => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let files;
  try {
    files = walk(dir).filter(path => /\.(js|html|json|txt|webmanifest)$/.test(path)).map(path => [path, readFileSync(path, 'utf8')]);
  } catch {
    console.error(`No production build at ${dir}. Run \`npm run build\` first.`);
    process.exit(1);
  }
  const problems = scan(files);
  if (problems.length) {
    console.error(`Production bundle check failed:\n- ${problems.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`Production bundle check passed (${files.length} files).`);
}
