// Passive demo-only gRPC observer. No injected faults, altered deadlines or application retries.
const path = require('node:path');
const { createRequire } = require('node:module');
const { performance } = require('node:perf_hooks');
async function startObserver({ sdkRoot, target = '127.0.0.1:8080' }) {
  require('./firestore-emulator-only.cjs').emulatorOnly();
  if (target !== '127.0.0.1:8080') throw Error('Loopback demo observer only');
  const req = createRequire(path.join(sdkRoot, 'package.json'));
  const grpc = req('@grpc/grpc-js'), loader = req('@grpc/proto-loader');
  const service = grpc.loadPackageDefinition(loader.fromJSON(require(path.join(sdkRoot, 'build/protos/v1.json')),
    { keepCase: false, longs: String, enums: String, defaults: true, oneofs: true })).google.firestore.v1.Firestore.service;
  const upstream = new grpc.Client(target, grpc.credentials.createInsecure());
  const server = new grpc.Server(), events = [], symbols = new Map();
  const start = performance.now(); let sequence = 0;
  const symbol = value => { if (!value?.length) return null; const key = value.toString('base64');
    if (!symbols.has(key)) symbols.set(key, 'T' + (symbols.size + 1)); return symbols.get(key); };
  const note = value => events.push({ ms: Math.round(performance.now() - start), ...value });
  const database = 'projects/demo-ifyoumind/databases/(default)';
  const allowed = request => request.database === database ||
    [request.name, request.parent].some(value => typeof value === 'string' && (value === database + '/documents' || value.startsWith(database + '/documents/')));
  const handlers = {};
  for (const [method, def] of Object.entries(service)) {
    if (def.requestStream) continue;
    handlers[method] = def.responseStream ? call => {
      if (!allowed(call.request)) return call.emit('error', Object.assign(Error('Demo database only'), { code: 7 }));
      const rpc = ++sequence, transaction = symbol(call.request.transaction);
      note({ rpc, method, phase: 'request', transaction, newTransaction: !!call.request.newTransaction });
      let done = false;
      const stream = upstream.makeServerStreamRequest(def.path, def.requestSerialize, def.responseDeserialize,
        call.request, call.metadata, { deadline: call.getDeadline() });
      stream.on('metadata', metadata => { if (!done) call.sendMetadata(metadata); });
      stream.on('data', data => {
        if (data.transaction?.length) note({ rpc, method, phase: 'transaction-created', transaction: symbol(data.transaction) });
        if (!done) call.write(data);
      });
      stream.on('end', () => { done = true; note({ rpc, method, phase: 'end', transaction, code: 0 }); call.end(); });
      stream.on('error', error => { if (done) return; done = true;
        note({ rpc, method, phase: 'error', transaction, code: error.code,
          classification: /Transaction lock timeout/.test(error.details || '') ? 'lock-timeout' :
            /Transaction is invalid or closed/.test(error.details || '') ? 'closed-transaction' : 'other' });
        call.emit('error', error);
      });
      call.on('cancelled', () => { if (!done) stream.cancel(); });
    } : (call, callback) => {
      if (!allowed(call.request)) return callback(Object.assign(Error('Demo database only'), { code: 7 }));
      const rpc = ++sequence, transaction = symbol(call.request.transaction);
      note({ rpc, method, phase: 'request', transaction });
      upstream.makeUnaryRequest(def.path, def.requestSerialize, def.responseDeserialize,
        call.request, call.metadata, { deadline: call.getDeadline() }, (error, value) => {
          note({ rpc, method, phase: 'end', transaction, code: error?.code ?? 0 });
          callback(error, value);
        });
    };
  }
  server.addService(service, handlers);
  const port = await new Promise((resolve, reject) => server.bindAsync('127.0.0.1:0', grpc.ServerCredentials.createInsecure(),
    (error, value) => error ? reject(error) : resolve(value)));
  return { port, events, close() { server.forceShutdown(); upstream.close(); } };
}
module.exports = { startObserver };
