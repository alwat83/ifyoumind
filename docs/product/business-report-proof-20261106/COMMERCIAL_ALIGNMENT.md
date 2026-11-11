# Offers: a real presentation mismatch, unchanged billing

November 6, 2026 · OpenAI / Codex. Evaluation for Phase1; **recommendations below are not implemented offer or billing changes**.

The configured $79 one-time report buys one decision without a subscription. The $39/month Pro plan includes five full reports per month and up to50 decisions; already-unlocked Pro reports remain unlocked after cancellation. Both use the same full-report product. Current source: `functions/src/intelligence/monetization.ts`, report entitlement logic and pricing template. The public sample still emphasizes the $79 report through its existing registration-intent CTA; the homepage/pricing also exposes Pro.

A customer can rationally prefer Pro for a short project: one month's subscription costs less than a single report and includes more reports. “No subscription” is a genuine payment preference, not evidence that the $79 content is analytically better. The report-proof slice demonstrates the actual deliverable and retains all current prices, allowances, intent links, entitlements and checkout behavior. It does not solve this offer-architecture question by hiding Pro or suggesting premium $79-only analysis.

## Proposed next presentation change

Near the Business sample's offer, show both choices plainly:

| Offer | Suggested factual wording |
|---|---|
| Free brief | “Your main city plus one comparison. Try your own decision before choosing a paid option.” |
| One report | “$79 one time. One full report for your decision. No subscription.” |
| Pro | “$39/month. Five full reports included each month. Renews monthly until cancelled; unlocked reports stay unlocked.” |

Use existing entitlement information as the source of truth, never a new price constant in presentation logic. Explain the allowance reset using the established backend policy if that detail is shown. Keep the free path visible. A later presentation change should preserve the existing report/project context across authentication and pricing; a new Pro intent mechanism would need its own scoped implementation, not an unsupported query parameter in copy.

Observe whether relevant plan writers/advisers understand the deliverable and the two payment choices during the deferred end-of-design walkthrough. Record exact questions, voluntary choices and actual task reuse; don't substitute a leading “Would you pay?” answer for a real purchase. If the structure confuses qualified buyers, take those observations to a separate founder pricing/entitlement decision. No price recommendation, billing change, discount, purchase, conversion lift, margin or willingness-to-pay result is claimed here.
