# Phase 3B — transaction reliability qualification

November 21, 2026 · OpenAI / Codex · `codex/firestore-transaction-reliability`, separated from draft #119 at `172dbaa93231e88fd2256b3ca7c2726d81a7c6e0`.

**NO-GO: no supported correction qualifies.** This branch adds reproducible test tools and evidence, not an application retry or dependency upgrade. Approved Concept A, #118, production data/configuration, billing and AI remain unchanged. The [Phase 3 report](../../design/midnight-slate/phase3/REVIEW.md), original strict diagnostic and original failure records are preserved. [Executed experiment evidence](EXPERIMENTS.json) records preliminary observations; final clean-head execution is recorded on the draft PR with its SHA and hashed report.

## Three failures, separate evidence

| Observation | Established facts | What remains unknown |
|---|---|---|
| Original Phase 3 natural concurrent city save | One success, one quota denial, one INTERNAL; final SDK error code 3, closed transaction, aggregate-read path. | Original first wire error was not retained. Do not retrospectively assign code 10 to this historical run. |
| Controlled document read abort | Proxy performs real rollback then injects code 10 before response; SDK resends the same closed transaction ID; real emulator code 3 masks the original; callback once, durable counter zero. | This injected cause does not establish the historical natural trigger. |
| Controlled aggregate read abort | Same deliberate fault at a different RPC; separate strict assertion fails with the same masking sequence. | Not interchangeable with the document fault or proof of production behavior. |

### Fresh natural reproduction

A **passive** loopback gRPC observer forwards metadata, request bytes and existing deadlines; it injects no error and adds no mutation retries. The unchanged compiled application callable creates two synthetic free decisions, then three concurrent saves contend for one remaining slot. Application membership checks execute with synthetic callable auth; this is **not** HTTP Firebase token verification. All Census requests receive the existing synthetic fixture; no external provider request.

On round 3: `[success, internal, resource-exhausted]`, three durable projects, 9,410 ms. Two earlier rounds gave the intended one success/two quota denials. Symbolic transaction **T21**:

| Relative time | RPC | Result |
|---|---|---|
| 11,429 ms | RunAggregationQuery | Emulator code 10, transaction lock timeout |
| 13,761 ms | Same read / same T21 | Emulator code 3, invalid or closed transaction |
| 18,697 ms | Same read / same T21 | Emulator code 3 again |

This establishes the natural mechanism **in this new emulator run**, independently of the controlled faults. Passive proxy timing may affect contention. It does not establish production frequency. No cap overspend or durable duplicate was observed in these rounds; that is not comprehensive partial-write qualification.

In the locked source, the SDK-owned transaction runner retries ABORTED. Its terminal INVALID_ARGUMENT handling retries only the specific expired-transaction message, not the closed-ID message. Streaming transport retries occur before that runner sees the failure, so the application receives terminal code 3, translated to INTERNAL, instead of the original recoverable code 10. Adding application retries or classifying all invalid arguments as recoverable would obscure this distinction and is rejected.

## Supported dependency decision table

All graphs use generated, committed experiment locks and separate ignored installs. **Production package files and lock are unchanged.** Node 22.23.2, emulator 1.19.8, native macOS; no production Firestore test.

| Candidate | Admin / Functions | Firestore / GAX / gRPC | Build compatibility | Strict gRPC recovery | Decision |
|---|---|---|---|---|---|
| Current lock | 13.5.0 / 6.4.0 | 7.11.6 / 4.6.1 / 1.14.0 | PASS | 2 controls PASS, 2 read recovery FAIL | Retain unchanged; unresolved blocker |
| Supported Admin 13 update | 13.10.0 / 6.4.0 | 7.11.6 / 4.6.1 / 1.14.7 | PASS | Same 2 PASS / 2 FAIL | No correction; reject upgrade for this issue |
| Firestore 8 supported graph | 14.3.0 / 7.4.0 | 8.7.1 / 5.0.8 / 1.14.7 | FAIL: 17 existing namespace-use diagnostics after Admin 14 removal | Same 2 PASS / 2 FAIL | Does not fix recovery; requires unrelated migration |
| Latest supported graph reviewed | 14.5.1 / 7.4.0 | 9.4.1 / 6.17.0 / 1.14.7 | FAIL: same 17 diagnostics | Same 2 PASS / 2 FAIL | Does not fix recovery; Node 22 + Admin migration risks |
| Public `preferRest` on current lock | 13.5.0 / 6.4.0 | 7.11.6 / 4.6.1 | Isolated transport tests only; no app transport change | Initial 4 recovery controls PASS; extended contracts **7 PASS / 1 FAIL / 1 CANCELLED** | Reject: query interruption and deadline contract fail |

