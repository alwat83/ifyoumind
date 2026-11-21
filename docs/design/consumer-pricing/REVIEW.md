# Consumer pricing — public clarity, enrollment unchanged

November 21, 2026 · OpenAI / Codex · `codex/consumer-pricing-clarity`, based directly on #119 exact `172dbaa93231e88fd2256b3ca7c2726d81a7c6e0`. This branch does not contain #120's experiment commits or alter #118/#119. No merge or deployment authorized.

## Consumer experience

All four offers are public without a signup or disclosure click: Free $0; Starter $4.99/month for one full Decision Report per paid billing period; Plus $9.99/month for three; one-time report $79. Starter and Plus receive equal primary visual emphasis using the existing Midnight Slate palette, Instrument Serif numerals and shared controls. No new design system, dependency or feature.

The existing free action moves near the heading, beside concise Free/$79 disclosure. A mobile screenshot review found that burying this action under two unavailable plans would impede adoption. The one-time price links to its existing offer in the same page. The free account/bill/report distinctions are plain:

- Bill examples and recognized CSV comparisons need no account. Bill files remain in the browser; no arbitrary PDF or bill intelligence is promised.
- An account enables saved city Decision Briefs, with the existing free limits and one comparison city.
- Paid city/business Decision Reports add comparisons, source-backed analysis and an action plan using public city evidence. They do not analyze a household bill, validate a tax assessment or establish overpayment.

Monthly enrollment is explicitly unavailable when the existing server eligibility is false. Disabled controls have plan-specific accessible names and an associated explanation. Price visibility does **not** unlock Checkout. `PricingComponent` TypeScript, backend, manifests/locks, environment and Stripe configuration are unchanged. Existing authorized-sandbox eligibility still exercises its prior Checkout wiring through intercepted responses; no public enrollment is activated.

Free and one-time offers retain their existing paths. The $79 option explicitly has the same full-report scope as a monthly credit, with no subscription; no fabricated premium distinction or misleading discount is introduced. Existing Starter/Plus subscribers retain their Account path. Grandfathered $39 Pro retains server-priced status, five-report allowance and billing management. Private status clearing and delayed-response protection on sign-out are unchanged.

## Before / after

| View | Before: exact #119 | After: this candidate |
|---|---|---|
| Desktop 1440 | [Before](screenshots/before-desktop.jpg) | [After](screenshots/after-desktop.jpg) |
| Mobile 390 | [Before](screenshots/before-mobile.jpg) | [After](screenshots/after-mobile.jpg) |
| Narrow 320 | [Before](screenshots/before-narrow.jpg) | [After](screenshots/after-narrow.jpg) |
| Tablet 820 | No new baseline | [After](screenshots/after-tablet.jpg) |
| Existing Plus | No layout change outside pricing | [Desktop](screenshots/plus-desktop.jpg) / [mobile](screenshots/plus-mobile.jpg) |
| Legacy Pro | Existing Account logic retained | [Desktop](screenshots/legacy-desktop.jpg) / [mobile](screenshots/legacy-mobile.jpg) |

The before preview's route-specific pricing HTML was byte-matched to the preserved 172dbaa local build. Images are real Angular/demo screenshots, not mockups. Only the documented Firebase emulator overlay is hidden in review captures; all accessibility and overflow checks run on the normal page. [Capture metadata and hashes](screenshots/before.json) / [after](screenshots/after.json). No Linux snapshot is updated or approved. Physical-device Safari/VoiceOver and unassisted comprehension remain unverified.

## Verification and preserved failures

New browser coverage verifies public, signed-in Free, active Starter, active Plus and legacy Pro on desktop/mobile, with320/390/820/1440 overflow and WCAG A/AA checks. It checks correct prices, allowances, disclosure, disabled enrollment, keyboard order, refresh, the free continuation, Account management and the preserved decision reference. Signed-in Free sends genuine **local** enrollment calls and receives FAILED_PRECONDITION before any Stripe access. Active/legacy billing responses are rendering fixtures only; they do not mutate entitlements.

