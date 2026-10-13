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
- **Advertising and alternative revenue strategy, 2026-10-12 (Claude Code; research only; nothing applied for, contacted, installed or spent).**
  - **Where it lives:** strategy doc https://claude.ai/code/artifact/edba208a-efd0-49c1-9231-a0f85fe9fcea; Notion entry "Advertising & Alternative Revenue Strategy (research only)" (https://app.notion.com/p/3f7c9bc5d8fd81719dd6ce961d2c1c74). The original discussion took place in ChatGPT and was not saved before.
  - **Recommendation:** don't monetise yet; measure guide traffic first.
    - **Then affiliates:** one labelled business-formation affiliate on guides only. ZenBusiness pays $75–$175, LegalZoom from $125 CPA and Northwest $100–$150, per their official pages.
    - **Display ads last:** non-personalised AdSense on guides only. AdSense has no traffic minimum. Mediavine Journey needs 1,000 Tier 1 sessions, Raptive 25k pageviews and Ezoic 250k users.
    - **Sponsorship:** only with an audience to show.
  - **Never on product surfaces:** homepage, sample, sign-up, free result, paid report and PDF, pricing, checkout, account and workspace.
  - **Model (assumptions only):** at 500, 3,000 and 15,000 guide pageviews a month, display ads earn about $1, $18 and $180, against about $76, $688 and $5,731 from $79 reports. A 5% drop in report conversion outweighs display ads in every scenario.
  - **Gates:**
    - A: 1,000+ Tier 1 guide sessions a month for 2 months, and the study complete.
    - B: counsel review of the CMP, RDP and GPC consent design and the policy changes.
    - C: no relative drop of 5% or more in report conversion during a 90-day pilot.
  - **Google Ads customer acquisition stays a separate spending track.**
