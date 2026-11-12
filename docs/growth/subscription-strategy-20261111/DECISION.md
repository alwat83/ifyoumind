# Founder pricing decision

**November 11, 2026 · OpenAI / Codex · Founder approved the design for pilot preparation.** See the [implementation handoff and remaining approvals](PILOT_PREPARATION.md).

## Recommendation

Test two paid plans with identical full-report quality. Use **$4.99 Starter for one full report** and **$9.99 Plus for three** as the pilot control. Test **$3.99 Starter** against $4.99 with Plus fixed. Hold the eight-report tier until repeat demand and measured costs justify it. The free offer retains anonymous examples and browser-local discovery, the public sample, and the current signed-in free brief. Credits expire at the end of each paid period. Saved, unlocked reports remain accessible.

| Offer proposed for pilot approval | Monthly price | Full reports each paid period |
| --- | ---: | ---: |
| Free | $0 | Public samples and discovery. Current free briefs stay available |
| Starter | $4.99 | 1 |
| Plus | $9.99 | 3 |

The lower entry price is simple and potentially compelling. At full usage, $3.99 gives a modeled 60.6% margin with only about $0.02 per report of headroom above the base delivery reserve at the 60% threshold. A $4.99 price gives 67.2% and more room for support or data costs. The third proposed tier has weak evidence of demand and concentrates high usage. Its incremental discount is steep, about $1.87 per credit at eight compared with $2.66 at three in the founder hypothesis. It requires an extra price and entitlement path, and at $2 per report it is unprofitable at full use before fixed overhead. Both pilot plans keep a clear upgrade reason, more reports for repeat questions at the same quality. [Unit economics](ECONOMICS.md) · [Calculated results](MODEL_OUTPUT.md)

Preserve all existing $79 purchases and existing $39 Pro terms. Keep the one-time path during the pilot, with an explicit no-renewal distinction and no implication of better analysis. Do not pitch $79 for an identical report to people eligible for the lower subscription without showing both choices. After the pilot, evaluate retiring the public $79 offer for new buyers or testing a separately approved, fairly priced one-time report. Account access and history continue for legacy purchases.

## Current commercial baseline

Fresh GitHub reads show master `e5d8f15fb9171a3723fdfc324dd0066d8d5caf5e` and the last successful production deployment at PR #76. PR #82 remains an open draft at `6fcef3ab84c793c5b93f559c0d9c6d6d7aefaeba` with both exact workflows green. Earlier read-only live Stripe checks confirmed the active $79 one-time and $39 monthly USD prices. The live default is now configured and verified. The signed-in owner check failed because Stripe could not resolve the linked customer. PR #82 remains on production hold pending a successful owner session and return. [Production deployment](https://github.com/alwat83/ifyoumind/actions/runs/42143112840) · [PR #82](https://github.com/alwat83/ifyoumind/pull/82) · [Founder release review](../../releases/integrated-20261110/FOUNDER_REVIEW.md)

| Status | Capability |
| --- | --- |
| Live | Bill-led homepage, browser-local electricity and property-tax examples, public Business sample and Census-based signed-in reports. Workspace history, saved report reopening, browser print, and separate Stripe Checkout and entitlement logic are in the deployed source. Current Pro has five included reports resetting on the first of the UTC month. The status display advertises a Pro project allowance, and the create path only enforces the Free creation cap. This needs an explicit pilot cost guard. |
| Implemented, unreleased | PR #82 homepage with three example choices, report evidence and print refinements, owner/admin portal access and cancellation display, and transactional cancellation handling. |
| Prototypes or separate scope | Broader discovery prototypes and separate AI-related modules. They are outside the scoped subscription benefit and report cost estimate. |
| Proposed | New prices, invoice-aligned report credits, plan changes, a pilot cohort and any repeat-use improvements below. Monitoring, alerts, automated source updates and additional paid datasets require separate evidence and approval. |

## Positioning and customer

**Clear comparisons. Traceable evidence. A practical next step.** Show two cities, the source period and a trade-off on one screen. Let visitors inspect a sample or use a bill example before showing a subscription. For a customer choosing a location, describe what the report can answer with Census estimates and what still needs local verification. Compared with piecing together search results or prompting a general chatbot, the demonstrated benefit is a consistent comparison, named sources, a saved decision and a shareable report with limitations. Search and chat may still be suitable for broad exploration. Avoid claims of exclusive data, guaranteed decisions, or greater accuracy.

Suggested pilot copy after approval: **“One full Decision Report each month for $4.99. Compare cities, inspect the sources and save or print the report. Renews monthly. Cancel before renewal to stop future charges. Already unlocked reports stay available.”** Plus changes the count and price only. Show the credit reset date, report definition and limit beside the offer. Use the preview to explain that Census data describes residents and cannot establish market demand, rent or competition.

Start with **independent U.S. small-business location advisers and consultants who have at least two active site comparisons in a quarter**. They can use existing city evidence for repeat client decisions and share printable outputs. Qualify for city-level comparison rather than address-level diligence, proprietary foot traffic, market forecasts or guaranteed decisions. Small-business owners with an active opening are a strong adjacent demonstration cohort and may have episodic demand. Individuals have broad curiosity but weaker demonstrated monthly recurrence. Researchers already using source tools may need narrower methodology and exports. No segment has validated willingness to pay in this analysis.

## Ten decisions for the founder

1. **Is $3.99 viable?** A credible test price if delivery costs and support fit the margin guardrail. There is no evidence it converts or retains better yet.
2. **Two or three paid tiers?** Two. A third price and allowance create more choice and operations before volume demand is known.
3. **Allowances?** One and three per paid period, expiring at period end. Retain unlocked reports and reserve credits only for a deliverable.
4. **Individual purchases?** Preserve legacy access and the existing path during the pilot. Reassess the public one-time price separately once recurring and episodic demand are observed.
5. **Strongest reason to subscribe?** A repeatable way to compare real options with inspectable sources, reusable output and a next research action.
6. **Why return next month?** Another genuine decision or a changed shortlist. Use saved evidence and reports before building reminders.
7. **First segment?** Independent location advisers with recurring U.S. city comparisons.
8. **Smallest safe experiment?** Observe five relevant first-time users, then run a limited approved $4.99 versus $3.99 Starter offer with fixed $9.99 Plus and identical benefits.
9. **Prerequisites?** Resolve the independent release gate, measure costs, verify subscription and cancellation lifecycle in test mode, prove legacy retention and reconcile pilot payment and usage data.
10. **Approve what now?** The founder approved preparation of Free $0, Starter $4.99/1, Plus $9.99/3, and $3.99/1 only as the experiment variant. Sandbox implementation, production activation, and enrollment have separate authorization gates.

## Evidence and implementation index

- [Founder-approved pilot preparation and decision gates](PILOT_PREPARATION.md)
- [Unit economics](ECONOMICS.md) and [growth scenario model](MODEL_OUTPUT.md)
- [Value, free-to-paid conversion, and 30/60/90 retention](FUNNEL_RETENTION.md)
- [Entitlement and migration specification](ENTITLEMENTS_MIGRATION.md)
- [Pricing experiment](EXPERIMENT.md)
- [Engineering backlog](IMPLEMENTATION_BACKLOG.md)
