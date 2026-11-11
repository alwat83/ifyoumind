# ifYouMind Life: consumer experience and public beta package

**Status:** research, specification and prototype only, approved by the founder on 2026-10-14.
- Nothing is built in the app, launched, or deployed.
- No one has been contacted.
- No analytics has been changed.
- Business is untouched, and its $79 and $39 prices are unchanged.

**Prototype (private, illustrative figures):** https://claude.ai/artifact/UPMV7T95KFu2zNEziiepXS. Source: `life-beta-prototype.html` in this folder.

**Evidence:** [Appendix A: data sources](appendix-data-sources.md) and [Appendix B: demand and alternatives](appendix-demand-and-competitors.md). Both are cited; items not verified at the source are marked.

---

## 1. Consumer product vision
**The problem:** a person facing a real choice, such as two job offers in different cities, has two kinds of help today:
- **Calculators** that convert one salary between two cities using one index. Housing is buried inside that index, the commute and personal priorities are left out, and many of these tools are run by publishers that earn from affiliate deals or lead generation (unverified).
- **Chat answers** whose numbers can't be checked and carry no dates.

Neither says when the honest answer is "it depends on what you value, and here is exactly how."

**What Life does:** you bring a question and your own numbers. ifYouMind adds dated official data, shows what is fact, estimate or yours, applies your priorities, checks whether the answer survives small changes, and says plainly when there is no clear winner. Then it gives the next real-world checks to make.

**Why people would use it rather than search or a chatbot:**
- **Two real options side by side,** each with its own salary, rent and commute.
- **Your numbers win.** Every figure can be overwritten.
- **Every number has a label and a source.** Price levels come from the BEA (2024 data, released Feb 2026), rents from Census ACS (2020–2024) and wages from BLS. Nothing is invented.
- **The verdict depends on your priorities and must hold up when they shift.** Otherwise the page says "no clear winner".
- **No sign-up wall, no ads in results, no affiliate steering, no lead capture.**

**First decisions it can credibly support:**
1. **Compare two job offers or locations** (the MVP).
2. **Is moving cheaper?** The same engine with one salary.
3. **Higher rent vs shorter commute.**

Each new decision type ships only when its data and its claim checks are ready. Medical, legal, credit, investment and insurance decisions stay out without a separate review.

**Why people would come back** (hypotheses, to measure):
- **The offer changes:** a counter-offer, a different start date, or a real rent quote replacing the estimate.
- **A third option appears.**
- **A partner wants to see it,** and runs the comparison with their own priorities.
- **The next decision follows the move:** rent vs commute, then rent vs buy.

## 2. Public-facing design: entry alternatives
| Option | What it is | Pros | Risks | When |
|---|---|---|---|---|
| **A. A dedicated `/life` (recommended for the beta)** | Static, crawlable landing page `/life/`, plus the tool at `/life/compare-job-offers` | Business homepage, SEO and conversion untouched. Clean measurement. Can be shown to study participants | Discovery depends on its own SEO and sharing | Beta |
| B. Two doors on the homepage | "For your business" / "For your life" above the fold | Exposes Life to existing traffic | Dilutes Business conversion, and changes a page you said not to replace yet | Only as an A/B test after A has data |
| C. Consumer-first brand homepage, with Business at `/business` | Life becomes the main public face | Fits the broader brand if B2C wins | Business SEO and paid-report conversion at risk. Needs redirects and canonical work | Only if beta evidence clearly favours it |

**How to decide (validation method):**
1. Run A for 6–8 weeks after launch.
2. Compare consumer completions and Search Console impressions with Business decision starts.
3. If Life's completions consistently exceed Business starts, test option B as a small homepage link or band, measured against Business checkout starts, before considering C.

The founder decides whether a single footer or nav link to `/life` is acceptable during the beta.

