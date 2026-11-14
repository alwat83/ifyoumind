# Decision creation journey — audit and review

## Before implementation

| Entry or step | Current behavior and friction |
| --- | --- |
| Public homepage and Discovery | Property tax is the default made-up example; electricity and city evidence are secondary. Full tax/electricity examples and recognized CSV calculations run in the browser without an account. They are not bills about a specific visitor, a parcel assessment, or evidence of an appeal. |
| Free brief and sample handoff | The homepage brief link is a protected Business route. Anonymous users sign in first; its safe return URL retains the Business type. The public city example opens the Business sample; the $79 CTA registers with `intent=report` and returns to a Business brief before checkout. Generic sign-up defaults to Business. An already signed-in, unverified visitor can lose an explicit comparison or growth intent on verification. No private question travels through a public URL. |
| Existing authenticated wizard | General entry asks for a decision type; an explicit Business, compare or growth link skips it. The place screen requires a primary city and also requires a second city for Business and compare. The visitor is asked to delimit up to three comparisons with semicolons. An optional concept and editable default question only appear after location. A timed progress claim has no reliable basis. |
| Market creation | Verified app entry and owner/admin callable authorization are different gates. The callable expects an organization, primary U.S. Census place, concept string and decision text. It accepts zero to three comparison cities. It canonicalizes U.S. states, resolves place names against ACS 2024/2019 and caches places in Firestore. No lookup-only callable or app autocomplete exists. Authenticated result retrieval is tenant-scoped. Invalid input, unmatched places and upstream outages are distinct; the wizard formerly surfaced raw error text. |
| Result and payment | The free brief renders evidence, sources and limitations; the first comparison is free when provided, up to three appear in an unlocked report. Checkout, report reservation, generation and purchased/legacy entitlements are server-controlled. The free creation allowance and saved decisions are unchanged. |
| Separate PR #95 | Draft `73b893c067ae54b4b55100dbe168191386e7b00e` adds private typed tax/electricity results and optional comparison to the isolated Discovery app, not the market wizard. This branch does not import or duplicate it. |

## Proposed and implemented scope

- **Market:** Question → City → existing free Decision Brief and evidence → optional existing full report. Existing entry links prefill editable context. Comparison rows stay closed until requested; an explicit two-city comparison needs two distinct places. Optional business context is folded away. Place suggestions use a small named set of sample cities already supported by the product; any other U.S. city and state can be typed and is verified by the existing backend.
- **Bills:** Explicit property tax or electricity → existing free Discovery example and supporting evidence, without entering a city. Recognizable bill questions offer that same route instead of creating a market report. No question or household data is sent to Discovery, authentication URLs, or analytics. The bill workflow provides no verified tax fairness judgment or city-level substitute for a real bill. Real typed bill input remains in #95.
- **Boundary:** Anonymous visitors can still use the public examples and sample before signing in. Personalized market data starts on the existing verified-account route. Preserve allowlisted route context and report intent across applicable auth returns, and keep question/places in the active form on back, correction or retry. No server API, new dependency, deployment or paid provider usage.

| Surface | Impact | Verification |
| --- | --- | --- |
| Decision setup and route context | Change Required | Editable question, minimal city input, optional comparisons, validation and retry. |
| Homepage, existing Discovery, sample and result | Verify Only | Existing entry points and evidence; bills use the isolated browser-local route. |
| Authentication | Change Required | Carry an allowlisted decision destination through signed-in email verification; guard and verified membership unchanged. |
| Pricing, checkout, entitlements, report service and infrastructure | Not Affected | Reuse the existing APIs and commercial model; verify surrounding journeys and emulator commerce. |
| Mobile, keyboard, accessibility and application states | Change Required | Shared tokens, responsive focus, error/loading and deterministic suggestions. |
| Analytics and SEO | Not Affected | No new events, free text in telemetry, public page metadata or dependencies. |
| Handoff | Change Required | Record verification, captures, rollout gate and limitations. |

