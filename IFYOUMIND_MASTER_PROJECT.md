# ifYouMind — Master Project Record and Roadmap

**Updated:** 2026-10-10  
**Repository:** https://github.com/alwat83/ifyoumind  
**Website:** https://ifyoumind.com  
**Notion:** https://app.notion.com/p/3f5c9bc5d8fd805ebaa6eae586db23bf  
**Purpose:** Living project context for the founder and all current/future development agents.

> **Legal operator (founder-confirmed 2026-10-11):** ifYouMind is a product and service operated by **Dose Ninja Inc.**; it is not a separate legal entity. The privacy policy and terms name Dose Ninja Inc. as operator, and that is intentional.
>
> **Operational separation:** ifYouMind and the Dose Ninja medication-management product share **no** customer records, analytics properties, mailing lists, product credentials or marketing infrastructure.
>
> **Project boundary and authorship:** ifYouMind and the Dose Ninja medication-management product are entirely separate projects. The founder confirms **all ifYouMind development through 2026-10-10 was performed using OpenAI (ChatGPT/Codex) tools and agents**. Claude, Gemini and other providers have **not** contributed to ifYouMind. Specific OpenAI agent/session ownership of individual commits may not be determinable from GitHub metadata; do not guess.

> **Status discipline:** planned ≠ committed ≠ merged ≠ deployed ≠ production verified. GitHub commits are implementation evidence, not proof of a working live release. Historical Notion architecture is not necessarily the current shipped product.

## 1. Vision and positioning
ifYouMind is becoming a general-purpose AI-powered data intelligence and decision platform, replacing the original social/idea-feed positioning. Combine trusted public datasets and, later, user-authorized data sources to produce understandable comparisons, actionable insights and **evidence-backed Decision Reports**. Make complex data accessible to consumers and businesses, with national/global examples rather than a Birmingham-only identity. The business goal is sustainable near-term revenue and a reliable product ready for marketing.

## 2. Stack and architecture
Historical repository/Notion records describe Angular 19.x, TypeScript, Tailwind/SCSS, AngularFire/Firebase Auth, Firestore, Firebase Functions (Node 20), Firebase Hosting and Stripe. Verify exact installed versions and runtime settings from current manifests. Earlier foundation work introduced organization membership, authorization and tenant isolation, local Firebase emulators, metrics/evidence contracts and connector job abstractions. Preserve authentication, per-tenant data boundaries, provenance and server-side secret handling.

