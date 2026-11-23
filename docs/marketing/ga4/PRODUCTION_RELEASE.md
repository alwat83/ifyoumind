# GA4 production execution receipt — STOPPED

November 23, 2026 · OpenAI / Codex · [PR129](https://github.com/alwat83/ifyoumind/pull/129). Exact founder authorizations [7113948791](https://github.com/alwat83/ifyoumind/pull/129#issuecomment-7113948791) and [7114343078](https://github.com/alwat83/ifyoumind/pull/129#issuecomment-7114343078) were executed. **Deployment succeeded; live privacy validation failed. NO-GO for completed analytics activation.** No automatic rollback, settings change or corrective deployment was performed.

[Machine-readable receipt](production-release.json). Raw credentials, browser IDs, cookies, account identifiers and unredacted cloud metadata remain outside public evidence.

## Deployed components

| Component | Exact source / production evidence |
| --- | --- |
| Hosting | `297efc22ef45108d5b42afe328ae6ba75f116130` |
| Live Hosting version | `267c912aeea5478b`, FINALIZED |
| Hosting release | `1795475756058000`, `2026-11-23T23:15:56.058Z` (15:15:56 PST) |
| Callable package | `a661acd16969913ab85bb524aaf677acbbabe348`, unchanged |
| Callable | `claimVerifiedPurchase`, ACTIVE, Gen2/Node22/us-central1 |
| Serving revision | `claimverifiedpurchase-00001-jul`, Ready, 100% traffic |
| Execution limits | 15seconds/max2/concurrency10/min0, zero secret bindings |
| Anonymous denial | Actual POST: 401 UNAUTHENTICATED, before receipt access |
| Retained OFF rollback | `08500dca665abbab`, independently FINALIZED; not restored |

The existing reviewed Gen2 runtime identity was used. No new runtime principal, manual IAM grant, provider credential or paid service was provisioned. The normal Google deployment build completed successfully in 41.617seconds; no local application rebuild, source change or artifact substitution occurred. The isolated callable's local analyzer resolved already-installed reviewed dependencies through an owned symlink **outside** its frozen package; that symlink was removed afterward. No node_modules or NODE_PATH environment was added to the artifact/deployment.

Exact commands, existing Firebase CLI13.35.1, explicit production project:

```sh
node node_modules/firebase-tools/lib/bin/firebase.js deploy \
  --project ifyoumind-473fe \
  --config test-results/ga4-final/functions-a661acd1/firebase.json \
  --only functions:claimVerifiedPurchase
node node_modules/firebase-tools/lib/bin/firebase.js deploy \
  --project ifyoumind-473fe \
  --config test-results/ga4-activation/hosting-297efc22/firebase.json \
  --only hosting
```

No other deploy, merge, hosted Actions run or payment was performed. The manifest's original `releaseAuthorized:false`/`deployExecuted:false` preparation fields were not rewritten: later founder comments authorize execution and this separate receipt records it.

## Preflight and independent readback

Initial GO21:32:13.927UTC, and fresh pre-Hosting GO23:15:51.587UTC. Verified current CLI identity against the previous release creator/finalizer/releaser, correct project/number, reviewed runtime access and actAs, pinned artifacts, saved Enhanced MeasurementOFF, no known local/workflow/Functions deployment overlap, rollback and applicable deployment/restore permissions. All150historical operation records were done, with both pages inspected.

Postcheck23:18:46.793UTC: all66provider static-file hashes and normalized configuration match the exact artifact; all34pre-existing Functions' state/update/build/service configuration unchanged. Enrollment, Stripe, AI, auth and pricing unchanged. All six public marketing JPEGs return anonymous200/image/jpeg/exacthash. Private Discovery's three asset hashes and CSP unchanged. All153frozen Hosting/callable files, both archives/manifests/config rechecked after deployment: PASS. No customer/allowance/entitlement write, rules/indexes/Storage change, real purchase or provider call.

Local checker diagnostics are preserved privately: historical identity hash lacked a canonical algorithm, so actual three deployment principals were compared; nonexistent permission names were replaced with the pinned CLI's actual sites.update/get checks; historical operation pagination was completed; full-vs-short Cloud Run revision names were normalized after inspecting Ready/100% metadata. An unprivileged network readback produced an authentication-style transport error and the authorized network-enabled readback succeeded. These were checker/environment corrections, not permission grants or artifact/config changes.

## Live verification and stop

Only fresh signed-out Chrome contexts and non-sensitive synthetic QA were used. No tag/provider response mocking:

| Check | Actual result |
| --- | --- |
| Reject analytics → tax reveal → evidence | PASS: $420finding/evidence, zero Google requests |
| Private Discovery synthetic example → clear | PASS: result/clear, zero Google requests |
| Before consent on Privacy page | PASS: no Google tag or collector request |
| Explicit consent | One tag to G-NRT31062LW; one observed page_view; collector HTTP204 |
| URL/title sanitization | **FAIL**: observed `dl=https://ifyoumind.com/privacy-policy?qa_release=internal`, `dt=Privacy Policy \| ifYouMind`; expected query-free URL and fixed `Privacy policy` |
| Withdrawal | PASS: ga-disable=true; no additional collection during bounded observation; fresh QA contexts closed |
| Realtime | UI showed0/no data at observation; ingestion unverified, not success |
| DebugView / verified paid conversion | Not executed; no purchase permitted |

First live script stopped on its schema assertion; it had recorded rejection/Discovery success but not the offending wire fields. One minimal instrumented consented observation captured the mismatch and withdrawal; no further collector test was performed. Both diagnostic records are retained. No real sensitive inputs were entered. Standard Google pseudonymous browser/session metadata is not published in evidence. The benign QA query proves a potential sensitive-query exposure path; **do not call the privacy gate passed because the test query itself was harmless**.

The application source supplies sanitized URL/title fields, but the actual Google tag emitted document-derived values. Exact runtime cause is not established; do not assume Enhanced Measurement was ON (savedOFF was independently verified twice before release). Mocked offline tests cannot establish actual Google serialization. No source correction, Google setting modification or replacement artifact is authorized by this failed test.

## Production state, costs and next decision

**Tracking remains deployed and may collect from consenting visitors. It has not been disabled or rolled back.** Rejected consent and the private Discovery boundary worked in the observed contexts. Existing Functions and commercial behavior remain intact. Retained OFF Hosting08500 is verified and restorable with the already-checked permission; restoration requires separate founder authorization. The new callable has no prior revision, remains authenticated, and is not itself the URL-leak source.

Requested decision: authorize **Hosting-only** restoration to08500, preserving the new callable and all other services. The existing documented releases.create procedure applies; do not execute without that authorization. No automatic rollback.

No new paid GitHub/service, OpenAI, advertising or payment spend. Existing Firebase build/hosting/runtime usage billing applies; actual dollar charge is unmeasured. Concurrency/maxInstances are capacity controls, not monthly spend caps. No customer/revenue/traffic outcome inferred from QA; Stripe remains the authoritative financial ledger. Historical payment waiver, transaction, physicalSafari/VoiceOver/Linux/human-comprehension limitations remain unchanged.

Exactly three next actions:

1. Founder decides the narrowly scoped OFF Hosting rollback; no duplicate deployment approval request.
2. Isolate real Google URL/title serialization and add a meaningful regression on a separate corrective source; preserve frozen artifacts and all failed evidence.
3. Only after privacy verification, authorize a new exact candidate and bounded collector/Realtime check; do not count QA as acquisition.
