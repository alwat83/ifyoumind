# ifYouMind integrated release candidate — founder approval package

Prepared 2026-10-22 by OpenAI / Codex. **DRAFT / NOT APPROVED / NOT DEPLOYED.**

[Draft integrated PR #60](https://github.com/alwat83/ifyoumind/pull/60).

Application and test snapshot: **`2c4a6f5490576a449c0873eb95653a222c1f8901`** on `codex/release-consumer-seo-20261022`, based on `bb6744b330378e63506cb90334098e6dfe2b86ff`. Later evidence-only commits are identified by the draft PR head. [Machine-readable manifest](candidate-manifest.json) pins source-to-release commits and SHA-256 checksums for all 39 local production Hosting files.

## Decision and scope

Review one integrated candidate for the consumer homepage, report mobile layout, permanent reporting protocol, technical SEO, and three source-cited decision guides. Business remains available now at **$79 per Decision Report / $39 per month Pro**. Life examples remain informational; Life and flexible uploaded-data tools are explicitly in development. PR #55 and its experimental calculator are excluded; `/life/quick-compare` returns HTTP 404.

No source PR has founder release approval recorded. Combining candidate commits is preparation for review, not approval to merge or publish. No master changes, production deployment, Stripe changes, customer data migration or paid transaction occurred.

## Source heads and dependencies

| PR | Exact source head | Exact-head result |
|---|---|---|
| [#49](https://github.com/alwat83/ifyoumind/pull/49) | `8f6f935c734f740a12f192a2de1e7bf99083389f` | Build + emulator QA SUCCESS |
| [#54](https://github.com/alwat83/ifyoumind/pull/54) | `738f7c2540978d6f06c9d66280221de3b3440c53` | Build + emulator QA SUCCESS |
| [#57](https://github.com/alwat83/ifyoumind/pull/57) | `45aaf911f2f6ed232c4f3d5cb0b86b01bf65fba2` | Build + emulator QA SUCCESS |
| [#58](https://github.com/alwat83/ifyoumind/pull/58) | `9c17a6195ed20a0d6a5fc3f1858094a443df6563` | Build + emulator QA SUCCESS |
| [#59](https://github.com/alwat83/ifyoumind/pull/59) | `a96d37447c2e4549106d9d22116feea21d058a89` | Manual emulator QA SUCCESS; stacked base has no master-only build check |

[Check URLs and mergeability](source-pr-ci.json), [#59 manual check](guides-manual-ci.json). All five were MERGEABLE at observation. #59 depends on #58; their changes appear once in this candidate. Started from #57 and cherry-picked #49 → #54 → #58 → #59 with source attribution. **No textual conflicts**. Browser and Hosting checks validate the combined behavior. Do not separately merge overlapping source PRs after an integrated release.

## Verification and limits

[Integrated exact application/test commit CI](application-commit-ci.json): [build SUCCESS](https://github.com/alwat83/ifyoumind/actions/runs/39828622077) and [complete emulator QA SUCCESS](https://github.com/alwat83/ifyoumind/actions/runs/39828622050) on `2c4a6f5490576a449c0873eb95653a222c1f8901`. Evidence-only follow-up head must independently pass PR checks.

- Production build, local build, and production bundle guard: PASS. No emulator project in the production bundle.
- Fast web/unit checks: **87/87 PASS**. Functions unit checks: **72/72 PASS**.
- Fresh emulator checks: rules **7/7**, organizations **5/5**, commerce/entitlements **29/29**, fixtures/limits **24 PASS / 1 intentional SKIP / 0 failures**. The skipped historical server verification test is supplemented by browser verification-gate checks; a skip is not a pass.
- Full desktop/mobile browser suite: **92/92 PASS; clean process exit 0, zero fixture accounts remaining**. Viewports 1280×800 and 390×844, plus 320px overflow checks. Includes registration/verification, return URLs, free brief creation, saved report retrieval, tenant isolation, limits, pricing, keyboard links, guides and report layouts.
- New paid-report UI coverage intercepts a purchased-report response to exercise full rendering, copy, print invocation and print CSS. Backend commerce tests separately verify entitlements/webhooks using intercepted Stripe REST calls. New browser checkout contracts intercept both the callable response and destination, asserting offer/report identity and navigation. **No real checkout, charge, subscription or rendered PDF export was performed.** Existing purchases/PDFs remain founder-confirmed working capabilities; this is regression evidence, not a new live-payment claim.
- Actual Firebase Hosting emulator serving the production build: **56 raw/rendered observations PASS**, 9 unique sitemap URLs, robots, JSON-LD, canonical redirects, private noindex and real missing/Life 404 responses. [Audit evidence](seo-audit.json). External calls were blocked; sample-report body checks use the separate emulator browser suite.
- Scoped TS/HTML lint: PASS. **Full lint FAILS with 91 pre-existing errors; default Angular tests FAIL compilation with 11 legacy errors** (missing old components, stale AppComponent expectation, profile and Firestore mock types). These are verified baseline limitations, not green checks or new application regressions. No unrelated legacy rewrite was attempted.
- Production build warnings: initial bundle **653.49 kB** versus 500 kB warning threshold; report/homepage CSS about 7.97/7.98 kB versus 4 kB warning thresholds; existing data-canvas/consumer-home CSS warnings. Build error budgets pass. Performance optimization is a recommendation; no field CWV results are available.
- No manual screen-reader, physical-device/iOS/Safari, field CWV, Google rich-result eligibility, organic traffic lift or post-deploy verification claimed. Automated WCAG checks do not establish complete accessibility conformance.

The first all-in-one runner exposed cross-suite emulator state; it now resets only the guarded demo Auth/Firestore state between stages. An earlier browser attempt had two long timeouts and a stopped process left a server port open. Those attempts are retained as failures, not counted as passes; the final clean-server result above is the acceptance run. All 92 cases passed after restarting on a fresh port; zero QA fixture accounts remain. Worker shutdown was delayed but completed normally; the final run exited 0 in 6.8 minutes. [JUnit report](browser-junit.xml): 92 tests, zero failures/errors/skips. See [per-case results](browser-case-results.json) and the integrated PR checks. The global sample seed now prevents the homepage test from requesting unseeded Census data.

## Founder visual review

Screenshots are captured from the integrated candidate with local deterministic Census fixtures. Review both first screen and full page before approving; examples are QA data, not customer metrics. 22 screenshots committed under [screenshots/](screenshots/). Representative homepage, sample and pricing views were visually inspected. The emulator-only warning banner in report/pricing captures is absent from production.

| View | Mobile | Desktop |
|---|---|---|
| Homepage first screen | [mobile](screenshots/mobile-homepage-fold.png) | [desktop](screenshots/desktop-homepage-fold.png) |
| Homepage full page | [mobile](screenshots/mobile-homepage-full.png) | [desktop](screenshots/desktop-homepage-full.png) |
| Sample report first screen | [mobile](screenshots/mobile-sample-report-fold.png) | [desktop](screenshots/desktop-sample-report-fold.png) |
| Guide index | [mobile](screenshots/mobile-guides-full.png) | [desktop](screenshots/desktop-guides-full.png) |
| Pricing | [mobile](screenshots/mobile-pricing-report.png) | [desktop](screenshots/desktop-pricing-report.png) |

Guide captures: [job offers/relocation](screenshots/mobile-compare-job-offers-relocation.png), [business locations](screenshots/mobile-choose-business-location-evidence.png), [own-data comparison](screenshots/mobile-compare-options-with-your-own-data.png).

## Deployment order — only after explicit founder approval

1. Confirm the reviewed draft PR's exact final head, source heads and green integrated build/QA checks still match. Decide explicitly whether to accept the disclosed existing global lint/spec debt. Review homepage/product claims, guide editorial dates and mobile screenshots. Hold #55/#51/#52 calculations separately.
2. Authorize a **single integrated release** rather than deploying intermediate source PRs. Before any merge, verify the production environment protection and intended source SHA: `.github/workflows/firebase-production.yml` automatically deploys on pushes to master. It deploys Hosting, Firestore rules/indexes, Storage rules and an explicit Functions allowlist. Those backend/rule/workflow files are unchanged here, but the workflow still redeploys them. No dispatch or merge is authorized by this document.
3. After authorized deployment succeeds, record the actual GitHub run and Firebase Hosting revision, then verify live homepage/sample/guides at mobile and desktop widths, redirects/404, raw/rendered metadata, registration intent and Business pricing. Use read-only checks first; any live paid transaction needs separate founder authorization. Monitor customer-facing errors and existing funnel metrics under current consent rules. Do not claim publication until verified.

## Rollback

The last successful production workflow observed is [38663118271](https://github.com/alwat83/ifyoumind/actions/runs/38663118271), source **`bb6744b330378e63506cb90334098e6dfe2b86ff`** (2026-10-15). This is verified deployment-workflow evidence; the current live Firebase Hosting revision was not independently inspected. Before release, record the actual prior Hosting version/release so rollback can target it.

If the authorized release regresses, stop further release steps and obtain founder rollback authorization. Prefer reverting the single future squash/merge commit via a reviewed rollback PR, rerunning build/guard/tests, then deploying through the existing authorized workflow. Record the actual future release commit; do not guess a revert SHA or reset master. The baseline source above is the recovery reference. Revert Hosting routing/config and generated metadata artifacts **together**; partial SEO rollback can break deep links or private noindex behavior. No data migration or Stripe configuration rollback is required by this candidate. Production rollback itself remains an approval-gated action.

## Open risks and next assignment

Release gate: explicit founder approval and final integrated CI. Existing global lint/spec failures must remain visible. Search Console has no accessible ifYouMind site and no analytics property is selected; indexing, impressions, clicks, conversion and field performance baselines remain unmeasured. Full Angular-body SSR and a www-to-apex redirect remain recommendations, not verified fixes; public static guides already carry complete HTML.

Next highest-value assignment: obtain/select the correct ifYouMind Search Console and analytics properties and establish consent-respecting acquisition/conversion baselines for the approved guide landing pages. Keep issue #56 open through measurement and authorized live verification. No issues closed by this release preparation.
