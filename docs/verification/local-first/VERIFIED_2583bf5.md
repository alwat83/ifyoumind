# Local-first verification — FAIL

Candidate: `2583bf5d4a31614b95f042a254e4c03c94bc9b1e` · Branch: `codex/midnight-slate`

Started: 2026-11-21T00:44:20.699Z · Finished: 2026-11-21T00:52:36.908Z

Source integrity: **VALID**. SHA, branch, clean status and source-byte fingerprint checked before/after; isolated tracked-source copy also checked.

Environment: darwin/arm64, Node v22.23.2, Java openjdk version "17.0.20.1" 2026-08-18, Playwright 1.56.0, browser 157.0.8103.80. Mode: native.

Tests: 684 passed / 3 failed / 15 skipped; 687 executed. Build/guard checks are counted separately.

| Check | Result | Test counts | Command |
| --- | --- | --- | --- |
| app-install | PASS | Check; no test count | `npm ci` |
| functions-install | PASS | Check; no test count | `npm --prefix functions ci` |
| locked-dependencies | PASS | Check; no test count | `Compare installed direct dependencies to both lockfiles` |
| functions-build | PASS | Check; no test count | `npm --prefix functions run build` |
| functions-tests | PASS | 72 pass / 0 fail / 0 skip | `npm --prefix functions test` |
| fast-web | PASS | 153 pass / 0 fail / 0 skip | `npm run test:seo` |
| production-build | PASS | Check; no test count | `npm run build` |
| production-bundle | PASS | Check; no test count | `npm run check:production-bundle` |
| production-isolation | PASS | Check; no test count | `node scripts/check-discovery-isolation.mjs --production` |
| local-build | PASS | Check; no test count | `npm run build:local` |
| discovery-build | PASS | Check; no test count | `npm run build:discovery` |
| electricity-build | PASS | Check; no test count | `npm run build:electricity` |
| unified-build | PASS | Check; no test count | `npm run build:unified` |
| discovery-isolation | PASS | Check; no test count | `node scripts/check-discovery-isolation.mjs --preview` |
| electricity-isolation | PASS | Check; no test count | `node scripts/check-discovery-isolation.mjs --electricity` |
| unified-isolation | PASS | Check; no test count | `node scripts/check-discovery-isolation.mjs --unified` |
| discovery-browser | PASS | 48 pass / 0 fail / 0 skip | `npm run test:discovery` |
| electricity-browser | PASS | 27 pass / 0 fail / 0 skip | `npm run test:electricity` |
| unified-browser | FAIL | 35 pass / 1 fail / 0 skip | `npm run test:unified` |
| hosting-browser | PASS | 84 pass / 0 fail / 0 skip | `npm run test:discover` |
| firestore-rules | PASS | 8 pass / 0 fail / 0 skip | `npm run test:rules` |
| organizations | PASS | 5 pass / 0 fail / 0 skip | `npm run test:organizations` |
| commerce-entitlements | FAIL | 47 pass / 1 fail / 0 skip | `npm run test:commerce` |
| fixtures-access | PASS | 24 pass / 0 fail / 1 skip | `npm run test:qa-integration` |
| authenticated-browser | FAIL | 181 pass / 1 fail / 14 skip | `npm run test:e2e` |

## Limitations

- Docker was requested but no usable local daemon is available. Native fallback executed; Docker path was not tested.
- Installed Chrome fallback used; it is not the pinned Linux Playwright renderer. Functional browser checks remain useful; Linux pixel parity is not established.
- Linux-only visual cases are explicitly skipped on this native OS. Native screenshots do not approve Linux baselines.
- Native/container Node major differs from current hosted workflow Node 20 (Functions declares Node 22). Actual versions are recorded.
- Java differs from hosted Java 21; actual local emulator results are recorded, without claiming identical environment parity.

## Evidence

Machine-readable report: [sanitized machine report](VERIFIED_2583bf5.json). Raw logs, Playwright JSON and screenshot/actual/expected/diff/trace evidence stay in this ignored run directory. Evidence manifest records relative paths, sizes and SHA-256 hashes. Baselines were not updated.

This is a development gate, not merge/deployment authorization. Human experience review, #118 dependency, #111 live retry, physical devices and spoken assistive technology are separate.


## Interpretation and follow-up

This preserved run tested **2583bf5d4a31614b95f042a254e4c03c94bc9b1e**, not a later documentation/fix commit. The final PR head is separately rerun and recorded in PR #119 and the Notion hub. No earlier run is represented as exact-head evidence for a moving branch.

Executed 25 checks: 22 passed, three failed, zero blocked. Test totals: **684 passed / 3 failed / 15 skipped**. Source SHA, branch, clean status, file fingerprints and isolated-copy digest matched before/after; zero source-change events and no watcher error. Both dependency installs passed in the isolated copy.

Failures retained:

1. **Standalone unified Discovery, mobile:** 35 passed / 1 failed. The second category action ended at 847.28 px in an 844 px viewport. The existing visibility assertion remains; the follow-up reduces only the local preview's narrow entry top spacing by 8 px. Public Discovery is unchanged.
2. **Commerce/entitlements:** 47 passed / 1 failed. Concurrent new-month city saves returned Firestore `INVALID_ARGUMENT: Transaction is invalid or closed`. This reproduces the earlier native-suite failure. Root cause is unresolved; no transaction, quota or backend assertion was changed and no automatic retry occurred.
3. **Authenticated browser:** 181 passed / 1 failed / 14 Linux-only skips. The mobile last-free-slot concurrent replay case received one failed response instead of four matching IDs. This is a real failed assertion, not a visual skip. Signup and offline recovery checks passed in this full run. The related #111 live retry gate remains unverified.

The other skip is the documented historical fixture. The Docker CLI is absent, so requested Docker verification fell back to native; Docker image execution and Linux visual comparisons were not performed. Native macOS/arm64 used Node 22.23.2, Java 17.0.20.1, Playwright 1.56.0 and installed Chrome 157.0.8103.80. These results do not establish Linux/Node20/Java21 environment parity.

Raw evidence remains ignored at `test-results/local-first/2026-11-21T00-44-20-279Z-2583bf5d/evidence/`; the JSON manifest records screenshot/trace/report hashes and paths without publishing their contents. Existing [desktop/mobile design captures](../../design/midnight-slate/screenshots/) are synthetic review references, not Linux baselines. No baseline was updated.

**Ready for supervised founder experience review of the connected prototype, not production release.** Local-first development can continue independently of GitHub billing. Before release: resolve/verify failed concurrency checks and the #111 gate, perform supported Linux actual/expected/diff review, observe unassisted first-use acceptance, reconcile separately approved #118 and obtain exact release authorization. Physical iPhone/Safari and spoken VoiceOver remain untested. No merge, deployment, billing change, provider request, real bill or customer outcome.
