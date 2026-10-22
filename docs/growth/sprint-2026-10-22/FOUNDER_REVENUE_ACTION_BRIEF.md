# Founder Revenue Action Brief — October 22, 2026

**Prepared, not contacted.** Twenty named buying groups researched; five personalized invitations/demo agendas ready for review; [editable tracker](BUYER_VALIDATION_TRACKER.md) initialized. No sales, demos, purchases or willingness to pay have been verified by this sprint. [Full roster and primary evidence](PROSPECTS.md); [unsent messages and routing requests](PERSONALIZED_OUTREACH_DRAFTS.md).

## Release decision

**GO for founder approval of #60; NO-GO for execution without that approval.** Exact latest head `2eb17081f2feaa40163255a6c7de5a57f67f76b7`, OPEN/DRAFT/MERGEABLE; [build](https://github.com/alwat83/ifyoumind/actions/runs/39834974901) and [QA](https://github.com/alwat83/ifyoumind/actions/runs/39834974902) SUCCESS on that head. No enforced required checks reported; both defined workflows pass. Existing package includes 22 reviewed screenshots, source inclusion audit, Business/SEO checks, 92 browser cases and measured contrast fix. Existing global lint 91 errors / Angular compiler 11 diagnostics remain disclosed; physical iOS/Safari, native PDF export, manual screen reader and post-deploy checks remain unverified. [Original decision/rollback brief](../../releases/2026-10-22/integrated/FINAL_DECISION.md).

#62 stays separate at `91b5fb71e093f38ca9c7cb6e05b773c6446b866a`, OPEN/DRAFT/MERGEABLE. Its [manual exact-head QA](https://github.com/alwat83/ifyoumind/actions/runs/39840028543) passed 94 browser cases and backend suites; production/local builds and sample-print review were completed earlier. Permanent commercial instructions and sample-print improvement await subsequent founder review; neither is silently added to #60. This sprint changes research/handoff documents only. New consumer homepage redesign requested during this sprint will use another branch based on #60; it is not included in either authorization.

Current live Hosting still `f91311de8f35458e`, release `1792026155391000` on both production domains; refreshed evidence in `release-gates.json`. Nothing merged/deployed/rolled back. Exact release authorization proposed: **“Approve merging PR #60 at `2eb17081f2feaa40163255a6c7de5a57f67f76b7` and its automatic Hosting, Firestore rules/indexes, Storage rules and listed Functions deployment, accepting the disclosed existing lint/Angular debt and verification limits. Keep Stripe unchanged and experimental Life calculations excluded.”** Rollback authorization is a separate decision; recheck the live target before release. A later redesigned homepage requires its own review and cannot inherit this approval.

## Five strongest initial prospects

“Strongest” means evidence of a compatible planning question, not confirmed buying intent. Read the source and requalify the current decision before contact. All direct owner addresses remain unverified; four transparent business-routing requests are prepared. No paid lead enrichment, scraped private contact list or purchased data used.

| Priority | Prospect | Why this fits | First demo question |
|---|---|---|---|
| P01 | Marilyn and Matt Willson / Skiptown | Public five-unit plan explicitly evaluates Austin-area communities for 2027 | Does comparing Austin, Cedar Park and Pflugerville help before neighborhood/site research? |
| P02 | Viren Patel / Flying Biscuit | Current Greenville site search plus stated interest in two other NC cities | Are Fayetteville/Jacksonville still relevant future comparisons? |
| P03 | Grant McDowell / Jeremy Press / Jason Twitty | Six-location plan across three SC cities; first planned 2027 | What decisions remain after selecting Rock Hill first? |
| P04 | Yasir and Aleeza Nadeem / Slim Chickens | Three named California cities and a planned 2027 first opening | Would a cited city comparison add anything beyond your existing support? |
| P05 | Mark DeStefano and Mike Diskin / Huey Magoo’s | Three Pennsylvania city/borough openings planned; later sites remain a question | Is comparable public context useful after choosing the first property? |

Sources linked per record in the roster. Secondary prospects include the Coates family, three distinct Playa Bowls buying groups, and named small multi-unit restaurant/retail operators. Some first sites are already chosen; those rank lower. Concentration in franchises is a cohort limitation, not a strategic pivot. Franchisors may already provide better site analytics; learn that before building anything.

## Exact contact approval requested

Proposed authorization: **“Approve the four supplied transparent business-routing requests for Skiptown, Flying Biscuit, Huey Magoo’s and Slim Chickens; then the five supplied P01–P05 invitations only through verified public business routes or consented introductions. Approve at most one follow-up per prospect after 2–3 business days, honoring refusals/opt-outs. Founder sends or explicitly authorizes sending from an approved identity/channel. No mass sequence, paid enrichment, discount, partnership promise or real transaction.”**

This approval has not been granted. A public contact page is not permission, a confirmed forwarding arrangement or a verified operator email. If routing fails, leave the operator unsent; do not guess an address or contact an unrelated employer. Request a general business route without posing as an applicant. Review exact recipient/channel/sender identity when approving; no paid tools or new email infrastructure required.

Sequence: obtain approval → permission-based routing (combine both Huey groups in one request) → send P01/P02 first when introductions are accepted → send P03–P05 through confirmed routes → ten-minute demos → an optional independent purchase through the existing funnel only when useful → one authorized follow-up → record outcomes. Customer purchases are the customer's own decision, not agent-initiated test transactions.

## Measurable production baseline and blockers

Read-only existing Firebase access succeeded at approximately **3:20 p.m. CDT, October 22**. [Sanitized production evidence](production-evidence.json) includes exact timestamps, project, windows and completeness. No IDs, emails, payment payloads, tokens or API keys committed.

