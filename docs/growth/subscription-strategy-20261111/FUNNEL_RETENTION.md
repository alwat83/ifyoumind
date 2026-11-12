# From first useful result to repeat decisions

**November 11, 2026 · Proposed.** Existing routes and release states are identified in the [founder decision](DECISION.md). This specification uses the current homepage, discovery, sample, decision and account surfaces.

## First-use audit

| Question | Observation and smallest next action |
| --- | --- |
| Understand it in five seconds? | The live first screen shows a concrete electricity result and a next action. PR #82 offers a city comparison and two bill examples. Five-second comprehension is unmeasured. Show the approved surface to an uncoached visitor and ask them to describe what it does. |
| Experience value without an account? | Yes. The browser-local example gives an inspectable result. The public Business sample is a complete worked example. Keep both anonymous. |
| Tell a free example from a paid report? | The sample and pricing use separate surfaces. The signed-in brief labels itself free, but the personalized deliverable and precise benefits need to be visible together before purchase. Add one factual comparison next to the subscriber offer. |
| See credible evidence? | The bill example traces numbers to its input. The Business sample shows source attribution, date, comparison and practical caveats. Keep that evidence reachable from the takeaway. |
| Want to investigate another question? | The supported choices create a path from an example to the visitor’s own decision. Repeat demand is unmeasured. Offer a second supported example or a personalized city comparison after the first result. |
| Understand the value of $3.99? | The price is a proposed variant. Show “1 full Decision Report per paid month,” the same public sample, what data it uses, and the renewal and cancellation terms in one view. |
| What creates hesitation or abandonment? | No usable qualified drop-off rates were available. Observe whether visitors understand the comparison, reach evidence, distinguish a sample from their own report, lose their place around email verification, or hesitate at the price or data limits. Treat each as a hypothesis until observed. |

## Conversion specification

| Stage | Proposed behavior and acceptance |
| --- | --- |
| Homepage | Preserve the release-approved design. Start with a supported example. Show a comparison, source period and takeaway quickly. A first-time mobile visitor can open the example without registering or encountering a price prompt. |
| Discovery → evidence → insight | Provide one action from a takeaway to exact figures, dates and assumptions. Keep household files and their values in the existing browser-local discovery boundary. Offer a supported next question after the result. |
| Report preview | Link to the public Business sample. Label it “Example Decision Report” and show one finding, the evidence, the limits and what to verify next. Link to “Compare my locations” and keep the example accessible without authentication. |
| Registration | Start a personalized free brief with the existing account flow. Preserve an allowlisted continuation through registration, email verification and login. Keep organization and project authorization server-side. Use a safe default if the original decision is gone, access changed or the intent expired. Keep location and project content out of query strings and analytics. |
| Free personalized result | Show the useful free comparison and its source before offering an upgrade. On an eligible locked result, place “Unlock my full report” beside a compact list of the full report sections and a sample link. Expose a clear return to the free result. Existing subscribers see their credit balance and reset date, with a confirmation if this action uses a credit. |
| Plan choice and Checkout | Compare Starter with Plus by report count. Show monthly total, auto-renewal, exact reset and expiry rules, cancellation timing, and one-time alternative when eligible. The server resolves the assigned price. Show the currency and total before confirmation, with tax if applicable. Use plain language and no preset upgrades or urgency. |
| Return and account | Route back to the selected project or account after Checkout. “Confirming payment” until the server verifies access, “Open my report” after durable unlock, and a recoverable retry if pending or failed. Show paid-through date, available credits, next charge or cancellation state, invoice/payment-method access and saved reports. |

Example offer copy for an approved Starter control: **“$4.99 a month for one full Decision Report. Compare locations, inspect the source evidence, and save or print your report. Your report credit resets on your paid renewal date. Unused credits expire. Cancel before renewal to stop future charges. Your unlocked reports stay available.”** Use the actual Stripe period and workspace time display. If unpaid, use the subscription state for payment help instead of promising a reset. Compare the two plan options in one mobile-width block and keep plan limits beside their prices.

Use the existing workspace event flow and authorized payment records where coverage supports it. Add only the minimum events required by the [experiment](EXPERIMENT.md) after privacy and schema review. The public discovery island sends no imported data, evidence or filenames for this experiment. Track the first-use walkthrough manually until there is an approved basis for anonymous assignment and measurement.

## Retention

| Period | Existing value to use | Proposed customer experience | Measure and react |
| --- | --- | --- | --- |
| Days 1–30 · activation | Generate a sourced location brief, unlock the full report, save in workspace history, reopen and print. | Return the customer to their project after payment. Show one example of how to read the report, one supported next action and remaining credits. In the account, show the saved report and expiry date. Test in-product help before adding communications. | First full report within 7 days of settled first invoice, time to successful report, support contacts per payer, pending/failed fulfillment. Inspect incomplete cases and fix reproducible friction. |
| Days 31–60 · repeat | Reopen prior analyses and start another supported comparison. | Make “Reopen saved report” and “Start another comparison” easy to find. Show the dataset vintage when revisiting a report. If customers need lightweight decision notes or lists, validate that need with observed work before implementation. | Distinct second decision, saved-report reopen and print, credit utilization, voluntary cancellation and payment recovery. Count second decisions separately from reopens and QA. |
| Days 61–90 · retention | Continue comparing supported options, revisiting trade-offs and retrieving saved evidence. | Give a clear way to revisit a changed shortlist and distinguish a previous snapshot from any newly generated analysis. Test optional cancellation reason in an approved portal flow. Consider genuine source updates only after confirming demand, data freshness and permission to notify. | Eligible first and second renewals, 90-day retained paid cohorts, refund and dispute rates, stated reasons for cancellation and involuntary churn. Break out missing evidence from low repeat demand. |

Current discovery supports the electricity and property-tax examples. There is no promise of new datasets, automated refresh, monitoring, alerts or advanced analysis in the offer. No reminders or gamification are needed to test whether a customer has another decision. If most people have only one purchase-worthy decision, investigate the one-time offer before adding retention features.

For an authorized first-use session, open the approved homepage on a phone and give the visitor five seconds. Ask “What can you do here?” Then say “You’re choosing between two cities. Show me one thing you learned, where the number came from, and what you’d do next.” Ask them to point out what a paid report adds, what renews, and whether they have a second comparison. Record observed actions and exact confusion with consent. The existing [first-use script](../../design/first-seconds/FIRST_USE_VALIDATION.md) provides the recruitment and observation format. Outreach remains Pending Founder Setup.
