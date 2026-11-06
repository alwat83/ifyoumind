# Measure useful experiences, then real purchases

November 6, 2026 · OpenAI / Codex. **Proposed measurement contract; no tracking implemented or user results collected.** Preserve the dated/scoped [launch scoreboard](../../growth/REVENUE_GROWTH_PLAN.md). Unknown remains unknown; today's audit is internal QA, excluded from all acquisition metrics.

## Existing instruments and boundaries

- Main-app AnalyticsService supports optional page_view/page_dwell when its provider is present and local-emulator guard is off. Source existence does not prove a configured accessible property, consented collection, or historical data quality.
- Organization-scoped ProductAnalyticsService/server allowlist: app_open,decision_created,report_view,pricing_view,checkout_started,checkout_success,checkout_cancelled,billing_portal_opened. It requires membership; do not reuse this callable for anonymous sample visits or invent an organization.
- `checkout_started` fires before the checkout callable returns; it means request initiated, not confirmed session creation. `checkout_success` means browser returned to a success URL, not payment or entitlement fulfillment. Dashboard correctly displays “Checkout→return”; do not treat its legacy internal `checkoutToPaid` property as a paid conversion measure.
- Confirm paid fulfillment through authorized live Stripe-confirmed payment/entitlement records, excluding founder/QA/test/duplicates and reconciling refunds/renewals/fees where applicable. A payment ledger count alone does not establish independently funded customers. No new financial query, publication scope or attribution claim here.
- Discovery is deliberately isolated: no Firebase/analytics providers, CSP connect-src none, no private-file persistence. **Do not add analytics to it** to complete a funnel chart. Use consented observation or aggregate public-entry events outside it if separately scoped.

## Event and outcome dictionary

| Stage | Definition / denominator | Instrument and status |
|---|---|---|
| Qualified public visit | Actual human visit with a compatible task; distinguish household vs Business, exclude staff/agents/bots/QA | Available consented analytics plus participant notes; current count unknown; don't claim that pageviews identify qualified intent |
| Public example start | Existing selected example destination activated, not a page impression | Proposed coarse landing CTA event only within existing consent rules; not implemented; inside-island tracking excluded |
| Meaningful bill experience | Person views findings, explains one correct change and one limitation, optionally checks evidence | Manual end-of-design observation; start click is insufficient; denominator all observed eligible attempts, failures included |
| Sample engaged | Relevant visitor examines a comparison and either its source or the reusable analysis; can state what it helps them do | Manual protocol first. Proposed public-page sample_lens_selected/sample_evidence_opened/sample_analysis_opened events are behavioral proxies only, not implemented or comprehension proof |
| Free brief completed | Server-created compatible own decision, loaded report/brief; distinguish repeat projects/users | Existing decision_created+report_view are partial proxies; identity/dedup/exclusions must be verified. Do not infer a completed read from creation |
| Checkout request | User explicitly requests the selected offer for an existing own report or Pro | Existing checkout_started. Denominator eligible own-brief/pricing viewers; request failures remain separate, not confirmed Stripe sessions |
| Checkout return | Browser arrives at success/cancel route | Existing checkout_success/cancelled; label “return” in reports. Dedup repeated reloads; not purchases |
| Paid and fulfilled | Successful live payment matched to correct entitlement, independently funded after exclusions | Authorized payment/entitlement reconciliation; denominator verified unique real checkout sessions if available. Unknown conversion until sessions/outcomes can be joined safely |
| Reuse / return | Same legitimate person reopens an already-created report or copies/prints it for their task | Existing app_open/report_view are partial; distinguish saved-project reopen from new report. Proposed copy/print events only indicate actions, not successful printer output or business use |
| Referral | Another genuine person follows a shared public link and has a meaningful experience | Copy/share click is not referral evidence. No private-report tracking or identity collection needed for current review |

Proposed event payload allowlist: versioned experience ID, public example/category or measure enum, action enum, coarse surface and QA marker where existing infrastructure permits. **Exclude** raw/custom questions, business names, city text in analytics payloads unless separately justified, CSV content/filenames/cells, dollar/household amounts, email, organization/project IDs, payment references, free text or cross-site identifiers. Never enable events automatically from this document. Respect existing privacy/consent and actual retention policies; do not promise new guarantees.

## First learning round, deferred until design testing resumes

Use5 participants per relevant task as a small qualitative design review, not population statistics. Do not recruit now. Household and Business scripts measure different value; report separate denominators. Record anonymously in ignored private notes with observed device, attempt, assistance, exact confusion, correct finding, limitation, intended reuse and next action. Do not put identities or verbatim private buyer notes into GitHub/Notion.

- Five-second exposure: “What does this let you do?” and “What would you try first?” Do not teach the intended answer or require recall of pricing from a brief glance.
- Household task: start the ready example, explain money-versus-usage or tax contribution, inspect one source and clear. Never ask for actual private bills.
- Business task: describe one income/growth trade-off, find its source period, say what the data cannot decide, locate/copy the plan section and explain one next research action. A winning-city answer is a misunderstanding to record, not success.
- Offer task after proof: “What would you receive for each option? Which, if any, fits this task?” Record the$39/$79trade-off without defending the price or asking a leading “Would you pay?” question. Stated interest is not willingness-to-pay proof.
- Real purchase remains a voluntary customer action after compatible value, with authorization/financial controls. Do not make agent-funded/QA transactions to manufacture conversion evidence.

## Working decision rules, not achieved targets

| Observation | Action |
|---|---|
| Any wrong figure/source, leaked private data/paid content, entitlement defect or inability to clear | Stop the affected release proposal; reproduce/fix smallest defect and run relevant checks |
| Print artifacts reproduced in promised export | Repair and visually verify all representative pages before claiming premium/print-ready delivery |
|2 of 5 misunderstand available task or expect arbitrary AI/PDF/site-demand answers | Correct that entry claim and repeat the targeted observation after the design change |
|4 of 5 explain a correct finding+limit and reach proof unassisted | Candidate for release review, not general validation or evidence of revenue lift |
| Business participants find the data accurate but do not need/reuse the draft | Challenge paid value/target use case; don't respond with more decorative design |
| Repeated$39/$79 confusion | Show exact observations for a separate founder offer decision; no unauthorized price/entitlement change |
| Fewer/mixed sessions or inaccessible analytics | Report exact counts/unknowns; continue scoped preparation, no invented rates/zeroes |

For any later event-based comparison, state exposure period/version, compatible audience, numerator/denominator, QA exclusions and missing/blocked events. Do not run an A/B test or claim lift on tiny unqualified traffic. No projected percentage gain, fixed revenue forecast or new dashboard prerequisite. Near-term success is useful evidence understood, one qualified paid-task conversation and a genuine independently funded purchase when actually verified.
