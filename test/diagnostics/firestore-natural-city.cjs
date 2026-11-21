// Actual unchanged callable handler under a passive wire observer. Synthetic demo workspaces only.
const fs = require('node:fs/promises'), path = require('node:path');
const { createRequire } = require('node:module');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
const { startObserver } = require('./firestore-wire-observer.cjs');
require('./firestore-emulator-only.cjs').emulatorOnly();
const candidate = process.argv.find(value => value.startsWith('--candidate='))?.split('=')[1] || 'locked';
if (!['locked', 'admin13'].includes(candidate)) throw Error('Only build-compatible candidate graphs may execute unchanged handlers');
const source = path.resolve('test-results/firestore-reliability', candidate, 'functions');
const sdkRoot = path.join(source, 'node_modules/@google-cloud/firestore');
const req = createRequire(path.join(source, 'package.json'));
(async () => {
  const observer = await startObserver({ sdkRoot });
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:' + observer.port;
  process.env.SUBSCRIPTION_ENROLLMENT = '';
  process.env.CENSUS_API_KEY = 'synthetic-fixture';
  // Fail closed outside the existing deterministic Census response fixture. No provider request.
  let providerRequests = 0;
  globalThis.fetch = async url => {
    const u = new URL(url);
    if (u.hostname !== 'api.census.gov') { providerRequests++; throw Error('External provider refused'); }
    return Response.json([['NAME', 'B01003_001E', 'B19013_001E', 'B25077_001E', 'state', 'place'],
      ['Denver city', u.pathname.includes('2019') ? '98000' : '100000', '70000', '260000', '08', '20000']]);
  };
  const handlers = req('./lib/index.js'), { getFirestore } = req('firebase-admin/firestore');
  const db = getFirestore(), rounds = [];
  const started = Date.now();
  let failure;
  try {
    for (let round = 1; round <= 12; round++) {
      if (Date.now() - started > 90000) throw Error('Observation budget exhausted; not a pass');
      const org = db.collection('intelligenceOrganizations').doc('wire-probe-' + randomUUID());
      const created = Date.now();
      try {
        await org.set({ name: 'Synthetic wire observer', plan: 'free' });
        await org.collection('members').doc('owner').set({ role: 'owner', status: 'active' });
        const call = requestId => handlers.createMarketIntelligenceProject.run({ auth: { uid: 'owner', token: { email_verified: true } },
          data: { organizationId: org.id, ...(requestId ? { requestId } : {}), location: 'Denver, CO', concept: 'Bookshop', decision: 'Compare candidate markets' } });
        await call(randomUUID()); await call(randomUUID());
        const values = await Promise.allSettled([call(randomUUID()), call(randomUUID()), call()]);
        const count = (await org.collection('marketProjects').count().get()).data().count;
        const codes = values.map(value => value.status === 'fulfilled' ? 'success' : value.reason.code);
        rounds.push({ round, codes, durableProjectCount: count, milliseconds: Date.now() - created });
        assert.equal(count, 3, 'No duplicate or overspent free slot');
        if (codes.filter(code => code === 'success').length !== 1 || codes.filter(code => code === 'resource-exhausted').length !== 2) {
          failure = 'Unexpected natural application outcome'; break;
        }
      } finally { await db.recursiveDelete(org); }
    }
    assert.equal(providerRequests, 0);
  } catch (error) { failure = error.message; }
  finally { await db.terminate(); observer.close(); process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'; }
  const report = { candidate, kind: 'passive observer; no injected errors, altered deadlines or mutation retry',
    status: failure ? 'FAIL' : 'PASS', failure, providerRequests, rounds, events: observer.events };
  await fs.writeFile(path.resolve('test-results/firestore-reliability', 'natural-' + candidate + '.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ candidate, status: report.status, rounds, wireErrors: observer.events.filter(event => event.code && event.phase === 'error') }));
  process.exitCode = failure ? 1 : 0;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
