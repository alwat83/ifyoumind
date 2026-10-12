# First-party product events: specification

Status: **draft for founder approval** (PR #35). Nothing here is live until that PR is released.

These events are written to Firestore `productEvents` by the `recordProductEvent` Cloud Function. They come only from signed-in, workspace-authorised pages. Nothing is sent to GA4 or any third party. GA4 funnel events are a separate, consent-gated system (Wave B, #18 and #24) and are still on hold.

## Engagement is not activation

| Term | Meaning | How we measure it |
|---|---|---|
| **Engagement** | Someone spent time with a result and did something with it | `result_engaged`: behavioural, automatic, recorded for everyone |
| **Activation** | Someone **understood** at least one finding relevant to their decision | **Only qualitatively**: task T3 in the usability study ("tell me one thing you learned, and how sure you are"), scored correct and specific, vague, or wrong |

`result_engaged` can't show understanding. A person can copy text they misread, or open a source out of doubt. We therefore never report `result_engaged` as "activation" or "understood". After the study, we compare each participant's T3 score with whether their session produced `result_engaged`:
- If the two agree for most participants, `result_engaged` can serve as a **leading indicator**, described as such.
- If they don't agree, we change the rule, or stop relying on it.

## Events added in PR #35
Every name describes only what the code can observe.

| Event | Fires when | It does **not** mean | Context stored |
|---|---|---|---|
| `result_engaged` | The person's own result has been open for at least 30 seconds **and** they copied the market analysis, opened a source link, or opened the print dialog. At most once per page view. | That they understood or trusted a finding | `trigger`: `copy`, `source` or `print`; `project` |
| `upgrade_panel_shown` | The unpaid "What the $79 report adds" panel was rendered on the page | That they scrolled to it or read it | `offer`: `report`; `project` |
| `intent_prompt_shown` | The purchase prompt for visitors who arrived wanting the $79 report (#28) was rendered | That they read it | `project` |
| `intent_prompt_clicked` | The prompt's "Get the full report · $79" link was clicked | That they bought anything. Payment is confirmed only by the Stripe webhook. | `project` |
| `market_analysis_copied` | The browser confirmed the market analysis was copied to the clipboard | That they used it in a plan | `project` |
| `print_dialog_opened` | "Print / save PDF" opened the browser's print dialog | That anything was printed or saved | `project` |

**Repeat use** has no event. It's derived from existing `decision_created` events: `repeatDecisionOrganizations` counts workspaces with 2 or more decisions in the window.

## Established events (unchanged)
- `app_open`
- `decision_created`
- `report_view`
- `pricing_view`
- `checkout_started`
- `checkout_success`. This is the browser returning from Stripe Checkout, not proof of payment.
- `checkout_cancelled`
- `billing_portal_opened`

Their context keeps the general cleaning rules: up to 8 short string values. Values that look like an email are now dropped too.

## Privacy rules
- **Each new event has a schema** (`functions/src/intelligence/product-event-logic.ts`).
  - Values are enumerations or an opaque project id, `[A-Za-z0-9_-]{1,64}`.
  - Unknown keys and values that don't match are dropped.
  - Unknown event names are refused.
- **Never stored:**
  - names or emails;
  - the business description or decision text;
  - city names typed by the user;
  - free text of any kind.
- A test checks that no schema pattern accepts an email, a name, an address, a URL or markup.
- **The public sample report records nothing.** It has no workspace.
- The existing fields `uid`, `organizationId` and `createdAt` are unchanged, and are set by the function, not by the browser.

## Admin metrics (`getProductFunnelMetrics`, admin claim required)
- **Counts and unique workspaces per event,** including the new events.
- **`conversion.decisionToEngaged`:** the share of workspaces with a decision that also had `result_engaged`. On the dashboard it's labelled "Engagement only, not proof of understanding".
- **`repeatDecisionOrganizations`.**
- **Limits:** the function reads at most 5,000 events per query. Test and internal accounts aren't excluded automatically, so filter them before quoting any number.

## How to verify after release (QA account only)
1. Open your own unpaid result. Expect `upgrade_panel_shown` with `offer: report`.
2. Within 30 seconds, click "Copy as text". Expect `market_analysis_copied` at once, and `result_engaged` with `trigger: copy` when 30 seconds have passed.
3. Click "Print / save PDF" on a paid report, then cancel the dialog. Expect `print_dialog_opened`, and no second `result_engaged` (the result has already counted once).
4. Check that no event's context contains anything except the keys in the table above.
