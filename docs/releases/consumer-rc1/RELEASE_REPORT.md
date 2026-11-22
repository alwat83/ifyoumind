# Consumer Release Candidate 1 — founder decision package

**Execution update:** [Founder final GO7071675451](https://github.com/alwat83/ifyoumind/pull/125#issuecomment-7071675451) records risk/scope approval for5:00–5:20p.m.PST. The [execution attempt stopped at4:39:15p.m.PST](EXECUTION_STATUS.md) under the explicit not-started-window rule, before any mutation or later preflight. No deployment attempted; active window remains necessary. The preparation memo below remains historical and its earlier “two decisions” wording is superseded by this approval/timing record.

**Current final-gate reconciliation — November21,4:23p.m. PST:** [Decision package and risk disposition](FINAL_GATE.md). #111 is now **verified GO** at e9005b491b77d8414d6d8e06f599d72a51255ae2; do not repeat it. Fresh source/artifact/control/rollback readbacks are linked there. **Production remains NO-GO pending explicit risk disposition and controlled exact Hosting release authorization.** Original preparation results below are historical unless specifically updated. No new production write/retry, rebuild or artifact change in this reconciliation.

November21,2026 · OpenAI / Codex · [Draft evidence PR #125](https://github.com/alwat83/ifyoumind/pull/125). **Candidate preparation PASS; production release NO-GO under the current unwaived gates.** No product changes, merge, deployment, workflow/protection change, customer write, billing/enrollment action, provider generation or system installation. The approved headline, supporting copy and “Reveal what changed” CTA are unchanged.

## Exact candidate and package

**Source `9d8caefc9943d65767198d6ec490dbdd63fd02e8`**, reviewed #124 head. [Fresh GitHub/ancestry evidence](GITHUB_INVENTORY.json) confirms #118→#119→#121→#122→#123→#124 already form one direct chain, all draft/MERGEABLE. No cherry-pick, rebase or source merge was needed. #120 remains independent atf856c3b and is excluded. `codex/consumer-release-candidate-1` carries only this evidence/handoff after the exact source; its later hash is not represented as a tested executable source.

| Artifact | Verified value |
|---|---|
|Local frozen package|`test-results/hosting-consumer-rc1-9d8caef/`|
|Portable archive|`test-results/hosting-consumer-rc1-9d8caef.tar.gz` ·1,056,098 bytes|
|Archive SHA256|`756b3d23fc067025c13c4713d5d4708d599a9797e905e0f85d8ea366728963f7`|
|[Full manifest](ARTIFACT_MANIFEST.json) SHA256|`b7067f63d53e08457b4234901415749f19600bdcb81ff2319432f0bb835ac397`|
|Source fingerprint|`d0d892d1f88c6c2b2ae1107b1506beedf6104477ef658843d826d53c3b94dc55`|
|Static content|58 files /2,044,279 bytes|
|[Isolated config](HOSTING_CONFIG.json) SHA256|`a985fa400017d793640bd4c895435d0c8d4a302c183efcb7d50999794ce5dec0`|

[Artifact checks](ARTIFACT_CHECKS.json): production build/bundle/isolation guards passed; manifest matches the exact report/source fingerprint; package and extracted archive independently re-hashed. Only top-level `hosting`, explicit siteifyoumind-473fe and `public/`; no Functions/rules/Storage, hooks, dynamic rewrites or commercial deployment configuration. Existing privacy/security headers and static/legacy rewrites preserved. The compiled hero contains the unchanged copy,88px cap and independent balancing, without the old viewport minimum. Eight static paths differ from the old4fa109f artifact, including new hero/main chunks: **this is the rebuilt #124 candidate, not the old package renamed**. Neither generated assets nor raw test traces are committed.

## Native verification and limitations

Fresh [machine-readable report](VERIFICATION.json): **19 checks PASS;594 tests PASS/zero FAIL/14 Linux visual SKIP**. Clean exact SHA/branch/digest before/after, isolated digest equal, zero source events; integrity VALID. Selected Consumer development PASS; overall PARTIAL for native Chrome/Node/Java differences. No standalone lint, hosted CI or physical-device pass claimed. No new dependency/tooling installed or visual baseline updated.

| Executed test group | Passed |
|---|---:|
|Fast web, including artifact safety|173|
|Existing first-screen review tools|12|
|Property-tax Discovery / electricity / unified|48 /27 /36|
|Production Hosting/privacy/CSV journeys|84|
|Authenticated consumer journeys|214|

Coverage includes home→reveal→$420/$240 evidence; supported synthetic/redacted CSV analysis, correction/clear/offline/isolation; city brief/save/reopen and retry fixtures; public/signed-in/active/legacy pricing; genuine local refusal of new monthly enrollment; auth/return/tenant boundaries; keyboard, axe, reduced motion and320/390/820/1280/1440 layouts. [Approved actual visual pairs and font checks](../../design/hero-question-refinement/REVIEW.md) remain valid because this RC changes no UI bytes. The existing four offers and legacy behavior are preserved; this is not live purchase/fulfillment proof.

**NOT_RUN:** Functions unit, Firestore rules, organizations, commerce/entitlements, fixture/access and strict transport diagnostic at this Consumer level. Their historical evidence/failures are preserved, not newly passed. The baseade00b0 assesses the approved frontend increment; it does not reclassify the entire historical routing/security stack as low risk. Physical Safari/iPhone, spoken VoiceOver, Linux pixel comparisons and unassisted comprehension remain unverified.

## Production, compatibility and rollback

[Fresh authenticated metadata](PRODUCTION_INVENTORY.json),20:01UTC: live Hosting **`39dc573f3826dca6`**, release **`1794933315802000`**, deployed November17 at16:35:15.802Z. This is the immediate rollback target for a future candidate release, subject to recheck at execution. It is FINALIZED,58 ACTIVE file records with hashes/config accessible. Historicalcd0b78221355e0f4 is FINALIZED58;1beeaa395c606d55 FINALIZED57. Existing CLI identity's `firebasehosting.sites.get/update` and project-read permissions passed a [read-only permission test](https://docs.cloud.google.com/resource-manager/reference/rest/v1/projects/testIamPermissions); no IAM change. These are [documented Hosting permissions](https://docs.cloud.google.com/iam/docs/roles-permissions/firebasehosting). This is retained-version/config/file-metadata and permission readiness, **not an executed restore, downloaded historical blob verification or approval to roll back**. Another identity must be checked independently.

Seven inspected Functions are ACTIVE/latest Ready/100% single revision with enrollment EMPTY: city writer00087-nub, recent-project reader00086-fox, project reader00086-gaq, public sample00045-gow, commercial status00088-soz, Checkout00071-doc and paid generation00015-xek. Full revision names/hashes are in the inventory. [Source invariants](SOURCE_INVARIANTS.json) confirm Functions, Firestore rules/indexes, Storage rules, environments, city/monetization services, purchase-intent handling and production workflow equal current master6dcffca. Approved frontend changes include clean routes/auth return destinations and presentation; native tests exercise them. Old `/app` routes remain compatible in the candidate. This establishes source/API-contract compatibility and serving metadata, **not cryptographic deployed-source attestation or paid fulfillment**. The later e9005b4 evidence now independently proves the bounded live same-ID save/retry case; it does not certify faulted/concurrent/month/dataset recovery.

Publishing static assets can therefore be separated from **redeploying** backend/billing infrastructure. It cannot remove those dependencies from saved-city, account-dataset or report actions. No new backend defect is established by this RC; original city/aggregate/month/dataset failures remain distinct. Controlled emulator read-abort failures are not automatically proof of production incidence or a single shared cause. Do not repeat rejected SDK experiments or claim a correction.

## Exact remaining gates and smallest next action

| Gate | Current evidence / minimum action |
|---|---|
|Exclusive production control|[Fresh readback](FINAL_CONTROLS_READBACK.json) (older snapshot retained in RELEASE_CONTROLS.json): active broad master workflow, cancel-in-progress:true, no outstanding jobs at observation, no enforced master/ruleset/environment approvals. **No exclusive window established.** The final memo proposes one named operator/window, credential/Console freeze and a separately approved short repository Actions pause/restore because a historical active workflow is unclassified. No exclusive custody is inferred from project IAM metadata. Local mutex alone is insufficient. No settings changed here.|
|#111 live retry|[Latest recorded status](111_STATUS.json): test already authorized, **GO, completed** under dedicated setup authorization7070107031, verified commit e9005b491b77d8414d6d8e06f599d72a51255ae2: decisions0→1→1/remaining3→2→2, same ID, zero retry writes and owner-read PASS. Superseded NOT_EXECUTED evidence remains historical in the JSON. No new test performed in this reconciliation; no remaining allowance use authorized.|
|Transaction recovery / gate disposition|No qualified supported correction; #120 and historical month/dataset failures remain open. The bounded #111 proof now passes; it does not resolve these separate findings. See the final memo for explicit E1–E4 disposition, not another dependency matrix. Hosting-only risk separation still requires an explicit founder gate disposition; a passing live retry would not erase controlled recovery failures.|
|Device/accessibility/pixels|Native coverage passes; physical Safari/VoiceOver/Linux pixels remain unverified. Complete available manual checks or explicitly record the founder's limited-release coverage decision. Do not relabel gaps, weaken tests or install tooling under this assignment.|
|Rollback|Retained target/config/file metadata and current CLI permissions ready. [Fresh live-channel/version/permission readback](FINAL_ROLLBACK_READBACK.json) confirms current39dc finalized58 and current CLI permissions. Fresh execution-time checks and **separate exact rollback authorization** remain required; no restore performed.|
|Live billing/subscriptions|No new live billing verification. These remain independent activation/paid-outcome gates, not prerequisites for displaying the already-approved closed monthly offers. Enrollment stays empty; no Checkout, payment or Stripe action in this RC.|

**Recommendation: preparation complete; production execution NO-GO now. Conditional Hosting-only GO recommended only after the final memo’s two founder decisions and all hard gates.** A narrowly authorized Hosting-only release is technically supportable without a Functions rollout, but cannot be called fully reliability-verified. The remaining route forward is the final memo’s explicit limited-scope/coverage disposition and exclusive controlled Hosting authorization. #111 is complete and must not be repeated. If the founder retains every existing gate without exception, hold this frozen package; do not silently waive them or start broader development. This recommendation is separate from the authorization required for any release.

## Execution reference — not executed

Preserve the frozen package and use a verified execution copy; re-read source/protections, current Hosting/rollback, active runs and relevant backend/enrollment metadata immediately before mutation. The existing [Hosting-only/independent rollback procedure](../phase5/HOSTING_ONLY.md) applies, with **this source and manifest**, never the old4fa109f artifact. A master merge still invokes the broad27-Function/rules/Storage workflow and is not authorized or necessary for this proposed static operation.

Only after separate exact authorization, the reviewed command is the pinned13.35.1 CLI with explicit project, isolated config and `--only hosting`; no bare/default deploy, hooks or workflow dispatch. Independently verify the actual new Hosting version/asset hashes, unchanged backend/empty enrollment and safe public/authenticated navigation. Production saves, Checkout, payments and provider generation require their own scope. Rollback creates a new Hosting release of the captured FINALIZED version only after separate approval; it restores the previous UI and may temporarily invalidate newly copied clean-route bookmarks, while preserving backend/data/entitlements. No automatic rollback is implied.

Local reproduction, executed on clean9d8caef before the documentation-only handoff:

```sh
npm run verify:local -- --level=consumer --base-sha=ade00b0c21c8e499a434ec8cf5581ef52984b829 --expected-sha=9d8caefc9943d65767198d6ec490dbdd63fd02e8
node scripts/prepare-hosting-release.mjs --expected-sha=9d8caefc9943d65767198d6ec490dbdd63fd02e8 --run-dir=test-results/local-first/2026-11-21T20-00-20-823Z-9d8caefc --out=test-results/hosting-consumer-rc1-9d8caef
node scripts/prepare-hosting-release.mjs --expected-sha=9d8caefc9943d65767198d6ec490dbdd63fd02e8 --verify=test-results/hosting-consumer-rc1-9d8caef
```

Future rebuilds need a clean exact-source checkout and new output directory; do not overwrite this artifact. Local preview4393 uses the tested RC snapshot and synthetic demo emulators; no real information or payments. Product/design/auth/commerce/SEO/privacy source are **Verify Only** in this preparation; deployment/handoff evidence is **Change Required**; live billing/AI/customer data are **Not Affected** because no operation changes them. No customer, conversion, revenue or comprehension outcome is claimed.
