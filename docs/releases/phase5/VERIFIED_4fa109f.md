# Local-first verification — PARTIAL

Candidate: `4fa109f5ba683e197efc781223225f0d1fca5407` · Branch: `codex/hosting-release-isolation`

Started: 2026-11-21T18:24:23.187Z · Finished: 2026-11-21T18:30:44.120Z

Source integrity: **VALID**. SHA, branch, clean status and source-byte fingerprint checked before/after; isolated tracked-source copy also checked.

Environment: darwin/arm64, Node v22.23.2, Java openjdk version "17.0.20.1" 2026-08-18, Playwright 1.56.0, browser 157.0.8103.80. Mode: native.

Tests: 594 passed / 0 failed / 14 skipped; 594 executed. Build/guard checks are counted separately.

| Check | Result | Test counts | Command |
| --- | --- | --- | --- |
| locked-dependencies | PASS | Check; no test count | `Compare installed direct dependencies to both lockfiles` |
| functions-build | PASS | Check; no test count | `npm --prefix functions run build` |
| fast-web | PASS | 173 pass / 0 fail / 0 skip | `npm run test:seo` |
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
| hosting-browser | PASS | 84 pass / 0 fail / 0 skip | `npm run test:discover` |
| authenticated-browser | PASS | 214 pass / 0 fail / 14 skip | `npm run test:e2e` |

## Limitations

- Installed Chrome fallback used; it is not the pinned Linux Playwright renderer. Functional browser checks remain useful; Linux pixel parity is not established.
- Linux-only visual cases are explicitly skipped on this native OS. Native screenshots do not approve Linux baselines.
- Native/container Node major differs from current hosted workflow Node 20 (Functions declares Node 22). Actual versions are recorded.
- Java differs from hosted Java 21; actual local emulator results are recorded, without claiming identical environment parity.

## Evidence

Machine-readable report: [report.json](VERIFIED_4fa109f.json). Raw logs, Playwright JSON and screenshot/actual/expected/diff/trace evidence stay in this ignored run directory. Evidence manifest records relative paths, sizes and SHA-256 hashes. Baselines were not updated.

This is a development gate, not merge/deployment authorization. Human experience review, #118 dependency, #111 live retry, physical devices and spoken assistive technology are separate.

## Risk-based scope

Level: **consumer**. Selected-check development status: **PASS**. Overall environmental/coverage status above remains separate. Production readiness: **NO-GO; no deployment authorization**.

Not executed at this level: functions-tests, firestore-rules, organizations, commerce-entitlements, fixtures-access, transaction-transport. These are not passes.

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

## Phase 5 artifact and evidence

[Compact machine-readable record](VERIFIED_4fa109f.json) retains all executed check outcomes, environment, exclusions, known failures and raw report digest. No transient traces or generated assets are committed. Full source: `4fa109f5ba683e197efc781223225f0d1fca5407`. This exact run is the evidence for the artifact; a later docs-only PR head is not falsely represented as a rerun.

Static package: `test-results/hosting-4fa109f`, 58 files / 2044304 bytes. Manifest SHA256 `ea2a96117cc4b4cac271696c5b2c2c37e4c7350d85592c5332f52eea70e7e97f`; isolated config SHA256 `a985fa400017d793640bd4c895435d0c8d4a302c183efcb7d50999794ce5dec0`. Preparation and independent re-hash validation passed. The config contains only Hosting, no hooks/dynamic rewrites; dedicated safety tests8 pass (also included in fast173). No deployment mode.

Initial CLI invocation supplied a mismatched SHA and was rejected as INVALID with zero tests. The actual candidate run above is clean/VALID; the rejected attempt remains in ignored evidence and is not called a pass.

No hosted CI success, production action, live retry, provider call, bill retention or customer/revenue outcome is claimed. Historical #120 and #121/#122 failures stay open; omitted backend suites have not passed in this consumer run.

Actual package commands (local-only, executed while exact4fa109f checkout was clean):

```sh
node scripts/prepare-hosting-release.mjs --expected-sha=4fa109f5ba683e197efc781223225f0d1fca5407 --run-dir=test-results/local-first/2026-11-21T18-24-22-773Z-4fa109f5 --out=test-results/hosting-4fa109f
node scripts/prepare-hosting-release.mjs --expected-sha=4fa109f5ba683e197efc781223225f0d1fca5407 --verify=test-results/hosting-4fa109f
```

Both exited0, source4fa109f, projectifyoumind-473fe,58 files, config digest above, releaseAuthorized:false. Preview readiness is separately recorded in [JSON](PREVIEW_READINESS.json); initial sandbox/expected-filename errors are retained there and did not modify product source.
