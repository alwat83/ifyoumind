// Prepares/verifies local static files only. Deliberately has no deploy mode.
import { resolve } from 'node:path';
import { prepareArtifact, verifyArtifact } from './hosting-release/artifact.mjs';
const args = process.argv.slice(2);
const names = new Set(['expected-sha', 'run-dir', 'out', 'verify']);
try {
  const values = {};
  for (const arg of args) {
    const match = /^--([a-z-]+)=(.+)$/.exec(arg);
    if (!match || !names.has(match[1]) || values[match[1]]) throw Error('Use --expected-sha=SHA --run-dir=DIR --out=DIR, or --expected-sha=SHA --verify=DIR');
    values[match[1]] = match[2];
  }
  if (!/^[a-f0-9]{40}$/.test(values['expected-sha'] || '')) throw Error('Full exact source SHA required');
  if (values.verify ? (values['run-dir'] || values.out) : (!values['run-dir'] || !values.out)) throw Error('Choose prepare OR verify; no deployment operation is supported');
  const result = values.verify ? await verifyArtifact(resolve(values.verify), values['expected-sha']) : await prepareArtifact({root:process.cwd(), runDir:values['run-dir'], out:values.out, expected:values['expected-sha']});
  console.log(JSON.stringify(result, null, 2));
} catch (e) {console.error('Hosting artifact rejected: ' + e.message); process.exitCode = 1;}