- **Release 2026-10-12 (Claude Code, founder-approved): Phase 1 RC [#37](https://github.com/alwat83/ifyoumind/pull/37), production verified (signed-out).**
  - **Merge:** `3114840`, pinned to the reviewed head `d81b178`. CI was green; the diff was 13 files with no functions, rules, config or billing code.
  - **Deploy:** run 38271849491 (#179) succeeded at 15:42:03Z on `3114840`. Bundle `main-UEXL42XX.js`.
  - **Production checks, all 9 PASS:**
    - deployed strings, homepage pricing links (prices unchanged), the intent note;
    - register inline errors and focus;
    - return URLs: decide and result keep their path, growth gets none, all three attack URLs stay on-site;
    - the sample shows "Sources cited: 4 of 4";
    - Google popup and auth iframe, the #31 headers, the guide;
    - axe 0 at 390 and 1440 px, no overflow, no console errors apart from Google's COOP notice.
  - #34 and #36 closed as superseded.
  - **Not verified:** signed-in journeys (no ifYouMind test account), verification in a different browser (no Hestia QA mailboxes), Google sign-in completion (no ifYouMind Google account).
  - **#35 spec v2 approved.** It stays a draft until its own release approval.
- **Phase 1 release candidate and event spec, 2026-10-12 (Claude Code; awaiting founder approval; nothing merged or deployed).**
  - **RC [#37](https://github.com/alwat83/ifyoumind/pull/37) `d81b178`:** master `d413a88` plus #34 plus #36.
    - The homepage conflict was resolved by keeping #34's intent and #36's labels.
    - Checks:
      - security review;
      - fast 45/45, functions 48/48, commerce 29/29, rules 5/5, organisations 5/5, build passes;
      - axe 0 and no overflow at 390 and 1280 px, no console errors;
      - signed-out deep link goes to `/login?returnUrl=…`, and `//evil.example` stays on-site.
    - The diff touches no functions, rules, config or billing code.
    - The Pro cancellation line is kept (founder decision; it matches the entitlement code).
    - The release checklist (before merge, deploy, signed-out and signed-in production checks, stop and rollback) is in the PR body.
    - #34 and #36 are to be closed as superseded on release.
  - **#35 spec v2 `2ca8350`:** `docs/analytics/product-events.md`.
    - `result_engaged` is an **engagement** signal. Activation (understanding) is measured only in usability task T3.
    - Events renamed to observable actions: `upgrade_panel_shown`, `intent_prompt_shown`, `intent_prompt_clicked`, `market_analysis_copied`, `print_dialog_opened`.
    - Functions 54/54, fast 38/38.
  - **Toolkit:** T1 is now the "10-second comprehension test". Consent supports notes-only, with no recording; those sessions are counted the same.
- **Phase 1 development, 2026-10-12 (Claude Code; founder-approved for draft branches; nothing merged or deployed).**
  - **1.1 [#34](https://github.com/alwat83/ifyoumind/pull/34) `c296d10`:** login return URL plus homepage $79 intent.
    - Security review done: allowlist, and property tests over about 25,000 inputs.
    - QA checklist for signed-in checks: `docs/qa/return-url-and-intent.md`.
    - Fast tests 41/41.
  - **1.2 Wave B reconciled with master:** [#18](https://github.com/alwat83/ifyoumind/pull/18) `f55786f` and [#24](https://github.com/alwat83/ifyoumind/pull/24) `da1dcf9`.
    - Footer: keeps both the support email and Cookie settings.
    - Register and decision flow: keep both the funnel tracking and the purchase intent.
    - Both merge cleanly with master. Still held for the GA4 review.
  - **1.3 [#35](https://github.com/alwat83/ifyoumind/pull/35) `134b582`:** first-party events.
    - `finding_viewed` (activation proxy: 30 s plus copy, source or print), `offer_viewed`, `intent_prompt_shown`, `intent_prompt_clicked`, `report_copied`, `report_exported`.
    - Each event has a schema allowing only enumerations and an opaque project id; established events now also drop email-like values.
    - Admin metrics add `decisionToFinding` and `repeatDecisionOrganizations`.
    - Functions 53/53, fast 38/38, commerce 29/29.
    - Conflicts with #29 in 3 report files (a mechanical merge).
  - **1.4 [#36](https://github.com/alwat83/ifyoumind/pull/36) `4ee9aba`:**
    - "Sources cited" replaces "High source coverage".
    - Pricing button labels say what happens.
    - The register button stays active and shows inline errors.
    - A line on the pricing page says reports unlocked with Pro stay unlocked after cancelling (true per the entitlement code). Founder decision whether to keep it.
    - Fast 39/39; axe 0.
  - **1.5 Usability study toolkit:** https://claude.ai/code/artifact/8faa5869-ecea-4e6a-a741-7af3cfdfec6a. It has the screener, consent, moderator script, note-taker sheet, findings log, outreach drafts (not sent) and synthesis. No one has been contacted.
  - **Release grouping when authorised:** #34 and #36 together (combined merge 45/45), then #35, then Wave B after the GA4 review.
- **Phase 1 customer-experience proposal, 2026-10-12 (Claude Code; for founder review).**
  - **Documents:**
    - Proposal: https://claude.ai/code/artifact/bc794ad5-24aa-4544-bcfe-c52ba170b327.
    - Concepts v2: https://claude.ai/artifact/CtfueoihHaB8WGXZFa1q5H. They cover the verdict-first header, a dot-and-interval comparison and evidence cards; every element is tagged live, built, designed or illustrative.
  - **Scope:**
    - 1.1 Q1 + Q2: [draft PR #34](https://github.com/alwat83/ifyoumind/pull/34), `a0d488c`, CI green, fast tests 40/40, not merged.
    - 1.2 merge master into #18/#24, which now conflict with master.
    - 1.3 activation and offer events.
    - 1.4 copy fixes Q4–Q6.
    - 1.5 an 8-person usability study.
  - **Phase 2 gate:**
    - at least 4 of 6 complete and understand a first result unaided;
    - at least 4 of 6 understand the $79 offer;
    - non-buyers name missing evidence;
    - 2 weeks of Wave B data.
  - **Competition research (official pages, 2026-10-12):**
    - CBP and NES have no place (city) geography.
    - Minimum figure: CBP 2023 county `ESTAB` by 6-digit NAICS 2017, plus a density from the same county's population, labelled county/employer-only/2023. Counts aren't noised, but cells under 3 are dropped.
    - NES 2024 (released 2026-09-29) uses NAICS 2022, and its method changes from 2025. Deferred.
    - R4 stays design-only.
- **Customer Value Expansion strategic assessment, 2026-10-12 (Claude Code; strategy only, for founder review).**
  - **Documents:**
    - Assessment: https://claude.ai/code/artifact/269b3bcd-c5ea-4e9b-8a80-2a2ba533f392. It covers the 12 deliverables and the original-brief traceability matrix.
    - Design concepts: https://claude.ai/artifact/CtfueoihHaB8WGXZFa1q5H.
  - **Status:** nothing implemented, merged or deployed.
  - **Findings:**
    - Nothing before sign-in is measured: GA4 never starts.
    - One $39 Pro month (5 reports) undercuts the $79 report.
    - The report covers demand but not competition or cost.
    - The live report shows no MOE (#29 fixes this).
    - Code review: `authGuard` sends signed-out users to `/login` with no return URL, and login always goes to `/app`. A verification link opened on another device therefore loses its destination and `intent=report`.
    - The homepage $79 button links to plain `/register`.
  - **Recommended next milestone, "First five, understood":**
    1. Wave B makes the funnel measurable.
    2. Run 6–8 observed sessions (programme in section 10; no outreach until approved).
    3. Reach 5 genuine paying customers, each with a recorded reason for buying.
  - **Quick wins proposed, not approved:** Q1 homepage intent; Q2 login return URL; Q3 verdict-first summary; Q4 rename "source coverage"; Q5 pricing copy; Q6 register button.
- **Release 2026-10-12 (Claude Code, founder-approved): #28 then #31.** Both are production verified for signed-out use.
  - **#28:**
    - Merged as `c1123aa` from head `a7a4cf4`, with CI green.
    - Deploy run 38196963277 succeeded at 02:47Z. The live bundle is `main-PJPQPYNE.js`.
    - Verified live:
      - homepage pricing order;
      - the sample report's labels and its CTAs linking to `/register?intent=report`;
      - the intent note, with sessionStorage holding `{intent, at}` only;
      - the intent allowlist;
      - register validation without submitting;
      - the Google popup and auth iframe;
      - `/app/*` routes redirecting to `/login`;
      - axe 0 violations, no overflow and no console errors.
    - The signed-in purchase journey is **not** verified. It needs the QA accounts, and no live purchase was made.
  - **#31:**
    - Rebased, then merged as `d413a88` from head `d6aa6bd`, with CI green.
    - Deploy run 38197794517 succeeded at 02:59Z.
    - The frame and permissions rules exclude Firebase's reserved `/__/` paths, because `signInWithPopup` embeds `/__/auth/iframe` from another origin.
    - Live headers on all pages and assets:
      - Referrer-Policy: strict-origin-when-cross-origin
      - nosniff
      - X-Frame-Options: SAMEORIGIN
      - Permissions-Policy
    - `/__/auth/*` sends no X-Frame-Options and no Permissions-Policy.
    - Behaviour checked:
      - the Google popup still works;
      - another origin can't embed the site;
      - only the origin is sent as the referrer to Google Fonts;
      - fonts load and clipboard-write is allowed;
      - axe 0 violations;
      - Stripe checkout and the portal are full-page redirects, unaffected.
    - Rollback: revert the merge commit.
  - **Follow-ups:**
    - The favicon is missing: `/favicon.png` serves the index page. This predates the release.
    - www doesn't redirect to the apex.
    - No CSP yet.
- **Readiness 2026-10-12 (Claude Code; nothing merged or deployed):**
  - **#26:** held until the Hestia QA mailbox baseline passes.
  - **#28 (a7a4cf4):** shipped independently of #26 on 2026-10-12 (see the release entry above). There's no code dependency and a trial merge is clean. The only new URL parameter is the allowlisted `intent=report`, so there's no PII in any URL. Rollback is a revert.
  - **Live headers:** only HSTS and Cache-Control are sent. There's no Referrer-Policy (so the browser default applies), no CSP, no nosniff, no X-Frame-Options and no Permissions-Policy. www serves 200 rather than redirecting to the apex.
  - **#31 (c83fb54, draft):** adds the explicit headers, without CSP.
  - **#29 (82b41c5):** draft until the live Census harness passes with a dedicated dev key in an isolated environment.
  - **#30 (1466625, draft):** grandfathered-price display, cancellation messaging and a portal-config hook. No Stripe changes. Needs a rebase after #26.
  - **#32 (756d92e, draft):** R4.1 city→county→metro resolver (CBSA July 2023). Never apportions county figures to a city. Not wired in.
  - **Founder actions:**
    1. QA mailboxes and the baseline (#26).
    2. Dev Census key as `CENSUS_API_KEY` (#29).
    3. Authorize #28, optionally with #31.
    4. Count live Pro subscriptions.
    5. Approve $149 and the portal configuration.
    6. GA4 review.
    7. Later: BLS/BEA keys and R4/R5 approval.
- **Security finding (open until #26 ships):** Cloud Functions do not check `email_verified`; only the browser guard does.
- **Customer count:** 0 verified live paying customers; five is the target.

## CUSTOMER VALIDATION & REVENUE READINESS SPRINT — 2026-10-12 (Claude, Anthropic)
Documentation and research only. Nothing was merged, deployed, installed, purchased, sent or published, and production stays at `3114840`. Sprint doc: https://claude.ai/code/artifact/e2590099-12eb-4eb7-a0c2-084afb0334bd. The Notion Command Center entry is dated 2026-10-12.

- **A · Authenticated QA:** 9 signed-in journeys from #37 are **unverified** because no QA account exists:
  - checks 6–12 in `docs/qa/return-url-and-intent.md`;
  - the signed-in pricing line;
  - the paid report and PDF.

  The sprint doc covers the setup and a 7-part authenticated QA script:
  - **Hestia mailboxes:** `qa-a`, plus `qa-b` with aliases `qa-b1`–`qa-b9`. If the `ifyoumind.com` MX isn't on Hestia, they go on a separate `qa.ifyoumind.com` mail domain, so existing mail and Hosting records are untouched.
  - **A dedicated QA Google account.** Firebase documents no Google test accounts.
- **B · Analytics:** the doc has an 11-item GA4 property checklist (Google signals, ads personalization, granular data, product links, retention, enhanced measurement, data sharing, DebugView).
  - **Compatibility:** #18 + #24 + #35 merge cleanly on master together (local trial: fast 57/57, functions 54/54, build passes).
  - **Consent:** #18 uses basic consent mode, so GA isn't loaded before Allow.
  - **Purchases vs clicks:** only the Stripe webhook counts as a purchase.
  - **Privacy policy:** its AI-provider sentence is inaccurate (no production AI). #12 fixes it and should ship before or with #18. The GA4 retention period must be added to the policy.
  - **Status:** #18 and #24 are still held.
- **C · Customer validation:** the recruitment approval package (screener, invitation, consent, scheduling, no-spend channel) is prepared and **not sent**.
- **D · Revenue:** the dashboard is defined. Its source of truth is Stripe live mode through `stripePayments` with `livemode=true`.

  **Missing data:**
  - `invoice.paid` renewals, refunds (`charge.refunded`) and disputes (`charge.dispute.created`) are not recorded;
  - there's no list for excluding test and QA workspaces.

  Recording these needs founder approval, because it touches the webhook. Entitlement logic would be unchanged.
- **E · Reconciliation against `3114840`:**
  - #26 now conflicts in `auth.guard.ts` (with #37's `loginParams`), and #12 conflicts too. Both need rebuilding on master with new commits, not force-pushes.
  - #18, #24, #27, #29, #30, #32, #33 and #35 merge cleanly.
  - Proposed order, each step separately approved: #33 → #26 → #12 → #35 → #18 → #24 → #29 → #30/#32.
- **Founder actions:**
  1. Hestia QA mailboxes and a QA Google account.
  2. Whether Claude gets QA credentials.
  3. The GA4 checklist and a retention choice.
  4. The refund policy (#12).
  5. The recruitment package.
  6. Stripe live: the webhook event list and identifying real customers.
  7. Release approvals.

## AUTOMATED QA INFRASTRUCTURE & REVENUE INTEGRITY — 2026-10-12 (Claude, Anthropic)
Nothing was merged or deployed, and production stays at `3114840`. No production users or data were created, changed or deleted. Stripe configuration was not touched.

**#38: automated authenticated QA** (`claude/jolly-ramanujan-ofr18a-qa-fixtures`, `c0e9894`, draft). CI is green on GitHub: the new `qa` job and `build`.
- **Fixtures F01–F10** run on the Auth, Firestore and Functions emulators (`demo-ifyoumind`):
  - real sign-up;
  - real verification-code consumption;
  - the real onboarding and decision callables;
  - a seeded Census cache;
  - targeted cleanup that refuses non-fixture accounts, and a leak check.
- **The run fails closed** if the emulators aren't local, the project isn't `demo-ifyoumind`, cloud credentials are present, or the bundle references `ifyoumind-473fe`.
- **Playwright: 32 scenarios × desktop and mobile = 64 tests, all passing.** They cover:
  - registration errors;
  - **the verification link opened in a separate browser, with the `$79` intent kept through the continue URL;**
  - the unverified gate;
  - protected routes;
  - return URLs (valid ones, plus 12 hostile ones);
  - a free decision;
  - saved retrieval;
  - cross-account denial;
  - the non-admin `/app/growth` view;
  - sign-out;
  - expired and invalid sessions;
  - layout, axe, console errors, and no external requests.
- **Integration suite:** 10 pass, 1 skipped until #26. The skipped test checks the server-side verification refusal.
- **New PR workflow `authenticated-qa.yml`:**
  - runs every emulator suite plus Playwright;
  - uses no secrets and has read-only permissions;
  - the rules, organizations and commerce suites had never run in CI before.
- **Production bundle check:** a new step in `launch-build-check.yml`. The deploy workflow is unchanged.
- **Behaviour changes:**
  - The emulator-only verification bypasses in the guard and register page are removed (dev and CI only; production unchanged).
  - `build:local` now writes to `dist/ifyoumind-local`.
  - Two fixes the new checks found: pricing "/month" contrast was 2.87:1, and account cards overflowed at 390 px with long email addresses.

**#26** (head `1bd38de`) now carries master and #37:
- The merge was a merge commit, not a force-push. The guard keeps both `ensureFreshVerification` and `loginParams`.
- The server-side emulator bypass `isLocalDemoEmulator` is removed.
- **Tests:** functions 52/52, fast 53/53, commerce 35/35.
- **Combined with #38:** e2e 64/64, and the QA integration suite 11/11 with the server check enforced.
- Still held for the QA account baseline.

**#39: revenue ledger** (`claude/jolly-ramanujan-ofr18a-revenue-ledger`, `2d4b699`, draft). It records renewals, failed renewals, refunds and disputes in `stripeLedger`:
- idempotent and out-of-order safe;
- a new dispute opens a billing review;
- **no access changes;**
- `stripePayments` gains `paymentIntentId`;
- `revenueSummary` counts genuine paying customers from live records only, excluding QA;
- `docs/revenue/founder-dashboard.md`.

**Tests:** functions 54/54, commerce 36/36. **Founder actions for #39:**
1. Select the new events on the live webhook endpoint.
2. Approve or decline a backfill.
3. Provide the exclusion list.

**Analytics compatibility** (local trial: #38 + #18 + #24 + #35, not pushed):
- **#24 conflicts with #38** in `register.component.ts`. The fix is mechanical: keep `sign_up` tracking and the always-verify flow.
- **Results:** fast 63/63, functions 54/54, e2e 63/64.
- **The failure is a real #18 issue:** on mobile the cookie banner covers the decision flow's "Show me what the data says" button until it's dismissed. Fix it before #18 ships.
- The local build never initialises GA, so this suite can't prove GA consent gating. #18's earlier production-config Chromium checks remain the evidence.

**Docs:**
- `docs/qa/automated-qa.md`: commands, environment variables, lifecycle, coverage matrix, CI and limitations.
- `docs/qa/production-qa-proposal.md`: least-privilege, allowlisted, dry-run-by-default production QA accounts plus an audit log. **Not built.**

**Remaining real-world gaps:**
- real email delivery and the hosted action page;
- Google OAuth;
- real Census data;
- live payments;
- Safari and real devices;
- intent across **devices** (only through the continue URL).

**Not tested anywhere:** the free 3-decisions-a-month limit, which the demo project skips. There is also no self-service account deletion.

## RELEASE: PR #38 AUTOMATED QA — 2026-10-12 (Claude, Anthropic): deployed and production verified (signed out)
Founder approved releasing PR #38 at reviewed head `c0e9894`.

**Pre-merge checks:**
- **Head and base:** the head was unchanged and master was still `3114840`; the merge was clean.
- **CI:** both `qa` and `build` were green.
- **Scope:** 28 files, matching the review.
- **Production bundles built from master and from the PR head and compared by content.** The only behavioural differences were:
  - the guard's `Pt||` (true only on localhost/127.0.0.1) and registration's localhost branch, both false on ifyoumind.com;
  - two CSS rules (pricing contrast and account-card wrapping).

  The master build hash `main-UEXL42XX.js` equals the previously live bundle, so the build is reproducible.
- **Emulator safety:**
  - every CI and emulator path uses `demo-ifyoumind` (Firebase demo projects never reach real resources);
  - the fixture guard refuses non-local emulator hosts, other project IDs and cloud credentials;
  - the CI job has no secrets and `contents: read`;
  - the deploy workflow is unchanged.

**Merged** as **`f98e19b`** (merge commit). **Deploy:** run 38306000061 (#180) succeeded at 20:47:31Z.

**Production smoke checks** (read-only, 20:49Z): **9/9 pass**.
- **Live bundle:** `main-B3S77CN4.js`, the build verified above.
- **Bundle contents:**
  - `ifyoumind-473fe` is present;
  - no `demo-ifyoumind`, `demo-api-key`, `qa.ifyoumind.test`, fixture password, emulator endpoint or Admin SDK marker.
- **Guard:** `a.emailVerified||e.url==="/profile"`, with no localhost exception.
- **Headers:** unchanged.
- **Pages:** 6 pages at 1280 and 390 px, with 0 console errors and 0 overflow.
- **Signed-out redirects:**
  - `/app/decide?…intent=report` keeps its returnUrl;
  - `/app/growth` has no returnUrl;
  - `//evil.example` stays on site.
- **Registration:** empty-form errors show.

**Remaining gaps:**
- Signed-in journeys in production, which need QA accounts.
- Real email delivery, Google OAuth and live payments.
- `/favicon.png` still serves HTML (#33 fixes it).
- `/login` and `/register` have a generic title.

## FOLLOW-UPS AFTER #38 — 2026-10-12 (Claude, Anthropic): all drafts
- **#40 free-limit tests** (`7a3d202`):
  - The demo-project exemption is removed, so the 3-decisions-a-month limit is enforced in the emulator.
  - The rule is now pure and unit-tested, with integration tests (4th refused with nothing written; earlier months don't count) and a browser test.
  - **Results:** functions 49/49, QA integration 12 pass + 1 skipped, e2e 66/66.
  - **Finding:** Pro's advertised "up to 50 decisions" is not enforced anywhere.
- **#39 revenue ledger audit** (`4fc0306`). Fixes:
  - refund-status ordering on its own clock;
  - one billing review per dispute;
  - **subscription refunds matched by Stripe customer**: sandbox records show Pro sessions and invoices have no payment intent on the current API version;
  - genuine-customer rule counting renewals against reversals;
  - `warning_closed` and `prevented` disputes are closed.

  Also adds `reconcileWithStripe` and the founder-run, read-only `scripts/reconcile-stripe.mjs` (needs an `rk_live_` key).
  - **Live records have not been compared,** because the connector reaches only the sandbox.
  - **Results:** functions 57/57, commerce 39/39, e2e 64/64.
  - Playwright output committed by mistake was removed in a follow-up commit.
- **#18 banner fix** (`66a55cb`), plus master merged:
  - The banner reserves bottom and scroll padding while open, with a compact layout at 560 px and below. Consent is unchanged.
  - New consent-banner spec at 320, 360 and 390 px.
  - Without the fix, 10 checks plus the mobile decision test fail; with it, the suite passes 78/78. Still held for GA4.
- **#41 account-deletion proposal** (design only): data inventory, retention, subscriptions, Stripe customer, disputes, a safe order (Auth user last), audit log and test plan.
- **#26:** unchanged, a draft until its baseline and verified-email gates are met.

**Holds unchanged:** #12, #18, #24, #26, #29, #30, #32, #33, #35, #39, #40, #41, R4/R5, advertising, outreach and AI.

## STATUS AFTER #38 ACCEPTANCE — 2026-10-12 (Claude, Anthropic)
**Production: verified.** Master and live are at `f98e19b` (PR #38, accepted by the founder as the production QA foundation).
- **Live bundle:** `main-B3S77CN4.js`.
- **Smoke checks:** 9/9 read-only checks passed at 20:49Z, all signed out.
- **Still unverified:** signed-in production journeys, email delivery, Google OAuth and live payments.

**Work this round (all drafts; nothing merged or deployed after #38):**
- **Live Stripe reconciliation** (#39, `scripts/reconcile-stripe.mjs`): founder-approved as read-only, **prepared but not run.** It needs the founder's live restricted key, so it can't run from here.
  - **Stripe safety:** a single GET-only fetch wrapper; it refuses non-`rk_live_` keys and keys that can read Customers; it prints only the HTTP status on errors, never the key or Stripe's message.
  - **Firestore and entitlements:** no Firestore write calls and no entitlement code loaded, proved by `test/reconcile-script.test.mjs`. Run it as a viewer-only account.
  - **Output:** `verified` matches and `discrepancies` are separate, with IDs and counts only.
- **#39 ledger** (`ab0c973`; CI green; security review found no issues):
  - **Customer fallback made conservative:** a refund or dispute is tied to a purchase only by payment intent, or by a Stripe customer with exactly one live payment in exactly one workspace. Anything else stays **unresolved for review**.
  - `genuinePayingCustomers` assumes every unresolved reversal applies; `payingCustomersNeedingReview` and unresolved refund amounts are reported separately.
  - **Tests:** functions 57/57, commerce 39/39, fast 54/54.
- **#40 free-limit tests:** CI green. Unchanged since the last round.
- **#42 Pro 50-decision allowance** (`93e923b`, built on #40; CI started by manual dispatch):
  - A transaction-reserved counter, so concurrent requests can't exceed the limit; failures give the slot back; the counter heals from stored decisions.
  - Period is the UTC calendar month, the same as Pro's included reports.
  - Covers mid-month downgrades and a grandfathering check; design in `docs/billing/decision-allowance.md`.
  - **Tests:** functions 50/50, commerce 34/34, e2e 66/66.
- **#41 deletion proposal** (`56411b3`):
  - Record retention is sourced from the IRS (3/6/7-year rules), CCPA (AG summary; statute text not fetched), GDPR 17(3), Stripe customer deletion (cancels subscriptions immediately), card dispute windows (120 days typical, up to 180) and Firebase recent sign-in.
  - Recommended defaults for the four decisions: payment records 7 years; Stripe customer link 180 days; anonymise legacy posts; a confirmation email before deletion; a 7-day undo window.
- **#33 favicon** (`cb61084`, master merged): built assets are real PNG and ICO files, the production bundle check passes, and fast tests pass 52/52. **Awaiting founder approval to merge.**

**Holds:**
- #26 (verified-email gates);
- #18 and #24 (GA4 property and consent review);
- #12, #29, #30, #32, #35, #39, #40, #41 and #42;
- R4/R5, pricing, outreach, advertising and AI.

**Next approval gates:**
1. #33 release.
2. Running the reconciliation with a live restricted key.
3. #40, then #42: check that no Pro workspace has more than 50 decisions this month.
4. #39, after selecting the webhook events.
5. The four deletion decisions and counsel on retention.
6. #26 after the QA account baseline.
7. #18/#24 after the GA4 review.

## RELEASE: PR #33 FAVICON — 2026-10-13 (Claude, Anthropic): deployed and production verified
Founder approved releasing PR #33 at reviewed head `cb61084`.

**Pre-merge checks:**
- **Head and base:** the head was unchanged, master was `f98e19b`, and the merge was clean.
- **CI:** green (`build` and `qa`).
- **Scope:** 7 files, all favicon-related:
  - `src/favicon.png` (64×64);
  - `public/favicon.ico` (16, 32 and 48 px);
  - `public/apple-touch-icon.png` (180×180);
  - an `apple-touch-icon` link tag in `src/index.html` and the guide generator;
  - `test/favicon.test.mjs` and a one-line allowlist in `test/guides.test.mjs`.

**Merged** as **`7c02795`** (merge commit). **Deploy:** run 38448419661 (#181) succeeded at 18:42:56Z. The main bundle is unchanged (`main-B3S77CN4.js`), as expected for static assets.

**Production checks** (read-only, 18:47Z): **8/8 pass**.
- **`/favicon.png`:** 200, `image/png`, 4,187 bytes, PNG signature, 64×64. The md5 matches the build (`b82ab645…`).
- **`/favicon.ico`:** 200, `image/x-icon`, 4,833 bytes, ICO signature, 3 sizes. The md5 matches (`55b66a56…`).
- **`/apple-touch-icon.png`:** 200, `image/png`, 180×180. The md5 matches (`8d362712…`).
- **No HTML fallback:** none of the three bodies is the SPA HTML.
- **Link tags:** the homepage and guide pages carry the icon and apple-touch-icon links.
- **Headers:** security headers unchanged.
- **Pages:** `/`, `/login`, `/register`, `/sample-report` and `/privacy-policy` load at 1280 and 390 px with 0 console errors and 0 overflow. Each page requested `/favicon.png` and got `image/png`.
- **Redirects:** signed-out redirects keep the return URL.

**Remaining issues:**
- `/login` and `/register` have the generic title "ifYouMind" (cosmetic; pre-existing).
- Signed-in production journeys are still unverified (no QA accounts).

**Holds unchanged:** #26, #39, #40, #42, #18, #24 and all others.

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