Newer GAX packages do not export package.json. Initial unmodified diagnostics reached the same two assertion failures but also failed the reporting hook. Retained original logs/results mark that setup failure. A **metadata-only adapter** reads the installed package JSON by absolute file path; no SDK code, request sequencing or assertion changes. The subsequent 2/2 outcomes are recorded separately. The original diagnostic SHA-256 remains `bc5ed41e66280a9d20402ee4d8aa712950e1b7b7b1d8ec33752cff403a575860`.

### Why REST is not a recommendation

The documented `preferRest` setting avoids the observed gRPC abort masking in the four initial controls. Real rollback is asserted before injecting each abort. Persistent ABORTED stops at maxAttempts 2 with original code 10 and zero writes; genuine unauthenticated rules denial remains terminal code 7; genuine invalid path remains terminal code 3. Test-only OAuth uses the public emulator `owner` sentinel, never ADC, a key or a real token endpoint.

Extended qualification fails: a real partial ordered query followed by TCP reset throws `ERR_STREAM_PREMATURE_CLOSE`; the full ordered unique result is not recovered. The test-only public GAX 100 ms RPC / 300 ms total configuration **does not bound a hanging REST read**: the 25-second test timeout cancels it, teardown resets the connection, and a later observation reports ECONNRESET at ~25,024 ms. Process teardown took ~75.6 seconds; neither duration establishes a production deadline. No writes were made by these two failing cases.

An initial exploratory REST probe had the wrong rollback URL and no injected-abort events. It is explicitly invalid, retained by hash, and excluded from passing evidence. Corrected tests require successful real rollback and `faultApplied=1`. No failed experiment is relabeled as passing. Client-wide `gaxServerStreamingRetries`, private SDK monkey-patches, extra application retries and lock/quota bypasses were not applied.

## Coverage and qualification boundary

| Required contract | Current evidence | Candidate release qualification |
|---|---|---|
| Controlled read / aggregate abort | Strictly fails on all four gRPC graphs | FAIL |
| Concurrent city saves | Fresh passive natural failure; cap remained 3 | FAIL |
| Dataset-cap enforcement | Preserved Phase 3 contention checkpoint passes; previous intermittent dataset failure remains distinct, initial wire cause unknown | Not newly qualified |
| Same-key / different-key idempotency, month boundary, auth and permission handling | Existing application assertions preserved. Historical exact172dbaa full native run: **728 PASS / 3 FAIL / 15 SKIP**, source integrity VALID | Full candidate business regressions NOT RUN after failed transport/build prerequisites |
| Terminal denial / invalid argument, no writes, bounded maxAttempts | Seven REST contracts pass, including genuine code 7/3 and persistent code 10 | Isolated evidence only; transport still rejected |
| Partial query, bounded deadline | Extended REST fails / times out | FAIL |
| Production, Linux, physical device, human understanding | No new production test, Linux runtime or participant session | Unverified, not passed |

No proposed correction passes every required contract. The matrix runner also executes the unchanged Functions unit suite for build-compatible graphs. Exact counts and clean-source integrity are emitted by the final run; historical and freshly run evidence remain separate. UI/build/browser suites on unchanged application source are not redundantly rerun for this test-only branch.

## Reproduce safely

Prerequisites: Node 22, existing repository tooling, Java 17, installed Firebase emulator 1.19.8, internet for npm registry installs. The runner starts no cloud resource. Use a clean checkout of this branch and an already-running **demo-only** emulator on exact loopback 8080. With no other emulator owner active, start it in a separate credential-free shell:

