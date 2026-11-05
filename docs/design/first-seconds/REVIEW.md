# First seconds — working design review

November 4, 2026 CST (verification continued November 5 UTC). OpenAI / Codex; specific model/session attribution unknown. Branch `codex/first-seconds-discovery`, from release handoff `da2ad4d35f713d1449d6ee099de732567e301ce8`; deployed application base `c01c93cd1c270949b4c778f4d52e4af1f1e8b25e`. **Locally implemented/tested; not merged or deployed.** Exact commit, PR and independent CI are recorded in the GitHub PR and conversation; base CI is not candidate CI.

## Founder direction and design

Founder likes the new visual direction and asks to push modern AI-project design further while maintaining engagement: only a few seconds to earn attention. Keep the existing playful ivory/violet/lime identity. Put useful output and interaction ahead of the illustration and supporting reading.

- “Two bills. One clear story.” gives a concrete entry into today's available product.
- The hero contains the actual synthetic preview switch and key numbers, rather than making visitors scroll to discover that interaction. No staged loading, fake conversation or autoplay.
- Electricity and property-tax previews update immediately; the primary free-example link follows the selected category into its working findings.
- Native evidence disclosure exposes the exact arithmetic, synthetic provenance and limits. Switching category while evidence is open updates the evidence as well as the chart and destination.
- Art remains part of the brand in the supporting section and loads lazily. Existing Business sample, optional Free/$79 report/$39 monthly Pro/five reports, registration intent and browser-local discovery boundaries remain.

Applicable primary guidance: [Fluent 2 responsible AI](https://fluent2.microsoft.design/responsible-AI) supports accurate expectations, clear actions and outputs users can verify. This is an application of those interaction principles; the current bill comparison is deterministic and has no new AI integration. Design conventions are not evidence of measured conversion improvement.

## Review images

| View | First screen | Full page |
|---|---|---|
| Desktop 1280×900 | [Desktop](screenshots/desktop-fold.png) | [Full](screenshots/desktop-full.png) |
| Mobile 390×844 | [Mobile](screenshots/mobile-fold.png) | [Full](screenshots/mobile-full.png) |
| Narrow 320×568 | [Narrow](screenshots/narrow-fold.png) | [Full](screenshots/narrow-full.png) |

[Desktop tax](screenshots/desktop-tax.png), [mobile tax](screenshots/mobile-tax.png). [Hash manifest](asset-manifest.json). Captures are from the final local production build, not the deployed site. Reviewed first-screen desktop/mobile/narrow images; no overlap or horizontal overflow. At 320px the decorative eyebrow/trust repeats and mini-bars are suppressed; the finding, exact values, evidence control and primary action remain visible.

## Verification

Fresh final production build PASS; final local preview build PASS. `npm run test:seo`: **137 PASS / 0 FAIL / 0 SKIP**. `QA_BROWSER_CHANNEL=chrome npm run test:discover`: **66 PASS / 0 FAIL / 0 SKIP**, including three new viewport cases for first-screen metrics, keyboard evidence disclosure and category-switch evidence correctness. Final complete rerun after the narrow-screen readability adjustment: 66 PASS (40.7s). Earlier iteration also passed 66; not counted as additional unique coverage.

Existing suites exercise direct category navigation, read-only examples, source tables, local CSV validation, corrections/recovery/clear, delayed read isolation, offline after load, privacy headers, no storage and unchanged Business registration paths. Automatic WCAG 2/2.1 A/AA checks, heading contrast and no horizontal overflow pass in checked scopes; native summary is at least 44px high. Primary action and metrics fit within each tested first viewport. Targeted landing TS/HTML ESLint PASS; production bundle guard PASS (36 files); diff whitespace check PASS. In-app browser also verified mobile tax selection, expanded arithmetic and matching destination. Stale local preview tab initially failed to reload; fresh tab on the approved local server worked. No production writes.

Build warnings remain: initial bundle 660.52kB/500kB; main homepage style 6.76kB/4kB, updated mobile style 4.40kB/4kB; other pre-existing style warnings. All remain below error budgets. No dependency/backend/auth/Stripe/rules/engine change. Historical full-source lint 91 and default Angular compiler 11 diagnostic baseline are not rerun or fixed here. Complete candidate CI, authenticated journeys and backend suites are tracked separately once the PR is created. Real-user five-second comprehension, engagement, conversion, retention, native devices/Safari and spoken screen-reader behavior are unverified; no new real signup, purchase, payment or outreach.

## Release / rollback

Development review only. Live application remains the separately verified PR75 release; see [live evidence](../../releases/visual-discovery-20261104/LIVE_VERIFICATION.md). Release authority for PR75 is fulfilled; this iteration has no production authorization. A separately approved release would use fresh exact-head CI, guarded merge and configured deployment plus live smoke. Before release, discard/revise this focused feature branch if rejected. After any future release, reverting its application commit restores the prior homepage; there is no schema or data migration. Hosting rollback alone does not restore backend resources.

## Next three / commercial effect

1. Founder reviews first-screen desktop/mobile captures and working preview; resolve any concrete readability or comprehension issue.
2. With permitted real participants, check whether five seconds is enough to identify the purpose and next action, then observe example completion. Internal browser tests are not user research.
3. After candidate review and explicit release authorization, complete exact-head checks and production verification; assess real use before further design expansion.

Hypothesis: immediate visible value and evidence will encourage exploration and useful first sessions. No measured lift, acquired customer, revenue or retention claim. Bill discovery remains free; Business is a separate optional purchase path, not a paid bill-analysis promise. No new infrastructure expense or external service; financial baseline unchanged. Outbound remains Pending Founder Setup.
