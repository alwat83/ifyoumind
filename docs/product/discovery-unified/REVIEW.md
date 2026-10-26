# Unified discovery — consolidated founder demonstration

## Founder review update — October 24, 2026

Founder accepts PR72's unified discovery product direction; **visual aesthetic is not final**. Planning and implementation of the narrow `/discover/` integration are now approved on a separate feature branch, preserving the current production homepage, Business functionality/prices and privacy restrictions. This supersedes older implementation-scope approval requests below; no merge or deployment is authorized. **Development is paused until the next founder session after recording this decision.** No integration implementation, additional redesign or feature expansion today. Existing release/capability gates and Pending Founder Setup remain.


October23,2026 CDT. **Working local-only candidate, ready for founder review.** Property tax and electricity now start from one entry, not separate technical demos. No public route, homepage replacement, new dataset, AI, PDF, server storage, price change, merge or deployment.

## Open and try it

`npm run build:unified` then `npm run start:unified` → **http://127.0.0.1:4315/** on the development machine. Choose **Try example** on either card: one click immediately creates supported findings without an account or question. **Use my CSV** opens that dataset’s existing file area and focuses its chooser; it does not guess a category or silently open/upload a file.

Suggested five-minute founder demonstration:

1. Read the two choices: **Property tax discovery** and **Electricity bill discovery**. Choose the tax example. See420USD/10% total change and the school charge’s240USD/57.1% contribution.
2. Expand a finding by keyboard. Exact source cells, current raw values and equations remain available.
3. Review/correct County2024 to1000 while total remains4200. Findings disappear; rerun honestly rejects the inconsistent sum. Correct total to4300 and rerun:320USD increase with current edited evidence and no misleading offsetting-change share.
4. Use **Clear & choose another**. It explicitly discards the current data and focuses the shared entry heading; sources, edits, follow-ups and pending file reads do not carry into another category.
5. Choose the electricity example. Distinguish consumption+60kWh/10%, total+25.20USD/21%, and whole-bill average0.2000→0.2200USD/kWh. The average includes all charges and is not a supplier tariff. Fixed/variable amounts are only what the source explicitly identifies.
6. Through **Use my CSV**, try [the existing unknown-split fixture](../discovery-electricity/unknown-electricity-v1.csv) and [one-bill fixture](../discovery-electricity/one-bill-electricity-v1.csv). Unknown stays unknown; incomplete input makes no comparison. Data can be corrected/completed/rerun in the same experience. A tax CSV in electricity (or reverse) is refused with the right format guidance, never automatically reinterpreted.
7. Clear, return and reload. Data is not saved. The same supported-file/privacy explanations are available throughout.

A direct in-app keyboard review also completed entry→tax example→exact evidence→clear/entry→electricity example→clear/entry, with result/entry heading focus verified. No native device or spoken screen-reader pass is implied.

## Coherence without another engine

`UnifiedDiscoveryComponent` adds only the chooser/navigation/session boundary. It mounts the **same existing discovery host** with an explicit scoped `ELECTRICITY_MODE` injector and small entry inputs. `startWithExample` runs the existing example path; `startAtFile` focuses the existing file control. Embedded mode removes duplicate technical-demo headers/footers. The existing shared CSV/money/comparison engine, evidence contracts, finding component, domain adapters, correction/rerun/error handling and clear logic remain the source of truth.

Category changes clear before unmount, and host destruction also invalidates pending reads. The unified shell clears on page exit/restoration. No hidden parallel tax/electricity component retains another dataset. No new dependencies, general upload framework, category guessing or added dataset formats. The independent tax/electricity bootstraps remain compatible for regression review; their original approved local builds are restored after testing this branch.

## Privacy and actual capabilities

Exactly two recognized redactedCSV formats,2rows/2MB,USD tax data or compatible kWh/USD electricity bills. Each chosen experience retains its full schema/period/zero/missing/reconciliation/classification restrictions and redaction guidance. No PDFs/scans/arbitrary spreadsheets, AI interpretation, external lookup or private sharing. All calculations and input state remain browser-local with CSPconnect-srcnone, no provider/auth/analytics initialization, storage or backend writes. Clear/exit removes data from this application, not cryptographic OS/browser memory. Source labels and limitations remain attached to findings; no tax correctness, tariff, cause, forecast or savings conclusion.

The unified build has its own bootstrap/index/output/loopback server. Production app imports/routes/assets, Business source/prices, dependency lockfile and deployment workflow are unchanged. This is not available on ifyoumind.com yet.

## Verification