## 3. Implemented/committed milestones (production validation separate)
- **2026-09-30 foundation:** OpenAI/Codex branches `codex/ifyoumind-2-foundation` and `codex/ifyoumind-2-contracts` documented organization authorization, rules/emulator tests, metrics/evidence and connector contracts. Historical documentation records commits `b40cbee`, `9b5519a`.
- **2026-10-03 consumer rebuild:** [PR #1](https://github.com/alwat83/ifyoumind/pull/1) merged to `master` with 275 commits, replacing the legacy site with a consumer-first public experience, authentication, guided decision flow, consumer results, pricing and data upload, while preserving intelligence backend.
- **Stripe:** 2026-10-03 `13c9977` updated the production workflow for a Stripe commerce webhook. October 9 commits added self-service billing portal session/client/UI and related function deployment wiring (`6f399d6`, `9738403`, `cfc1ad3`, `bf7619c`, `743fb34`, `06173a1`). Founder confirms successful paid purchases; do not classify paid purchase as outstanding. Code/CI and production evidence remain separate from this founder confirmation.
- **Census:** October 9 commits `975f24a` (API key for live market data), `55a708e` (transient failure retry), `705fc98` (safe failure-stage reporting). Validate live responses, fallback, quotas and source freshness.
- **Decision Report trust:** `20a1c82`, `456a394`, `5d60934` refined source coverage, report locations and decision triggers. Verify report labels accurately describe data coverage rather than unsupported certainty.
- **Mobile UX:** `7e2bc0a`, `6d5f156`, `0308df5`, `9c30bc2` refined mobile report/pricing layouts.
- **Analytics:** `468219f`, `faf248d`, `fd91c1b`, `6206169`, `c49099f`, `96a1c84`, `7e90182` implemented first-party product-funnel events; `39b2f7d`, `4312cc1`, `d23dba0`, `d4e97ab`, `3853c43`, `945a31d` added founder growth metrics/dashboard and deployment wiring. Verify authorization and accuracy.
- **Marketing scope:** `85bb6fb` broadened landing examples for national appeal; `29fd4bd` added paid report entitlement-gate test.

Latest recent-commit search on 2026-10-10 returned `20a1c82` dated October 9. This is **not** confirmation of current production release SHA.

## 4. Branch inventory (observed 2026-10-10)
`master`, `codex/ifyoumind-2-foundation`, `codex/ifyoumind-2-contracts`, `codex/ifyoumind-2-dashboard`, `codex/ifyoumind-2-product-features`, `codex/ifyoumind-2-universal-data`, `codex/ifyoumind-3-consumer`, `codex/stripe-checkout-ui`. Do not merge blindly: compare each with `master` for unique changes and stale dependencies.

## 5. API and data integration roadmap
**Existing integration to verify:** U.S. Census.

**Next public-data candidates:** FRED (economic indicators), World Bank (global development), BLS (employment/inflation), SEC EDGAR (filings), HUD (housing), FEMA (hazards), Eurostat, USGS, OpenStreetMap, NOAA/Open-Meteo, OpenAQ, GDELT, NASA Earthdata, Data.gov, FBI public data, UNdata and REST Countries. Prioritize reliable low-cost APIs; record usage limits, licenses, required attribution, geography, coverage, freshness and cost before integration. Do not present candidate integrations as shipped.

**Later private connectors:** User-authorized Stripe, GA4 and other business systems, with least-privilege access, encryption, consent, auditability and deletion controls.

## CURRENT HANDOFF — READ FIRST (2026-10-10)
**Project coordination authority: [ifYouMind Notion hub](https://app.notion.com/p/3f5c9bc5d8fd805ebaa6eae586db23bf).** Read its newest founder decisions first. GitHub is implementation/CI evidence, and this Markdown is the durable engineering handoff. Do not use the historical phase table below to override the current consumer-first revenue priority.

**Founder-confirmed working:** Decision Report generation, successful PDF output and paid purchases. Prior threads describe a Census-backed Decision Report with 4/4 attributed key metrics, evidence, decision triggers and action plan; do not rebuild or relabel these as unfinished. Stripe checkout, webhook, billing portal and report entitlement implementation exist on `master`. A founder-confirmed successful paid purchase is not an outstanding task.

**Session stopping point (2026-10-10):** PR #3 checkout messaging merged; documentation PR #4 merged earlier at `c4dac410`. Founder requested a pause after these changes. Next session: confirm deployment status and prioritize marketing/customer acquisition. No new feature work now.

**Current workstreams (status at latest check):**
- **Checkout return UX:** [Draft PR #3](https://github.com/alwat83/ifyoumind/pull/3), branch `codex/checkout-report-confirmation`, commit `7a78d090ca5b297e5dba0cac3d3c696cf0743d44`. Fixes misleading checkout-success copy by fetching the report project and requiring `decisionReportPurchased === true` before displaying unlocked link; checks Pro status before claiming Pro access. **Launch build check completed SUCCESS** on that commit. **MERGED into master** on 2026-10-10 via squash commit `e10cec732742fd50eccb6453c3d5c88a40bb4055`; feature-branch Launch build check SUCCESS. Production deployment/live smoke check not yet confirmed in this handoff. Next session: check post-merge deployment status and changed return-message UX only; do not repeat completed paid purchase tests without regression evidence.
- **FRED:** [Draft PR #2](https://github.com/alwat83/ifyoumind/pull/2), branch `codex/fred-economic-indicators`, last observed `5565dfb`, 9 commits ahead of master at prior comparison. Earlier 25/25 Functions tests passed locally; launch build CI succeeded; dependency security audit failed. **Not merged/deployed**, nonessential to first revenue; defer.
- **Security:** Production dependency audit has known failures. Triage material risks separately; do not blindly upgrade dependencies or conflate audit failure with confirmed compromise.
- **Customer acquisition:** **Highest business priority after minimal release polish.** Use existing nationally appealing consumer positioning, product funnel analytics and growth dashboard. Focus on visitor → signup → decision → report → purchase conversion, messaging, SEO, outreach and learning from real users. Avoid building speculative connectors before demand.

**Operational workflow for every agent:** Read the latest Notion hub directive, `AGENTS.md`, this handoff, GitHub master/open PRs/CI. Choose one nonduplicated task. Make scoped changes on a branch. Record what is confirmed by founder versus code/CI versus production smoke test. Update Notion after significant work and keep this file in sync. Include exact PR, commit, build, deployment and next action. Historical development attribution through this date: OpenAI agents only, per founder. Never confuse Dose Ninja.

**Release and testing guardrail:** PR #3 merged after a successful feature-branch CI build; this does not imply production deployment or live verification. Do not merge deferred PR #2 without separate review.

## 6. Product and commercial roadmap
| Phase | Priorities | Release gate |
|---|---|---|
| 0 — Verify current build | Check `master`, CI, Firebase Hosting/Functions, live Census, OpenAI key/server configuration, Stripe webhook/checkout/portal, report generation, auth, analytics | Verified live smoke tests and tracked blockers |
| 1 — Trustworthy public-data MVP | Robust Census experience, FRED/World Bank/BLS candidates, comparison flows, citations, freshness, uncertainty and clear error states | Useful evidence-backed decisions with measurable success |
| 2 — Engagement | Saved reports/history, AI-assisted Ask experience, Pulse/alerts, mobile polish and onboarding | Users return and complete meaningful decisions |
| 3 — Revenue and acquisition | Validate free/paid packaging, entitlements, billing, conversion funnel, SEO/content, launch marketing, growth dashboard | Tested payment and retention metrics |
| 4 — Business connectors | Authorized data ingestion, reusable connector jobs, organizational dashboards, audit and privacy | Secure cross-tenant isolation and accurate connector sync |
| 5 — Expansion | More datasets/geographies, advanced analysis, developer/API platform and partnerships | Data quality, sustainable cost and demand proven |

**Pricing:** Historical Notion hypotheses include $49/$99/$199/$399+ tiers. Treat these as exploratory, not approved live pricing; inspect the current site and Stripe configuration.

## REVENUE SPRINT — 2026-10-11 (Claude, Anthropic)
Session on branch `claude/jolly-ramanujan-ofr18a`. Builds on the commercial-execution handoff (PRs #6–#9); does not repeat it. Full record in the Notion hub entry "Revenue sprint: AI audit, revenue tracking and acquisition kit".

- **OpenAI integration — planned / deferred.** No AI model runs in production. `market-ai.ts` and `ai-synthesis.ts` call OpenAI, but they are not exported from `functions/src/index.ts`, not in the deploy allowlist, and not called by the UI. The $79 report is deterministic: Census ACS metrics plus rules. It delivers what its copy promises, so this is **not a P0 revenue blocker**. Do not market the product as AI-powered until AI ships.
- **Revenue analytics — committed, [draft PR #11](https://github.com/alwat83/ifyoumind/pull/11).** The webhook records Stripe-confirmed payments with `livemode`. The growth dashboard separates live revenue from test mode and no longer calls the checkout redirect "Paid". Functions 35/35, commerce emulator 26/26, build PASS. Not merged or deployed.
- **Acquisition — drafted, nothing sent.** The Notion "ifYouMind Revenue Sprint Tracker" database was created. Launch Campaign Kit sections 7–11 were added: segment check, five posts, demo script, referral partners, and the 14-day plan.
- **P0 gate unchanged:** live purchase → webhook → unlock → refund is not production verified. The Stripe connector reaches only the sandbox account, so live revenue is not verified by Claude.

## ORGANIC DISCOVERY AND SEO READINESS — 2026-10-11 (Claude, Anthropic)
Founder-approved preparation phase. Nothing was published, deployed, sent or configured externally. PR #12 is still on hold and the live $79 payment test is still deferred. No Dose Ninja resources were used.

- **SEO metadata — production verified, [PR #16](https://github.com/alwat83/ifyoumind/pull/16)** (`claude/jolly-ramanujan-ofr18a-seo`).
  - Live check before the fix: every route declared `https://ifyoumind.com/` as its canonical URL, including `/sample-report`, and login and app pages were indexable.
  - The PR adds `src/public-pages.json` as the single list of indexable pages, a `PageMetaService` that sets per-route canonical, robots and share tags, and noindex for auth and app routes.
  - The live sitemap was already correct (the build regenerates it); the committed copy was stale.
  - `npm run test:seo` and the build pass.
- **Guides — production verified, [PR #17](https://github.com/alwat83/ifyoumind/pull/17)** (`claude/jolly-ramanujan-ofr18a-guides`).
  - Markdown in `content/guides/` is rendered at build time into static `public/guides/<slug>/index.html` pages, which Firebase Hosting serves before the SPA rewrite. One shared template and stylesheet; `marked` is a dev dependency.
  - First guide: `/guides/market-analysis-business-plan/`.
  - axe-core found 0 WCAG 2.1 AA violations on mobile and desktop.
- **SEO release — 2026-10-11, founder-authorized, production verified.**

  | PR | Merge commit | Deploy run | Live check |
  |---|---|---|---|
  | #16 | `1e73076` (head `38e94a0`) | 38160120570, success | PASS: self-canonicals on `/`, `/sample-report` (UTM stripped), `/privacy-policy`, `/terms-of-conduct`; `noindex,nofollow` and no canonical on `/login`, `/register`, `/app/*`; sitemap 4 URLs; no console errors |
  | #17 | `acf89ce` (head `888073f`, master merged in) | 38160728377, success | PASS: `/guides/market-analysis-business-plan` 301 → trailing slash, 200; canonical, og and Article/BreadcrumbList JSON-LD correct, dated 2026-10-11; all 13 Census figures present; 7 external and all internal links 200; 4 links to `/sample-report`; axe 0 violations and no overflow at 390px and 1280px; sitemap 6 URLs; homepage footer link present |

  The checks were read-only, run from the ifyou environment.
  - **Follow-up (not started):** the mobile comparison table scrolls sideways with no visual cue.
  - **Next:** Search Console sitemap submission once ownership is confirmed.
  - **Still on hold:** PR #18 (analytics consent) stays unmerged pending its consent and privacy-policy review; PR #12 is on hold; the live $79 test is deferred.
- **Cornerstone article — verified.** All Census figures (Austin, Charlotte and Nashville-Davidson balance; ACS 5-year 2015–2019 and 2020–2024, tables B01003, B19013, B25077) match data.census.gov exactly, and the 2024 values match Census Reporter. External links were checked and the SBA link updated.
- **Analytics — gap found, not fixed.**
  - GA4 (G-DZMLBPS4ZX) is configured but never initialises. Nothing injects AngularFire Analytics or `ScreenTrackingService` in routed code, and the live site sends zero GA requests.
  - A two-line fix was tested locally but is held for a consent and privacy decision.
  - The first-party funnel (`recordProductEvent` → `productEvents`) covers signed-in events only.
- **Email DNS — risk found, not changed.** ifyoumind.com publishes **two SPF records**, which is an SPF permanent error. DMARC is `p=quarantine`, there is no Google DKIM, and MX points to self-hosted `mail.ifyoumind.com`. The support@ inbox is unverified.
- **Search Console:** a `google-site-verification` TXT record already exists, and its owning account is unknown. `www.ifyoumind.com` serves a duplicate of the site instead of redirecting.
- **Analytics consent — committed, [draft PR #18](https://github.com/alwat83/ifyoumind/pull/18)** (stacked on #17). GA4 starts only after "Allow analytics"; the banner and preferences panel, previously never rendered, now appear. Not merged.
- **Pricing finding:** reports unlocked under Pro are permanently flagged `decisionReportIncludedWithPro`, so one $39 Pro month (5 reports, kept after cancellation) dominates the $79 report. Recommendations are for the founder; no prices or entitlements were changed.
- **Census API:** api.census.gov now rejects keyless requests. Production uses the `CENSUS_API_KEY` secret; keep it set.
- **Next initiative — Customer Value Expansion (planned).** Priorities:
  1. analytics;
  2. customer discovery calls with target users (no contact authorized yet; **five genuine paying customers is the target, not an established result — 0 verified live payments as of 2026-10-11**);
  3. the Pro/report overlap;
  4. County Business Patterns competitor counts and ACS median rent (B25064) in reports;
  5. explicit free-brief limits;
  6. a professional tier.

  Full review: Claude Docs "SEO readiness and Customer Value Expansion review".

## CUSTOMER VALUE EXPANSION, UX AND CONVERSION STRATEGY — 2026-10-11 (Claude, Anthropic)
Strategy only: no features implemented, no pricing or entitlement changes, nothing deployed. The full assessment is in the Claude Docs doc "Customer Value Expansion, UX and Conversion Strategy".

- **Finding:** an email sign-up passes about nine screens, including an inbox detour, before seeing a personalised result. Nothing before sign-in is measured. The paid report adds cities but little new insight. Pro at $39/month (5 reports, kept after cancelling) undercuts the $79 report.
- **Recommended phase 1, "Measure and clarify"** (planned; needs approval):
  1. Consent-gated GA4 (#18) plus five funnel events.
  2. Clarity copy: free-brief limit, one name ("Decision Report"), register headline.
  3. Intent carry-through, cutting nine screens to six with no change to auth or paid access.
  4. Founder-first offer presentation, copy only.

  Gate to phase 2: about 2 weeks or about 200 measured homepage visits.
- **Phase 2, report value** (planned):
  - ACS significance flags (Census Z-test, 90% MOE);
  - households above income thresholds (B19001) and age bands (B01001);
  - County Business Patterns employer establishments, plus Nonemployer Statistics;
  - residential median gross rent (B25064), labelled as a proxy;
  - a "copy into my business plan" export.

  Commercial rent has no reliable free official source, so it is user-entered evidence only.
- **Later phases:** professional offer (report pack or monthly plan above $79, decided on evidence); grounded AI (facts in, sentences out, with fact-ID validation and rule-based fallback; provider-neutral; OpenAI integration still deferred); cross-industry reuse of the same evidence engine.
- **Resolved:** the legal operator is Dose Ninja Inc. (founder-confirmed). Privacy wording is in #18; Terms wording is in #12 (still on hold).
- **Wave A release, 2026-10-11 (Claude Code, founder-authorized).** Each PR: CI green on head → merge → deploy run → read-only production check from the ifyou environment (no sign-ups, purchases, form submissions or consent clicks).

  | Order | PR | CI head | Merge commit | Deploy run | Production check | Status |
  |---|---|---|---|---|---|---|
  | 1 | [#20](https://github.com/alwat83/ifyoumind/pull/20) guide table scroll cue | `77ff048` | `46f1125` | 38171026194 success | PASS: hint at 390px, hidden at 1280px; axe 0; no overflow | Production verified |
  | 2 | [#22](https://github.com/alwat83/ifyoumind/pull/22) clarity copy | `4d8bf30` | `a956f57` | 38171460974 success | Copy live everywhere; FAIL on pre-existing /sample-report contrast (`#788194`, 3.91:1), so the release stopped | Deployed; verified after #25 |
  | 2a | [#25](https://github.com/alwat83/ifyoumind/pull/25) footnote grey `#5f6878` (5.62:1) | `5f8d91b` | `2591d95` | 38176829772 success | PASS: computed colour correct; axe 0 on /sample-report at 390 and 1280px; regressions clean | Production verified |
  | 3 | [#23](https://github.com/alwat83/ifyoumind/pull/23) six-screen first-time path | `2f1e6e7` | `c95de9e` | 38177318999 success | PASS: /verify-email renders the new page; signed-out /app/decide redirects to /login; new flow strings in the deployed chunks; no "Fast-casual restaurant" default; axe 0 on six public pages | Production verified (signed-out); real verification email still to check |
  | 4 | [#21](https://github.com/alwat83/ifyoumind/pull/21) this documentation | see the merge record | | | Docs only | |

  **Not verifiable read-only:** the signed-in decision flow and the real verification email's continue link. Check both once with a founder test account.
- **Wave B (#18 consent-gated GA4 → #24 funnel events): on hold.** It needs:
  - the founder's GA4 property checks: an ifYouMind-only property; Google signals off; no advertising links; retention of 2 or 14 months; enhanced-measurement history, site search and form interactions off; granular location and device data off; data sharing off;
  - separate authorization;
  - a DebugView check after deploy.

  #24 must merge after #18.
- **Email-verification hardening:** [PR #26](https://github.com/alwat83/ifyoumind/pull/26), head `af7a535`, CI green. Status: **committed, not merged or deployed**.
  - **What it does:** `requireVerifiedIdentity` runs first in 13 functions: the 12 that write data or touch billing, plus `getProductFunnelMetrics` (verified email, then the admin claim). 12 functions are exempt: the public sample, the Stripe webhook, workspace setup, the product-event log, and read-only functions of the caller's own workspace.
  - **Fail-closed:** only the boolean claim `email_verified === true` passes.
  - **Browser:** the auth guard reloads a stale unverified account once, and refreshes a token minted before verification.
  - **Tests:** functions 52/52, commerce 35/35, organizations 5/5, rules 5/5, fast tests 24/24.
  - **Release condition (founder, 2026-10-11):** release only after the 13-scenario onboarding baseline passes on production with internal test accounts, then re-test. **Blocked:** no ifYouMind-controlled inbox is available to the agent session. The domain's MX is `mail.ifyoumind.com`; Dose Ninja mailboxes must not be used.
- **Phase 2, paid-report value (technical preparation approved; implementation not approved):**
  - **Seven items:**
    - significance flags (ACS MOE, Census Z-test at 90%);
    - affordable households (B19001);
    - target age (B01001);
    - employer competitors (CBP 2023, county);
    - owner-operated competitors (NES 2023, county);
    - residential rent as a labelled proxy (B25064);
    - a business-plan copy.
  - **Labels:** every figure carries an evidence label (survey estimate, business count, calculated, proxy or customer evidence), plus its geography level and period.
  - **Accuracy rules:** ratios only within one geography level, and no apportioning county figures to cities.
- **FRED research (2026-10-11):**
  - **Terms:** the FRED terms prohibit caching or storing FRED content and commercial use without the St. Louis Fed's written consent. Copyrighted series need owner permission.
  - **Excluded:** Realtor.com, the Freddie Mac PMMS 30-year rate and UMich sentiment.
  - **Recommendation:** FRED for research only. Production indicators come from the original public-domain agencies:
    - BLS LAUS and QCEW;
    - BEA county income and GDP;
    - Census population estimates and building permits;
    - FHFA HPI.

    Each agency's API terms are to be confirmed before build.
  - **Plan:** https://claude.ai/code/artifact/f2fecef4-4921-44da-ba45-a113a03e722a
- **Official-source research (2026-10-11).** Plan: https://claude.ai/code/artifact/fd74813d-55a5-4ca9-a354-d82031e6e7bd
  - **Census:** no US copyright (policy DS027). Every API request now needs a key. Required notice: "This product uses the Census Bureau Data API but is not endorsed or certified by the Census Bureau."
  - **BLS:** public domain. Cite BLS and the retrieval date. v2 key allows 500 queries a day; v1 allows 25. The BLS quotes still need a manual check in a browser.
  - **BEA:** public domain. Free key; 100 requests a minute. Required notice: "This product uses the Bureau of Economic Analysis (BEA) Data API but is not endorsed or certified by BEA."
  - **FHFA HPI:** no API, downloads only. "FHFA HPI®" is a trademark; cite it as "Source: FHFA HPI®".
  - **Caching:** none of the four restricts storage in the pages read.
  - **Changes to the plan:**
    - CBP has no planned release date for 2024 data, and NES changes method from 2025, after a Commerce order banning noise infusion. Use the 2023 data, labelled as the latest published, with BLS QCEW as the fallback for employer counts.
    - Building permits are monthly at county level (since 2022), not only at metro level.
- **Enhanced $79 report prototype:** https://claude.ai/artifact/3aabntWGixBsHtxLatJEyp. It mixes real figures (ACS from the guide; FHFA county HPI 2020–2025; Travis County LAUS) with clearly marked illustrative placeholders. Status: for founder review; not implemented.
- **Release phases (estimates, each gated on founder approval):**
  - R1: #26, then Wave B, then docs.
  - R2: UX polish U1–U12, about 2–3 days.
  - R3: evidence labels, significance tests, market sizing and export (Census only), about 4–5 days.
  - R4: industry code, competitors and cost proxy, about 4–5 days.
  - R5: BLS, BEA, permits and FHFA trends, about 5–7 days.
- **Founder decisions (2026-10-11, late):**
  - **R2 (conversion polish) and R3 (paid-report core):** approved for implementation as draft PRs. No merge or deploy.
  - **R4 and R5:** stay at design stage.
  - **The prototype:** the design baseline.
  - **FRED:** research-only, pending legal review.
  - **Official publishers first:** Census, BLS, BEA and FHFA, with licence notices and API conditions verified before production use.
  - **Pricing:** a recommendation only, with no changes.
- **[Draft PR #28](https://github.com/alwat83/ifyoumind/pull/28), R2 conversion polish.** Head `731979b`; CI green.
  - **Changes:**
    - the sample is labelled "Decision Report · Sample";
    - "Included in the $79 report" pills;
    - an unpaid "What the $79 report adds" panel;
    - a direct "$79" CTA;
    - the $79 card before Pro, with its contents listed;
    - business-led homepage use cases;
    - a support contact;
    - a register next-step line;
    - an "In this report" list;
    - correct ACS period wording.
  - **Tests:** fast tests 28/28, functions 48/48, commerce 29/29; axe 0 at 390 and 1280. Prices, Stripe and entitlements are unchanged.
  - **Status:** committed (draft).
- **[Draft PR #29](https://github.com/alwat83/ifyoumind/pull/29), R3 paid-report core.** Head `8fcdc7d`.
  - **New code:** `functions/src/intelligence/evidence.ts` uses the Census Bureau formulas (SE = MOE/1.645, root-sum-of-squares totals, proportion and ratio MOEs, a 90% Z-test).
  - **Report content:** households at four income thresholds (B19001), residents aged 25–44 (B01001), and difference checks that never rank places within the margin of error. Missing, open-ended and controlled values are explicit.
  - **Fetching:** evidence is fetched only for entitled views, stored on the decision, and retried when Census is down. The key stays server-side.
  - **Tests:** functions 61/61, commerce 31/31, fast tests 19/19, orgs and rules 5/5; axe 0. Screenshots use labelled fixture data.
  - **Status:** committed (draft).
- **Pricing recommendation (research only):**
  - **The problem:** Pro at $39 a month includes 5 full reports, so it beats the $79 one-off for every buyer.
  - **Recommendation:** keep $79 as the main offer, and reposition Pro as Professional at about $149 a month for 5 reports (about $30 per report), for advisers and multi-site operators. The alternative is $99 a month for 3 reports.
  - **Unit economics:** variable cost per report is near zero. Net of the Stripe card fee, $79 yields about $76.41.
  - **Status:** awaiting a founder decision.
- **Release order (founder, 2026-10-11):** #26 (held for the mailbox baseline) → #28 → #29 → Wave B (held for the GA4 review) → docs #27. #29 is rebased onto #28; its CI tests the combined tree.
- **#28 adds purchase intent:** the sample's $79 buttons carry `intent=report` through sign-up, verification and the first decision. The result page then offers the $79 report through the existing Stripe checkout. Verification and payment are unchanged.
- **#29 narrative fix:** comparative wording follows the 90% difference tests. A place is never called higher or the highest within the margin of error.
- **Combined R2+R3 check:**

  | Suite | Result |
  | --- | --- |
  | Fast tests | 35/35 |
  | Functions | 66/66 |
  | Commerce | 31/31 |
  | Orgs | 5/5 |
  | Rules | 5/5 |

  - **Accessibility:** axe 0 on six pages at 390 and 1280 px.
  - **Exports:** the business-plan copy text and print/PDF are verified.
  - **Evidence:** in `docs/integration-evidence/`.
- **Professional at $149/month for 5 reports:** prepared as a specification only. Pending founder approval and a check for existing Pro subscribers in live Stripe. No Stripe, billing, entitlement or public-pricing change.
- **Release readiness (2026-10-11, latest):**
  - **#28:** ready for release review. A security review of the purchase-intent journey found no sensitive data in verification or continue URLs, an intent value limited to `report`, a same-origin continue URL, and unchanged verification, guard and payment controls.
  - **#29:** head `82b41c5`. The Census key is proven never returned, stored or cached, and never in `src/` or `dist/`. Real-data validation (`npm run validate:census`, `docs/census-validation/`) waits on a dev `CENSUS_API_KEY` in a test environment.
- **Professional pricing ($149/month for 5 reports):** preferred direction, not authorized. Grandfathering is automatic, because Stripe keeps existing subscription prices and access depends on subscription status. The live subscriber count is unknown, since the connector reaches only the sandbox (one $39 test subscription). The migration plan is in the Phase 2 plan, section 10.
- **R4 and R5 sequence (design only):**
  - R4.1 geography resolver → R4.2 industry-code picker → R4.3 CBP 2023 → R4.4 NES 2023 (needs a NAICS 2017→2022 crosswalk) → R4.5 rent proxy and lease quotes.
  - R5.1 FHFA (no key) → R5.2 BLS LAUS → R5.3 BEA → R5.4 building permits.
- **Founder checklist:**
  1. Hestia QA mailboxes and the email steps (unblocks #26).
  2. A dev Census key in a test environment (unblocks #29 validation).
  3. Authorize #28, then #29.
  4. Count live Pro subscriptions in Stripe.
  5. Approve Professional pricing.
  6. GA4 review (unblocks Wave B).
  7. Later: BLS and BEA keys, and R4/R5 approval.
- **Security finding (open until #26 ships):** Cloud Functions do not check `email_verified`; only the browser guard does.
- **Customer count:** 0 verified live paying customers; five is the target.

## 7. Known technical debt and risks
The September 30 repository audit reported tracked `functions/node_modules`, a bundle over budget, baseline lint errors and test compilation issues. Reassess current state before declaring these unresolved. Other risks: API quotas and licensing, data freshness, evidence mislabeling, auth/tenant isolation, billing entitlement drift, secrets exposure, deployment failures, mobile conversion friction and duplicated agent work.

## 8. Historical verification checklist (not a list of unfinished launch features)
- [ ] Confirm current `master` HEAD, relevant GitHub Actions run results and deployed Hosting/Functions revision.
- [ ] Run fresh build/tests; inspect baseline lint, bundles and dependency hygiene.
- [x] Founder confirmed working Decision Reports and generated PDF; earlier Census-backed 4/4 metric report documented. Targeted regression checks only when making related changes.
- [x] Founder confirmed paid purchases work. Other UX/mobile/billing-portal regression checks should be scoped to actual changes; do not relabel paid purchase outstanding.
- [ ] Verify founder metrics events, permissions and reporting consistency.
- [ ] Compare all outstanding branches with `master` and resolve unique changes.
- [ ] Update the ifYouMind Notion hub and engineering tasks with evidence-backed statuses.

## 9. Multi-agent governance
All development so far: **OpenAI only**, per founder confirmation. Other AI providers: **no historical contributions**. Future contributors should read [AGENTS.md](AGENTS.md), this document and Notion; claim only their own verifiable work; record agent/provider, branch, commit/PR, tests, deploy and blockers. Do not confuse ifYouMind with Dose Ninja or borrow its agent history.

## 10. References
- [Repository](https://github.com/alwat83/ifyoumind)
- [Commits](https://github.com/alwat83/ifyoumind/commits/master)
- [Branches](https://github.com/alwat83/ifyoumind/branches)
- [Consumer rebuild PR #1](https://github.com/alwat83/ifyoumind/pull/1)
- [Notion project hub](https://app.notion.com/p/3f5c9bc5d8fd805ebaa6eae586db23bf)
- [Notion Alpha Architecture](https://app.notion.com/p/3f5c9bc5d8fd8050a396c3f97307c97b)
- [Notion Repository Audit](https://app.notion.com/p/10fc9bc5d8fd83e58a3601021e03a362)
- [Notion Organization Authorization](https://app.notion.com/p/fb7c9bc5d8fd83c1a35401fb26610ef1)
- [Notion Metric/Evidence Contracts](https://app.notion.com/p/b92c9bc5d8fd832aa62281b47e427829)

**Maintenance:** Keep this record current after meaningful releases; preserve historical milestones and distinguish planned, committed, deployed and verified. Never commit credentials or personal customer data.
