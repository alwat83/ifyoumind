# ifYouMind integrated release candidate

November 10, 2026 · OpenAI / Codex · [Draft PR #82](https://github.com/alwat83/ifyoumind/pull/82) · `codex/integrated-release-20261110`

## Source and integration

Master base `e5d8f15fb9171a3723fdfc324dd0066d8d5caf5e`. Preserved the #79 → #80 → #81 stack and integrated independent #78 in application commit `4e1100fc1a4665b16d3b205c436249df7f22a757`. The master project record auto-merged. The current handoff and development log had overlapping insertions and retain both histories. The final candidate adds the review material and clarifies the date in the homepage Census evidence. The PR and its checks identify the current review SHA.

| Draft | Verified source head | Scope |
| --- | --- | --- |
| [#79](https://github.com/alwat83/ifyoumind/pull/79) | `d376f38b4c6eb5ac4e37027974e9e99257989eb0` | Homepage layout, image assets and entry routes |
| [#80](https://github.com/alwat83/ifyoumind/pull/80) | `16884db7ee6ff386e317ef76ac4234a661ab15bc` | Public plan comparison |
| [#81](https://github.com/alwat83/ifyoumind/pull/81) | `e645ae2c826d4a726a3af7e3d4063901e10eecbc` | Interactive examples and source-cell disclosures |
| [#78](https://github.com/alwat83/ifyoumind/pull/78) | `973aba77d5a49ca06b5026b3305d1540e7877350` | Sample report proof, sources and print layout |

Integration adds the Nashville transition copy, labels October 11 as the homepage evidence snapshot, and extends the desktop and mobile homepage regression to follow the two-city preview into the three-city sample. Scope includes Angular templates, styles, fixtures, assets, tests and records. Firebase Functions, rules, dependencies, billing implementation and workflows match the base. Source drafts remain open for reference.

## First visit and evidence

The warm palette, skyline, short heading and primary CTA carry the reference composition. Desktop puts the question, figures and takeaway in one panel. Mobile stacks the takeaway before the table and retains readable evidence at 320 pixels. The primary hero action opens the existing electricity example, while the homepage picker offers three questions in place. The two entry points provide different depths of exploration. On mobile the picker starts below the hero, so a visitor who follows the primary CTA can miss the other two questions.

- The Austin and Charlotte Census preview shows city estimates. The sample carries the same income figures, $93,658 and $82,068, and adds Nashville at $77,371. The source periods are 2015–2019 and 2020–2024 for change and 2020–2024 for current estimates. The report explains survey uncertainty and names demand, competition and rent as separate research.
- The illustrative electricity bill goes from $120.00 to $145.20, a 21% increase or $25.20. Usage increases from 600 to 660 kWh, or 10%. The source panel shows the calculations and CSV cells. The example gives a reason to inspect itemized charges.
- The illustrative tax bill rises $420 from $4,200 to $4,620. School charges account for $240 or 57.1%, with county and municipal charges adding $90 each. The evidence identifies the original cells. The breakdown points to where the difference appeared.
- The public offer explains the free Business brief, $79 once, or $39 monthly for five included full reports. Pro renews monthly until cancelled and previously unlocked reports remain accessible. The live homepage and both configured active USD Stripe Price objects matched. The five-report allowance, registration intent and entitlement behavior were checked through app code and emulator tests. The candidate uses the existing account and purchase flow.

There is an immediate, concrete payoff from switching to electricity and seeing 21% versus 10%. The proof report backs up the homepage’s promise by showing exact figures, limits and research steps. The bill examples serve a broad audience and paid Business reports serve a narrower need. A first-use study should test whether visitors understand that distinction and see enough value in the report to proceed to registration.

## Visual evidence

Captured from the integrated Angular app with local demo emulators and the seeded public Census sample. The viewports were 1440×900, 390×844 and 320×568 CSS pixels. Public Hosting regressions also ran at 375, 768 and 1024 pixels.

| State | Desktop | Mobile |
| --- | --- | --- |
| Full homepage | [1440](screenshots/desktop-home.webp) | [390](screenshots/mobile-home.webp) |
| Hero | [Desktop](screenshots/desktop-hero.webp) | See full homepage |
| City discovery | [Default](screenshots/desktop-discovery.webp) | [Default](screenshots/mobile-discovery.webp) |
| Electricity result | [Electricity](screenshots/desktop-electricity.webp) | [Electricity](screenshots/mobile-electricity.webp) |
| Source cells | [Evidence](screenshots/desktop-evidence.webp) | [Evidence](screenshots/mobile-evidence.webp) |
| Compare Plans | [Pricing](screenshots/desktop-pricing.webp) | [Pricing](screenshots/mobile-pricing.webp) |
| Business sample | [Full report](screenshots/desktop-sample.webp) | [Full report](screenshots/mobile-sample.webp) |

[Dated Census evidence](screenshots/desktop-city-evidence.webp) · [320px expanded evidence](screenshots/narrow-evidence.webp) · [PDF page review](screenshots/pdf-review.webp)

The five actual Chrome exports each contain eight pages. Desktop A4 and Letter were exported with backgrounds on and off, and mobile Letter was exported with backgrounds off. The desktop and mobile Letter exports contain identical text. Inspection covered white page canvases, both comparison measures, readable tables, Census references and uncertainty. The source-only last page has generous whitespace. The PDF review removes the local Firebase emulator warning only from print. On-screen report captures retain that warning and show the fixture report's own save date.

## Verification

[Launch build](https://github.com/alwat83/ifyoumind/actions/runs/42868886038) and [authenticated QA](https://github.com/alwat83/ifyoumind/actions/runs/42868886139) passed on the integrated application commit. Local production and emulator builds, changed TS/HTML ESLint, 145 fast tests, both production guards and all 69 Hosting browser cases passed. The local full suite passed 62 desktop cases then stalled at the transition to mobile and was stopped. The independent CI run completed the full suite.

| CI suite | Result |
| --- | --- |
| Fast web and Functions | 145 and 72 passed |
| Public Hosting | 69 passed |
| Discovery prototypes | 48 base, 27 electricity, 36 unified passed |
| Authenticated browser | 124 passed across desktop and mobile |
| Firestore rules, organizations, commerce | 7, 5 and 29 passed |
| QA fixtures and access | 24 passed, 1 existing skip |

The checks cover keyboard order, visible focus, selected-state controls, source table labels, live status text, keyboard disclosures, mobile menu focus restoration, color contrast, reduced motion and forced colors. Chrome accessibility snapshots supplement axe checks. A spoken screen reader, physical mobile devices and Safari remain outside this run. The app was tested with public data fixtures and emulated authentication and billing. Live price reads used Stripe GET operations. Real registration email, payment, fulfillment, customer acquisition and conversion require separate evidence.

## Performance

Five alternating fresh Chrome 157 contexts per width on a local ARM Mac, with the verified master and candidate production builds replayed from disk. External traffic was blocked. The measurements reflect local unthrottled rendering and do not represent field Core Web Vitals.

| Metric | Master | Candidate |
| --- | ---: | ---: |
| Initial Angular bytes / estimated transfer | 660.52 / 178.30 kB | 667.27 / 180.04 kB |
| Lazy homepage / estimated transfer | 33.12 / 7.15 kB | 47.10 / 10.17 kB |
| Lazy report / estimated transfer | 53.21 / 11.63 kB | 74.29 / 15.87 kB |
| 1440 median LCP / max CLS | 104 ms / 0 | 124 ms / 0 |
| 390 median LCP / max CLS | 92 ms / 0.018 | 104 ms / 0 |

The hero uses a high-priority WebP with a responsive source set. The 390px test at device pixel ratio 2 selected the 1440w image, about 31 kB. Use-case images loaded lazily. Production uses inlined font declarations and remained readable with remote font requests blocked. Electricity selection and source expansion produced only static SVG and nearby lazy image requests. The existing style budget warnings include the 7.97 kB report stylesheet against its 8 kB error threshold. The report chart uses CSS and the data is exposed as a labeled table.

## Release and rollback

GO for founder review and possible release authorization when the draft checks are green. Production status remains the previously verified PR #76 release, master `e5d8f15`, Hosting version `f76d7036fa558cf7`. Authorization must name the reviewed SHA and the automatic Firebase deployment from master. Before release, recheck master and PR checks and confirm the retained Hosting version is available. After an authorized merge, verify the deployment revision and smoke the public homepage, all discovery routes, sample, pricing, registration intent and authenticated report access. If rollback is authorized, restore the retained Hosting version for immediate recovery, then revert the integrated release on master and verify the restored paths. Review the configured Firebase workflow before either action.

1. Review the screenshots and walk the desktop and mobile journeys against the draft.
2. After release authorization and successful smoke checks, run short first-use sessions and record whether people understand the product, find the evidence and recognize the Business offer.
3. Use the existing acquisition plan to validate a qualified path to a paid report. Track actual checkout, fulfillment and independently verified purchases separately from internal QA. Outbound remains Pending Founder Setup.