Checkpoint results: initial targeted 48 cases: 42 pass/six fail, all six a new inline-link visual distinction defect. Restoring underlines fixed it; the subsequent 48 pass. After moving the existing free action above the unavailable plans, ten focused cases pass. Initial sandbox build aborted before compilation; native build passes. Initial sandbox fast run 158 pass/one filesystem-watcher failure; native fast 159 pass. None of these earlier failures is erased or called a pass. Final exact-source local-first [summary](VERIFIED_76b4ca2.md) / [machine report](VERIFIED_76b4ca2.json):738 pass/three fail/15 skip, integrity VALID, zero source events. All 214 authenticated and84 Hosting cases pass. Commerce month-boundary save and both strict read-recovery assertions fail. The following commit is evidence/handoff only; no executable changes after tested 76b4ca2.

The complete existing local-first plan remains intact, including the strict transaction diagnostic. No assertion, cap, retry or failure classification is weakened. Expected existing Firestore recovery failures remain release blockers even if consumer UI checks pass. Do not label the overall gate green when those fail. No hosted CI success is claimed during deferred GitHub billing.

## Impact matrix

| Surface | Assessment | Evidence / rationale |
|---|---|---|
| Public/signed-in pricing | Change Required | Visibility, hierarchy, scope and unavailable-state copy; stateful browser coverage and before/after |
| Homepage, Discovery, saved decisions, reports | Verify Only | Existing linked destinations preserved; full local-first coverage, no product source changes outside pricing HTML/SCSS |
| Authentication / Account | Verify Only | Existing identity loading/clearing, active-plan and legacy management; session, verification and subscriber tests |
| Checkout / entitlements / subscription controls | Verify Only | Backend and TypeScript unchanged; existing intercepted contract tests and genuine closed-enrollment emulator denial |
| Mobile/tablet/desktop/a11y | Change Required | Same shared tokens;320/390/820/1440, keyboard, disabled semantics, underlined inline links, axe |
| Analytics/SEO/privacy | Verify Only | No new tracking, persistence or bill association; public pricing still makes no private callable request |
| Reliability handoff | Change Required | Minimal unsent SDK reduction and sanitized existing trace; no rerun of rejected experiments |
| Production/#118/#119/#120 | Not Affected | New branch, no protected branch update, deployment, environment or data write |

The Grandmother Test is an engineering hypothesis: a stranger should distinguish free private bill comparisons, account-saved city work and paid public-data reports; find an available free action; see all prices without signup; and understand that monthly enrollment is unavailable. No participant session or measured comprehension/conversion result is claimed.

## Reliability track — preserved and separate

[Unsent sanitized upstream package](../../../test/fixtures/firestore-upstream/README.md) includes a small SDK-only natural-contention reduction, the unchanged #120 passive observer/guard and a redacted existing natural trace. No authentication, customer, Census, billing or product data is included. Syntax, fail-closed guard and helper provenance checks were performed; the new reduced contention probe and a new dependency installation were **not** run. It must not be represented as independently reproduced. No external report is submitted. [#120](https://github.com/alwat83/ifyoumind/pull/120) stays at `f856c3b462903422a8cad4aaa6bdaed41268fe3b`, with its original NO-GO and diagnostics preserved. No rejected version matrix is repeated.

## Release decision

Consumer UI review readiness is separate from backend and production readiness. This candidate is for founder review only. Production remains NO-GO: unresolved recovery, #111 eligible-workspace live retry, #118 dependency, Linux individual image review, physical devices/assistive technology, human comprehension and separate release authorization. Sequence stays #118 → verified foundation → reconciled consumer candidate → separate founder approval. No subscription activation, Stripe or AI change is included. Roll back an unreleased candidate by leaving it unmerged; any later authorized release must independently record fresh Hosting/Functions rollback targets.
