# ifYouMind: useful in seconds, credible enough to pay for

November 6, 2026 · OpenAI / Codex; specific model/session unknown. **Product audit and proposed execution requirements. No application redesign implemented by this assignment.** This package answers the founder's “Make ifYouMind an Irresistible Product” brief, following source inspection and fresh public-journey observation.

## Decision

Keep automatic discovery as the product foundation. The near-term opportunity is to make **one useful comparison, its proof and the next sensible action** unmistakable. Preserve free household discovery; give the existing paid Business product an equally concrete demonstration. Do not rebuild the platform or imply that four demographic measures can choose a business location.

The highest-impact next product slice is **Business report proof in one screen**, specified in [CODEX_BACKLOG.md](CODEX_BACKLOG.md#recommended-next-assignment-business-report-proof-in-one-screen). Start that slice by reproducing and correcting the observed print defect; then add a concise, data-derived sample digest using existing report fields. This is one existing-report experience, not new research infrastructure. This assignment prepares the slice; implementation and release remain separate statuses.

## 1. Verified baseline

| Surface | Evidence and state | Limits |
|---|---|---|
| Production | Fresh GitHub master `e5d8f15fb9171a3723fdfc324dd0066d8d5caf5e`, PR76. Existing [deployment/Hosting evidence](https://github.com/alwat83/ifyoumind/blob/9fd6673a343690277ded473fe835d36cebdeaddd/docs/releases/first-seconds-production-20261106/LIVE_VERIFICATION.md): run42143112840/Hostingf76d7036fa558cf7 | Hosting release API not refreshed this assignment; fresh public UI observation below confirms current visible behavior, not every deployed backend revision |
| Design draft | PR77 OPEN/DRAFT/MERGEABLE at `9b0b2787cefd4c3953796be6b18e3fdad8060b4c`; original021/8c6 ancestry preserved | Not merged/deployed; new “Your bills, made clearer” findings and spotlight remain development-only |
| Draft engineering | Fresh [build 42297006341 SUCCESS](https://github.com/alwat83/ifyoumind/actions/runs/42297006341) and [QA 42297006429 SUCCESS](https://github.com/alwat83/ifyoumind/actions/runs/42297006429); individual QA steps inspected | Existing independent runs observed, not rerun; no invented new aggregate CI count |
| Current public journey | Fresh Chrome desktop1280×900/mobile390×844: homepage, public sample, electricity findings, report-intent registration, guarded pricing/app redirects;12route observations | Public read-only review, no signup, email, real checkout or authenticated production report opened; no physical-device/Safari/spoken-reader or participant validation |
| Sample and print | Public sample fetched successfully in both final profiles; real Census metrics, illustrative coffee-shop question. Fresh Chrome A4 and Letter export inspection | The endpoint may refresh its existing public cache; no private project/entitlement write. Initial probe timed out before final successful captures; not classified as a production outage. Print findings below are scoped to captured Chrome exports |
| Auth/commercial app | Source/routes/guards/server entitlement logic plus fresh successful authenticated emulator/commerce/rules CI steps | This is implementation/CI evidence, not proof of a live independently funded purchase or an exhaustive security/Stripe audit |

[Machine-readable live observation](LIVE_OBSERVATION.json) contains headings, paths, sample facts and scope. [GitHub observation](GITHUB_OBSERVATION.json) pins master/draft/CI. [Screenshot hashes](asset-manifest.json) identify the captures. Internal QA is excluded from customer/traffic/revenue measures.

### What actually exists

- **Free browser-local discovery:** two explicit USD CSV adapters (property tax/electricity), ready-made synthetic examples, deterministic findings, exact cells/calculations, correction/refusal/retry/clear. No prompt, account or backend upload for this island.
- **Public Business sample:** one illustrative specialty-coffee decision comparing Austin, Nashville and Charlotte with actual Census figures. Complete report, source links, action plan, comparison takeaways, business-plan text/copy and browser print/save PDF. It is not an interactive arbitrary-city guest query.
- **Authenticated Business:** email verification/Google path, saved decisions, Census U.S. place matching, a free brief with primary city plus one comparison; full report with up to three comparisons. Free limit 3 decisions/month; Pro 50 decisions/month, five included full reports/month. Entitlements are enforced server-side.
- **Commercial infrastructure:** $79 single report, $39/month Pro, Stripe checkout/portal/webhook and fulfillment implemented. Return messaging checks access. No financial record refresh or new purchase evidence in this audit.
- **Other data journeys:** guarded CSV/data/ask/advanced routes exist separately. “Explore my own data” explicitly says it is not used in Decision Reports. Do not represent them as the browser-local bill discovery or as arbitrary-file automatic intelligence.
- **Not available through the public promise:** arbitrary documents/PDFs/scans, unconstrained AI research, private server file discovery, external bill benchmarks, site-level rent/competitors/foot traffic, business demand forecasting, optimized location selection or statistically tested Census differences. Some broader capabilities have code/planning elsewhere; that does not make this public promise available.

## 2. Candid experience audit

Severity is a product judgment from inspected behavior, not measured abandonment or customer complaints.

| Finding | Evidence | Consequence | Recommended action |
|---|---|---|---|
| **The free wow and paid value are disconnected** | Home leads with “Two bills. One clear story.” Business/sample/prices appear lower down; household discovery supplies no paid Business analysis | Bill users may see no relevant reason to pay, while Business visitors first see a different task | Two truthful entry paths under one identity; never force household users into a Business upgrade. Show the Business sample as its own useful product |
| **Sample proof takes too much reading** | Fresh mobile sample is 9,051 px high (desktop 5,459 px). First viewport shows CTA/banner/question/nav and the beginning of a long summary; detailed tables repeat facts in several places | The product asks users to assess a long report before making the value obvious | A short trade-off digest with directly labeled figures and one-action evidence; keep full report accessible, not deleted or hidden behind signup |
| **A premium deliverable has a visible print defect** | Captured A4 and CSS-sized Letter exports are7 pages. Backgrounds-on export has a large dark area on final page; default backgrounds-off Letter retains its sources without the dark tail. A4 page3 ends on “Property cost context,” with text on page4 | Directly undermines promised print/save-PDF quality; existing click/print-media tests do not verify rendered pagination | Reproduce locally with public/sample fixture, isolate print/body/host backgrounds, keep headings with following content, verify full rendered Letter/A4 output with backgrounds on/off before proposing release |
| **The $79 value is narrower than the language suggests** | Report derives population, median household income, median home value and two-vintage population change; narrative is deterministic and lightly business-contextualized | “Should I open here?” and “get your question answered” can imply evidence the report does not contain | Sell a sourced demographic comparison and reusable market-analysis draft; clearly state what remains unresolved |
| **Pricing invites an obvious comparison** | $39/month includes five reports; $79 buys one with no subscription. Already-unlocked Pro reports remain unlocked after cancellation | A skeptical buyer can rationally choose Pro even for short-term work; copy cannot manufacture a unique analytical advantage for the $79 report | Present both plainly: one-time payment/no recurring commitment versus recurring plan/five included reports. No hidden cheaper plan, price/entitlement change or invented premium $79 content |
| **“Live data” obscures vintage and cache** | Public sample header says “Sample · live data,” dated October 11. Underlying ACS estimates are2020–2024/2015–2019; sample/cache logic reuses saved payloads and may fall back stale | A visitor may read “live” as current economic conditions or freshly regenerated analysis | “Public Census estimates” plus dataset period and genuine retrieval/report date; never reset dates from today's render or claim real-time data. Legacy saved sample text still exists |
| **Current evidence restraint is valuable** | Summary explicitly refuses a location recommendation; source count says it is not certainty; small-gap heuristic is disclosed and significance untested | Trust can differentiate the experience if presented plainly and early | Preserve these boundaries; replace confidence gauges with evidence scope/known/unknown labels |
| **The custom-question affordance exceeds the analytical range** | Decision form accepts a free question and examples such as apartment purchase, but source analysis takes places and concept; it does not choose a method from the question | Novices may mistake a stored question for an open-ended answered question | Explain supported analysis at entry; suggest scoped questions (“How do these cities compare on income and population?”). No chatbot-style answer animation |
| **Commercial handoff is protected but long** | Sample→registration→verification→two context steps→free brief→pricing→checkout. Report intent is already preserved | Value has to survive several transitions; do not call this a broken funnel without user evidence | Keep intent/return protections; use clear next-action copy and preserve context. Do not remove verification or implement guest checkout speculatively |
| **Measurement is partial and easy to misread** | Organization events exist; `checkout_success` is emitted on a success URL return. UI correctly labels checkout→return despite internal `checkoutToPaid` name. Discovery has CSP connect-src none/no analytics | Reported purchase conversion would be wrong if derived from return events; anonymous-demo funnel cannot currently be reconstructed | Preserve payment-ledger separation; manual first-use counts first, optional coarse public-page events only within existing consent controls; no analytics added to private discovery |
| **No validated paid audience or result yet** | Dated financial/launch scoreboard is scoped; no participant study/independent purchase refreshed here | “Users will pay” and “saves hours” remain hypotheses | Demonstrate the deliverable to relevant plan writers when testing/outbound resumes; observe what they actually reuse and which uncertainty it resolves |

[Mobile live homepage](screenshots/mobile-home.png) · [mobile sample first screen](screenshots/mobile-sample-fold.png) · [sample full](screenshots/mobile-sample.png) · [report-intent registration](screenshots/mobile-register.png) · [print contact sheet](screenshots/sample-print-contact-sheet.png) · [Letter backgrounds-on final page](screenshots/print-letter-backgrounds-last-page.png) · [Letter default final page](screenshots/print-letter-default-last-page.png). These are current baseline captures, not proposed designs or customer behavior.

## 3. Vision and defensible positioning

**Product definition:** ifYouMind turns supported data into clear comparisons, traceable findings and practical next steps.

**Suggested public lead:** “See the story. Check the evidence.” Supporting promise: “Understand what changed, compare what matters, and see what to check next.” This evolves the founder's “Stop guessing. Start knowing.” into an inspectable action. That phrase can remain an aspirational brand line, but should not imply certainty, real-time data or an automated right answer.

**Interaction signature:** a clear finding → the exact values behind it → its boundary → a useful next check. Use the same pattern across supported categories without pretending the data products are interchangeable. Automatic discovery remains the entry model; users should not have to invent prompts to see value. The broader question→evidence→analysis→insight→decision vision is a direction, not a claim that arbitrary questions are answered today.

**Identity:** retain the existing warm paper, ink, lavender and lime visual vocabulary. Lavender frames the main comparison; lime marks exploration, not “good” or a winning city. Reserve stronger chart colors for meaningful selected measures. Quiet evidence disclosures, readable numeric typography, source periods and considered empty/failure states make the product recognizable. Earn delight from discovering a real difference, not confetti or simulated thinking.

| Advantage | Real today | Defensibility assessment |
|---|---|---|
| Inspectable exact arithmetic/source cells in bills | Yes, plus correction/clear and deterministic rerun | Useful trust workflow; can be copied. Strengthen with curated correctness/recovery evaluation rather than claim a moat |
| Structured, repeatable sourced city comparisons | Yes within Census/place/schema limits | Integration/QA/reuse advantage; public datasets themselves are not proprietary |
| Exportable narrative, comparisons and next-research checklist | Yes; print defects need repair | Real deliverable advantage when it fits a customer's task; premium value must be demonstrated |
| Statistical confidence, category-specific demand research, prioritized recommendations | Not supported by current public report | Requires methodology/data/engineering approval; cannot be supplied by a label or model-generated prose |
| Cross-dataset/private-data discovery at broad scale | Direction and some separate infrastructure | Not today's acquisition claim; no connector expansion without a demonstrated use case |
| General superiority to chatbots or search | Not established by this audit | Compare workflows and effort on a real task; do not claim competitors cannot cite, calculate or export |

## 4. Proposed homepage with actual copy

A copy/layout proposal, not a released homepage or instruction to replace PR77. Keep existing SEO, accessible navigation, free and paid paths, sources/format disclosure and production performance boundaries. First mobile viewport should contain one useful result and a working primary action, not this whole page's explanation.

| Position | Proposed copy / behavior |
|---|---|
| Navigation | ifYouMind · For business · Sign in · Try an example |
| Eyebrow | A clearer next step starts with evidence. |
| H1 | **See the story. Check the evidence.** |
| Supporting line | See what changed in two bills—or explore the public data behind a business location decision. |
| Primary demonstration | Two compact native example selectors: Electricity / Property tax. Keep actual supported arithmetic visible immediately, made-up badge persistent |
| Electricity finding | **Your bill rose 21%. Your energy use rose 10%.** / $120→$145.20 ·600→660kWh |
| Tax finding | **A $420 increase. $240 came from school charges.** / $4,200→$4,620 · school$2,400→$2,640 |
| Proof action | **Show me the numbers** → existing arithmetic, then exact source in full findings. “These figures show the difference, not why it happened.” |
| Main CTA | **Explore this free example** → existing selected /discover/?example=…; “No account. No prompt.” |
| Secondary path | **Making a business decision? See a full sample report.** → existing /sample-report. Visible as a clear secondary route, not a generic upgrade from bills |
| Own data | **Try your own bill CSV** / “Two supported USD formats. Processed in this browser tab. No PDFs or scans.” |
| Business section | **A clearer comparison. A useful first draft.** / “Compare U.S. cities using Census estimates. Get sourced market context, a market-analysis draft and a checklist of what to verify next.” |
| Business proof | Actual sample income/growth comparison derived from retained official report payload; “City-level context. Not business demand, competition or rent.” |
| Business CTA | **Explore the full Business sample** / “Real Census estimates. Example decision. No account.” |
| Offer lead | **See the deliverable before you choose.** Free brief /$79 one-time report /$39 monthly Pro with five included reports, each scoped plainly |
| Closing | **One useful finding is a good place to start.** / **Try an example** |

Do not place a five-question wizard in front of results. Do not auto-scroll, autoplay a video, delay figures for animation, claim that a source count measures certainty, or show a global “best city.” Keep the default immediately useful with JavaScript active and readable error/unsupported states when data cannot load. Use purposeful reduced-motion-safe transitions only between user-selected states.

## 5. Detailed first-use demonstrations

### Everyday discovery: already supported, improve continuity

1. Landing already shows the made-up electricity comparison. Visitor may switch to tax; both values, units and provenance update together.
2. One action opens the matching existing full example. PR77 already improves the results presentation; do not rebuild its engine.
3. Tap a figure to inspect exact math and source cells. The finding and limitation stay attached. Allow keyboard return.
4. Optional correction shows how changed inputs invalidate the old finding; rerun is explicit. Do not imply the example is a user's file.
5. Clear returns to the category chooser and removes data/expanded evidence. No signup or irrelevant paid interruption.
6. Natural share action initially uses an existing public example URL; private CSV content never becomes shareable by default. A copy control would be a proposed small feature, not currently shipped.

### Business proof: proposed, using the existing public sample

**Question:** “How do these cities compare for a business plan?” Subline: “An example specialty coffee shop decision. The figures describe residents, not demand for coffee.” Do not retain “Which city should I choose?” as an answer this evidence can settle.

**First response, visible without interaction:** “Austin has the highest household income here. Charlotte has the largest estimated population change.” Display $93,658 Austin income;5.4% Charlotte change, with the correct separate units/periods and all three cities' directly labeled values nearby. These are the observed sample values, not constants for implementation. Show a small-gap/untested warning for the population comparison immediately, not only after opening proof.

**Choose a lens:** Household income / Population change. The selected view updates an existing-data chart or compact comparison rows. No new request, ranking method or model. Higher income is higher income, not a better business opportunity. Growth compares2015–2019 with2020–2024 ACS 5-year population estimates; it is not annual or statistically established growth.

**Inspect:** “Show the source” exposes official table/variables, data periods, report's actual retrieval/generated date and the report's existing uncertainty text. Source count is citation completeness, not confidence. Missing data is unavailable, never0.

**Next check:** “Before choosing a location, verify demand, competitors and site costs.” Link to the existing action-plan section. This is the appropriate recommendation from the present evidence: a research action, not a city verdict.

**See the deliverable:** “Read the market-analysis draft” jumps to the included full section, with copy/print controls. Full public sample remains available. Do not lock this proof or add a pretend paywall.

**Apply to my decision:** “Start a free brief for my cities” preserves existing account/verification/context journey. Nearby factual offer copy explains the single-report and Pro options. Do not create an actual Stripe session before an authenticated project and explicit customer action.

**States:** loading states name the real sample request; no decorative multistep “AI research.” Existing deadlines/retry/offline/unavailable states persist. A stale fallback remains marked with its saved date, never silently promoted to new/live results. Tiny/tied/reversed/missing values use neutral copy; two ACS point estimates cannot establish cause or a winner. No user-adjustable “priorities” weights until a defensible method is separately specified.

## 6. Premium report specification

See [REPORT_SPEC.md](REPORT_SPEC.md) for component order, source/date rules, comparison behavior, print acceptance, supported recommendations and non-goals. Premium means a deliverable the reader can inspect, adapt and use; length is not value. No model rewrite, generic confidence score, new data collection or PDF ingestion is necessary for the first slice.

## 7. Conversion strategy

**Buyer hypothesis:** an independent founder preparing a business-plan market section or an adviser repeatedly assembling city comparisons. Stronger task fit than casual bill users or people seeking an investment verdict. These audiences are hypotheses, not validated willingness to pay; no competitor/pricing market research or new outreach performed.

**Why consider paying:** “A sourced comparison and editable market-analysis draft for your chosen U.S. cities, with an action plan, evidence limits and print-ready output.” Show the full public sample first. The paid value is the assembled reusable deliverable, not proprietary Census numbers, an AI answer, guaranteed hours saved or a lender-endorsed plan.

**What uncertainty is reduced:** which selected city has higher/lower demographic measures, by how much, for what geography/period; what evidence to gather before a site commitment. **Not resolved:** whether the business will succeed, customer demand, a lease decision or financing readiness.

**Current offers, unchanged:** Free brief: primary+one comparison, three decisions/month. $79 report: one project, primary+up to three comparisons, no subscription. $39/month Pro: five included reports/month and up to 50 decisions, renews until cancelled; unlocked reports stay unlocked. Explain both honestly; don't imply one-time content is superior, conceal the less expensive plan, invent an annual commitment or change prices/entitlements. If this structure confuses relevant buyers after demonstration, bring actual observations to a separate founder pricing decision.

**Where to convert:** Business sample after a visible useful comparison and concrete deliverable proof; unpaid own brief after its own evidence is visible. Preserve report intent/project identity across auth/pricing; confirmation comes from entitlement, not the URL. Do not put a $79 upsell in a household electricity insight.

**Return reason:** reopen a saved decision, copy the analysis into a plan, verify missing local evidence and compare another genuine candidate. Existing report persistence supports some of this. Do not promise automatic data refresh, collaborative editing, notes, reminders or monitoring that do not exist.

**Sharing:** start with the public sample/source anchors and public synthetic examples; preserve provenance and limits. Proposed clipboard summary must include selected cities/measure/period and public URL, never private CSV cells, organization/project IDs or invented success stories. No backend public sharing of customer reports in this plan. A share action is not a recommendation or referral outcome.

## 8. Success framework and execution

[MEASUREMENT.md](MEASUREMENT.md) defines denominators, exclusions, existing instrumentation, proposed events and stop rules. [CODEX_BACKLOG.md](CODEX_BACKLOG.md) specifies the three phases, scope, effort, dependencies, acceptance and verification per initiative. These are planning/engineering acceptance targets, not forecasts or observed conversion results.

Top three product improvements: **(1)** Business proof-at-a-glance plus verified print quality; **(2)** coherent evidence-first entry paths that show household and Business value separately; **(3)** transparent deliverable/offer comparison and context-preserving commercial handoff. Start with the first, beginning with the confirmed print defect. Review existing PR77 independently; its now-green checks do not grant release authority or justify mixing these new requirements into it.

## 9. Direct answers to the founder

1. **What prevents exceptional?** The paid task is harder to see than the free demo; its sample is dense, the exported output has a reproduced defect, and the question language outruns a four-measure demographic product. No amount of motion proves $79 value or demand.
2. **What earns “wow”?** One surprising, accurate trade-off visible immediately—followed by one tap proving it. For Business: higher income in one city, larger estimated change in another, and a clear explanation of what that cannot decide. For bills: money and usage changing differently.
3. **What convinces a skeptic to pay?** A full sample they can inspect and actually reuse, correctly scoped to their chosen cities, dependable print/copy, sources/dates and a useful missing-evidence checklist. We have not established that this bundle commands $79. Do not paper over the $39 Pro alternative.
4. **Which three changes first?** The proof/print slice, coherent entry paths, then honest offer/handoff clarity; full requirements in backlog.
5. **What to avoid?** Another chatbot, broad file/connector/PDF ingestion, unsupported best-city recommendations, confidence meters, fake generation, more homepage art before the paid proof is clear, and elaborate anonymous tracking. Do not rewrite reliable auth/billing to shorten a funnel without evidence.
6. **Strongest positioning?** “Clear comparisons. Traceable evidence. A practical next step.” Specific current examples underneath. Broad vision above, available task boundaries below.
7. **Why share?** A concise useful finding someone else can inspect. Make public examples/source-linked sample sections easy to pass along with limits; never turn private files into public viral content.

## Source map

Local paths are reviewed on134a4d1/9b0b278; cited production architecture files below are unchanged from master unless identified as draft. Refer to exact master in GitHub when implementing against production.

- `src/app/app.routes.ts`, `auth.guard.ts`, `auth/register/*`, `purchase-intent.ts`, `return-url.ts`: routes, verification, context/intent.
- `src/app/intelligence/public-landing.component.{html,ts}`, discovery controllers/helpers/findings and `firebase.json`: live entry vs isolated browser-local island; PR77 findings are draft-only.
- `market-report.component.{html,ts,scss}`, `market-report-mobile.component.scss`, `market-analysis.component.{html,scss}`, `evidence-summary.ts`: report rendering, proof, print and uncertainty.
- `functions/src/intelligence/market-intelligence.ts`, `market-analysis.ts`, `report-entitlement-logic.ts`, `monetization.ts`: deterministic Census analysis, cache/sample/data periods and entitlements/prices.
- `src/app/intelligence/{product-analytics.service,pricing.component}.ts`, `functions/src/intelligence/{product-analytics,growth-metrics}.ts`, growth-dashboard template: event semantics and payment/return distinction.
- `e2e/specs/{sample-report-demo,sample-report-mobile,sample-recovery,registration,return-url,decisions,release-readiness}.spec.mjs`, `functions/test/{market-analysis,report-entitlement-logic,stripe-commerce-logic}.test.cjs`: existing behavior coverage; rendered PDF defects are outside current click-only print proof.
- [Growth plan](../../growth/REVENUE_GROWTH_PLAN.md), [measurement readiness](../../growth/MEASUREMENT_READINESS.md), [automatic-discovery foundation](../AUTOMATIC_DISCOVERY_PROPOSAL.md), [PR77 review](https://github.com/alwat83/ifyoumind/blob/9fd6673a343690277ded473fe835d36cebdeaddd/docs/design/discovery-value-20261106/REVIEW.md): scoped business evidence, privacy, product direction and current draft.