| Check | Current local result |
|---|---|
| Fast tests |135PASS, includes24tax+16electricity unit tests; no calculation-engine change in this sprint|
| New unified browser suite |36PASS0FAIL0SKIP,48.6s,desktop1280/mobile390/narrow320|
| Independent tax / electricity browser suites |48PASS(1.5min) /27PASS(40.1s)|
| Accessibility |0automated checked WCAG2/2.1A/AA violations; keyboard/focus, one main/h1, evidence/error/correction/clearing checked|
| Privacy/switching |0externalrequests/writes/browserstorage entries; unknown/wrong format, pending read→other category, reload/restore and clearing expanded evidence covered|
| Builds/guards |Production/tax/electricity/unified builds,preflight,33fileproductionguard,21JSdiscoveryexclusion,allthreepreviewguards,targetedlintPASS|
| Legacy failures |Fresh91global lint errors/11Angular compiler diagnostics, same signature multisets0new/removed; Angular tests did not execute; no Karma-port conflict in this session|

Unified initial226.97kB/64.84kB transfer; production659.83/178.03. Existing shared hoststyle5.06kB exceeds4kB warning but is below8kB error; no budgets relaxed. Final exact-head GitHub CI/runs are pinned in the new draft PR after push, not inferred from70/71checks. Existing integration skip and manual live signup/email/PDF/payment limitations remain explicit.

Measured layout:390×844both example actions visible within first screen (bottom472.19/737.19px).320×568first tax example visible, second category requires vertical scrolling (electricity action bottom912.28px); no horizontal overflow. After one click, first finding headings are within each viewport:desktop469.22tax/440.72electricity,mobile498.05both,narrow562.19both. This is internal browser measurement, not proof of human comprehension, conversion or field performance. NativeSafari/iOS/physicaldevice/spokenSR/novice usability remain unverified; earlier native-control/Chrome-connection limits are historical, not newly closed.

Resolved attempts, not hidden baseline failures:

- Initial HTML copied the legacy root selector; bootstrap displayed useful reload guidance instead of the new entry. The attempt failed/timed out and was interrupted, not counted as a pass. Corrected `app-unified-discovery` root and added build-time HTML-selector guard.
- Next full run34PASS/2narrowFAIL:unified header pushed both first finding headings to630.69px beyond568. Compact mobile navigation restored562.19px; final36PASS without weakening assertions.

## Visual evidence

All27captures show actual local Angular UI with synthetic data, unedited; [hash manifest](screenshots.json), [structured results](verification.json).

| State | Desktop | Mobile |
|---|---|---|
| Shared entry |[Desktop](screenshots/desktop-entry-full.png)|[Mobile](screenshots/mobile-entry-full.png)|
| Tax findings |[Desktop](screenshots/desktop-tax-findings-full.png)|[Mobile](screenshots/mobile-tax-findings-full.png)|
| Electricity findings |[Desktop](screenshots/desktop-electricity-findings-full.png)|[Mobile](screenshots/mobile-electricity-findings-full.png)|
| Tax evidence |[Desktop](screenshots/desktop-tax-evidence-full.png)|[Mobile](screenshots/mobile-tax-evidence-full.png)|
| Electricity evidence |[Desktop](screenshots/desktop-electricity-evidence-full.png)|[Mobile](screenshots/mobile-electricity-evidence-full.png)|
| Correction |[Desktop](screenshots/desktop-corrected-full.png)|[Mobile](screenshots/mobile-corrected-full.png)|
| Wrong category |[Desktop](screenshots/desktop-wrong-category-full.png)|[Mobile](screenshots/mobile-wrong-category-full.png)|
| Unknown split |[Desktop](screenshots/desktop-unknown-full.png)|[Mobile](screenshots/mobile-unknown-full.png)|
| Incomplete |[Desktop](screenshots/desktop-insufficient-full.png)|[Mobile](screenshots/mobile-insufficient-full.png)|

[390px entry first screen](screenshots/mobile-entry-fold.png) · [320px tax result](screenshots/narrow-tax-fold.png) · [320px electricity result](screenshots/narrow-electricity-fold.png).

## Decision and next assignment

**GO for unified local founder review. Public deployment remains NO-GO until the proposed integration is implemented, exact-head tested and explicitly authorized.** [Precise production integration/release proposal](RELEASE_PLAN.md) records70→71→unifiedancestry, a static `/discover/` island, privacy/asset/SEO/status/Business checks, actual automatic deployment targets and guarded rollback.

Recommended next assignment, after founder scope approval: implement that small public entry integration on a feature branch. Do not add categories, overhaul the homepage or build speculative analytics. First-time usefulness and willingness-to-pay remain unvalidated; internal tests are not customer traction. Outbound **Pending Founder Setup**, no messages or purchases.
