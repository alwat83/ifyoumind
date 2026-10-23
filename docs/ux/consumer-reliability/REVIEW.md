# Consumer experience reliability — founder review

October23,2026 CDT. Candidate on `codex/consumer-sample-recovery`; application commit `ebf780a51d13cb20ce7726cf2ec350f335fc961e`. **Development only; not merged or deployed.** Production remains `1f09e6e0ad5b184cf6d4ac151bd361d53fa56e79`. Outbound distribution remains **Pending Founder Setup**; no account details requested or communications sent.

## Problem and resulting behavior

A locally simulated failure of the public sample callable displayed only `INTERNAL`. Visitors had no in-page retry or useful explanation. The candidate provides a plain-language error, keyboard-operable **Try again**, loading announcement, offline/timeout guidance and a free-guide/homepage alternative. Successful retry focuses the report heading. The sample remains public and never requires registration or purchase to recover.

The request path is `/sample-report` → `MarketReportComponent` sample mode → `MarketIntelligenceService.sample()` → existing read-only `getSampleDecisionReport`. Backend behavior/data/permissions are unchanged. Original errors are retained in developer console diagnostics with code/stack, not shown to visitors. Authenticated report errors/entitlements/checkout behavior are unchanged.

A 20-second client/SDK deadline ends indefinite loading. Only explicit user retries; duplicate activation while pending is guarded and focus remains on the button. Offline events release a pending UI; reconnecting does not automatically send another request. Late results/rejections are observed and cannot overwrite a later attempt. Navigation destroys/cancels the UI wait. The unloaded-state introduction stays compact; the full sample notice returns with the loaded report. A UI cancellation does not cancel work already executing on the server; this endpoint is read-only. There is no cached/fabricated fallback report, automatic retry loop, new dependency or data collection.

## Reproduce and review

1. Build/run the local demo app using the repository emulator QA workflow. Seed sample Census fixtures; never use production credentials.
2. Intercept the first `getSampleDecisionReport` response with HTTP503 and callable `{error:{message:'INTERNAL',status:'INTERNAL'}}`.
3. Open `/sample-report`: helpful text, original navigation, free-guide/homepage links, one h1 and a Try again button remain. No report statistics are invented.
4. Release the interception and activate Try again using Enter/Space: actual emulator callable loads the report; focus moves to its heading and sources remain visible.
5. Keep returning503: repeated failure remains understandable and offers alternatives. No automatic requests.
6. Hold the response beyond20seconds, or go offline during loading: bounded timeout/offline guidance appears. Offline retry sends no request; online explicit retry recovers.

Automated repro: `e2e/specs/sample-recovery.spec.mjs`. Local captures after the change use demo emulators and seeded sample figures that mirror the production example; the emulator banner is intentional. They are UI evidence, not fresh Census retrieval or commercial activity. The before image is a production page with a synthetic browser-local failure, not an observed outage.

## First-time consumer journey — observations and limits

Homepage headline, explanation, exploration/sample CTAs and four decisions are present in the checked desktop/mobile first screens. Native keyboard controls open real guides or existing Business registration. Upcoming personal calculations/uploads remain labeled in development; arbitrary AI answers are not advertised. The guide/sample/source/next-action/registration/pricing/print journeys are covered by existing and new browser regressions. No other reproducible product defect was identified in this review; no speculative layout changes made.

This is an engineering/heuristic review, **not a measured five-second comprehension study**. No outside participant, first-user feedback or conversion result is claimed. A brief comprehension/usefulness observation with real users remains a later learning activity after communications are separately reopened. It is not a development blocker.

Accessibility: persistent polite loading status, dynamically inserted error alert, semantic headings/links, focus-visible styling, ≥44px new recovery controls, retained keyboard focus while retrying and heading focus after success. Automated WCAG2/2.1A/AA and keyboard checks do not prove spoken announcements on every screen reader. Physical iOS/Safari, manual VoiceOver/NVDA, field Core Web Vitals, native PDF export and real payment remain unverified.

## Commercial and release scope

Existing $79 one-time Decision Report and $39/month Pro with five included reports, free brief, registration intent, saved reports, print and intercepted checkout contracts remain in scope for regression. No Stripe configuration, prices, live account creation/payment, analytics platform, Life calculator, upload feature, paid service or outreach change.

This feature branch descends from the preserved docs-only #67 head `7ef80a3e1a3242f8c636c207e16f99813aef045c`. A master-target candidate includes that shared public instruction/handoff/production-evidence history once, plus this focused recovery change. #67 stays open unchanged; do not later merge overlapping history blindly. Research #63/prospect details/private drafts are excluded. No other source PR is merged.

Founder approval is required before merging this exact final candidate SHA into master and its automatic production deployment. Refresh exact-head build/QA, mergeability, scope and current Hosting rollback target first. A previous #66 approval does not authorize this release. Production workflow can redeploy Hosting/rules/indexes/Storage/Functions although this change modifies no backend/rules source. No execution authorization requested for outbound or Stripe.

