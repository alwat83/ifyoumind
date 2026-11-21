# Local-first verification — FAIL

Candidate: `76b4ca20c7d7eb375068b6c74b69e63b33636fbd` · Branch: `codex/consumer-pricing-clarity`

Started: 2026-11-21T16:33:29.372Z · Finished: 2026-11-21T16:41:13.729Z

Source integrity: **VALID**. SHA, branch, clean status and source-byte fingerprint checked before/after; isolated tracked-source copy also checked.

Environment: darwin/arm64, Node v22.23.2, Java openjdk version "17.0.20.1" 2026-08-18, Playwright 1.56.0, browser 157.0.8103.80. Mode: native.

Tests: 738 passed / 3 failed / 15 skipped; 741 executed. Build/guard checks are counted separately.

| Check | Result | Test counts | Command |
| --- | --- | --- | --- |
| locked-dependencies | PASS | Check; no test count | `Compare installed direct dependencies to both lockfiles` |
| functions-build | PASS | Check; no test count | `npm --prefix functions run build` |
| functions-tests | PASS | 72 pass / 0 fail / 0 skip | `npm --prefix functions test` |
| fast-web | PASS | 159 pass / 0 fail / 0 skip | `npm run test:seo` |
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
| firestore-rules | PASS | 8 pass / 0 fail / 0 skip | `npm run test:rules` |
| organizations | PASS | 5 pass / 0 fail / 0 skip | `npm run test:organizations` |
| commerce-entitlements | FAIL | 47 pass / 1 fail / 0 skip | `npm run test:commerce` |
| fixtures-access | PASS | 24 pass / 0 fail / 1 skip | `npm run test:qa-integration` |
| authenticated-browser | PASS | 214 pass / 0 fail / 14 skip | `npm run test:e2e` |
| transaction-transport | FAIL | 2 pass / 2 fail / 0 skip | `npm run diagnose:transactions` |

## Limitations

- Installed Chrome fallback used; it is not the pinned Linux Playwright renderer. Functional browser checks remain useful; Linux pixel parity is not established.
- Linux-only visual cases are explicitly skipped on this native OS. Native screenshots do not approve Linux baselines.
- Native/container Node major differs from current hosted workflow Node 20 (Functions declares Node 22). Actual versions are recorded.
- Java differs from hosted Java 21; actual local emulator results are recorded, without claiming identical environment parity.

## Evidence

Machine-readable report: [VERIFIED_76b4ca2.json](VERIFIED_76b4ca2.json). Raw logs, Playwright JSON and screenshot/actual/expected/diff/trace evidence stay in the ignored run directory recorded in the machine report. Evidence manifest records relative paths, sizes and SHA-256 hashes. Baselines were not updated.

This is a development gate, not merge/deployment authorization. Human experience review, #118 dependency, #111 live retry, physical devices and spoken assistive technology are separate.

## Consumer pricing interpretation

[Draft #121](https://github.com/alwat83/ifyoumind/pull/121). Consumer UI is **GO for founder review**, not release. All 214 executed authenticated cases (including 10 new pricing cases), 84 Hosting, 159 fast, 72 Functions, rules 8, organizations 5 and fixture/access 24 pass. All production/local/standalone builds and isolation guards pass. Scoped pricing HTML/TypeScript ESLint passes separately.

Overall gate remains **FAIL**: commerce 47 pass/one UTC month-boundary save failure; strict transport 2 controls pass/two recovery failures. The month-save first wire error was not captured; do not assign it the natural probe's original error. No retry or failure is hidden. 15 skips are 14 Linux visual cases plus one existing fixture case. No hosted CI pass claimed.

The raw full report hash is `5a150cfa28a31bf1756ad16c9e203c509cb86006e332452c73f91605c3516d1c`. [Committed machine report](VERIFIED_76b4ca2.json) includes the artifact manifest and known failures; raw logs, tokens, traces and payloads stay ignored.

Actual before/after and all five pricing states were captured on 320/390/820/1440 with axe and keyboard checks. Physical devices, spoken VoiceOver, Linux pixels and human comprehension remain unverified. No baseline changed. Existing Angular bundle/style warnings remain; no new pricing style-budget warning.

The subsequent commit records only these evidence/handoff files. All tested executable bytes, dependencies, assertions and product captures remain unchanged. It is identified separately on the PR; the full failed gate is not rerun just to obtain a different result. No merge/deploy, billing/enrollment/AI change or production-data write.
