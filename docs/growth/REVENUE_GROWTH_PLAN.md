# ifYouMind Revenue Growth Command Center

Observed 2026-10-22, OpenAI / Codex. Owner: founder; technical execution: authorized development agents. Repository/GitHub are authoritative; synchronize milestones to the existing Notion hub. This is the standing commercial plan required by root `AGENTS.md`. Update the scoreboard weekly when working on the project; this document does not create a scheduled automation.

## Objective and authority

Acquire five independently paying customers within the next 30 days, then establish a repeatable acquisition channel with positive contribution economics. **This is a target, not a claim that there are currently zero or five customers.** Existing independently paying customer count and revenue are unknown. Founder confirmation that purchases work is capability evidence, not a financial ledger.

Prioritize paying customers → revenue/conversion → faster discovery-to-value → retention/repeat purchases → cost discipline → directly supporting functionality. Consumer acquisition remains part of the vision; preserve the working Business offer. No speculative Life calculator release. Founder approval is required for production/master merges, pricing/Stripe changes, spending, transactions, external communications and major strategic changes. Draft work and analysis may proceed independently.

## Verified commercial model and delivery boundaries

Source: `functions/src/intelligence/monetization.ts`, `market-report.component.*`, `pricing.component.*`, and `growth-metrics.ts`, reviewed 2026-10-22.

| Offer | Configured terms | Commercial use |
|---|---|---|
| Free | 3 decisions/month; 1 comparison city | Experience a Decision Brief before buying |
| Decision Report | $79 one-time per report; up to 3 comparison cities | A specific location decision, plan-ready narrative, evidence, action plan, copy/print |
| Pro | $39/month; 50 decisions/month; up to 3 comparisons; 5 included full reports per UTC calendar month | Repeated research; include only when the customer's usage supports it |
| Public sample | Complete example without registration | Demonstrate output before asking for account creation |
| Consumer guides | Search-focused education; integrated candidate contains 4 guides, 9 sitemap entries | Acquisition; label unfinished data/Life tools accurately |

Prices are configured presentation, not proof of live Stripe price objects or actual receipts. No pricing/configuration change proposed. Pro's five included reports are an existing founder-approved term; at full allowance use, $39/5 = **$7.80 gross per included report before costs**. This arithmetic is a capacity/margin risk to measure, not realized unit economics or a recommendation to change price.

