# Local-first verification — FAIL

Candidate: `2cc49b5b0509fd79b72a575a0288fa15cde3ea19` · Branch: `codex/midnight-slate`

Started: 2026-11-21T04:43:58.875Z · Finished: 2026-11-21T04:52:09.346Z

Source integrity: **VALID**. SHA, branch, clean status and source-byte fingerprint checked before/after; isolated tracked-source copy also checked.

Environment: darwin/arm64, Node v22.23.2, Java openjdk version "17.0.20.1" 2026-08-18, Playwright 1.56.0, browser 157.0.8103.80. Mode: native.

Tests: 706 passed / 1 failed / 15 skipped; 707 executed. Build/guard checks are counted separately.

| Check | Result | Test counts | Command |
| --- | --- | --- | --- |
| app-install | PASS | Check; no test count | `npm ci` |
| functions-install | PASS | Check; no test count | `npm --prefix functions ci` |
| locked-dependencies | PASS | Check; no test count | `Compare installed direct dependencies to both lockfiles` |
| functions-build | PASS | Check; no test count | `npm --prefix functions run build` |
| functions-tests | PASS | 72 pass / 0 fail / 0 skip | `npm --prefix functions test` |
| fast-web | PASS | 157 pass / 0 fail / 0 skip | `npm run test:seo` |
| first-screen-concepts | PASS | 12 pass / 0 fail / 0 skip | `node scripts/review-first-seconds.mjs --check` |
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
| unified-browser | PASS | 36 pass / 0 fail / 0 skip | `npm run test:unified` |
| hosting-browser | FAIL | 83 pass / 1 fail / 0 skip | `npm run test:discover` |
| firestore-rules | PASS | 8 pass / 0 fail / 0 skip | `npm run test:rules` |
| organizations | PASS | 5 pass / 0 fail / 0 skip | `npm run test:organizations` |
| commerce-entitlements | PASS | 48 pass / 0 fail / 0 skip | `npm run test:commerce` |
| fixtures-access | PASS | 24 pass / 0 fail / 1 skip | `npm run test:qa-integration` |
| authenticated-browser | PASS | 186 pass / 0 fail / 14 skip | `npm run test:e2e` |

## Limitations

- Docker was requested but no usable local daemon is available. Native fallback executed; Docker path was not tested.
- Installed Chrome fallback used; it is not the pinned Linux Playwright renderer. Functional browser checks remain useful; Linux pixel parity is not established.
- Linux-only visual cases are explicitly skipped on this native OS. Native screenshots do not approve Linux baselines.
- Native/container Node major differs from current hosted workflow Node 20 (Functions declares Node 22). Actual versions are recorded.
- Java differs from hosted Java 21; actual local emulator results are recorded, without claiming identical environment parity.

## Evidence

Machine-readable report: [sanitized machine report](VERIFIED_2cc49b5.json). Raw logs, Playwright JSON and screenshot/actual/expected/diff/trace evidence stay in this ignored run directory. Evidence manifest records relative paths, sizes and SHA-256 hashes. Baselines were not updated.

This is a development gate, not merge/deployment authorization. Human experience review, #118 dependency, #111 live retry, physical devices and spoken assistive technology are separate.

## Preserved focus regression

This completed exact-head run preserved 706 passed / one failed / 15 skipped, with 25 checks passed, one failed, none blocked; source integrity valid and zero source-change events. All 186 authenticated browser, 48 commerce, 24 fixture/access, 8 rules, 5 organization, 72 Functions, 157 fast and standalone checks passed.

The single failure was the narrow Hosting category-switch keyboard assertion. After electricity was selected, production moved focus to the result region; the expected selected-button focus was lost. This is an interaction regression, not a waived assertion or an environment-only failure. Keep first reveal focus on the newly visible result, but retain the selected control when replacing an already-visible answer, canceling any prior pending movement. The strict existing assertion is preserved and additionally checked after two animation frames to detect queued focus movement. No arithmetic, privacy, business logic, layout, backend or concurrency change.

The preceding dataset-cap fixture and city-save intermittency did not reproduce in this run; that does not establish a fix or waive #111's live gate. The resulting correction is independently verified at the next exact PR head. Linux, physical-device and spoken screen-reader limitations remain.

Follow-up checkpoint: all three affected desktop/mobile/narrow Hosting cases passed with the additional post-paint focus assertion; production build and scoped TS/HTML lint passed. The final exact-head full result is recorded on #119.
