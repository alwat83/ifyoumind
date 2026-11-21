// Explicit diagnostic, deliberately outside ordinary test globs and all production graphs.
// A failed recovery assertion is a real unresolved diagnostic failure, never an accepted baseline.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { mkdir, writeFile } = require('node:fs/promises');
const { createRequire } = require('node:module');
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080' ||
    process.env.GCLOUD_PROJECT !== 'demo-ifyoumind') {
  throw Error('Requires the loopback Firestore emulator and demo-ifyoumind. No cloud fallback.');
}
for (const [name, value] of Object.entries(process.env)) {
  if (value && /^(GOOGLE_APPLICATION_CREDENTIALS|FIREBASE_TOKEN|GCP_SA_KEY|GOOGLE_OAUTH_ACCESS_TOKEN|CLOUDSDK_AUTH_ACCESS_TOKEN|CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE|OPENAI_API_KEY|STRIPE_.*KEY|AWS_(ACCESS_KEY_ID|SECRET_ACCESS_KEY|SESSION_TOKEN))$/.test(name)) {
    throw Error('Credential-bearing environment refused: ' + name);
  }
}
const sdk = path.resolve('functions/node_modules/@google-cloud/firestore');
const sdkRequire = createRequire(sdk + '/package.json');
const grpc = sdkRequire('@grpc/grpc-js');
const loader = sdkRequire('@grpc/proto-loader');
const { Firestore } = require(sdk);
const definition = loader.fromJSON(require(sdk + '/build/protos/v1.json'), {
  keepCase: false, longs: String, enums: String, defaults: true, oneofs: true,
});
const service = grpc.loadPackageDefinition(definition).google.firestore.v1.Firestore.service;
const database = 'projects/demo-ifyoumind/databases/(default)';
// This is the documented emulator Admin sentinel, not a real credential. No rules are changed.
const metadata = () => { const value = new grpc.Metadata(); value.set('authorization', 'Bearer owner'); return value; };
const events = [], results = [], symbols = new Map();
const symbol = bytes => {
  if (!bytes?.length) return null;
  const key = bytes.toString('base64');
  if (!symbols.has(key)) symbols.set(key, 'T' + (symbols.size + 1));
  return symbols.get(key);
};
let direct, base, upstream, server, port, arm = 'control', injected = false;
const unary = (name, data) => new Promise((resolve, reject) => {
  const def = service[name];
  upstream.makeUnaryRequest(def.path, def.requestSerialize, def.responseDeserialize, data,
    metadata(), { deadline: Date.now() + 10000 }, (error, value) => error ? reject(error) : resolve(value));
});

test.before(async () => {
  direct = new Firestore({ projectId: 'demo-ifyoumind' });
  base = direct.collection('transactionDiagnostics').doc(randomUUID());
  await base.set({ synthetic: true, count: 0 });
  await base.collection('state').doc('read').set({ synthetic: true });
  upstream = new grpc.Client('127.0.0.1:8080', grpc.credentials.createInsecure());
  server = new grpc.Server();
  const handlers = {};
  for (const [name, def] of Object.entries(service)) {
    if (def.requestStream) continue; // Diagnostic never opens listeners or bidirectional writes.
    const allowed = request => request.database === database;
    if (def.responseStream) {
      handlers[name] = async call => {
        if (!allowed(call.request)) return call.emit('error', Object.assign(Error('Demo database only'), { code: 7 }));
        const transaction = symbol(call.request.transaction);
        const target = (arm === 'read-abort' && name === 'BatchGetDocuments') ||
          (arm === 'aggregate-abort' && name === 'RunAggregationQuery');
        if (target && transaction && !injected) {
          injected = true;
          try {
            await unary('Rollback', { database, transaction: call.request.transaction });
            events.push({ arm, method: name, transaction, origin: 'injected-after-real-rollback', code: 10 });
            call.emit('error', Object.assign(Error('Synthetic transaction abort'), { code: 10 }));
          } catch (error) { call.emit('error', error); }
          return;
        }
        // RunAggregationQuery uses parent rather than database; allowed below is intentionally exact.
        const stream = upstream.makeServerStreamRequest(def.path, def.requestSerialize, def.responseDeserialize,
          call.request, metadata(), { deadline: Date.now() + 10000 });
        stream.on('data', data => call.write(data));
        stream.on('end', () => call.end());
        stream.on('error', error => {
          events.push({ arm, method: name, transaction, origin: 'emulator', code: error.code, message: error.details });
          call.emit('error', error);
        });
        call.on('cancelled', () => stream.cancel());
      };
    } else {
      handlers[name] = async (call, callback) => {
        if (!allowed(call.request)) return callback(Object.assign(Error('Demo database only'), { code: 7 }));
        try {
          if (name === 'Commit' && call.request.transaction?.length && arm === 'commit-abort' && !injected) {
            injected = true;
            await unary('Rollback', { database, transaction: call.request.transaction });
            events.push({ arm, method: name, transaction: symbol(call.request.transaction), origin: 'injected-after-real-rollback', code: 10 });
            return callback(Object.assign(Error('Synthetic commit abort'), { code: 10 }));
          }
          callback(null, await unary(name, call.request));
        } catch (error) { callback(error); }
      };
    }
  }
  // Queries address a parent document. They must still stay inside this exact synthetic subtree.
  for (const name of ['RunQuery', 'RunAggregationQuery']) {
    const handler = handlers[name];
    handlers[name] = call => {
      if (!call.request.parent?.startsWith(database + '/documents/' + base.path)) {
        return call.emit('error', Object.assign(Error('Synthetic query parent only'), { code: 7 }));
      }
      // Validation-only alias, ignored by protobuf serialization.
      call.request.database = database;
      return handler(call);
    };
  }
  server.addService(service, handlers);
  port = await new Promise((resolve, reject) => server.bindAsync('127.0.0.1:0',
    grpc.ServerCredentials.createInsecure(), (error, value) => error ? reject(error) : resolve(value)));
});

