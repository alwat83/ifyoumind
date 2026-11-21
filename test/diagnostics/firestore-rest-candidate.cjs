// Isolated, supported REST preference experiment. Not imported by application/runtime code.
const test = require('node:test'), assert = require('node:assert/strict');
const http = require('node:http'), fs = require('node:fs/promises'), path = require('node:path');
const { randomUUID } = require('node:crypto'), { createRequire } = require('node:module');
require('./firestore-emulator-only.cjs').emulatorOnly();
const req = createRequire(path.resolve('test-results/firestore-reliability/locked/functions/package.json'));
const { Firestore } = req('@google-cloud/firestore'), { OAuth2Client } = req('google-auth-library');
const emulatorAuth = new OAuth2Client();
// Public emulator Admin sentinel only: no real credential, key file or token endpoint.
emulatorAuth.setCredentials({ access_token: 'owner', expiry_date: Date.now() + 3600000 });
const database = 'projects/demo-ifyoumind/databases/(default)';
const results = [], events = [], symbols = new Map();
let server, direct, base, arm = 'control', faultApplied = 0;
const symbol = value => { if (!value) return null; if (!symbols.has(value)) symbols.set(value, 'T' + (symbols.size + 1)); return symbols.get(value); };
const faultTarget = (method, data) => data.transaction && (
  (['read-abort', 'always-abort', 'permission', 'invalid', 'deadline'].includes(arm) && method === 'batchGet') ||
  (arm === 'aggregate-abort' && method === 'runAggregationQuery') || (arm === 'commit-abort' && method === 'commit'));
const client = budget => new Firestore({ projectId: 'demo-ifyoumind', preferRest: true, authClient: emulatorAuth,
  ...(budget ? { clientConfig: { interfaces: { 'google.firestore.v1.Firestore': {
    retry_params: { default: { initial_retry_delay_millis: 100, retry_delay_multiplier: 1.3, max_retry_delay_millis: 200,
      initial_rpc_timeout_millis: 100, rpc_timeout_multiplier: 1, max_rpc_timeout_millis: 100, total_timeout_millis: 300 } },
    methods: { BatchGetDocuments: { timeout_millis: 100 } },
  } } } } : {}),
});