Rollback, if separately approved: restore the independently verified currently deployed Hosting version (last recorded `e0c9142f16a5e741`, re-read before any release) and revert the recovery application commit through a reviewed PR. Hosting restoration does not roll back Functions/rules or the master source branch. No rollback performed and no claim that the old version remains the latest Hosting revision without a fresh read.

Verification counts, screenshots and final PR/CI links are recorded below after completion. Global lint/Angular failures must remain explicit; no green CI waiver or customer outcome is implied.


## Verified results — applicationebf780a

| Check | Result |
|---|---|
| Production and local Angular builds; production bundle guard | PASS; no emulator config/QA fixtures in production bundle |
| Fast suite including request-state unit tests | 95PASS0FAIL; eight new loading/error/deadline/cancellation tests |
| Functions unit tests | 72PASS0FAIL |
| Firestore rules / organizations / commerce integration | 7/5/29PASS, zero failures, fresh emulator sessions |
| QA fixtures / access / limits integration | 24PASS, one existing intentional server-verification SKIP, zero failures |
| Complete browser suite | **112PASS0FAIL0SKIP**, desktop/mobile, two workers; includes14 new recovery cases |
| Accessibility | Zero automatic WCAG2/2.1A/AA violations in checked error/persistent-error/recovered sample and existing homepage/guide/report scopes; keyboard focus/loading/error semantics checked |
| Actual local production Hosting SEO | 56 raw/rendered observations, nine sitemap URLs, metadata/schema/robots/redirects/private noindex/missing+Life404 PASS; external browser requests blocked |
| New/changed component/helper lint | PASS; callable service retains seven existing array-type errors, unchanged in global comparison |
| Global lint | **FAIL91**, identical path/rule/message multiset to recorded clean-production baseline; zero new or removed error signatures |
| Global Angular test command | **FAIL before test execution:11 compiler diagnostics**, identical baseline diagnostic multiset; zero new. Related bundler/Karma load errors are not additional executed tests |

The generic build/style budget warnings remain; market-report stylesheet warning7.97kB, below8kB error limit. No budget relaxed. Human five-second comprehension, manual screen-reader speech, physical devices/Safari, live signup-email/paid fulfillment/real payment and field performance remain unverified.

Earlier attempts are not hidden: sandboxed local build aborted before build completion and succeeded outside sandbox; initial full browser run109PASS/3FAIL exposed two harness issues (hard navigation aborted a callable in an older navigation-only test, and a hidden empty status queried by accessible role in two viewport cases). Trace confirmed ERR_ABORTED; the existing navigation test now waits for the actual sample answer, and offline assertion inspects the persistent status node. No general error suppression added; real diagnostic preservation is asserted. Corrected pre-compact full run112PASS. The final compact revision subsequently passed14focused cases; a one-worker final rerun completed56desktop cases then stalled between projects and was stopped (incomplete, not a pass). The final two-worker local run completed112PASS0FAIL0SKIP (2.2minutes), with clean fixture teardown and emulator shutdown; final exact-head CI is recorded separately after push. A combined integration session64PASS/1FAIL/1SKIP retained commerce admin configuration that a later suite requires absent; documented isolated commands then65PASS/1SKIP. One npm wrapper rejected a worker flag before browser execution; corrected explicit command used. The first temporary Hosting config served no build (invalid audit); config-relative build path and homepage200 precheck fixed the harness, then all56 observations passed. A new 320×568 assertion then measured the first compact repeated-error layout at596.97px to the bottom of Try again (below the568px screen). A shorter heading and mobile spacing fixed this verified first-screen issue; the final focused14cases passed; Try again bottom563.08px, within568px, overflow0. No production incident or skipped failure inferred from these attempts.

## Screenshots

| State | Mobile | Desktop |
|---|---|---|
| Before, synthetic failure | [Raw technical error](screenshots/before-mobile-error.png) | — |
| After, recoverable failure | [390px](screenshots/mobile-sample-error.png) | [1280px](screenshots/desktop-sample-error.png) |
| Repeated failure | [320px](screenshots/mobile-sample-persistent-error.png) | [1280px](screenshots/desktop-sample-persistent-error.png) |
| Offline | [320px](screenshots/mobile-sample-offline.png) | [1280px](screenshots/desktop-sample-offline.png) |
| Timeout | [390px](screenshots/mobile-sample-timeout.png) | [1280px](screenshots/desktop-sample-timeout.png) |
| Recovered complete sample | [390px](screenshots/mobile-sample-recovered.png) | [1280px](screenshots/desktop-sample-recovered.png) |

Eight error/repeated/offline/timeout review captures hide only the fixed development emulator banner for legibility; no product content/data was edited. Recovered captures retain that development banner. Full unmodified test screenshots/traces remain local test output. [Structured verification](verification.json), [SEO evidence](seo-audit.json), [screenshot manifest](screenshots.json). Final head/PR/CI results are pinned in GitHub after push; prior-head results are not substituted.
