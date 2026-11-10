# Business Report Proof — Phase 1

November 6, 2026 · OpenAI / Codex; specific model/session unknown. **Implemented locally on a master-based feature branch; not merged or deployed.** Authoritative starting point: [November6 audit](../experience-audit-20261106/README.md), its report specification, backlog and measurement contract. Founder explicitly authorized this implementation, with separate release approval retained.

## What the customer sees

The public sample now opens with a concise question and two measure-specific findings: Austin's $93,658 median household-income estimate and Charlotte's5.4% population-change estimate. These values come from the loaded report; no demonstration numbers are hardcoded into the component. Native buttons switch directly labeled three-city comparisons. Visible copy says the estimates do not establish business demand, competitors, rent or a winning location, and that differences are not statistically tested.

One disclosure exposes the report's actual official Census references, both ACS vintages, recorded retrieval dates and city-table links. Opening evidence or switching views does not fetch, persist or track anything. The current sample remains an illustrative decision using real Census estimates. The report's saved date is shown rather than calling cached figures “live.” Original question, complete detailed report, source count/method, copy/print, free path and existing purchase-intent links remain available. Links move focus directly to the market-analysis draft and existing research checklist. Unsupported saved shapes fall back to the original full report.

The short sample notice uses native disclosure for repeated offer detail; sample identity and Census provenance remain visible. Repeated brand/metadata text is reduced on screen and retained in print. No first-use wizard, fake generation, winner score, new data/provider, pricing or billing change.

## Concrete before and after

| View | Master baseline | Implemented slice |
|---|---|---|
| Desktop1280×900 | [Before](screenshots/before-desktop.png) | [After](screenshots/after-desktop.png) · [Full](screenshots/after-desktop-full.png) |
| Mobile390×844 | [Before](screenshots/before-mobile.png) | [After](screenshots/after-mobile.png) · [Full](screenshots/after-mobile-full.png) |
| Narrow320×568 | [Before](screenshots/before-narrow.png) | [After](screenshots/after-narrow.png) · [Full](screenshots/after-narrow-full.png) |
| Source interaction | Prior source/summary below detailed introduction | [New mobile source panel](screenshots/after-mobile-sources.png) |

[Baseline observation](BASELINE.json) · [Final layout observation](LAYOUT.json). Same public sample payload replayed locally before/after; fallback fonts. The local Firebase warning is an emulator-only overlay; capture hides it for the final images/PDFs, not via production code. Before screenshots preserve their original capture. No private household file, real account, financial record or customer data appears in these images.

Both highlighted values are fully visible in each checked first viewport: bottom585.44px/900desktop,537.73px/844mobile and556.58px/568narrow. Horizontal overflow0. These are layout measurements, not proof that a first-time visitor understands the product in30seconds. Participant testing remains deferred until the end of this design pass; no invented comprehension or conversion result.

## Print fix and actual export proof

Baseline print inspection confirmed a dark page canvas from the global body background after the report's white surface ended; the host retained a100vh minimum. A global color transition initially delayed the scoped print color change. The fix applies a white body background and disables that transition **only in print media while a report is present**. The report host's print minimum height is removed. Analysis paragraphs/headings, cards, source blocks and source/footer adjacency have appropriate break rules; tables/citations/footer remain readable. No screen palette or other route's print styling is changed by the conditional body rule.

Print always includes both measures, named cities, exact values, periods, sources and uncertainty, independent of the last selected screen view. Interactive controls are omitted; the full report remains. Native browser print/save PDF is retained—no new renderer, provider, upload or backend service.

| Output | Visual proof |
|---|---|
| Baseline, live A4 | [Preserved audit contact sheet](../experience-audit-20261106/screenshots/sample-print-contact-sheet.png) |
| Isolated fix, before new digest | [Print-only fix](screenshots/print-fix-contact-sheet.png) |
| Final public sample | [A4 backgrounds](screenshots/after-print-A4-backgrounds.png) · [A4 default](screenshots/after-print-A4-default.png) · [Letter backgrounds](screenshots/after-print-Letter-backgrounds.png) · [Letter default](screenshots/after-print-Letter-default.png) |
| Free / paid / Pro rendering | [Free matrix](screenshots/owned-free-print-matrix.png) · [Purchased matrix](screenshots/owned-purchased-print-matrix.png) · [Pro matrix](screenshots/owned-pro-print-matrix.png) |

