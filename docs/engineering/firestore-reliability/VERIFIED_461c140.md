# Exact-head local qualification — NO_QUALIFIED_CORRECTION

[Draft PR #120](https://github.com/alwat83/ifyoumind/pull/120) · Tested commit `461c140d38bebad00b6a49788ea027207991320d` · Branch `codex/firestore-transaction-reliability`.

Started 2026-11-21T16:10:28.710Z; finished 2026-11-21T16:13:08.572Z. Node v22.23.2, macOS arm64, demo Firestore emulator 1.19.8. No production requests.

**Integrity VALID:** clean source before/after, identical digest `7967798bd6a57494495146463d6b5351f44dcf2bd565b7cece5228f9144df537`, zero source events, no watcher error. [Machine report](VERIFIED_461c140.json). Raw report SHA-256 `f9b28a267ad3423779c7d6972e9a30a7687a8c71e2b50e3b4d70202a83ba63a5`. Raw logs and full symbolic wire traces remain in the ignored run directory recorded in JSON.

Command:

```sh
GCLOUD_PROJECT=demo-ifyoumind FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/firestore-reliability.mjs --sha=461c140d38bebad00b6a49788ea027207991320d
```

17 checks: **9 PASS / 8 FAIL**. 172 TAP cases: **162 PASS / 9 FAIL / 1 CANCELLED / 0 SKIP**. The JSON aggregator combines failed + cancelled as 10 not-passed; it does not call cancellation a pass. Build and natural-probe failures are separate from TAP counts. Exit 1, no candidate qualified.

| Check | Exact outcome |
|---|---|
| harness-safety | PASS — 3 passed, 0 failed/cancelled |
| locked-install | PASS |
| locked-build | PASS |
| locked-unit | PASS — 72 passed, 0 failed/cancelled |
| locked-transport | FAIL — 2 passed, 2 failed/cancelled |
| admin13-install | PASS |
| admin13-build | PASS |
| admin13-unit | PASS — 72 passed, 0 failed/cancelled |
| admin13-transport | FAIL — 2 passed, 2 failed/cancelled |
| firestore8-install | PASS |
| firestore8-build | FAIL |
| firestore8-transport | FAIL — 2 passed, 2 failed/cancelled |
| current-install | PASS |
| current-build | FAIL |
| current-transport | FAIL — 2 passed, 2 failed/cancelled |
| rest-contracts | FAIL — 7 passed, 2 failed/cancelled |
| natural-locked | FAIL |

Fresh natural probe failed on round1: INTERNAL/success/resource-exhausted, durable count3. Symbol T4 aggregate read: code10 lock-timeout at2,419ms, code3 closed-ID at4,628ms and8,717ms. Application receives terminal INTERNAL. Provider requests0. This confirms the new mechanism, not the original historical wire error.

REST hanging-read test cancelled at25s; later teardown observation ECONNRESET at25,017ms, zero writes. Partial query throws premature-close error. No application transport change qualifies. Both Admin14 builds fail17 namespace-use diagnostics. Both compatible graphs pass72 Functions tests. Four strict gRPC graphs each pass2/fail2.

Full candidate business/HTTP-auth/browser qualification NOT RUN after prerequisite failures. Existing exact172dbaa full native result remains historical728 pass/3 fail/15 skip. No new hosted workflow run was listed for this head; GitHub Actions billing remains deferred, local evidence is not hosted CI.

Only evidence/handoff files are added after this tested source commit. Their commit is separately diff-checked and safety-tested; the full matrix is not redundantly rerun for documentation changes. No executable, application, dependency or assertion change follows this tested head. Production remains NO-GO. #118/#119 heads unchanged; release and device/human gates remain.
