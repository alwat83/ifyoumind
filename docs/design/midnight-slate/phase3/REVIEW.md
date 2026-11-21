# Phase 3 — connected experience and release preparation

November 20, 2026 PST · OpenAI / Codex · draft #119, `codex/midnight-slate`.

Concept A remains the approved direction. No redesign, merge, deployment, production write, billing/enrollment change or provider request. Protected #118 remains unchanged at `2f4975f94ac888547df8b1fbdf149a50741f6570`. The tested starting candidate is `52dea070267b2858d559ca55094f25b024520923`: [707 native tests pass, 15 skip, valid integrity](../../../verification/local-first/VERIFIED_52dea07.md). New exact-head results are recorded on [#119](https://github.com/alwat83/ifyoumind/pull/119); checkpoints below are not substituted for that run.

## Connected audit and narrowly scoped correction

[Actual synthetic audit](JOURNEY_AUDIT.json) walked the following existing routes at desktop, 390 and 320 px without external requests. It is engineering observation, not an unassisted participant session.

| Journey | Observed behavior / boundary | Decision |
| --- | --- | --- |
| Home → reveal → evidence | One action reveals $420/$240 in place; synthetic labels and limitations remain; 57.1% arithmetic is inspectable. | Preserve A, motion and focus behavior. |
| Evidence → own tax/electricity CSV | Direct category-matched local intake; two-statement redacted format and unsupported PDFs disclosed. Local calculations, correction/clear and category-only return retained. | Preserve engines, privacy lifecycle and existing format limitations. |
| Private CSV → public example → cities → sample report | Public category survives the return; no private values travel into navigation/account. Sample report follows city evidence; household bills are not a paid report capability. | Preserve explicit separate scopes. No Checkout created. |
| Signed-in question → brief → saved decision → reopen | Original question and supported answer survive; existing signed-in report and evidence work. | Preserve auth, source/entitlement rules and saved data. |
| Empty / populated Your decisions | Empty list repeated the same create action under a different label. Private-bill boundary was only in the empty state. Populated list repeated a new-decision link. | Remove both duplicate links, retain one top-level action, move the existing boundary to the persistent lead, replace “Nothing to manage” with “No saved city decisions yet.” |

No audited dead end justified a new screen, route or feature. Supported CSV entry remains a material usability limit for people with only a PDF; no arbitrary bill capability is claimed. Account datasets are still explicitly separate from browser-local bill rows. Human understanding and comfort returning remain unmeasured.

| Actual changed surface | Desktop before / after | Mobile before / after |
| --- | --- | --- |
| Empty saved decisions | [Before](screenshots/before-empty-1440.jpg) / [After](screenshots/after-empty-1440.jpg) | [Before](screenshots/before-empty-390.jpg) / [After](screenshots/after-empty-390.jpg) |
| Existing saved city question | [Before](screenshots/before-saved-1440.jpg) / [After](screenshots/after-saved-1440.jpg) | [Before](screenshots/before-saved-390.jpg) / [After](screenshots/after-saved-390.jpg) |

[Before metadata](screenshots/before-capture.json) / [after metadata](screenshots/after-capture.json) include 320 px. All twelve complete captures have zero horizontal overflow. These are actual local Angular screenshots with synthetic QA questions, not real customer or verified local-market evidence. The unchanged first screen and reveal remain in the [A review](../first-five-seconds/REVIEW.md).

## Transaction investigation — reproduced mechanism, no backend patch

Two distinct paths were observed historically: `createMarketIntelligenceProject` and `writeWithinCap` dataset caps. Both use a transactional document read followed by a query/aggregate read. Existing application tests retain strict concurrency, quota, idempotent replay and authorization assertions.

1. A synchronized, ten-writer direct-SDK contention checkpoint compared ordinary queries with aggregate counts. Both permitted exactly two creations from 48 to 50 and refused the remainder. [Results](CONTENTION_CHECKPOINT.json). This did **not** naturally reproduce the historical error and does not establish that it is fixed.
2. The locked functions dependency is Firestore **7.11.6**, GAX **4.6.1**; emulator **1.19.8**, native Java **17.0.20.1**. A local gRPC proxy forwards only the demo database, uses the emulator Admin sentinel and injects one abort after a **real emulator rollback**. No credentials, production endpoint, application retry or SDK patch.
3. Both existing-ID `BatchGetDocuments` and `RunAggregationQuery` faults produce the same chain: injected code 10 → two real emulator code-3 replies for the same symbolic transaction → callback ran once, returned “Transaction is invalid or closed.” Durable counter remained **zero**, with no partial mutation.
4. Uninjected control commits once. Commit-abort control retries the callback and commits exactly once. [Sanitized checkpoint](TRANSPORT_CHECKPOINT.json). Strict recovery assertions: **two pass / two fail**. The failure is not accepted as an XFAIL or a passing diagnostic.

