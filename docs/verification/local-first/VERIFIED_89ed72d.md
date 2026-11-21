# Local-first verification — FAIL

Candidate: `89ed72d7d612b621c48b80b70cb60c067ae41706` · Branch: `codex/midnight-slate`

Started: 2026-11-21T04:23:17.656Z · Finished: 2026-11-21T04:32:29.671Z

Source integrity: **VALID**. SHA, branch, clean status and source-byte fingerprint checked before/after; isolated tracked-source copy also checked.

Environment: darwin/arm64, Node v22.23.2, Java openjdk version "17.0.20.1" 2026-08-18, Playwright 1.56.0, browser 157.0.8103.80. Mode: native.

Tests: 695 passed / 12 failed / 15 skipped; 707 executed. Build/guard checks are counted separately.

| Check | Result | Test counts | Command |
| --- | --- | --- | --- |
| app-install | PASS | Check; no test count | `npm ci` |
| functions-install | PASS | Check; no test count | `npm --prefix functions ci` |
| locked-dependencies | PASS | Check; no test count | `Compare installed direct dependencies to both lockfiles` |
| functions-build | PASS | Check; no test count | `npm --prefix functions run build` |
| functions-tests | PASS | 72 pass / 0 fail / 0 skip | `npm --prefix functions test` |
| fast-web | FAIL | 156 pass / 1 fail / 0 skip | `npm run test:seo` |
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
| hosting-browser | FAIL | 78 pass / 6 fail / 0 skip | `npm run test:discover` |
| firestore-rules | PASS | 8 pass / 0 fail / 0 skip | `npm run test:rules` |
| organizations | PASS | 5 pass / 0 fail / 0 skip | `npm run test:organizations` |
| commerce-entitlements | PASS | 48 pass / 0 fail / 0 skip | `npm run test:commerce` |
| fixtures-access | FAIL | 23 pass / 1 fail / 1 skip | `npm run test:qa-integration` |
| authenticated-browser | FAIL | 182 pass / 4 fail / 14 skip | `npm run test:e2e` |

## Limitations

- Docker was requested but no usable local daemon is available. Native fallback executed; Docker path was not tested.
- Installed Chrome fallback used; it is not the pinned Linux Playwright renderer. Functional browser checks remain useful; Linux pixel parity is not established.
- Linux-only visual cases are explicitly skipped on this native OS. Native screenshots do not approve Linux baselines.
- Native/container Node major differs from current hosted workflow Node 20 (Functions declares Node 22). Actual versions are recorded.
- Java differs from hosted Java 21; actual local emulator results are recorded, without claiming identical environment parity.

## Evidence

Machine-readable report: [sanitized machine report](VERIFIED_89ed72d.json). Raw logs, Playwright JSON and screenshot/actual/expected/diff/trace evidence stay in this ignored run directory. Evidence manifest records relative paths, sizes and SHA-256 hashes. Baselines were not updated.

This is a development gate, not merge/deployment authorization. Human experience review, #118 dependency, #111 live retry, physical devices and spoken assistive technology are separate.


## Preserved failure assessment

This exact-head result belongs to `89ed72d7d612b621c48b80b70cb60c067ae41706`, before the post-render/readiness corrections. **695 pass / 12 fail / 15 skip**, 22 checks pass / four fail / zero blocked; source integrity valid, zero change events.

- Fast web: 156 pass / one stale old-promise copy assertion. Updated the approved copy expectation while retaining provenance and no-fabricated-AI checks.
- Hosting: 78 pass / six keyboard failures across projects. The new reveal needed a render-ready wait before directly focusing its previously hidden summary; forced-color focus checks also needed genuine keyboard modality after the new pointer action. Moved production focus to Angular's installed `afterNextRender` write phase, retained stale-focus/destroy guards, and retained strict focus/outline assertions with proper readiness. All six affected native keyboard cases subsequently passed.
- Authenticated: 182 pass / four failures / 14 Linux visual skips. Compact desktop navigation now uses the existing menu; the saved-decision shortcut should be used directly rather than opening a duplicate same-destination menu item. Two provenance checks still expected the finding before the now-approved reveal. Updated interaction steps while retaining exact auth paths, saved reopening and synthetic-evidence assertions.
- Fixtures/access: 23 pass / one failed parallel dataset-cap case / one historical skip. `INVALID_ARGUMENT: Transaction is invalid or closed` arose in `writeWithinCap`/`universal-limits` aggregate-query path. This is distinct from the previously observed city-save failures, although the error family is similar. Root cause and production relevance are unverified. Backend, error-classification, concurrency and cap assertions are unchanged.

Commerce (48) and all other builds, guards, rules, organizations, Functions and standalone suites passed in this run. Follow-up native fast checks: 157 passed; scoped lint passed. No failed result is erased or counted as passing. The resulting head is independently verified and recorded in PR #119 and Notion. No automatic retry, baseline update, production operation, provider generation or commercial change.