## Founder walkthrough

| Moment | Desktop (1280 px) | Mobile (390 px) |
| --- | --- | --- |
| Old location step | [Before](decision-creation/before-desktop.webp) | [Before](decision-creation/before-mobile.webp) |
| Start with the question | [Question](decision-creation/question-desktop.webp) | [Question](decision-creation/question-mobile.webp) |
| Continue to the city | [City](decision-creation/place-desktop.webp) | [City](decision-creation/place-mobile.webp) |
| Free brief and existing offer | [Brief](decision-creation/brief-desktop.webp) | [Brief](decision-creation/brief-mobile.webp) |
| A bill needs no city | [Property tax handoff](decision-creation/bill-desktop.webp) | [Property tax handoff](decision-creation/bill-mobile.webp) |

The captures use the same local Chrome and synthetic Firebase Auth fixture, with the emulator warning hidden in both builds. In the city step the original question remains visible. Start from the homepage's free brief or the public sample, verify an account, edit the starter question, and create a brief for Springfield, IL. Compare cities by opening a second field; no special punctuation is required. Switch to a bill question from the generic route and the primary action changes to the made-up bill example immediately.

The question is saved with a completed market brief. The deterministic report uses the city and optional business context; it does not interpret arbitrary questions. Questions stay in memory until submitted; leaving or reloading before submission discards them. A local suggestion is not a verified place. No new autocomplete service, climate/parcel/rate data, tracking, uploads, external AI or checkout behavior was introduced. If the backend doesn't match a place or data is temporarily unavailable, the screen explains how to retry and retains entries. A one-city offer omits comparison claims.

**Review decisions:** Is the two-screen market flow clear, and is the explicit bill-example exit distinct enough? Confirm that authenticated personalized market briefs and existing anonymous bill examples are the appropriate release boundary. Anonymous personalized market lookup or the real typed bill draft would need separate scope review. No change in customer acquisition or revenue has been measured.

**Release and rollback:** Draft only. Before an authorized production release, verify the actual master/artifact and all exact-head checks. Do not ship missing or unexplained visual baselines. Reuse the normal release path and retain the preceding Hosting version. Restore that Hosting version for a user-facing regression if authorized; prepare a reviewed source revert. No Functions, rules, provider or commerce changes are needed for the candidate.

## Verification

- `npm run test:seo`: 137 passed. `npm --prefix functions test`: 72 passed.
- Local production and demo builds completed. `npm run check:production-bundle` and `node scripts/check-discovery-isolation.mjs --production` passed. Existing bundle warnings remain. Local production build on this design measured the initial application at 681.46 kB raw and 182.90 kB estimated transfer, and the unchanged Discovery bundle at 235.41 kB raw and 66.27 kB estimated transfer.
- Targeted local Chrome covered 47 desktop and 47 mobile QA cases using synthetic Census fixtures, including one-city creation, distinct comparisons, keyboard suggestions, axe, verification links between browsers, protected routes, saved results, tenant isolation, a simulated upstream outage and retry, and simulated checkout, credit and legacy Pro behavior (94 passed). The final bill routing and auth handoff also passed six focused desktop/mobile retests. The visual comparisons use Linux CI; see the [exact-head checks](https://github.com/alwat83/ifyoumind/pull/98/checks).
- Verification used emulators and synthetic data. No live payments, production provider calls, field latency, real-device screen reader, Google OAuth popup or independent customer outcomes were tested.
- [Linux visual review run](https://github.com/alwat83/ifyoumind/actions/runs/43619934157) passed 136 authenticated browser cases and reported four intentional visual failures: two decision cases lacked the four new question/place snapshots, and two registration cases differed after the copy correction. Reviewed each new candidate and both registration expected/actual/diff sets. Registration changed only the explanation and its vertical reflow. Accepted these six images; unrelated baselines were left alone. The final exact-head run checks the committed references.
