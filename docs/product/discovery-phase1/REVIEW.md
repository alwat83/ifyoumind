# Phase 1 — working automatic discovery for founder review

**October23 founder follow-up:** direction confirmed; focused copy/recovery improvements and a proposed second category are documented in [FOUNDER_FOLLOWUP.md](FOUNDER_FOLLOWUP.md). Local only; PR70 remains draft and approval-gated.

October23,2026 CDT · OpenAI/Codex · **Implemented and tested locally; not merged, deployed or offered in production.** Founder authorized Phase1 of #69 at `ee7d05be4a301a21918fbf20a2eb54ab4093304b`. Dedicated branch `codex/automatic-discovery-phase1`; exact final head/CI pinned in its draft PR. Includes preserved #69 documentation history once; no separate #69 merge or production authorization.

## Try the actual experience

```sh
npm run build:discovery
npm run start:discovery
```

Open **http://127.0.0.1:4313/** (loopback only). No registration, prompt, backend, Firebase initialization, OpenAI request or paid API. This is a working Angular component and deterministic calculation engine, not a homepage mockup. The production homepage remains unchanged.

1. Click **Try example data**. Two synthetic annual statements produce the total change, component contribution and common proportional change automatically. Labels say example data and calculated, not model-generated or official tax interpretation.
2. Expand **Show source cells & calculation** on each finding. Inspect the exact current raw values, original parsed CSV grid references, normalized amounts and every arithmetic step. Reversed row/header order keeps correct coordinates.
3. Open **Review or correct data**. Edit County2024 to1000.00 and Total2024 to4300.00. Old findings disappear immediately; rerun yields a320.00USD increase, with the edited source cells. Edits replace the source for the current run; an untouched duplicate of the private file is not retained.
4. Explore suggested follow-up questions. They explain which evidence to seek; they do not claim to know causes, compare municipalities or fetch anything.
5. Load [one-year CSV](one-year-tax-v1.csv): honest insufficient-data message, no findings; complete the second row on the page and rerun. Blank amounts, duplicate years and inconsistent totals are refused rather than filled or combined.
6. Load [supported example CSV](example-tax-v1.csv), or a redacted file in the same format. Parsing and analysis stay on this device. **Clear my data** removes source values/findings; a late file-read result cannot restore them. Reload starts empty. Example download contains only the public synthetic fixture.

## Exact supported format and limits

Headers: `tax_year,county_usd,school_usd,municipal_usd,total_usd` (all five required; order may vary). One property, one USD currency, same three component definitions, two consecutive annual tax years. Non-negative decimal billed amounts, at most two decimal places, no currency symbols/grouping/formulas/scientific notation; maximum999999999.99USD per amount. Component sums must match total exactly. Zero is valid; missing is invalid. One row is recognized but insufficient. More than two rows/unknown headers/negative adjustments/multiline fields/malformed quotes are refused.2MB byte limit before reading. CSV logical rows include the header; evidence coordinates refer to that parsed grid rather than physical text lines.

No PDFs, scans, arbitrary spreadsheets, OCR, billing-account/parcel identification, assessment verification or real-tax retrieval. Users must redact identifiers and supply comparable annual statements; the adapter cannot independently prove that two redacted rows belong to the same property or currency. No forecast, tax correctness, appeal advice, savings claim or causal inference. Two years do not establish a trend/correlation. Component shares are suppressed when opposing changes make net contribution percentages misleading; ties/zero denominators/unchanged data have explicit honest states. Exact integer cents and BigInt ratio rounding avoid float errors; small non-zero changes are not reported as zero percent.

## Architecture and privacy boundary

`src/discovery-main.ts` bootstraps only `TaxDiscoveryComponent`, Angular common/runtime and the pure engine. Reuses the existing CSV tokenizer behind strict syntax/schema/value validation; does not modify existing registered CSV or Business report behavior. Separate `discovery` Angular configuration/index/tsconfig/output folder; no production route/import/link/asset, Firebase config, auth, analytics or service dependency. No new dependency or production deployment workflow change. `connect-src 'none'`, noindex, no external assets, no forms/frames; loopback static server accepts onlyGET/HEAD and does not receive file contents. CI builds both entries and checks exclusion/provider-free isolation.

CSV/file/draft/finding state stays in component memory. File input is cleared after reading; filename is not kept/displayed/logged. No upload, browser storage, cookies, IndexedDB, telemetry, model request, private export/share or saved report. Page-exit/restore clears state; Clear invalidates pending read tokens and removes input values/evidence. This is application-level disposal, not a promise to cryptographically erase browser/OS memory or control extensions/device behavior. No broader server retention/provider-policy claims. The existing registered Business data import is a different, unchanged persistent feature; its previously identified blank→0 conversion is not reused or fixed by this isolated slice.

## Verification

