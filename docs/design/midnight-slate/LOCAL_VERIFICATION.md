# Midnight Slate — local verification evidence

Observed November 20, 2026 · OpenAI / Codex · draft #119. UI source checkpoint `1f800024f50650b81e6a656f648b12ed50bb27a5`. The final follow-up corrects Ask/advanced action contrast and capability wording, extends route accessibility coverage, and updates regression-harness readiness, screenshots and documentation. No production changes or customer data. Results below are newly executed local checks, not GitHub CI or user outcomes.

| Check | Observed result | Limits / correction |
| --- | --- | --- |
| Production build `npm run build` | PASS | Initial 693.28 kB raw / 185.14 kB estimated transfer. Stylesheet warning budgets exceeded; hard budgets passed. |
| Emulator app `npm run build:local` | PASS | Uses demo project only. |
| Production, island and three standalone guards | PASS | Production guard examined 40 files; island has three allowlisted assets, excludes app imports/provider endpoints; existing tax/electricity/unified standalone builds and isolation guards pass. |
| Fast web `node scripts/web-tests.js` | 146 pass | Includes provenance and truthful illustrative social template tests. |
| Functions `npm --prefix functions test` | 72 pass | No backend diff in this design. |
| Full local Hosting `QA_BROWSER_CHANNEL=chrome npm run test:discover` | 84 pass | Desktop, mobile, 320 px; final finding-placement assertions retained. |
| Focused finding and qualified-answer rerun | 9 pass | Tax/electricity on desktop, 390 and 320 px. |
| Final secondary-route/return/report checks | 6 pass | Extends dark-palette, overflow and axe coverage to data, Ask and advanced routes after the action-label correction. |
| Targeted connected/visual/a11y browser suite | 32 pass | Earlier 25 pass / 7 fail exposed genuine inline-link contrast distinction and test timing; corrected. |
| Complete authenticated browser suite | 179 pass / 3 fail / 14 skip | Linux-only visual cases intentionally skipped on macOS; these are not visual passes. |
| Affected signup/offline checks, 3 repeats × desktop/mobile | 12 pass | After explicit form/value readiness and exact expected-offline console allowance. Not a rerun of the full suite. |
| Commerce `npm run test:commerce` | 47 pass / 1 fail | Emulator `Transaction is invalid or closed` during unchanged concurrent month-boundary case. |
| Same commerce case in fresh emulator | 1 pass, unchanged | No backend or quota/concurrency assertion changed. Clean complete commerce CI still required. |
| Firestore `npm run test:rules` | 8 pass | Internal/tenant boundaries preserved. |
| Organizations `npm run test:organizations` | 5 pass | Local auth and Firestore only. |
| Fixtures/access `npm run test:qa-integration` | 24 pass / 1 skip | Historical fixture skipped; not represented as tested. |
| Final after screenshot capture | 40 captures, zero overflow | 10 complete routes × 1280/820/390/320 px; before set is unchanged #118. Additional desktop/mobile own-input, expanded-evidence and six account-dataset/Ask/advanced captures. |
| Editorial exports | 6 PNG + HTML, zero overflow | Synthetic tax/electricity, square/portrait/story; no publication. |

## Commands and interpretation

Use the lockfiles and existing package scripts. Local browser runs set `QA_BROWSER_CHANNEL=chrome` because the pinned Linux Playwright renderer is not installed locally. Linux pixel comparisons must use the reviewed CI renderer. No baseline files were updated in this redesign.

```sh
npm run build
npm run build:local
npm run check:production-bundle
npm run build:discovery
npm run build:electricity
npm run build:unified
npm run check:discovery-isolation
node scripts/check-discovery-isolation.mjs --electricity
node scripts/check-discovery-isolation.mjs --unified
node scripts/web-tests.js
npm --prefix functions test
QA_BROWSER_CHANNEL=chrome npm run test:discover
QA_PORT=4309 QA_BROWSER_CHANNEL=chrome npm run test:e2e
npm run test:commerce
npm run test:rules
npm run test:organizations
npm run test:qa-integration
QA_BROWSER_CHANNEL=chrome node scripts/render-midnight-social.mjs --png
```

Targeted browser command uses `firebase emulators:exec --project demo-ifyoumind --only auth,firestore,functions` and Playwright config `e2e/playwright.config.mjs`, `--workers=1`, with `connected-journey`, `midnight-experience`, `layout-a11y` and `sample-report-mobile` specs. Affected reruns select the city signup and losing-connection cases and use `--repeat-each=3`. Existing auth verification, intent return, offline recovery and request-count assertions remain.

The empty Name observed once in the full sweep was not conclusively traced to a runtime cause. The design changes no signup logic. Explicit readiness and entered-value checks prevent the test from treating an empty submission as a successful setup. Two other failures were expected Chrome `ERR_INTERNET_DISCONNECTED` console diagnostics during deliberately offline recovery; the allowance is scoped to that one test and exact error. Offline UI/retry assertions remain.

The commerce fresh-emulator rerun was:

```sh
node node_modules/firebase-tools/lib/bin/firebase.js emulators:exec \
  --project demo-ifyoumind --only firestore \
  "node --test --test-concurrency=1 --test-name-pattern='replaying a city save across the UTC month boundary' test/subscriptions.integration.test.mjs"
```

A guard invocation initially lacked the standalone preview build and stopped with ENOENT after its production/island checks passed; all three existing standalone entries were then built and their guards passed. An initial sandbox emulator invocation could not bind its port and executed no tests. The permitted local-emulator retry above passed. Demo Functions emit denied Secret Manager lookup warnings for the demo project; no secret was returned. No production fixture, transaction, provider request or report entitlement was created.

## Exact-head CI blocker

At UI checkpoint `1f800024…`, [Launch 44835415458](https://github.com/alwat83/ifyoumind/actions/runs/44835415458) and [Authenticated QA 44835419791](https://github.com/alwat83/ifyoumind/actions/runs/44835419791) both failed before any job step. Independent annotations on check runs `136630458892` and `136630471990` state:

> The job was not started because your account is locked due to a billing issue.

There are no executed job steps or product-test logs. This is an external execution blocker, not evidence of a failing product assertion or passing tests. Final exact-head attempts are recorded on [PR #119](https://github.com/alwat83/ifyoumind/pull/119/checks). Account billing was not changed. No extra runner/service or bypass was introduced. Launch adds only a manual trigger for the stacked branch; deployment workflows are unchanged.

After account restoration, run both workflows on the final head. Inspect each changed Linux expected/actual/diff and adopt only explicitly reviewed references. No bulk acceptance and no CI baseline regeneration. Rerun the required full suites on that head. A green #118 run does not verify this design.

## Untested and release recommendation

Physical iPhone/Safari, spoken VoiceOver, native print-device behavior and actual human first-use comprehension are untested. Automated keyboard, axe, reduced-motion and responsive checks do not substitute for them. The strict two-statement CSV format remains a material first-use constraint; PDFs and arbitrary bills are unsupported.

**GO for founder prototype review; NO-GO for production.** Required: clean exact-head CI, individual Linux visual review, unassisted five-task acceptance, foundation reconciliation and separately authorized release scope. The #111 live retry remains unverified. #118 was not modified, #95/#101 pilots remain isolated, and #96 AI remains staging-disabled. No new business outcomes were measured.