[Print matrix record](PRINT_CHECKS.json):16state/settings combinations—public sample/free/purchased/Pro × Letter/A4 × backgrounds on/off. Owned states are explicitly intercepted QA rendering fixtures, not real purchases. Actual server entitlements are covered separately by commerce/rules tests. Full rendered page sheets are reviewed for dark tails, clipping, headings and source preservation; PDF text checks independently reject empty pages, require actual sample figures/source limits and ensure free output excludes the paid market-analysis section. Public sample has8pages; the extra overview is retained for comprehension, not marketed as shorter output. No page-count or paper-saving claim. [Download the final public sample PDF](../../../output/pdf/ifyoumind-business-sample.pdf).

## Engineering scope

- Print-only commit `b965d3e`: conditional global print canvas, separate report print stylesheet and market-analysis pagination/legibility rules. Final print refinements accompany the presentation commit.
- New standalone `ReportProofComponent` plus pure `report-proof.ts` presentation helper; integrated only in sample mode after the existing sample request succeeds. No changes to report-generation algorithms, schema, server responses, auth, checkout, entitlements or payment processing.
- Helper preserves units/direction/zero, all tied maxima, incomplete/unavailable figures and finite chart geometry. Known inconsistent income vintages are not combined into a lens. Unknown periods/dates stay unknown; untrusted/non-Census source URLs are not promoted into the new inspector. Existing original report remains the fallback.
- Seven meaningful fast cases; six browser cases across desktop/mobile plus explicit narrow/text-spacing/forced-colors/reduced-motion checks. Existing mobile sample assertion now targets the new concise proof while still checking the original detailed summary and all7contents links.
- No dependency, Firebase/Stripe configuration, deployment workflow, homepage or discovery-engine change. PR77 is not in this branch's ancestry and remains at its original head.

## Verification and limits

Master baselinee5d8f15:137fast and production buildPASS before source changes. Candidate production and emulator-local buildsPASS;144fast/72FunctionsPASS; targeted threeTS/twoHTML lintPASS; production36file guard and21rootJS/3allowlisted discovery-asset isolationPASS. Demo-only rules7/organizations5/commerce29PASS; fixtures24PASS+1existingSKIP. Complete local desktop/mobile browser suite124PASS. Final affected print/owned-state checks rerun after pagination refinement; final focused12PASS0FAIL0SKIP after the final pagination/free-fixture refinements, recorded in [VERIFICATION.json](VERIFICATION.json). Counts overlap the full suite, not an extra136distinct cases. Initial two-worker attempt passed its desktop cases then stopped making progress at project transition and was terminated; not counted as a full pass. The bounded single-worker complete run succeeded. Initial print canvas assertion caught the color transition before the fix; failed attempts are not passes.

Actual public/owned print renders and final hash/link/whitespace/scope checks accompany this review. Exact-head GitHub checks follow the new draftPR; prior PR77/master checks are not inherited. Existing global91lint/11Angular test-compiler diagnostics and the fixture skip remain disclosed; full global lint/Karma were not rerun or claimed fixed. Main bundle662.05kB (178.61kB estimated transfer); lazy report74.29kB (15.84kB estimated transfer); new proof stylesheet4.70kB warning remains below8kB error. Existing build-budget warnings remain, none relaxed. Physical devices/Safari/spoken screen reader, native printer dialogs, real signup/payment,30second novice comprehension and commercial lift remain unverified. Local browser tests block external traffic; print/visual captures replay public data and use fallback fonts.

## Commercial alignment

[Specific mismatch and proposed presentation](COMMERCIAL_ALIGNMENT.md): $39/month Pro includes five full reports versus $79 for one without a subscription. Both use the same full-report product. Existing prices, entitlements and calls to action remain unchanged. The one-time preference is not a superior analytical deliverable. A later offer presentation should explain both choices transparently; no billing/price decision is inferred from this implementation. No real purchase, audience/user count, revenue or profitability claim.

## Review, release and continuation

Local preview: http://127.0.0.1:4326/sample-report while the checked Hosting emulator is running. Without the capture replay it uses local demo Functions; run the guarded demo emulator stack for its sample data. Build with the existing lockfile, `npm run build` and `npm run build:local`; existing `npm run test:e2e` requires the local demo guards/Java/dependencies, not production credentials. Source/PR/exactCI and handoff commits pinned in the conversation after push.

Production remains the retained PR76/e5d8f15/Hostingf76d7036fa558cf7 release record. No production Hosting API refresh, deployment, master push, rollback, spend, private-file capability, AI/provider activation or outbound. Separate exact-head approval is required for any future merge/deployment. Rollback is a scoped revert of the reviewed presentation/print changes and separately authorized redeployment; none performed here.

Next three: review this working comparison and actual sample export; conduct the deferred30second relevant-task walkthrough when testing resumes; then address transparent offer/context continuity using actual findings, without price changes. Recommended next implementation after review is offer clarity for the existing sample/free-brief paths—not new data or analytical features. Outbound remains **Pending Founder Setup**, with no participant/sender reminders or messages.
