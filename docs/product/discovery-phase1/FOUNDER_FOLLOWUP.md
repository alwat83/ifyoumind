# Phase 1 founder follow-up — October 23, 2026

**Working direction confirmed by the founder:** automatic discovery remains the foundation of ifYouMind. This sprint improves the existing local experience in draft [PR #70](https://github.com/alwat83/ifyoumind/pull/70), rather than redesigning the production homepage or activating another dataset.

## First-time journey and concrete fixes

The welcome screen at http://127.0.0.1:4313/ is the local entry point. On desktop1280, mobile390 and narrow320 the example action is visible in the first screen; one click produces findings, with the first finding heading inside the viewport. No account, prompt, mapping screen or network analysis is required. The production homepage deliberately has no discovery link or route: public integration still needs founder release authorization. This review is not a claim that discovery is live.

| Observed issue | Implemented correction | Preserved evidence |
|---|---|---|
| Incomplete input displayed “Here’s what changed” before a valid comparison existed. | Incomplete/invalid input now says “Let’s get the data ready.” Editing also removes the previous findings until rerun. | No comparison on one row; missing is not zero; validation messages and current source values remain available. |
| “Component,” “largest dollar change” and “proportional change” required unnecessary interpretation. | “School changed the most.” “School went up by $240.00. That makes up 57.1% of the $420.00 increase.” “All three charges went up by 10%.” | Exact same cents, percentages, equations and source-cell references; tied, offsetting, zero and unchanged cases remain honest. |
| A rejected browser file read could surface its raw exception message. | Helpful file-open guidance; repeated failures can recover by selecting the file again or trying the example. | Developer console keeps the error name only. No private filename/raw exception message is logged or shown; schema errors retain useful validation detail. |

Finding headings, chart labels and the limitation heading use everyday language. “What two bills can’t tell us” still explains that these two observations establish neither cause, correctness nor a trend. Suggested questions remain requests for evidence, not generated answers. No calculation behavior, tax schema, pricing or dependencies changed.

## Validation and founder walkthrough

1. Open the local welcome on desktop/mobile and click **Try example data**. Is the $420 change understandable before opening the evidence?
2. Inspect **Show source cells & calculation** for the school finding. Can you verify its $240/57.1% contribution yourself?
3. Correct County2024 to1000 and Total2024 to4300. Old findings disappear; rerun yields a $320 increase and current edited cells. Opposing changes do not get misleading contribution percentages.
4. Load the included [one-year CSV](one-year-tax-v1.csv). No findings, honest heading, second row editable. Complete it or reset to the example.
5. Clear after opening sources/follow-ups. Source values, tables and findings disappear; pending reads cannot restore cleared/replaced private data.

The expanded browser suite checks repeated native file-read rejection→successful retry, pending private read→example replacement, oversized and empty files, welcome CTA/first finding position, incomplete headings and clearing expanded evidence, in addition to previous success/correction/duplicate/zero/format cases. All use synthetic fixtures. Updated screenshot links and final exact results are in [REVIEW.md](REVIEW.md); GitHub pins final-head CI after push. Automated accessibility is not spoken screen-reader or physical-device verification. No first-time-user comprehension result has been measured.

## Recommended Phase 2 — two household electricity bills, local only

**Proposal only, not approved or implemented.** Question: “What changed in my electricity bill—and my usage?” The app may calculate usage and billed-charge differences; it must not answer causal “because” without evidence. Present “Your usage changed by…” beside “Your bill changed by…” and explain what still needs checking.

Candidate ranking below is engineering judgment from the existing implementation, not market research or proof of demand. Usefulness and willingness to provide data remain hypotheses.

| Candidate | Reuse | Expected usefulness | Effort / privacy implications | Decision |
|---|---|---|---|---|
| Two electricity bills in one explicit CSV | High: paired periods, three charges/total, exact money, evidence/correction/clear; adds usage and dates. | Shows whether usage and billed cost moved together without prompts; a meaningfully different second category. | Moderate: strict date/usage validation; usage can reveal household activity. No identifiers needed. | Recommend a narrow local prototype after approval. |
| Two months of manually aggregated household spending | High arithmetic/UI reuse. | Potentially useful but depends on the user correctly aggregating categories before the “automatic” experience. | Moderate completeness ambiguity; sensitive spending categories; manual preparation burden. | Later, if actual user feedback supports it. |
| Bank/card transaction files | Lower: variable formats, merchant mapping, duplicate transactions, refunds, transfers and periods. | Broad potential, unvalidated here. | High implementation and sensitive identity/merchant detail exposure. | Defer; avoid a universal parser. |
| Job-offer / take-home-pay comparison | Some UI reuse, substantially different calculation/methodology needs. | Relatable decision, but could imply unsupported personal financial outcomes. | High methodology/scope risk, separate Life boundaries and approval. | Defer. |

### Small explicit input and results

One recognized `phase2-electricity-v1` CSV, exactly two bills, fixed USD/kWh, non-negative plain decimals, exactly three named charge fields and reconciled total. Proposed headers:

`period_start,period_end,usage_kwh,supply_usd,delivery_usd,other_usd,total_usd`

Dates use ISOYYYY-MM-DD with **end exclusive**, explained in the downloadable example and correction form. Derive billing days from dates. First slice supports the same calendar month in adjacent years and equal billing-day counts, one household/meter and consistent charge definitions; user confirms those assumptions because redacted rows cannot prove identity or plan comparability. Reject incompatible/overlapping periods, malformed dates, missing units/amounts, negative credits/adjustments and unreconciled totals; no silently annualized or partial period. Unsupported layouts get a useful refusal, not guessed mapping. End-exclusive normalization is a preparation requirement, not a claim to recognize provider statements directly.

Synthetic example only:2025-07-01→2025-08-01,600kWh,charges60/50/10,total120;2026-07-01→2026-08-01,660kWh,charges66/55/11,total132. Both31days; total+$12/+10%, usage+60kWh/+10%, largest charge difference supply+$6 (50% of $12). All arithmetic must have source cells/equations. No model or cause needed. No retail-rate inference from total÷usage: fixed charges mean that is not necessarily the tariff. No weather, provider-price, savings, fair-bill or best-plan claims.

Reuse only proven pieces when implementing the approved second slice: local file lifecycle/privacy, CSV tokenizer, money/percentage functions, evidence disclosures, correction invalidation and accessible chart patterns. Add a small **separate electricity adapter** with its own typed schema and period/usage validation. Extract a shared display/evidence shape and helpers only where both real adapters need them. Keep tax validation and existing Business unchanged. No universal schema, automatic category guessing, plugin registry, mapping wizard, new backend or large rewrite.

### Approval and validation gates

1. **Founder scope approval:** authorize this one CSV/example, local-only second category and exact comparable-period restrictions; no implementation inferred from this recommendation.
2. **Local implementation gate:** deterministic total/usage/charge findings, source cells, correction/clear and insufficient/invalid states; tests for dates, decimals, zero denominators, incompatible periods and private read races. Both categories pass regression and remain outside production imports/routes/assets.
3. **Usability gate:** founder review followed by separately authorized real-user observation. Proposed criterion:4of5 first-time participants identify a correct finding and its supporting inputs within60seconds, and understand that a matching change is not proof of cause. Target only, not a result or a promise to contact anyone.
4. **Independent future approvals:** public route/merge/deployment; AI/provider/budget; PDF/OCR; external comparisons; server file handling/retention; commercial/pricing changes. None are bundled into Phase2. No private export/share or file persistence by default.

Keep identifiers out of CSVs/screenshots/logs and retain the same memory-only/clear lifecycle; do not promise OS-level erasure or assume usage is non-sensitive. Outbound stays **Pending Founder Setup**. No outreach, purchases, Stripe changes, new prices or production deployment.

## Next highest-value learning

Observe the founder using the improved Phase1 example/evidence/correction path, then choose the smallest demonstrated friction to fix. After separate approval, test whether a second category actually improves perceived usefulness before broadening format support. No new customer, revenue or conversion outcome is claimed.