**Technical note:** the app serves one shell page with one title for every app route (seen in today's production check). That's why `/life/` must be a **pre-rendered static page**, like today's `/guides/`, to be discoverable.

**Mobile-first screens** (all in the prototype):
1. **Landing:** "What are you trying to figure out?" with one input, a filled real example, and only supported decisions enabled.
2. **Read-back of the two options, then three short clarifying questions:** housing size, whether the move is paid, and what matters most.
3. **Numbers:** prefilled estimates, each tagged; your edits always win.
4. **Result:** the verdict first, then money per month, priorities sliders, "Where these numbers come from", and "Before you decide".
5. **Share:** a copied summary that leaves out salaries and rent unless you turn them on.
6. **Save:** an account is offered only here, for saving and coming back.

## 3. Customer journey
**Steps:** search result, shared summary or direct visit → landing (with the example) → options confirmed (1 tap) → 3 questions → numbers prefilled (the user edits 2–6 values) → verdict → evidence (optional) → next steps → share (optional) → save with an account (optional).

**Targets for the beta, to calibrate:**
- First useful answer in **under 2 minutes** using the defaults, and **under 5 minutes** with the user's own numbers.
- **No more than 8 fields** before the result.

## 4. Initial MVP: the smallest credible public beta
| Item | Specification |
|---|---|
| **Supported use case** | Two options in US metro areas (387 BEA metros; places outside metros use the state nonmetro value, flagged): stay or move, or offer A vs offer B. English, desktop and phone |
| **Required inputs** | Two places; salary for each; housing cost for each (prefilled from ACS median gross rent by bedrooms); commute minutes for each; tax share (prefilled with a rough federal plus FICA estimate, single filer, standard deduction, labelled; state and local "not included" unless entered) |
| **Optional inputs** | Monthly commute cost; relocation covered; moving cost; 1–5 ratings for career growth and for family nearby; 0–5 priority weights |
| **External sources** | BEA RPP (2024); ACS 5-year B25031 and B25064 (2020–2024); IRS and SSA 2026 constants. Later: BLS OEWS "is this offer typical?", ACS commute defaults, HUD FMR as a second rent benchmark |
| **Calculations (deterministic, in the browser)** | Take-home = salary × (1 − tax share). Left after housing = take-home − housing. Buying power = left after housing ÷ (non-housing price level ÷ 100). The non-housing composite needs confirming against BEA's published components; if it can't be built from published data, use all-items RPP and disclose the overlap with rent. Priority score: each criterion is scaled 0–1 within the pair and weighted by the user's 0–5 sliders |
| **Verdict rules (same as the evidence engine, #46)** | A verdict only with the user's own priorities. It must hold when any single weight moves one step either way, otherwise "no clear winner". Money gaps under 5% are flagged as small, because estimates and real quotes could reverse them; this is a reading aid, not a significance test. No "best city" |
| **Evidence presentation** | Every figure is tagged Fact, Estimate, Yours or Calculation. Source lines give the publisher, table, data year and release date. Required notices: BEA credit, Census API notice. BEA's own caveats are shown: price levels, not cost of living; no year-to-year comparison; whole-metro average |
| **Privacy** | Inputs never leave the device: no server call carries them and nothing is stored. Analytics, if approved, records only step names and coarse outcomes (for example "verdict: no clear winner"), never amounts or places, and only with consent |
| **Security** | Static files only: no new Cloud Function, no anonymous backend, no AI, no Firestore access. That rules out denial-of-wallet through Functions or Firestore, and no App Check is needed for the beta. Existing CSP and headers apply |
| **Cost** | One static data file (roughly 40–60 KB for 387 metros plus a place list of about 30 KB) and the tool bundle. Firebase Hosting transfer has a free daily allowance, then about $0.15/GB (to confirm against current pricing). Even 10,000 visits a month at about 0.5 MB each is about 5 GB. **Expected cost per completed decision: a fraction of a cent** |
| **Accessibility** | WCAG 2.2 AA. 44 px targets. Every input labelled. Sliders show their numeric value and are keyboard operable. Contrast checked in both themes. Reduced motion respected. Plain-language reading level |
| **Mobile performance** | Landing page under 100 KB and static. Tool route lazy-loaded with a JavaScript budget of about 150 KB gzipped. LCP under 2.5 s on a mid-range phone on 4G. Works offline after load |

**Not in the MVP:**
- free-text understanding by AI (the question box maps only to the supported decision; the options are confirmed by the user);
- share links;
- saved comparisons;
- state tax calculation;
- occupation wage checks.

## 5. Data architecture
```
Publisher bulk files (BEA RPP CSV, ACS 5-year, IRS/SSA constants, OMB delineations)
  → build script  scripts/build-life-data.mjs   (run by hand when a source releases; reviewed in a PR)
  → life-data/v2024.json  { metros: {cbsa: {rpp, rppGoods, rppServicesExHousing?, rent1br, rent2br, rentMoe…}},
                            places: [{name, state, cbsa}], provenance: [{source, table, dataYear, released, retrieved, url}] }
  → served as a static file by Hosting (long cache, versioned name)
  → browser: lookup → calculation → evidence objects (fact / estimate / user / calculation) → verdict rules
```
- **Evidence model:** the same object types and rules as the evidence engine (#46), used in the browser. Before release, the claim checker grades the beta's sentence templates in CI: a verdict without criteria, ranking inside a small gap, causal or certainty words. Long term, the engine moves into a package shared by Functions and the app.
- **Provenance:** every published figure carries source, table, data year, release and retrieval dates. These appear in "Where these numbers come from".
- **Refresh:** annual for each source (BEA around December or February, ACS around December or January, IRS each autumn). A stale-data banner appears if a source is more than 18 months past its data year.
- **Security:** no secrets are involved; bulk files need no API keys. Generated data is reviewed in PRs, like code.

## 6. Organic acquisition plan
- **Quality over volume.**
  - **At launch:** the tool page, plus 3–5 pages that each answer a real question with computed, sourced figures. Candidates: two offers worth it?; salary needed to match; housing gap by metro; commute value; moving for a job: what the data says.
  - **No mass city-pair pages at launch.** Pair pages come later, and only for pairs with Search Console evidence and genuinely useful content.
- **Measurement first:** use Search Console for the domain (check whether it's already set up for Business), and Google Trends to compare phrasings. No search volumes are claimed until measured.
- **Sharing loop:** the summary is built for a partner or family member. Relocations are often declined over family and partner issues (Atlas 2024: 34% and 30%). Copied text first. Revocable links later, needing a separate review of storage and expiry.
- **Earned links:** the annual "most and least expensive metros" page, tied to BEA's release, and a "Moving for a job: what the data says" page built from Census reasons for moving.
- **Not without separate approval:** community posts, outreach, ads, or partnerships (for example with career coaches).

## 7. Traction scorecard: the first 100 meaningful completed decisions
**A meaningful completed decision means all of these:**
- the verdict screen was shown;
- at least 2 values were changed from the defaults (the user's own salary or housing);
- the session had human interaction;
- it is not QA, a bot, or the founder or team.

**Counting** (privacy-conscious, consent-gated):
- **Without analytics consent:** count anonymous completion events with no identifier. Report them as **completions**, not people.
- **With consent:** a random first-party ID stored in the browser and reset every 90 days, reported as **estimated unique browsers**. Never claimed as unique people.
- **No inputs are ever sent:** no salary, place, rent or free text.
- **Exclusions:** a QA flag set by test tooling, known bots by user agent, and sessions with no pointer or key interaction.

| Metric | Definition | Starting target (hypothesis) |
|---|---|---|
| Completed decisions | As defined above | **100** (milestone) |
| Start → complete | Completions ÷ sessions that answered the first question | ≥ 40% |
| Time to first answer | Median from landing to verdict | < 3 min |
| Understood the result | 1-question check after the verdict: "Which numbers were estimates?" (optional) | ≥ 70% correct |
| Share rate | Summary copied ÷ completions | ≥ 10% |
| Return | Estimated browsers completing again within 30 days | ≥ 10% |
| Second decision | A different decision type, or a third option, started | Tracked once a second type exists |
| Optional accounts | Accounts created to save ÷ completions | Tracked; no target in beta |
| Cost per completed decision | Hosting cost ÷ completions | < $0.01 |

**Kept separate from Business metrics:** a separate consumer event namespace, and no mixing with founder revenue metrics.

**A realistic path to 100** (an estimate, not a forecast):
- At 40% start-to-complete and 15–25% of visitors starting, 100 completions need about **1,000–1,700 visitors**.
- **New pages earn search traffic slowly,** typically over weeks to months. Early completions will come mostly from:
  1. the founder's approved network and the 6-person study participants, who don't count toward the 100 while the study is running;
  2. sharing among their partners and friends;
  3. Search Console-driven improvements.
- **Expected timeline:** 6–12 weeks after launch. **Highly uncertain.**

## 8. Monetization hypotheses (no new paid offer without approval)
- **The core comparison stays free.** It is the acquisition engine and the trust signal.
- **Hypotheses to test later, in order:**
  1. **Saved comparisons and history:** free with an account. This drives return use and enables the next item.
  2. **A one-time "relocation decision pack"**, priced later: a detailed report with an occupation pay check (BLS OEWS), both partners' priorities, a moving-cost worksheet and a checklist. This reuses the Business report pipeline.
  3. **A premium tier later,** only if repeat use is shown.
- **Never:** ads in results, affiliate-driven recommendations, lead selling, artificial urgency, or paywalls that hide the verdict.
- **Testing willingness to pay:** an honest "Would this be worth paying for? Tell me when it exists" prompt that states clearly it isn't available. Founder approval needed. Stated interest is never counted as demand.

## 9. Implementation plan
| Component | State | Effort (agent days, plus founder review) | Dependencies |
|---|---|---|---|
| Verdict rules, sensitivity check, small-gap flag | **Prototype**, and the **draft** engine #46 | 1–2 (port to a shared TS module with tests) | #46 merge (approved separately) |
| Claim-checker evaluation of the beta's sentence templates | **Draft** #46 | 1 | #46 |
| Data build script plus `v2024.json` | **Research** (Appendix A) | 2–3 | Confirm the BEA table names and the non-housing composite; Census notice wording |
| Place → CBSA lookup | **Research** | 1 | OMB delineation and Census relationship files |
| Static `/life/` landing page | **New** (reuses the guides build) | 1–2 | Founder: entry option A, and whether to add a nav link |
| `/life/compare-job-offers` lazy Angular route (screens 1–5) | **Prototype** | 4–5 | Design review |
| Consent-gated consumer events | **New**; GA4 consent mode already exists | 1–2 | Privacy review |
| Privacy Policy and Terms updates (consumer use, estimates, no inputs stored) | **New** | 1, plus counsel | Counsel |
| e2e tests (desktop and Pixel 7), accessibility checks, bundle budget | **New**; the harness exists | 2 | — |
| Save comparison (account) | **Later** | 3 | Rules, quotas, deletion design |
| Share links | **Later** | 2–3 | Storage, expiry and revocation review |

**Total to a private beta:** about 3 weeks of agent work, plus review. It is one small PR per row, each separately approved, with no rewrite.

**Security dependencies:**
- **None for the anonymous MVP,** because it uses no backend.
- **Saving and sharing need:** verified email (#26), App Check (plan ready), quotas, and deletion.

**Risks:**
- **Wrong geography match.** Mitigation: confirm the place and show the metro used.
- **Tax estimate taken as advice.** Mitigation: labelled, editable, and never presented as a calculation.
- **Slow SEO.**
- **Thin-content risk** if pair pages are rushed.
- **Consent reduces measured traffic.** Report the counts as minimums.
- **BEA lag and annual non-comparability.** Disclosed on the page.

## 10. Founder decisions before implementation or launch
1. **Entry strategy:** approve option A (`/life`) for the beta. Decide whether a footer or nav link from the Business site is allowed.
2. **Data scope:** the BEA, ACS and IRS/SSA set for the MVP; the rough federal plus FICA tax estimate (single filer), with state tax "not included" unless entered.
3. **Validation:** approve the 6-person consumer study using this prototype (recruitment, wording and moderator to be approved, as for Business).
4. **Build approval:** the implementation rows above, one PR at a time, starting with #46 (already approved as the foundation) and the data build script.
5. **Measurement:** consent-gated consumer events, the "meaningful completed decision" definition, and the scorecard targets.
6. **Privacy and legal:** Privacy Policy and Terms updates, and counsel review.
7. **Later:** share links, saved comparisons, and any paid consumer offer.
8. **Public beta launch:** a separate approval after the study and QA.
