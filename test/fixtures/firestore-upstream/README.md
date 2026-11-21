# UNSENT — aggregate-read abort masking reproduction package

Prepared November 21, 2026. No upstream submission, new dependency installation or cloud test authorized/performed. This folder is outside application imports and CI test globs. Copy it into a temporary directory before installing/running; it changes no application dependency.

## Verified observation versus prepared reduction

The **actual unchanged callable** was observed through a passive gRPC proxy on the Firestore emulator. Three independent saves contended for the last slot; one succeeded, one hit the cap and one surfaced INTERNAL. The trace shows a real aggregate lock-timeout ABORTED, then two real invalid/closed-transaction replies for the same transaction ID. The SDK transaction runner saw terminal code 3 instead of the original recoverable code 10. Durable project count stayed three.

[Preserved exact-source results and log hashes in draft #120](https://github.com/alwat83/ifyoumind/blob/f856c3b462903422a8cad4aaa6bdaed41268fe3b/docs/engineering/firestore-reliability/VERIFIED_461c140.md). `observed.json` contains only the symbolic error sequence and aggregate counts. It excludes raw transaction IDs, workspace/user identifiers, questions, documents, credentials and billing state. Historical Phase 3's first wire error remains unknown. Controlled document/aggregate aborts are separate tests, not this natural trace.

`reproduce.cjs` is a **new SDK-only reduction, not yet run for contention**. It mirrors the sequence of reads → aggregate count → lock/item writes using synthetic records. It removes all product, authentication, Census, billing and Firebase Functions dependencies. A real run must establish whether this reduction reproduces reliably; do not claim that it has. The passive observer and guard are byte-identical to #120. No SDK patch, injected fault, custom transport deadline or application retry exists here.

## Environment and reproduction

Observed: Node22.23.2, Java17.0.20.1, Firestore emulator1.19.8, Firestore7.11.6, GAX4.6.1, grpc-js1.14.0, proto-loader0.7.15. Four primary versions are pinned in the standalone manifest; it has no new lock, so freshly resolved transitives may differ. Capture the resolved tree in a separately approved run. No version experiment is requested.

1. Copy only this folder to a temporary directory. Start an already available emulator1.19.8 on `127.0.0.1:8080` with project `demo-ifyoumind`, in a credential-free environment. Do not point at a cloud project or reuse production data.
2. For a later approved upstream reproduction, install the pinned manifest with `npm install --ignore-scripts --no-audit --no-fund`. No real keys, ADC, Firebase login or provider access is needed. This installation has **not** been performed for this package.
3. Run:

```sh
GCLOUD_PROJECT=demo-ifyoumind FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run reproduce
```

Optional `--sdk-root=/absolute/path/to/existing/@google-cloud/firestore` permits using an already locked installation, without an install. `node reproduce.cjs --check` checks the fail-closed guard only, loads no SDK and opens no socket.

The probe allows at most12 rounds and starts no new round after90seconds. Each transaction uses SDK maxAttempts5; the untouched SDK's own RPC deadlines still apply. This is not a proven90-second wall deadline. It cleans only its randomized synthetic subtree. Exit1 means reproduced masking or invariant failure; exit2 means inconclusive. A later non-reproduction cannot clear the existing strict failures. The process never converts terminal code3 to a retry or returns a partial successful answer.

## Expected / observed

Expected: let a recoverable transactional read abort reach the SDK's bounded transaction runner; recount before commit; allow only one creation and two cap denials, without duplicate or partial writes. Genuine argument and permission errors must remain terminal.

Observed natural trace: ABORTED10 lock timeout → same transaction retried twice → INVALID_ARGUMENT3 → callable INTERNAL. The same mechanism remains in separately tested supported upgrades; REST is not qualified because broader query/deadline contracts fail. This package makes no claim about production prevalence or a supported correction.

## Proposed upstream question — draft only

Can the maintained SDK provide a supported transaction-read-scoped correction that preserves the first abort for whole-transaction recovery, without changing ordinary-query streaming semantics or bounded deadlines? Existing upstream reference: [google-cloud-node#9693](https://github.com/googleapis/google-cloud-node/issues/9693). Do not open duplicates or send this package without founder authorization.