| Check | Result |
|---|---|
| New pure engine/unit tests | **24PASS0FAIL** |
| Fast web suite | **119PASS0FAIL**, includes those24 |
| Standalone browser suite | **48PASS0FAIL0SKIP**,1280×900/390×844/320×568, follow-up28.8s |
| Accessibility |0automatic WCAG2/2.1A/AA violations in checked welcome/findings/evidence/error/zero/follow-up/corrected states; keyboard first-click/disclosures/focus and source errors covered |
| Privacy regressions |0external requests/writes; no local/session storage, cookies or IndexedDB; reload/clear/late-read cancellation checked |
| Production + standalone builds and both bundle guards |PASS;21productionJS files exclude discovery;33production files pass emulator/fixture guard; preview has no provider endpoints |
| Changed TS/template lint |PASS |
| Global lint / Angular test |**91errors /11compiler diagnostics before execution**, same baseline signature multisets,0new/removed; not represented as passing |

Follow-up installed-Chrome capture: first findings107ms desktop,50ms mobile,100ms narrow, after the explicit example click. First finding heading bottom481.22/496.55/560.69px, within each viewport. These are internal reference-Mac measurements, **not physical-device, field-performance, first-user comprehension or conversion results**. No real-user feedback/purchase/revenue outcome. Physical iOS/Safari/manual VoiceOver/NVDA speech remain unverified. Existing positive live signup/payment/PDF gaps and integration skip remain separate commercial baseline limitations.

Follow-up discovery initial build197.50kB/58.11kB transfer (previous195.6/57.7). New preview stylesheet6.71kB carries a4kB warning, below8kB error limit; no budget relaxed. Production initial659.80kB/178.02kB transfer versus recorded659.78/178.01; no discovery JS/route imported. Existing production bundle/style warnings remain. Production functionality/Business79report/39monthlyPro unchanged; full existing emulator/Business regression outcomes are pinned in exact-head CI, not guessed from old green commits.

Earlier attempts: sandboxed Angular process aborted134; local build passed outside sandbox. First browser harness timed out before any cases because Angular emitted `discovery-index.html`; corrected explicit index output to `index.html`. Initial full33then36cases passed; a newly added first-screen regression subsequently found320px finding below568 (35PASS/1FAIL). Compact result layout and header brought heading bottom544.19; focused narrow1PASS and final36PASS. A new source-style preflight failure8347bytes was resolved by splitting responsive styles using existing project conventions; final production build/preflight/bundle checks passed. No failed attempt counted as a pass or hidden as baseline debt.

## Visual evidence

All15 current captures are the actual Angular preview with synthetic inputs; no image editing or private records. [Hash manifest](screenshots.json), [structured verification](verification.json).

| View/state | Desktop | Mobile |
|---|---|---|
| Welcome, first screen | [1280](screenshots/desktop-welcome-fold.png) | [390](screenshots/mobile-welcome-fold.png) |
| Automatic findings, first screen | [1280](screenshots/desktop-discovery-fold.png) | [390](screenshots/mobile-discovery-fold.png) |
| Complete result | [Desktop](screenshots/desktop-discovered-full.png) | [Mobile](screenshots/mobile-discovered-full.png) |
| Source cells/calculations | [Desktop](screenshots/desktop-evidence-full.png) | [Mobile](screenshots/mobile-evidence-full.png) |
| Honest insufficient data | [Desktop](screenshots/desktop-insufficient-full.png) | [Mobile](screenshots/mobile-insufficient-full.png) |
| Repeated native file-read failure | [Desktop](screenshots/desktop-read-failure-full.png) | [Mobile](screenshots/mobile-read-failure-full.png) |

[Narrow320 first screen](screenshots/narrow-welcome-fold.png) · [Narrow320 first finding](screenshots/narrow-discovery-fold.png) · [Corrected source/result](screenshots/mobile-corrected-full.png).

Follow-up attempt:45PASS/3FAIL because the new empty-file test expected a schema message instead of the actual helpful “CSV is empty.” Parser behavior was correct; test expectation corrected, full48PASS0FAIL. Native read failure messages now avoid raw exceptions, retaining only the diagnostic error name in the console. Incomplete/editing input no longer receives a completed-discovery heading. Public homepage integration remains deliberately absent pending release approval.

## Founder review / next decision

Interact with the example, inspect one finding, make one correction, try insufficient data, and clear it. Evaluate whether the first result is useful and credible without a prompt. The founder has confirmed automatic discovery as the foundation. The next changes should follow this interaction, not another set of homepage mockups; the electricity-bill proposal is for review only. Any physical-device/manual-SR/novice validation should report actual observations. Outbound remains **Pending Founder Setup**, no invitations/account requests.

Phase1 local development/testing approval does **not** authorize any merge, production deployment, broad uploads, PDF/OCR, model/provider activation, pricing/subscription change or outreach. Existing production remains74a91fb/Hostinga4b9fd4f6533ce8b (last verified release). Follow-up Phase2/AI/private-storage/pilot gates remain separate. No Stripe changes, payments or speculative analytics added.
