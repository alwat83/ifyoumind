// Unexecuted SDK-only reduction of the verified natural callable trace. No injected faults.
const { emulatorOnly } = require('./firestore-emulator-only.cjs');
emulatorOnly(); // Refuse cloud/credentials before loading any SDK.
const path = require('node:path'), fs = require('node:fs/promises');
const { createRequire } = require('node:module'), { randomUUID } = require('node:crypto');
const { startObserver } = require('./firestore-wire-observer.cjs');
if (process.argv.includes('--check')) { console.log('Loopback demo guard passed; no SDK loaded or request made.'); process.exit(0); }
const sdkRoot = path.resolve(process.argv.find(x => x.startsWith('--sdk-root='))?.slice(11) || path.join(__dirname, 'node_modules/@google-cloud/firestore'));
const req = createRequire(path.join(sdkRoot, 'package.json'));
const { Firestore, Timestamp, FieldValue } = req(sdkRoot);
(async () => {
  const observer = await startObserver({ sdkRoot });
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:' + observer.port;
  const db = new Firestore({ projectId: 'demo-ifyoumind' });
  const rounds = [], start = Date.now();
  let reproduced = false, failed = false;
  try {
    for (let round = 1; round <= 12 && Date.now() - start < 90000; round++) {
      const parent = db.collection('aggregateAbortReproducer').doc(randomUUID());
      try {
        const month = Timestamp.fromDate(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)));
        const member = parent.collection('members').doc('synthetic-owner');
        const billing = parent.collection('billing').doc('synthetic-state');
        const lock = parent.collection('usage').doc('lock');
        const projects = parent.collection('items');
        await parent.set({ synthetic: true }); await member.set({ role: 'owner' });
        async function save() {
          const ref = projects.doc(); let callbacks = 0;
          try {
            await db.runTransaction(async tx => {
              callbacks++;
              await tx.get(member); await tx.get(ref); await tx.get(parent); await tx.get(billing);
              await tx.get(lock);
              const count = (await tx.get(projects.where('createdAt', '>=', month).limit(3).count())).data().count;
              if (count >= 3) throw Object.assign(Error('Synthetic cap reached'), { code: 'CAP' });
              tx.set(lock, { updatedAt: FieldValue.serverTimestamp() });
              tx.create(ref, { synthetic: true, createdAt: FieldValue.serverTimestamp() });
            }, { maxAttempts: 5 }); // SDK-owned bounded retries only; no application retry.
            return { code: 'OK', callbacks };
          } catch (error) { return { code: error.code ?? 'UNKNOWN', callbacks }; }
        }
        const seed = [await save(), await save()];
        if (seed.some(r => r.code !== 'OK')) throw Error('Synthetic setup failed; not a reproduction');
        const outcomes = await Promise.all([save(), save(), save()]);
        const count = (await projects.count().get()).data().count;
        rounds.push({ round, outcomes, durableCount: count });
        if (count !== 3) { failed = true; break; }
        reproduced = observer.events.some(e => e.code === 10 && e.classification === 'lock-timeout' &&
          observer.events.some(later => later.ms > e.ms && later.transaction === e.transaction && later.code === 3 && later.classification === 'closed-transaction'));
        if (reproduced) break;
      } finally { await db.recursiveDelete(parent); }
    }
  } finally { await db.terminate(); observer.close(); process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'; }
  const result = { scope: 'synthetic emulator; no fault injection or application retry', reproduced, failed,
    status: failed ? 'INVARIANT_FAILURE' : reproduced ? 'MASKED_ABORT_REPRODUCED' : 'INCONCLUSIVE',
    rounds, events: observer.events.filter(e => e.phase === 'error') };
  await fs.writeFile(path.join(__dirname, 'observation.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
  process.exitCode = reproduced || failed ? 1 : 2; // No intermittent non-reproduction is a passing correction.
})().catch(error => { console.error('Reproducer terminated:', error.code || error.name); process.exitCode = 1; });
