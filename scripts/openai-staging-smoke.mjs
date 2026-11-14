import { pathToFileURL } from 'node:url';
import { createInterface } from 'node:readline';

const fixture = {
  households: 'Market A has 12,000 households and Market B has 9,000. The difference is 3,000 households.',
  income: 'Market A has a median household income of $62,000 and Market B has $68,000. Market B is $6,000 higher.',
};
const source = 'Synthetic market fixture. Illustrative figures, not real places or Census results.';
const caveat = 'Household counts and median income do not establish customer demand, profitability, or why the markets differ.';
const within = (value, max) => Number.isSafeInteger(value) && value > 0 && value <= max;

function validateTarget(project, organizationId, phase, approved) {
  if (!approved || !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project ?? '') ||
      project === 'ifyoumind-473fe' || project.startsWith('demo-') ||
      !/^synthetic-[a-z0-9-]{1,64}$/.test(organizationId ?? '') ||
      !['disabled-before', 'enabled', 'disabled-after'].includes(phase)) {
    throw new Error('An approved staging project, synthetic workspace, and smoke phase are required.');
  }
}

function matchingToken(token, project) {
  if (typeof token !== 'string' || token.length > 8192 || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) return false;
  try {
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return claims.aud === project && claims.iss === `https://securetoken.google.com/${project}`;
  } catch {
    return false;
  }
}

export async function runStagingSmoke({ project, organizationId, phase, approved, token }, send = fetch) {
  validateTarget(project, organizationId, phase, approved);
  if (!matchingToken(token, project)) throw new Error('A Firebase ID token issued for the staging project is required.');

  // Firebase still verifies the token signature, reviewer claim and workspace role.
  const start = performance.now();
  const response = await send(`https://us-central1-${project}.cloudfunctions.net/explainSyntheticMarket`, {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(20_000),
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ data: { organizationId } }),
  });
  if (!response.ok) throw new Error('The staging callable rejected the smoke request.');
  const { result } = await response.json();
  const latencyMs = Math.round(performance.now() - start);
  if (result?.synthetic !== true || result.caveat !== caveat || !Array.isArray(result.evidence) ||
      result.evidence.length !== 2 || new Set(result.evidence.map(item => item?.id)).size !== 2 ||
      !result.evidence.every(item => Object.hasOwn(fixture, item?.id) && item.statement === fixture[item.id] &&
        item.source === source && Object.keys(item).length === 3)) {
    throw new Error('The response did not match the synthetic evidence fixture.');
  }
  if (phase !== 'enabled') {
    if (result.source !== 'deterministic' || result.reason !== 'disabled' || result.evidence[0].id !== 'households' ||
        Object.keys(result).length !== 5) throw new Error('The staging callable did not confirm disabled fallback.');
    return { phase, source: 'deterministic', valid: true, latencyMs };
  }
  const usage = result.usage;
  if (result.source !== 'openai' || Object.keys(result).length !== 5 || !within(usage?.inputTokens, 768) ||
      !within(usage?.outputTokens, 128) || usage.serviceTier !== 'default' || Object.keys(usage).length !== 3) {
    throw new Error('The staging callable did not confirm a valid provider result within budget.');
  }
  return { phase, source: 'openai', valid: true, latencyMs, ...usage };
}

async function main() {
  const [confirmation, phase, project, organizationId, ...extra] = process.argv.slice(2);
  const approved = confirmation === '--approved-staging-smoke' && extra.length === 0 && !process.stdin.isTTY;
  validateTarget(project, organizationId, phase, approved);
  // Receive a token through a pipe from a trusted local signer. Never accept it as an argument.
  const input = createInterface({ input: process.stdin, terminal: false });
  for await (const token of input) {
    input.close();
    console.log(JSON.stringify(await runStagingSmoke({ project, organizationId, phase, approved, token })));
    return;
  }
  throw new Error('Missing staging Firebase ID token on standard input.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    // Transport and parser errors may include response material. Keep CLI output generic.
    console.error('Staging smoke failed. Check the approved target, credentials, phase, and restricted staging evidence.');
    process.exitCode = 1;
  });
}
