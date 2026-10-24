# Electricity discovery — local prototype review

Founder approved detailed design and local prototype development after Phase1 readiness, on a separate branch. **No merge, deployment, PDF, external comparison, AI, backend storage, Stripe change or outreach.** Outbound remains **Pending Founder Setup**.

## Try it

`npm run build:electricity` then `npm run start:electricity` → **http://127.0.0.1:4314/**. Loopback only. Click **Try example data**, no account or prompt. The tax/Phase1 candidate remains separate in PR70; [its final review](../discovery-phase1/FINAL_READINESS.md) pins169128cba5464bf9d1a89574ca2399aaaae18c4b.

The synthetic31-day July bills demonstrate:

| Finding | Earlier | Later | Meaning |
|---|---|---|---|
| Billed consumption |600kWh|660kWh|60kWh/10% more used; not a dollar amount.|
| Current-period total billed |120USD|145.20USD|25.20USD/21% more billed.|
| Whole-bill effective unit cost |0.2000USD/kWh|0.2200USD/kWh|Total billed ÷ kWh includes every charge; **not a supplier tariff**.|
| Source-identified fixed/variable/other |20/90/10USD|20/115.20/10USD|Variable line differs25.20USD; this is a bill-identified classification, not an inferred cause or rate.|

Each finding expands exact source cells and arithmetic. The average uses integer cents and thousandths of kWh with BigInt rational rounding, not rounded intermediate rates. Zero consumption leaves unit cost unavailable; zero charges are real zeros, missing is not zero. No cost forecasting, provider-rate, “fair bill,” savings or causal claims.

Try an unknown split with the included `unknown-electricity-v1.csv`: total/usage/average remain useful, and the app explicitly refuses to guess a fixed/variable split. Try a one-row file for insufficient data; correct/reconcile rows, rerun, inspect current source values and clear. Editing invalidates findings immediately.

## One recognized CSV — exact limits

Headers exactly: `period_start,period_end,unit,currency,consumption_kwh,charge_basis,fixed_usd,variable_usd,other_usd,total_usd`. Header order can vary; no extra columns. Maximum2rows/2MB, one household meter, consistent charge definitions and current-period charges. Remove names, addresses, accounts and meter IDs before choosing a file.

- Dates are real ISOYYYY-MM-DD,1900–2199, **end exclusive** (first day not billed),1–62billingdays. Match start month/day in adjacent years and equal durations; reject duplicates, overlaps, unequal days and different seasons rather than normalize. Users must prepare/confirm those semantics; the app cannot prove redacted rows belong to one meter or tariff. This is not direct recognition of provider statements.
- Explicit `unit=kWh`, `currency=USD`. Consumption is billed usage, not a cumulative meter reading, power in kW or an MWh value; no silent unit/currency conversion. Consumption allows up to3decimals; amounts up to2, plain non-negative decimals. Negative credits/solar exports/refunds/prior balances/arrears/tier/tariff extraction are outside this first format. No assumed zeros or formula/scientific-notation coercion.
- `charge_basis=identified`: the source explicitly identifies the charge categories. All three amounts required, explicit0 for an absent charge, exact sum equals total. This is user-provided attribution, not audited tariff correctness; a fixed charge can still change between periods.
- `charge_basis=unknown`: all three breakdown amounts must be blank, not invented0. No fixed/variable or contribution inference. If only one bill is identified, paired charge contributions remain suppressed. The total and consumption can still be compared.

## Reuse, isolation and privacy

This extends Phase1 instead of introducing an independent engine:

- **`discovery-core.ts`** owns both adapters' strict recognized-CSV/tokenizer boundary, exact money/percent functions, shared analysis/issue/finding/evidence contracts and paired-charge comparison rules.
- **`tax-discovery.ts`** retains tax-specific year validation and adapts normalized tax facts into the shared comparison. Original tax arithmetic/unit/browser suites protect the refactor. **`electricity-discovery.ts`** supplies electricity-specific date/unit/classification validation plus consumption and effective-cost rules over that same contract.
- **`DiscoveryFindingsComponent`** is the one card/chart/evidence renderer for both. The existing host owns one file-reading/correction/rerun/reset/clear/late-read lifecycle. An explicit local bootstrap token selects the category; there is no universal parser, arbitrary category guessing, plugin system or duplicated frontend analysis flow.
- Dedicated electricity bootstrap/index/build/output, same CSPconnect-srcnone/noindex and GET/HEAD-only loopback server. No production import/link/route, Firebase/auth/analytics initialization, dependencies, paid API or persistence. Private input stays in page memory; Clear/reload/exit disposes of application state, not a cryptographic browser/OS erasure promise. Household usage is sensitive even when identifiers are removed. No private export/share.

