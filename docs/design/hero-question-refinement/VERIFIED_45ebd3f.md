# Local-first verification — PARTIAL

Candidate: `45ebd3fab6e8d0864ff30db6b20eee81baaf8c31` · Branch: `codex/hero-question-wrap`

Started: 2026-11-21T19:10:42.008Z · Finished: 2026-11-21T19:16:12.380Z

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

Machine-readable report: [report.json](VERIFIED_45ebd3f.json). Raw logs, Playwright JSON and screenshot/actual/expected/diff/trace evidence stay in this ignored run directory. Evidence manifest records relative paths, sizes and SHA-256 hashes. Baselines were not updated.

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

## Narrow refinement evidence

Reviewed base `ade00b0c21c8e499a434ec8cf5581ef52984b829`. [Compact machine-readable record](VERIFIED_45ebd3f.json) retains environment, checks, NOT_RUN suites, known failures, source integrity and raw report digest. Generated traces/reports stay ignored; screenshots and capture metadata are in [review](REVIEW.md). Product changes only two homepage SCSS files. Browser regression retains every prior assertion, adds1280px and tests rendered orphan/empty-tail behavior. Four earlier targeted cases PASS; this full run independently includes those cases.

Both loaded Inter/Instrument Serif and existing QA font fallback were checked at320/390/820/1280/1440. Ten full-page before/after captures hide only the existing emulator banner. No Linux baseline update. Physical Safari/iPhone, spoken VoiceOver and human comprehension remain unverified. Existing backend findings stay open; sensitive suites omitted at Consumer level are not passes. No hosted CI, production action, provider generation, enrollment or commercial outcome claimed.

A later evidence/handoff-only head changes no executable bytes and is not represented as a rerun. The old #123 static release artifact predates this refinement; no new deployment artifact or release authorization is created here.