test.before(async () => {
  direct = client(false);
  base = direct.collection('transactionDiagnostics').doc(randomUUID());
  await base.set({ synthetic: true, count: 0 });
  await base.collection('state').doc('read').set({ synthetic: true });
  for (const [i, id] of ['a', 'b', 'c'].entries()) await base.collection('ordered').doc(id).set({ n: i });
  server = http.createServer(async (request, response) => {
    try {
      const chunks = []; for await (const chunk of request) chunks.push(chunk);
      let bytes = Buffer.concat(chunks), data = bytes.length ? JSON.parse(bytes) : {};
      const url = new URL(request.url, 'http://127.0.0.1');
      if (!decodeURIComponent(url.pathname).startsWith('/v1/' + database + '/documents')) throw Error('Demo database only');
      const method = url.pathname.match(/:([a-zA-Z]+)$/)?.[1] || request.method;
      const transaction = symbol(data.transaction);
      events.push({ arm, method, phase: 'request', transaction, newTransaction: !!data.newTransaction });
      const target = faultTarget(method, data), repeated = ['always-abort', 'permission', 'invalid', 'deadline'].includes(arm);
      if (target && (repeated || faultApplied === 0)) {
        if (arm === 'deadline') { faultApplied++; return; } // Deliberately no response; public SDK deadline must terminate.
        if (arm === 'permission') {
          faultApplied++; // Forward unauthenticated to obtain a genuine rules denial, not a synthetic error.
        } else if (arm === 'invalid') {
          faultApplied++;
          data.documents = [database + '/documents/odd']; bytes = Buffer.from(JSON.stringify(data));
        } else {
          const rollback = await fetch('http://127.0.0.1:8080/v1/' + database + '/documents:rollback', {
            method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer owner' },
            body: JSON.stringify({ transaction: data.transaction }),
          });
          if (!rollback.ok) throw Error('Required real rollback failed: ' + rollback.status);
          faultApplied++;
          events.push({ arm, method, transaction, origin: 'injected-after-real-rollback', code: 10, status: 409 });
          response.writeHead(409, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ error: { code: 409, status: 'ABORTED', message: 'Synthetic transaction abort' } }));
          return;
        }
      }
      const headers = { 'content-type': 'application/json', 'content-length': bytes.length };
      if (!(arm === 'permission' && target)) headers.authorization = 'Bearer owner';
      const upstream = http.request({ hostname: '127.0.0.1', port: 8080, method: request.method, path: request.url, headers }, reply => {
        events.push({ arm, method, transaction, origin: 'emulator', status: reply.statusCode });
        if (arm === 'partial-query' && method === 'runQuery' && !data.transaction && faultApplied === 0) {
          const chunks = [];
          reply.on('data', chunk => chunks.push(chunk));
          reply.on('end', () => {
            const rows = JSON.parse(Buffer.concat(chunks).toString());
            const row = rows.find(value => value.document);
            if (!row) return response.destroy(Error('No real query row to interrupt'));
            faultApplied++;
            response.writeHead(200, { 'content-type': 'application/json' });
            response.write('[' + JSON.stringify(row) + ',', () => response.destroy(Error('Synthetic partial-stream disconnect')));
          });
        } else { response.writeHead(reply.statusCode, reply.headers); reply.pipe(response); }
      });
      upstream.on('error', error => response.destroy(error)); upstream.end(bytes);
    } catch (error) { response.writeHead(500, { 'content-type': 'application/json' }); response.end(JSON.stringify({ error: { code: 500, status: 'INTERNAL', message: error.message } })); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
});

test.after(async () => {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  server?.closeAllConnections(); await new Promise(resolve => server?.close(resolve));
  if (base) await direct.recursiveDelete(base);
  await direct?.terminate();
  await fs.mkdir('test-results/firestore-reliability', { recursive: true });
  await fs.writeFile('test-results/firestore-reliability/rest-contracts.json', JSON.stringify({
    kind: 'isolated supported preferRest; injected synthetic faults, not production proof',
    sdk: JSON.parse(await fs.readFile(path.resolve('test-results/firestore-reliability/locked/functions/node_modules/@google-cloud/firestore/package.json'), 'utf8')).version,
    status: results.length === 9 && results.every(value => value.validation === 'PASS') ? 'PASS' : 'FAIL', results, events,
    deadlineCase: '100ms RPC / 300ms GAX test-only budget; not a proposed production value',
  }, null, 2) + '\n');
});

async function transact(mode, validate, budget = false) {
  arm = mode; faultApplied = 0; await base.update({ count: 0 });
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:' + server.address().port;
  const db = client(budget); let attempts = 0, outcome; const started = Date.now();
  try {
    await db.runTransaction(async tx => {
      attempts++; const parent = await tx.get(db.doc(base.path));
      if (mode === 'aggregate-abort') await tx.get(db.doc(base.path).collection('state').count());
      else await tx.get(db.doc(base.path + '/state/read'));
      tx.update(db.doc(base.path), { count: parent.get('count') + 1 });
    }, { maxAttempts: 2 });
    outcome = { success: true };
  } catch (error) { outcome = { success: false, code: error.code }; }
  finally { await db.terminate(); }
  const result = { mode, ...outcome, attempts, faultApplied, count: (await base.get()).get('count'), milliseconds: Date.now() - started, validation: 'FAIL' };
  results.push(result); await validate(result); result.validation = 'PASS';
}

test('REST control commits once', { timeout: 25000 }, () => transact('control', value => {
  assert.equal(value.success, true); assert.equal(value.attempts, 1); assert.equal(value.count, 1);
}));
for (const mode of ['read-abort', 'aggregate-abort', 'commit-abort']) {
  test('REST ' + mode + ' retries the complete transaction once without partial writes', { timeout: 25000 }, () => transact(mode, value => {
    assert.equal(value.faultApplied, 1); assert.equal(value.success, true); assert.equal(value.attempts, 2); assert.equal(value.count, 1);
    const old = events.find(event => event.arm === mode && event.origin === 'injected-after-real-rollback').transaction;
    const rejectedReadReplays = events.filter(event => event.arm === mode && event.phase === 'request' && event.transaction === old && !['rollback', 'commit'].includes(event.method));
    assert.equal(rejectedReadReplays.length, 1, 'No resending a read after its transaction was invalidated');
  }));
}
test('REST persistent abort terminates at maxAttempts with original code 10 and zero writes', { timeout: 25000 }, () => transact('always-abort', value => {
  assert.equal(value.success, false); assert.equal(value.code, 10); assert.equal(value.attempts, 2); assert.equal(value.faultApplied, 2); assert.equal(value.count, 0);
}));
test('REST genuine permission denial stays terminal code 7', { timeout: 25000 }, () => transact('permission', value => {
  assert.equal(value.success, false); assert.equal(value.code, 7); assert.equal(value.attempts, 1); assert.equal(value.count, 0);
}));
test('REST genuine invalid argument stays terminal code 3', { timeout: 25000 }, () => transact('invalid', value => {
  assert.equal(value.success, false); assert.equal(value.code, 3); assert.equal(value.attempts, 1); assert.equal(value.count, 0);
}));
test('REST partial ordinary query returns ordered unique rows', { timeout: 25000 }, async () => {
  arm = 'partial-query'; faultApplied = 0;
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:' + server.address().port;
  const db = client(false); const result = { mode: arm, validation: 'FAIL' }; results.push(result);
  try {
    const snapshot = await db.doc(base.path).collection('ordered').orderBy('n').get();
    result.ids = snapshot.docs.map(doc => doc.id); result.faultApplied = faultApplied;
    assert.equal(faultApplied, 1); assert.deepEqual(result.ids, ['a', 'b', 'c']); result.validation = 'PASS';
  } finally { await db.terminate(); }
});
test('REST public test deadline terminates a hanging read with no writes', { timeout: 25000 }, () => transact('deadline', value => {
  assert.equal(value.success, false); assert.equal(value.code, 4); assert.equal(value.attempts, 2); assert.equal(value.count, 0);
  assert.ok(value.milliseconds < 22000, 'Bounded experiment deadline, not an application Promise.race');
}, true));
