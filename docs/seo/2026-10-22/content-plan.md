# Decision-intent content — 2026-10-22

OpenAI / Codex. Related [#56](https://github.com/alwat83/ifyoumind/issues/56). Prepared on `codex/decision-intent-guides`, stacked on technical SEO draft #58. Not published or deployed. These are proposed intent targets based on the decision a reader needs to make; keyword volume, ranking difficulty and conversion lift have **not** been measured.

| Guide / intent | Reader outcome | Original contribution / product path |
|---|---|---|
| `/guides/compare-job-offers-relocation/` — comparing offers when moving | Build a manual evidence sheet, distinguish gross pay/benefits, obtain quotes, identify constraints and unresolved assumptions | Invented offer/commute/housing table, questions to ask, sensitivity checklist. Explicitly says Life comparison is in development. Business sample is labelled as a separate available example. |
| `/guides/choose-business-location-evidence/` — evidence before a lease | Separate a city shortlist from a site commitment and distinguish demographic context from customer demand | City-versus-site evidence table, invented permitted-use scenario, field checks and decision note. Primary CTA remains the working Business sample/free brief. |
| `/guides/compare-options-with-your-own-data/` — flexible comparison / decision matrix | Define compatible criteria, preserve sources and missingness, and explain judgements without a false winner | Invented workshop-room evidence table, overlap/units checks and review triggers. Manual workflow; no claim of an available dataset-upload tool or calculator. |

The existing business-plan market-analysis guide remains unchanged. Guides index broadens to all four articles; homepage footer adds the index while retaining its market-analysis link. Public sample report adds a business-location checklist and guide-index link without removing any report/pricing/signup path. No auth, pricing, entitlements, analytics or financial engine changes.

## Sources and editorial boundaries

Primary sources reviewed 2026-10-22:

- BLS employer compensation categories: https://www.bls.gov/charts/employer-costs-for-employee-compensation/costs-per-hour.htm — wages versus benefits; no current aggregate figures republished or used as an individual's package value.
- BEA regional price parities: https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area — regional/year context, not a household quote. No unsupported city cost-of-living recommendations.
- SBA market research and location guidance: https://www.sba.gov/counseling/plan-your-business/ and https://www.sba.gov/counseling/launch-your-business/ — current destinations verified after older business-guide URLs redirected.
- Census small-business research resources: https://www.census.gov/topics/business-economy/small-business/about/powerful-data.html — further research, not a claim that ifYouMind integrates every source.
- Scottish Government multi-criteria guidance: https://www.gov.scot/publications/central-functions-social-security-agency-location-analysis-phase-1-phase/pages/9/ — scoring can be optional, judgements and sensitivity must be visible; original public-policy context acknowledged.
- UK multi-criteria manual: https://www.gov.uk/government/publications/multi-criteria-analysis-manual-for-making-government-policy — reference for more formal methods, not validation of a personal recommendation.

All new numeric examples are explicitly invented; no fabricated statistics, testimonials, keyword metrics or automatic winning location. No mass-generated city pages, personal tax estimates or public links to the experimental Life calculator. Existing guide template continues to emit static Article/Breadcrumb JSON-LD and self-canonical metadata. Content is source-cited original guidance, not copied source text.

## Validation and release gates

Fast tests 87/87 PASS (including guide metadata/links/clear product limitations), production/local builds and production-bundle guard PASS, changed HTML ESLint PASS. Guide count increases from 1 to 4; generated sitemap increases from 6 to 9 canonical URLs. All 6 new-guide browser checks PASS (3 articles × 390/1280px): correct canonical metadata, working Business link targets, explicit development disclosures, no page overflow, and 0 WCAG A/AA axe violations. Screenshots are saved in `guides/`. Two representative mobile/desktop captures were visually reviewed. All guide bodies are static HTML and remain available without JavaScript.

Before release: founder editorial/availability review, exact-head CI, approval of the underlying #58 routing/artifact changes, and separately authorized merge/deployment. #54, #49, #57 and #58 have independent evidence and approval gates. No publication inferred from a successful build.

After an authorized deployment, verify new guide/index URLs and canonicals, Article/Breadcrumb JSON, keyboard/table scrolling, sitemap count and all Business CTA paths. Once correct properties are accessible, establish organic landing → working Business feature → completed decision → checkout → verified purchase baselines under the existing consent policy. Treat any conversion/traffic improvement as a hypothesis until measured.

Rollback: revert only the approved content commit and rebuild to remove its static pages and sitemap entries; retain #58's routing/metadata fixes unless independently reverted as a unit. No billing configuration change is part of rollback.