| Observation | Verified scope | What it does not prove |
|---|---|---|
| This UTC week: 2 events, one app-open and one report-view | Since Oct 19 00:00 UTC; one workspace per event type | Not two qualified visitors or an independent buyer |
| Trailing 30 days: 99 events; 11 decision-created, 6 checkout-start, 1 checkout-return | Five distinct decision-created workspaces; three checkout-start workspaces; query uncapped | Events are not successful usable briefs, created Stripe sessions or purchases; cohort stages are not a sequential conversion rate |
| `stripePayments`: 0 documents, including all-time count | Exact first-party production ledger | Not evidence of zero Stripe revenue or broken purchases |
| Three processed webhook markers on Oct 9: two checkout-completed, one invoice-paid | Only type/state/time read | Mode, amount, refund, product and independent buyer unknown; reconcile with Stripe |
| Explicit `adminConfig/qaExclusion` document missing | Existing automated rules found no fixture/claim exclusions for these records | Founder/manual QA may remain; do not classify workspaces as independent customers |
| Billing enabled; no accessible BigQuery datasets in this project | Existing billing association and dataset listing | No invoice/usage-cost total; no evidence that another project lacks an export |

Stripe account-list connector twice returned the authentication-retry response without accounts; no correctly scoped Stripe transactions/refunds/fees available. Renewals/refunds/fees are not covered by the first-party ledger. No selected ifYouMind analytics property / accessible Search Console site was established in the preceding audit. Qualified visitors, independently paying customers, successful purchases, active paying subscribers, gross/refunds/fees, infrastructure/AI costs and contribution margin remain **unknown**. Founder-confirmed purchase capability is not reopened as a defect.

Required access: reconnect the correct Stripe account and scope ifYouMind products/metadata; or provide an approved scoped, redacted transaction/refund/fee/renewal export. Founder identifies explicit QA/founder workspace exclusions before any config change. Obtain project-attributed Cloud/AI invoices or a correctly scoped billing export; do not create a new export/service or retrieve secrets without separate authorization. [Select the ifYouMind analytics property](https://app.hypd.ai/sources?utm_source=mcp&utm_content=none_selected).

## The $79 offer: what can justify payment

Verified source: `functions/src/intelligence/market-intelligence.ts`, `monetization.ts`, report HTML and paid entitlements. Core metrics are population, median household income, median home value and change between 2019/2024 ACS five-year estimate periods when available. Price buys organization, comparisons, a readable narrative/action plan and shareable output; public Census facts themselves are not proprietary. “Live” means retrieved/cached evidence, not 2026 real-time demographics. No competition, commercial rents, foot traffic, pet ownership, arbitrary-data analysis or sales forecast is available.

Configured offer: $79 one-time report, main place plus up to three comparisons; free brief has one comparison. Pro remains $39/month with five included reports and existing limits. Do not change pricing or promise discounts/refunds. Ask why a buyer would pay rather than use free Census/franchisor research; “already covered” is a valid disqualification.

Smallest improvements, ranked: (1) **executed now:** five decision-specific demo agendas and an explicit evidence-fit explanation, zero new infrastructure; (2) **prepared in #62:** public-sample print makes output tangible; conversion benefit unmeasured; (3) **recommended after conversations:** clarify any repeated misunderstood deliverable or input step, limited to the observed objection; (4) reconcile payment evidence before claiming sales conversion or optimizing it. Do not build traffic/competition integrations or bespoke forecasting to rescue an unvalidated pitch. Buyer-specific geography preflight is blocked for keyless public requests; no custom report was generated or promised.

## Seven-day commercial schedule — October 23–29, CDT

Dates are proposed work windows, not scheduled messages. Contacts depend on approval and recipient permission. No contact occurs automatically if the founder is unavailable.

| Day | Work and buyer opportunity | Exit evidence |
|---|---|---|
| Fri Oct 23 | Founder decides release separately; approves or declines exact routing/invitation scope. After approval, send four routing requests; prioritize P01/P02 introductions. | Approval reference, actual routes and responses; no assumed sends |
| Sat Oct 24 | Rehearse source/limitation demo and verify named-city inputs in an authorized environment; prepare two relevant sample walkthroughs without customer writes. | Honest coverage/blocker checklist; no fabricated personalized report |
| Sun Oct 25 | Review replies only if appropriate; prepare recipient-time-zone options and reconcile access requirements. No unsolicited weekend follow-up. | Next permissioned action per prospect |
| Mon Oct 26 | Send remaining accepted introductions/invitations; hold requested demos. | Current decision, deadline, actual demo/objections recorded |
| Tue Oct 27 | Hold demos; one authorized follow-up to Friday invitations after 2 business days. Offer existing free experience and optional $79 path when relevant. | No purchase pressure; actual checkout/payment evidence separated |
| Wed Oct 28 | Continue requested conversations; reconcile any real receipts/refunds and fulfillment with scoped access. | Independent payment verification or explicit reconciliation blocker |
| Thu Oct 29 | Review five-demo target, actual buyers, objections, costs and next cohort. One authorized follow-up where due, then stop. | Verified results versus targets; choose smallest next action from evidence |

Targets: five relevant demos and progress toward five independent buyers by November 20, not five promised purchases in week one. No activity/revenue result claimed. Contribution = gross minus refunds/fees/attributable variable costs; actual costs missing means margin unknown. Include founder/support time before calling the business profitable.

Highest-value next commercial task: obtain approved introductions and run the first two real buyer conversations. Highest-value measurement task: scoped Stripe reconciliation and explicit founder/QA classification. Homepage redesign now requested proceeds separately; it must not displace the eventual buyer-feedback loop or alter these approval gates.
