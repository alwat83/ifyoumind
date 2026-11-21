# Local-first verification — FAIL

Candidate: `d792381be1dbc86f5d70c37f3704ff0f29ba1bc4` · Branch: `codex/phase4-launch-readiness`

Started: 2026-11-21T17:15:35.878Z · Finished: 2026-11-21T17:20:55.154Z

Source integrity: **VALID**. SHA, branch, clean status and source-byte fingerprint checked before/after; isolated tracked-source copy also checked.

Environment: darwin/arm64, Node v22.23.2, Java openjdk version "17.0.20.1" 2026-08-18, Playwright 1.56.0, browser 157.0.8103.80. Mode: native.

Tests: 538 passed / 2 failed / 15 skipped; 540 executed. Build/guard checks are counted separately.

| Check | Result | Test counts | Command |
| --- | --- | --- | --- |
| locked-dependencies | PASS | Check; no test count | `Compare installed direct dependencies to both lockfiles` |
| functions-build | PASS | Check; no test count | `npm --prefix functions run build` |
| functions-tests | PASS | 72 pass / 0 fail / 0 skip | `npm --prefix functions test` |
| fast-web | PASS | 165 pass / 0 fail / 0 skip | `npm run test:seo` |
| local-build | PASS | Check; no test count | `npm run build:local` |
| firestore-rules | PASS | 8 pass / 0 fail / 0 skip | `npm run test:rules` |
| organizations | PASS | 5 pass / 0 fail / 0 skip | `npm run test:organizations` |
| commerce-entitlements | PASS | 48 pass / 0 fail / 0 skip | `npm run test:commerce` |
| fixtures-access | PASS | 24 pass / 0 fail / 1 skip | `npm run test:qa-integration` |
| authenticated-browser | PASS | 214 pass / 0 fail / 14 skip | `npm run test:e2e` |
| transaction-transport | FAIL | 2 pass / 2 fail / 0 skip | `npm run diagnose:transactions` |

## Limitations

- Installed Chrome fallback used; it is not the pinned Linux Playwright renderer. Functional browser checks remain useful; Linux pixel parity is not established.
- Linux-only visual cases are explicitly skipped on this native OS. Native screenshots do not approve Linux baselines.
- Native/container Node major differs from current hosted workflow Node 20 (Functions declares Node 22). Actual versions are recorded.
- Java differs from hosted Java 21; actual local emulator results are recorded, without claiming identical environment parity.

## Evidence

Machine-readable report: [VERIFIED_d792381.json](VERIFIED_d792381.json). Raw logs, Playwright JSON and screenshot/actual/expected/diff/trace evidence stay in the ignored run directory recorded in the machine report. Evidence manifest records relative paths, sizes and SHA-256 hashes. Baselines were not updated.

This is a development gate, not merge/deployment authorization. Human experience review, #118 dependency, #111 live retry, physical devices and spoken assistive technology are separate.

## Risk-based scope

Level: **backend**. Selected-check development status: **FAIL**. Overall environmental/coverage status above remains separate. Production readiness: **NO-GO; no deployment authorization**.

Not executed at this level: first-screen-concepts, production-build, production-bundle, production-isolation, discovery-build, electricity-build, unified-build, discovery-isolation, electricity-isolation, unified-isolation, discovery-browser, electricity-browser, unified-browser, hosting-browser. These are not passes.

Known unresolved findings (not cleared by this run):

- [transaction-read-abort](https://github.com/alwat83/ifyoumind/pull/120): Strict document and aggregate abort recovery fail; no qualified supported correction.
- [city-save-month-boundary](https://github.com/alwat83/ifyoumind/blob/76ece8d911f7cec1dd269da732478b66199c2f12/docs/design/consumer-pricing/VERIFIED_76b4ca2.md): Concurrent new-month save returned INTERNAL; original wire error not captured. A later pass cannot close this finding.
- [dataset-cap-intermittent](https://github.com/alwat83/ifyoumind/pull/119): Historical dataset-cap aggregate failure remains distinct; no supported correction verified.

Manual release gates:

- Founder experience review
- Applicable branch protections and independent source review
- Linux visual review where affected; device/assistive-technology gaps recorded
- #111 live retry and unresolved reliability findings
- Fresh deployment-specific identity, configuration, rollback and smoke evidence
- Explicit exact-scope founder merge/deployment authorization

## Phase 4 interpretation

[Draft #122](https://github.com/alwat83/ifyoumind/pull/122). Tested exact `d792381be1dbc86f5d70c37f3704ff0f29ba1bc4`, reviewed base `76ece8d911f7cec1dd269da732478b66199c2f12`. Sensitive runner changes correctly classify at backend level. Full default release plan remains byte-for-byte command-equivalent by regression test.

11 checks: ten PASS / one FAIL. 540 tests executed: **538 PASS / two FAIL / 15 SKIP**. Functions72, fast165, rules8, organizations5, commerce48, fixture/access24, authenticated214 pass; strict recovery two controls pass / two failures remain. New/original runner unit tests14 pass separately. Raw full report SHA-256: `2821479f83c2f7561c248161e05e63d046fa95caf6340ae64a52df67cf679d6f`.

The Consumer-level negative CLI probe returned INVALID and executed zero tests because the changed runner is sensitive. This is expected refusal, not an application regression or passing frontend certificate. Fourteen excluded full-plan checks remain NOT_RUN in the selected report; they are not passes. Physical/Linux/human gaps remain, and prior city/dataset failures are not cleared by this run.

No production/standalone/Hosting suite rerun was needed for unchanged product source in this tooling-only scope; historical consumer evidence is identified separately. No hosted run/CI pass is claimed. The subsequent commit records only evidence/handoff, without executable changes or a redundant rerun to seek a different outcome.