test.after(async () => {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  server?.forceShutdown(); upstream?.close();
  if (base && direct) await direct.recursiveDelete(base);
  await direct?.terminate();
  await mkdir('test-results/phase3-reliability', { recursive: true });
  await writeFile('test-results/phase3-reliability/transport.json', JSON.stringify({
    kind: 'fault-injected SDK diagnostic; not natural-contention or production proof',
    sdk: require(sdk + '/package.json').version, node: process.version,
    gax: sdkRequire('google-gax/package.json').version,
    status: results.length === 4 && results.every(value => value.success) ? 'PASS' : 'FAIL', results, events,
  }, null, 2) + '\n');
});

async function runArm(mode) {
  arm = mode; injected = false;
  await base.update({ count: 0 });
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:' + port;
  const db = new Firestore({ projectId: 'demo-ifyoumind' });
  let attempts = 0, outcome;
  const start = Date.now();
  try {
    await db.runTransaction(async tx => {
      attempts++;
      const parent = await tx.get(db.doc(base.path));
      if (mode === 'aggregate-abort') await tx.get(db.doc(base.path).collection('state').count());
      else await tx.get(db.doc(base.path + '/state/read'));
      tx.update(db.doc(base.path), { count: parent.get('count') + 1 });
    }, { maxAttempts: 2 });
    outcome = { success: true };
  } catch (error) { outcome = { success: false, code: error.code, message: error.details || error.message }; }
  finally { await db.terminate(); }
  const value = { arm: mode, attempts, injected, milliseconds: Date.now() - start,
    ...outcome, count: (await base.get()).get('count') };
  results.push(value);
  return value;
}

test('control: an uninjected transaction commits once', { timeout: 25000 }, async () => {
  const result = await runArm('control');
  assert.equal(result.success, true); assert.equal(result.count, 1); assert.equal(result.attempts, 1);
});
for (const mode of ['read-abort', 'aggregate-abort']) {
  test(`${mode}: original abort should reach the runner and retry the complete transaction`, { timeout: 25000 }, async () => {
    const result = await runArm(mode);
    assert.equal(result.injected, true, 'Required fault must actually occur');
    assert.equal(result.success, true, `SDK recovery failed: code ${result.code}, ${result.message}`);
    assert.equal(result.attempts, 2); assert.equal(result.count, 1);
  });
}
test('control: commit abort retries the whole transaction and commits once', { timeout: 25000 }, async () => {
  const result = await runArm('commit-abort');
  assert.equal(result.injected, true); assert.equal(result.success, true);
  assert.equal(result.attempts, 2); assert.equal(result.count, 1);
});