This proves transport masking in the installed stack under the controlled fault. It does **not** prove that historical failures started with this abort, that every closed transaction has this cause, or that production Firestore behaves identically. Firebase documents [emulator transaction limitations](https://firebase.google.com/docs/emulator-suite/connect_firestore#how_the_cloud_firestore_emulator_differs_from_production). An [open upstream report](https://github.com/googleapis/google-cloud-node/issues/9693) describes the same transport mechanism on other SDK versions; its proposed private patch is not treated as a supported fix.

### Reproduction and correction boundary

```sh
# Fresh demo Firestore emulator, strict recovery assertions; currently exits nonzero.
GCLOUD_PROJECT=demo-ifyoumind npm run diagnose:transactions
```

With the existing local demo emulator already running, use `GCLOUD_PROJECT=demo-ifyoumind FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 METADATA_SERVER_DETECTION=none node --test test/diagnostics/firestore-transaction-transport.cjs`. Never point this script at another endpoint. It refuses missing/remote emulator configuration and credential-bearing environments, cleans only its own synthetic subtree and writes ignored `test-results/phase3-reliability/transport.json`. No raw transaction IDs are retained.

Both local-first and restored Authenticated QA now include this strict diagnostic. It runs after normal browser checks so they remain observable. **An overall failed gate must be reported even if all ordinary journeys pass.** No automatic retry, skip, message-based code-3 reclassification or assertion relaxation is introduced.

**Proposed correction:** verify a supported SDK/GAX change that lets the original transactional abort reach the SDK-owned bounded transaction runner, scoped to transaction reads. No compatible supported fix is yet verified. Do not monkey-patch private runtime methods, switch the client-wide streaming engine, add unbounded retries, or change application cap/transaction logic to hide the error. A correction needs its own reviewed reliability scope and passing fault, authorization, same-key/different-key/month-boundary/cap, partial-query/no-duplicate, deadline and genuine-denial regressions before release. Existing quota/replay guarantees and records must remain intact. No backend transaction logic or dependency changed here.

## Visual verification

No Docker, Podman, Colima, Lima, OrbStack, QEMU, Multipass or supported VM application was found on this Mac. No verified existing Linux executor is available through the current tools. The existing pinned Playwright 1.56.0 / Ubuntu Noble container remains reproducible once a local Docker daemon is available:

```sh
npm run verify:local -- --expected-sha=FULL_CANDIDATE_SHA --docker --install
```

Here it explicitly falls back to native Chrome; it does not establish Linux parity. No paid runner, remote daemon, VM install or hosted-CI bypass was introduced. GitHub billing remains deferred.

Fixed a real latent visual-harness readiness issue: homepage capture waited for a link that is hidden until reveal. Shared journey definitions now exercise the actual first button and the revealed answer separately. Native readiness tests walk **the same seven journeys on desktop/mobile**, capture review images and assert visibility/overflow without reading or approving pixel baselines. The Linux suite retains its platform guard, strict screenshot assertions and missing-baseline failure. The new revealed-homepage baseline is intentionally absent pending Linux review. Snapshot paths and prior baselines remain unchanged.

Checkpoint: all 14 native readiness cases passed. Two initial boundary cases failed because the new *empty* test fixture mistakenly requested one decision; correcting the fixture to zero passed all four empty/populated cases with assertions intact. Initial run 26 pass / two fail is retained in the work log. Fast checkpoint 157 and runner checks eight pass. Two additional diagnostic safety checks pass, rejecting non-demo/remote endpoints and credential-bearing environments before a client can be used. Shared native fixture IDs are separated from the unchanged deterministic Linux identities to prevent collisions when both suites run on Linux. Exact-head full results follow separately.

**Unverified:** all Linux actual/expected/diff comparisons, physical iPhone/Safari, spoken VoiceOver and unassisted comprehension. No changed baseline is approved. When Linux is available, review each actual, expected and diff individually, explain intended differences, and update only reviewed files under the existing design-system procedure. Native readiness is not pixel approval.

## Impact matrix and Grandmother Test

| Surface | Assessment | Evidence / rationale |
| --- | --- | --- |
| Saved decisions | Change Required | Less repeated action, plain empty state, persistent bill/account boundary; paired three-width captures and empty/populated regressions. |
| Home, bill, city, sample and report paths | Verify Only | Approved A and existing engines/routes, privacy, report scopes and calculations unchanged; complete synthetic journeys and full local tests. |
| Authentication / pricing / Checkout / entitlements | Verify Only | Same identity/authorization and commercial code; no live session/payment or provider change. |
| Backend transactions / rules / production infrastructure | Not Affected by implementation | Diagnostic reproduces a risk without modifying them. Metadata readback is GET-only. |
| Verification / handoff | Change Required | Shared readiness, strict transport gate, evidence and dependency-aware release sequence. |

Engineering checks support a readable question, one free interaction, inspectable source, clear next step and existing recovery. They do not establish a grandmother's five-second comprehension, confidence, willingness to return or willingness to pay. Use the existing five-task guide with synthetic information and no coaching; do not claim a session occurred.

## Dependency-aware release gates — no execution authorized

| Candidate | Verified evidence | Release dependency |
| --- | --- | --- |
| #118 foundation | Exact `2f4975f94ac888547df8b1fbdf149a50741f6570`, OPEN/DRAFT, mergeable against current master. [Launch](https://github.com/alwat83/ifyoumind/actions/runs/44794807994) and [QA](https://github.com/alwat83/ifyoumind/actions/runs/44794808027) passed on that exact head. | Separate founder authorization, fresh release/rollback checks and explicit #111 gate disposition. Do not modify/release it as a side effect of #119. |
| #119 A + Phase 3 | Stacked on #118, preserving its ancestry. Baseline 52dea07 passed 707 native tests, but predates the new strict diagnostic. New exact head and all pass/fail/skip evidence belong on the existing PR and Notion. | #118 reconciled first, current candidate verified, Linux image review, unresolved recovery diagnostic/#111 gates, human review and separate exact-head release approval. |

[Fresh GET-only production inventory](PRODUCTION_READBACK.json), November 20 PST: current master is `6dcffca4eb186c6e0da7431523d7137652e14990`; Hosting `39dc573f3826dca6`, release `1794933315802000`, FINALIZED; prior `cd0b78221355e0f4` also FINALIZED. City writer `createmarketintelligenceproject-00087-nub` ACTIVE and 100% traffic; enrollment empty. These are readback facts, not a new deployment or rollback rehearsal.

### Required order and authorization checkpoints

1. **Hold both drafts.** Resolve supported recovery and Linux coverage, or obtain a consequential, explicit founder risk disposition with the evidence. The #111 production retry still needs an eligible existing, explicitly synthetic internal QA workspace, authorized owner and legitimate free capacity. Prior preflight found none; no new eligibility scan or live write was performed here. Do not create a fixture, reset allowance or waive the gate. The founder's current “before production action” checkpoint applies.
2. **Foundation first:** recheck #118 exact head, master, checks, mergeability, current Hosting and finalized rollback immediately before a separately authorized release. The normal master-push production workflow deploys allowlisted Functions, rules/indexes/storage and Hosting, even with unchanged backend source. GitHub billing currently prevents relying on that workflow. Restoring it or using a separately reviewed, explicitly authorized manual/Hosting-only process is a release prerequisite; no alternative is executed here.
3. Do not merge #119 while the #118 deployment is running: the shared production concurrency group has `cancel-in-progress: true`. Wait for #118 deployment and independent serving-version verification, then capture its exact finalized Hosting version as the immediate #119 rollback target.
4. Retarget/reconcile #119 to the actual released master, review the resulting diff, rerun exact-head local/available hosted and Linux visual gates, and obtain **separate #119 exact-head merge/deployment authorization**. Never infer release permission from Concept A visual approval or green ordinary tests.
5. Verify actual release commit, serving Hosting version and writer traffic independently; no success claim from GitHub merge alone. Stop if deployment, traffic or smoke evidence is uncertain.

### Rollback preparation

For #118 the present baseline is `39dc573f3826dca6`; keep `cd0b78221355e0f4` as the older finalized reference. For #119 use the independently verified, finalized #118 Hosting version recorded at its release, currently **unknown**. After separate rollback authorization, the supported operation is [Hosting releases.create](https://firebase.google.com/docs/reference/hosting/rest/v1beta1/sites.releases/create): POST `/v1beta1/sites/ifyoumind-473fe/releases?versionName=sites/ifyoumind-473fe/versions/VERIFIED_TARGET` with the reviewed rollback Release body. This creates a new release pointing to retained content. No POST was performed.

Restore Hosting first and retain the compatible #111 writer unless it is independently at fault. Do not send retrying clients to an older incompatible writer. Preserve all project, entitlement and allowance records. Restoring the pre-#118 client temporarily removes new clean-route/public-pricing behavior; test old `/app` entry and clean bookmarks accordingly. After any authorized rollback, verify current live-channel version, required legacy/new paths, authentication and saved access. A finalized readable version proves availability, not successful restoration or future IAM authorization; reverify both at execution.

### Production smoke checklist after separate authorization

- Confirm exact merge/deployment commit, live Hosting version and city-writer ACTIVE/100% traffic; enrollment remains closed and AI configuration unchanged.
- Home at 320/390/desktop: illustrative question, in-page $420/$240 reveal, 57.1% evidence, motion preference, keyboard/menu and legal paths.
- Own CSV entry shows the two-statement privacy boundary and correct category. Use public examples/empty intake for non-destructive navigation; any production data/fixture write needs its specific approval.
- Electricity and city examples, sample report and clear city/Business paid-report scope; no live Checkout, charge or provider request.
- Sign-in/verification, legacy redirects, existing saved brief/reports and sign-out; no entitlement assumption from redirects.
- Perform the separately approved #111 same-attempt live retry only after all eligibility preconditions and explicit current authorization. Reconcile original project ID and one allowance use; stop on uncertainty, never reset records.

**Recommendation: GO for focused founder experience review; NO-GO for production.** Ordinary UI success cannot waive the strict transport failures, unavailable Linux comparisons, #111 requirement, deployment-path readiness or separate founder authorization. No new participant, conversion or revenue outcome is claimed. The next useful action is the five-task review of the existing product while the supported reliability/Linux prerequisites are addressed.