Proposed explanation text is deterministic; no AI interpretation or unsupported cause. Optional AI, PDFs/OCR, external sources, server retention, public integration and pricing retain separate approval gates.

## Verification and visual evidence

Final local/CI results and screenshot hashes are recorded in `verification.json`, `screenshots.json` and the draft PR. Physical iOS/Safari/spoken screen-reader/novice-study limits from Phase1 remain explicit. Automated tests and synthetic screenshots are not customer traction or comprehension evidence.

Initial electricity27browserPASS. Shared tax renderer extraction initially caused47PASS/1narrowFAIL: the first finding heading bottom580.69px exceeded568px because the child component lost parent-scoped eyebrow typography. Restored that rule in the shared renderer; final rerun results below distinguish the fixed attempt. No viewport assertion or budget relaxed. Legacy Angular attempt reproduced11compiler diagnostics and also encountered an occupied Karma9876port; no legacy tests executed. Global91lint signatures unchanged.

## Founder review and next decision

Evaluate whether a newcomer can tell consumption, total, average and identified charges apart, inspect one calculation, correct an inconsistent total and understand an unknown split. Do not interpret a whole-bill average change as a proved tariff change. Usability/willingness-to-pay remain hypotheses; no outside-user result or revenue claimed.

Next three: review both local datasets; address observed comprehension/manual-browser gaps; separately decide any public pilot/integration after the prototype review. No further file categories or speculative analytics by default. Business79report/39monthlyPro and private launch drafts remain untouched.

## Screenshots

All18captures are actual Angular UI with synthetic inputs, unedited; [hash manifest](screenshots.json).

| State | Desktop | Mobile |
|---|---|---|
| Welcome |[Desktop](screenshots/desktop-welcome-full.png)|[Mobile](screenshots/mobile-welcome-full.png)|
| Automatic discoveries |[Desktop](screenshots/desktop-discovered-full.png)|[Mobile](screenshots/mobile-discovered-full.png)|
| Source cells/calculations |[Desktop](screenshots/desktop-evidence-full.png)|[Mobile](screenshots/mobile-evidence-full.png)|
| Unknown charge split |[Desktop](screenshots/desktop-unknown-full.png)|[Mobile](screenshots/mobile-unknown-full.png)|
| Insufficient input |[Desktop](screenshots/desktop-insufficient-full.png)|[Mobile](screenshots/mobile-insufficient-full.png)|
| Corrected current evidence |[Desktop](screenshots/desktop-corrected-full.png)|[Mobile](screenshots/mobile-corrected-full.png)|

[320px welcome](screenshots/narrow-welcome-fold.png) · [320px first result](screenshots/narrow-discovery-fold.png). Initial capture found the long ISO-date badge wrapped at320px, pushing the heading bottom580.19px beyond568. The badge now uses YYYY-MM shorthand; exact start/end dates remain in evidence and forms. A regression asserts that the first finding heading is visible inside all three viewports.


## Final local results

135fastPASS (24tax+16electricityunit included);48taxbrowserPASS34.4s;27electricitybrowserPASS18.5s,0FAIL0SKIP. Zero automated WCAG A/AA violations, external requests, writes or browser-storage entries in checked states. Tax/electricity/production builds, preflight, production33fileguard/21JSexclusion, bothpreviewguards and targetedlintPASS. Electricity209.75kB/61.55transfer;sharedhoststyle5.06kB warning4/below8error;production659.83/178.03.91global lint errors/11Angular diagnostics remain unchanged failures; legacy command also hit occupiedKarma9876, no tests executed. Final new-headCI pinned in draftPR afterpush, not borrowed from70.

One intervening new test mistakenly checked first-result visibility after clearing the page; that attempt timed out. The erroneous added assertion was removed while preserving the expected no-results/blank-input checks; final27PASS. Earlier attempts are not full passes. [Structured verification](verification.json) preserves measured results/manual limits.