```sh
firebase emulators:start --project demo-ifyoumind --only firestore
```

Then, from the clean repository root in a credential-free process:

```sh
GCLOUD_PROJECT=demo-ifyoumind FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
  node scripts/firestore-reliability.mjs --sha="$(git rev-parse HEAD)"
```

Expected current outcome: **nonzero, NO_QUALIFIED_CORRECTION**. Do not convert a known failure into success. Installs use `npm ci --ignore-scripts` in isolated ignored run directories with empty HOME; no `.env`/credential/config files are copied. Only allowlisted source/test/config and experiment locks are copied. Transport tools refuse production/remote endpoints and credential-bearing environments before loading the SDK. Synthetic subtrees are removed; no reservations or production locks are touched.

Each timestamped `test-results/firestore-reliability/runs/` directory retains JSON, Markdown and hashed raw logs, including failures, cancellations and timed-out commands. SHA, clean working tree, branch, source-byte digest and transient source events are checked before/after; changed source invalidates the run. Old experiments are not overwritten. Natural contention can fail on a different round or not recur within its fixed observation budget; a later natural pass cannot clear a strict recovery failure. No baseline is auto-approved.

## Official evidence reviewed

- [Firestore changelog](https://github.com/googleapis/google-cloud-node/blob/main/handwritten/firestore/CHANGELOG.md): reviewed through 9.4.1; no verified fix for this transaction mask.
- [GAX changelog](https://github.com/googleapis/google-cloud-node/blob/main/core/packages/gax/CHANGELOG.md): reviewed through 6.17.0; no verified qualifying fix.
- [Firebase Admin Node release notes](https://firebase.google.com/support/release-notes/admin/node): Admin 14 namespace removal and Node 22 migration explain the source compatibility failures.
- [Open upstream issue 9693](https://github.com/googleapis/google-cloud-node/issues/9693): same masking mechanism reported; not an official supported correction. No external comment or outreach sent.
- [Documented REST preference](https://firebase.google.com/docs/reference/admin/node/firebase-admin.firestore.firestoresettings) and [Firestore API](https://googleapis.dev/nodejs/firestore/latest/Firestore.html): public setting; onSnapshot can permanently switch back to gRPC. No application listener change attempted.
- [Emulator differences](https://firebase.google.com/docs/emulator-suite/connect_firestore#how_the_cloud_firestore_emulator_differs_from_production): emulator concurrency behavior does not prove production behavior.

Registry metadata, package engines and declared peer/dependency ranges were independently inspected; exact experiment locks make the tested combinations reproducible. Upgrading only GAX beyond the SDK-declared range was not treated as supported.

## Impact and next decision

| Surface | Assessment | Reason / evidence |
|---|---|---|
| Diagnostics, local tools, experiment fixtures, handoff | Change Required | Isolated observer, strict extended contracts, pinned graphs, machine report and source-integrity gate |
| City save / datasets / auth / quotas | Verify Only | Unchanged handlers exercised or existing coverage explicitly scoped; no correction qualified |
| Homepage, Discovery, Reports, saved UI, mobile/a11y | Not Affected | No product template, style, route, data engine or UI behavior changed; #119 visual evidence remains valid for its own head |
| Pricing, Stripe, entitlements, subscriptions, AI | Not Affected | No runtime or commercial config/source change; no live requests/data writes |
| Production infrastructure / #118 | Not Affected | No deployment, merge or branch modification |

Next investigation: prepare the compact synthetic reproducer for a **supported transaction-read-scoped upstream fix/backport** that preserves original aborts without changing ordinary-query semantics or deadlines. An upstream issue alone is not a solution. Requalify all business contracts only after that transport gate passes. A significant architectural alternative requires founder review before implementation; none is introduced here.

Release sequence stays **#118 → verified foundation deployment → reconciled #119 → separate exact-head authorization**. #111 eligible-workspace live retry, Linux individual actual/expected/diff review, physical iPhone/VoiceOver and unassisted comprehension remain outstanding. No authorization to release either branch follows from this investigation. Revenue benefit is reduced lost-save and repeated-attempt risk; no measured conversion or independent sale is claimed.
