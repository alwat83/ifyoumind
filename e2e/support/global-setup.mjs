import { readFile, readdir } from 'node:fs/promises';
import { assertEmulatorEnv, bundleProblems } from './emulator-guard.mjs';
import { seedCensusCache } from './fixtures.mjs';

/** Refuses to run unless both the backend and the app bundle are the local demo project. */
export default async function globalSetup() {
  assertEmulatorEnv();
  const dir = 'dist/ifyoumind-local/browser';
  let files;
  try { files = await readdir(dir); } catch {
    throw new Error(`${dir} is missing. Run \`npm run build:local\` first.`);
  }
  const main = files.find(name => /^main.*\.js$/.test(name));
  if (!main) throw new Error(`No main bundle in ${dir}.`);
  const problems = bundleProblems(await readFile(`${dir}/${main}`, 'utf8'));
  if (problems.length) throw new Error(`Refusing to test this bundle: ${problems.join('; ')}`);
  await seedCensusCache();
}