The present Business output provides Census-backed city context, sources, limitations and comparison support. It does not establish site-level competition, rent, customer demand, a revenue forecast, loan eligibility or investment suitability. ACS estimates have uncertainty and comparison constraints; the Census guidance supports those evidence limits, not willingness to pay. [Census comparison guidance](https://www.census.gov/programs-surveys/acs/guidance/comparing-acs-data.html). The SBA's planning resources establish a relevant business-planning context, not validated demand for this product. [SBA planning overview](https://www.sba.gov/counseling/plan-your-business/).

## Actual funnel and audit findings

Discovery (search/guide/referral) → homepage or public sample → registration and verification → free brief → relevant $79 upgrade / repeated-use Pro → authenticated Stripe Checkout → webhook-confirmed payment and entitlement → report / print / repeat use / billing portal.

- Public sample and existing copy-as-text work without a customer account. On this growth branch, a lower-page **Print / save this sample** control reuses the existing browser print function. Existing first-screen recommendation and registration CTAs are preserved. This is development-only until approved; conversion benefit remains a hypothesis.
- Authenticated first-party events include app open, decision creation, report/pricing views, checkout start, return/cancel and billing portal. Public guide/sample qualified visits and completed free experiences are not equivalent to these events. Legacy optional GA route/dwell instrumentation operates under the existing consent policy; do not change consent to fill measurement gaps.
- Checkout is organization-authorized; report checkout needs an owned project, and duplicate entitlement checks exist. Webhooks record successful payment/entitlement independently of a browser return. Demo/emulator tests validate contracts; no real payment initiated.
- `stripePayments` is keyed by Checkout session and records mode, amount/currency, offer and paid time. `getProductFunnelMetrics` excludes configured QA/owner identities and separates live/test. It is not a complete accounting ledger: subscription renewals, refunds, fees and total costs need reconciliation. Its recent-window query is capped at 5,000 records; record completeness before using totals.
- Hosting currently runs version `f91311de8f35458e` (release `1792026155391000`, October 15). Integrated #60 is a separate unmerged release candidate; growth work must not alter it. Final #60 head `2eb17081f2feaa40163255a6c7de5a57f67f76b7` has build and QA SUCCESS. [Release decision evidence](../releases/2026-10-22/integrated/FINAL_DECISION.md).
- Core sources include cached Census evidence and deterministic report logic; optional AI paths exist. Runtime limits include instance, import and query caps. Actual infrastructure/AI spending, model usage and invoices are unknown; source configuration does not prove zero cost. No provider, credential, model or dependency change made.

### Five largest obstacles, ranked by current evidence

These are ranked operational obstacles, not quantified causes of lost sales; visitor/customer interviews and funnel data are unavailable.

| Rank | Verified observation | Commercial implication / hypothesis | Resolution and evidence needed |
|---|---|---|---|
| 1 | No accessible, correctly scoped revenue/conversion baseline: Stripe connector authentication retries returned no accounts; Search Console lists no sites; analytics has no selected ifYouMind property | Cannot distinguish a distribution, conversion or retention bottleneck, or verify independent customers | Founder/account administrator restores correct scope; reconcile paid live transactions and refunds, excluding QA/founder/test; no account cross-contamination |
| 2 | Acquisition/mobile/SEO candidate #60 is not approved or live | Proposed improvements cannot affect public conversion until authorized | Founder reviews exact green head and accepts documented risks; approved deploy and live smoke are separate tasks |
| 3 | This audit has no verified qualified distribution pipeline or demonstrated channel conversion | More content alone may produce no buyers; search demand and willingness to pay remain unvalidated | Founder-approved targeted conversations/demos and tagged referrals; count decision-makers with an active decision, not impressions |
| 4 | Personal results require registration/verification; public sample lacked an explicit print control | Buyers may struggle to evaluate the paid deliverable before committing effort; abandonment impact is unknown | Safe sample print improvement now; measure sample → registration → free completion → paid, then interview abandoners with approval |
| 5 | Checkout ledger alone omits renewals/refunds/fees/cost attribution; repeat-use/retention baseline unknown | Gross sales could obscure poor margin or Pro under/over-utilization | Reconcile billing/costs weekly; measure fulfilled reports, repeat orders, subscriber retention and support time before expansion |

## Target segments and channels

1. **Near-term primary hypothesis:** a small-business owner actively comparing U.S. cities for an opening/expansion and needing demographic context for a business plan. Qualify by a current decision, compatible geography/data needs and willingness to review the sample. $79 is the initial one-off offer; no prediction/financing guarantees.
2. **Secondary repeat-use hypothesis:** an independent advisor, consultant or multi-location operator with recurring comparisons. Demonstrate actual output and evidence limits; Pro only when repeat usage fits. No claimed partnerships or paying accounts.
3. **Acquisition audience:** job-offer/relocation decision-makers and people comparing their own data. Existing guides provide checklists; unsupported calculators/uploads must remain explicitly in development. Do not sell unavailable capabilities.

Priority channels: founder-approved direct conversations and product demonstrations for fast feedback; existing owned contacts only with approval and appropriate context; approved referrals to advisors/business-planning communities; high-intent organic guides after release. Prepare outreach drafts without sending. Paid ads, purchased lists, new subscriptions, large integrations and broad speculative consumer tools are deprioritized until demand and unit costs are measured. No search-volume, competitor-price or CAC estimate was verified in this assignment.

## Ranked 30-day execution plan: October 22–November 20, 2026

| Priority / window | Action / output | Impact, effort, confidence | Measurement and decision rule | Dependency / risk |
|---|---|---|---|---|
| 1 / days 1–3 | Founder decision on #60; reconnect scoped metrics; reconcile baseline | High enabling value; small execution; high confidence that measurement is needed, revenue effect unknown | Record exact deployed version only after approval; complete baseline or explicit missing fields; never count test transactions | Founder approval and account access; no merge/deploy now |
| 2 / days 1–3 | Draft and test tangible sample-print improvement and buyer demo script | Medium hypothesized conversion value; small; medium usability confidence, low revenue confidence | Desktop/mobile keyboard, print layout, accessibility and existing $79 CTA pass; then compare qualified sample users progressing to free/paid | Separate stacked draft PR; does not block/extend #60 |
| 3 / days 4–10 | Founder-approved 10 qualified conversations and 5 short demos (activity targets) | Highest direct learning/revenue potential; medium founder time; low demand confidence until observed | Ask about an actual decision, alternatives, sample usefulness and $79 willingness to buy; record objections and verified independent buyers. If no relevant need emerges, narrow/revise segment before building | Approval before every externally authorized campaign; no automated sends or discounts |
| 4 / days 8–20 | Repeat the best validated message; one existing business-location guide/landing-page experiment; prepare 3 relevant referral introductions | Medium near-term value; small/medium; low until interviews | Track tagged qualified visits → completed brief → confirmed purchase; five interviews are directional, not statistically significant. Stop generic content expansion if traffic lacks relevant decisions | Approved release and communications; no paid distribution |
| 5 / days 15–30 | Review fulfilled reports, approved feedback, repeat decisions and fit for Pro; reconcile weekly costs | High retention/margin value after purchases; small recurring; medium mechanism confidence | Target five unique independent paying buyers by day 30; document offer/currency/refunds and support cost. If missed, report the gap and strongest observed bottleneck; do not manufacture transactions | Correct billing scope; founder approval for customer contact; never count founder-funded trials |

The recommended commercial assignment after the release decision is a **scoped baseline plus founder-approved five-demo validation sprint**, not another broad feature build. Safe drafts and engineering proceed while those decisions wait.

## Experiment queue

| Rank | Hypothesis / artifact | Expected near-term impact | Effort / confidence | Measurement / stop condition |
|---|---|---|---|---|
| 1 | Active-decision demos produce more relevant buying evidence than broad feature work; [draft scripts](FOUNDER_OUTREACH_DRAFTS.md) | Potential direct $79 purchases; no forecast | Medium founder time / demand confidence low | Independent confirmed purchases, objections and useful sample assessments; requalify segment after 10 conversations with no relevant need |
| 2 | Letting prospects print the complete sample makes the deliverable easier to evaluate | Conversion opportunity, amount unknown | Small / usability medium, revenue low | No-auth print usability first; subsequent tagged sample cohorts and paid outcomes. No invasive tracking or claims of lift before data |
| 3 | A business-location evidence page attracts compatible intent | Qualified organic acquisition; slower feedback | Small using existing guide / demand low | GSC impressions/clicks and qualified free/paid cohorts after access; revisit if irrelevant queries dominate; no invented search volume |
| 4 | A requested second decision predicts Pro fit and repeat revenue | Retention opportunity after real customers | Small / low until usage observed | Repeat purchases, active paid subs, included-report usage, cancellations/refunds and support time; do not upsell against customer needs |
| 5 | Cache/usage observation reveals avoidable report costs | Margin improvement, amount unknown | Small audit first / medium | Verified bills and attributed usage; no infra migration unless savings exceed operational risk |

Use sequential cohorts and qualitative evidence at low volume; do not claim A/B statistical significance without sufficient data. Report denominator, attribution window and missing consent/source data with every conversion rate.

## Weekly revenue scoreboard

Week **2026-10-19 through 2026-10-25 UTC**. Observation: 2026-10-22. Every value below is **unknown**, not zero. Tool access checks do not establish sales or traffic. Update this same table for the current week and append a dated prior-week snapshot here when rolling forward; preserve history. Never put customer PII, tokens or raw payment details in Git/Notion.

| Metric | Actual | Definition / authoritative source / limitation |
|---|---|---|
| Qualified visitors | Unknown | Unique human visits with relevant decision intent, scoped analytics + campaign context; define qualification and consent gaps; no selected property |
| Completed free decision experiences | Unknown | Successfully persisted usable free brief, not signup/click; first-party project/event reconciliation; exclude QA/founder/demo |
| Checkout initiations | Unknown | Successfully created Checkout session, separately from click/checkout_started event; dedupe session ID; correct product/org scope |
| Successful paid purchases | Unknown | Settled/succeeded live payments with paid entitlement, not redirect/test; scoped Stripe + webhook ledger; reconcile renewals separately |
| Independently paying customers | Unknown | Unique external buyers with their own funds; exclude founder/team/QA/refunded test arrangements; minimize retained identity data |
| Active paying subscribers | Unknown | Live paid, current service period; exclude trial/unpaid/canceled-with-expired-access; reconcile subscription status and invoices |
| Gross revenue | Unknown | Successful live receipts before refunds/fees, separately by currency and one-time/renewal; never sum mixed currencies |
| Refunds | Unknown | Actual refunds in period, distinguish payment cohort and partial refunds; Stripe reconciliation required |
| Payment fees | Unknown | Actual balance-transaction fees by receipt/currency; no generic percentage assumed |
| Infrastructure costs | Unknown | Firebase/Google Cloud invoices and attributable usage, separate fixed/variable; shared-cost allocation explicitly documented |
| AI costs | Unknown | Verified provider invoices/usage attributable to ifYouMind; no assumption of zero from optional code paths |
| Estimated contribution margin | Unknown | Gross − refunds − payment fees − attributable variable infrastructure/AI costs; missing component means unknown; not net profit |

Source access evidence: fresh Search Console list returned `[]`; analytics account listing exposed no selected ifYouMind property (unrelated properties were not queried); Stripe account-list tool repeated an authentication retry response without returning accounts. Restore scoped access through [analytics source selection](https://app.hypd.ai/sources?utm_source=mcp&utm_content=none_selected). HYPD audit/research tools also reported plan restrictions; no upgrade/purchase requested. Existing founder dashboard is implemented, but no production dashboard totals were obtained this session. No business metric has been inferred from test fixtures.

## Targets, costs and retention

- Five $79 one-time purchases would be **$395 gross**; five $39 subscriptions would be **$195 monthly gross at that point**, before refunds, fees, costs, tax treatment and churn. These are conditional arithmetic scenarios, not forecasts or current MRR. Track actual mix and collection; repeatable acquisition requires more than one small cohort.
- New cash-spend budget currently authorized: **$0**. Existing hosting, payment, AI and founder-time expenses are unknown, not free. Do not buy ads/tools or assume standard Stripe fees. Gross margin is not profit: fixed operating expenses, founder labor and taxes require separate treatment.
- Record time to first useful brief, report fulfillment/print issues, repeated decisions, Pro utilization, cancellation/refund reasons and support time. Draft useful follow-up questions; contact customers only after founder authorization. Avoid building retention automation before evidence of repeated need.
- Before expanding included reports or infrastructure, reconcile cost per fulfilled report and cost per active paying workspace. Keep existing cache/quotas/security boundaries. Optimize verified cost drivers, not assumed ones.

## Immediate execution and handoff

Implemented on the isolated growth branch: permanent mandate and Business Impact reporting; this command center and outreach drafts; explicit no-registration sample print action with desktop/mobile regression coverage. [Desktop sample offer](evidence/sample-print-desktop.png) and [mobile sample offer](evidence/sample-print-mobile.png) were captured against demo emulators and visually reviewed. Exact test outcomes, commits and PR links belong in `CURRENT_STATUS.md` and the append-only development log. Revenue lift, new customers and profitability remain unverified. Next: founder release decision, restore scoped measurement, then approve and run a small buyer-validation sprint.


## Revenue execution sprint — verified October 22 follow-up

[Founder Revenue Action Brief](sprint-2026-10-22/FOUNDER_REVENUE_ACTION_BRIEF.md), [20 public-signal prospects](sprint-2026-10-22/PROSPECTS.md), [five personalized invitations/demo agendas](sprint-2026-10-22/PERSONALIZED_OUTREACH_DRAFTS.md) and [buyer-validation tracker](sprint-2026-10-22/BUYER_VALIDATION_TRACKER.md) prepared. No communications sent, demos scheduled or purchases independently verified by this sprint. Twenty named buying groups are research targets, not twenty confirmed buyers. Top five have named multi-city plans; direct owner routes and willingness to pay remain unverified. Four transparent business-routing requests are ready for founder approval. Proposed seven-day schedule is October 23–29, with first conversations taking precedence over speculative functionality.

Existing authorized production access now provides a partial baseline: this UTC week has two raw events (one app-open, one report-view); trailing 30 days has 99 events, 11 decision-created, six checkout-start and one checkout-return. No automated QA rule matched, but explicit founder/manual QA exclusions are missing. These counts are unclassified activity, not qualified visitors, completed experiences or independent buyers. `stripePayments` contains zero documents; three October 9 webhook markers are processed, without mode/amount available. No zero-revenue inference. Stripe reconciliation still blocked; billing enabled but project has no accessible BigQuery datasets, and actual invoices/costs are unknown. Keep financial scoreboard values unknown. [Sanitized evidence](sprint-2026-10-22/production-evidence.json).

PR #60 remains exact green head `2eb17081f2feaa40163255a6c7de5a57f67f76b7`, founder execution gate held. #62 remains separate at `91b5fb71e093f38ca9c7cb6e05b773c6446b866a`, manual exact-head QA SUCCESS (94 browser cases). No application changes in this commercial package. Newly requested consumer homepage redesign is a separate feature/draft review; it must preserve available/upcoming disclosures, existing $79/$39 Business paths and this buyer-validation loop. No pricing, customer communications or deployment authorization inferred.
