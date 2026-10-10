# ifYouMind — Master Project Record and Roadmap

**Updated:** 2026-10-10  
**Repository:** https://github.com/alwat83/ifyoumind  
**Website:** https://ifyoumind.com  
**Notion:** https://app.notion.com/p/3eb02474659c81ecba55cc4eed184a71  
**Purpose:** Living project context for the founder and all current/future development agents.

> **Project boundary and authorship:** ifYouMind and Dose Ninja are entirely separate projects. The founder confirms **all ifYouMind development through 2026-10-10 was performed using OpenAI (ChatGPT/Codex) tools and agents**. Claude, Gemini and other providers have **not** contributed to ifYouMind. Specific OpenAI agent/session ownership of individual commits may not be determinable from GitHub metadata; do not guess.

> **Status discipline:** planned ≠ committed ≠ merged ≠ deployed ≠ production verified. GitHub commits are implementation evidence, not proof of a working live release. Historical Notion architecture is not necessarily the current shipped product.

## 1. Vision and positioning
ifYouMind is becoming a general-purpose AI-powered data intelligence and decision platform, replacing the original social/idea-feed positioning. Combine trusted public datasets and, later, user-authorized data sources to produce understandable comparisons, actionable insights and **evidence-backed Decision Reports**. Make complex data accessible to consumers and businesses, with national/global examples rather than a Birmingham-only identity. The business goal is sustainable near-term revenue and a reliable product ready for marketing.

## 2. Stack and architecture
Historical repository/Notion records describe Angular 19.x, TypeScript, Tailwind/SCSS, AngularFire/Firebase Auth, Firestore, Firebase Functions (Node 20), Firebase Hosting and Stripe. Verify exact installed versions and runtime settings from current manifests. Earlier foundation work introduced organization membership, authorization and tenant isolation, local Firebase emulators, metrics/evidence contracts and connector job abstractions. Preserve authentication, per-tenant data boundaries, provenance and server-side secret handling.

## 3. Implemented/committed milestones (production validation separate)
- **2026-09-30 foundation:** OpenAI/Codex branches `codex/ifyoumind-2-foundation` and `codex/ifyoumind-2-contracts` documented organization authorization, rules/emulator tests, metrics/evidence and connector contracts. Historical documentation records commits `b40cbee`, `9b5519a`.
- **2026-10-03 consumer rebuild:** [PR #1](https://github.com/alwat83/ifyoumind/pull/1) merged to `master` with 275 commits, replacing the legacy site with a consumer-first public experience, authentication, guided decision flow, consumer results, pricing and data upload, while preserving intelligence backend.
- **Stripe:** 2026-10-03 `13c9977` updated the production workflow for a Stripe commerce webhook. October 9 commits added self-service billing portal session/client/UI and related function deployment wiring (`6f399d6`, `9738403`, `cfc1ad3`, `bf7619c`, `743fb34`, `06173a1`). Actual checkout/portal/entitlement production behavior still needs verification.
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

## 7. Known technical debt and risks
The September 30 repository audit reported tracked `functions/node_modules`, a bundle over budget, baseline lint errors and test compilation issues. Reassess current state before declaring these unresolved. Other risks: API quotas and licensing, data freshness, evidence mislabeling, auth/tenant isolation, billing entitlement drift, secrets exposure, deployment failures, mobile conversion friction and duplicated agent work.

## 8. Verification checklist
- [ ] Confirm current `master` HEAD, relevant GitHub Actions run results and deployed Hosting/Functions revision.
- [ ] Run fresh build/tests; inspect baseline lint, bundles and dependency hygiene.
- [ ] Smoke test authentication, Decision Reports, source coverage, Census live calls and failure states.
- [ ] Smoke test mobile layouts, pricing, checkout, Stripe webhook, paid access and billing portal.
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
- [Notion project hub](https://app.notion.com/p/3eb02474659c81ecba55cc4eed184a71)
- [Notion Alpha Architecture](https://app.notion.com/p/3eb02474659c81e69b5eee89a8b120c7)
- [Notion Repository Audit](https://app.notion.com/p/3eb02474659c81388ce6c013301a3292)
- [Notion Organization Authorization](https://app.notion.com/p/3eb02474659c8144a068cc030cd5e3b5)
- [Notion Metric/Evidence Contracts](https://app.notion.com/p/3eb02474659c8160834df25c3bca34ec)

**Maintenance:** Keep this record current after meaningful releases; preserve historical milestones and distinguish planned, committed, deployed and verified. Never commit credentials or personal customer data.

## 11. FRED integration and security audit — 2026-10-10
- **Provider:** OpenAI/ChatGPT tools; individual agent session unspecified.
- **Branch:** `codex/fred-economic-indicators`; **draft PR:** [#2](https://github.com/alwat83/ifyoumind/pull/2). Status **committed**, not merged/deployed/production verified.
- **Implementation:** authenticated Firebase callable `getFredEconomicIndicators` backed by server-side `FRED_API_KEY`, source metadata, validated FRED observations and a one-hour per-instance cache. CPIAUCSL is a **CPI index**, not an annual inflation percentage. Exports and explicit production deployment allowlist added, but no release executed.
- **Evidence:** founder Mac verified `npm --prefix functions run build` PASS and `npm --prefix functions test` PASS **25/25** at commit `1a7c78c`, including three FRED parser tests. An earlier Angular build passed; no live authenticated FRED request verified.
- **Security automation:** commit `d0b088b` adds `.github/workflows/dependency-audit.yml` to audit production dependencies on PRs and master pushes, with separate app/Functions artifacts and high-severity failure. **Workflow execution/results not yet verified.** Prior install output reported 94 app and 23 Functions vulnerabilities across all dependency classes; production-only severity counts unknown.
- **Release gates:** inspect audit artifacts and remediate relevant high/critical findings; review quotas and caching across instances; verify real FRED response, authentication and failure handling; check GitHub Actions; only then merge and verify Firebase production. Merging `master` triggers the production workflow.
