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
