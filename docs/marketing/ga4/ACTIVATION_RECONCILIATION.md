# GA4 final activation reconciliation

November23,2026 · OpenAI /Codex · **Prepared only; no production authorization executed.**

## Saved setting and authority

Fresh authenticated UI readback after reload confirms accountifYouMind/property **565380927**, production stream **16394318092**, URL`https://ifyoumind.com`, measurement **G-NRT31062LW**, Enhanced Measurement switch **OFF (value0)**,0connectedsite tags. Observed approximately18:52–18:54UTC. The founder made the setting change before this session; Codex performed read-only navigation/reload. EarlierON observations were dated historical readings and must not be presented as current blockers. No Google edit, test-send or collector request was made.

Standard Pageviews remain listed in the UI with Enhanced MeasurementOFF. The application still suppresses the automatic initial view (`send_page_view:false`) and sends only manual allowlisted page events. At release, re-open/reload this exact stream and STOP if the saved switch isON or IDs/destination differ. This is a verification gate, not a new request to repeat the founder's completed setup.

## Isolated candidate and frozen baseline

Preserved PR128 evidence head **b86229d9f7887d0ba79204660d1be3bec098c55d**, OFF executable **a661acd16969913ab85bb524aaf677acbbabe348** and all original packages. On **codex/ga4-activation-candidate**, the only application-code diff from b86229d9 is:

```diff
-export const GA4_PRODUCTION_ENABLED = false;
+export const GA4_PRODUCTION_ENABLED = true;
```

Necessary tests update the flag expectation and add three viewport executions of an offline production-origin probe. It serves actual production-build files into a fresh context at a simulated production hostname, using `route.fulfill` only. Google is mocked and all other external traffic blocked. No local test marker enables this path; the flag must actually be true. The OFF build fails the positive assertion (0views), and the prepared activation build passes only after consent, with one tag, sanitized SPA views, withdrawal and isolated Discovery. This is **offline browser evidence, not live GA4 delivery**. An initial probe used a Privacy link absent from the existing pricing page; the probe was corrected to the existing back-to-home path without changing UI/assertions. Diagnostic logs remain local.

No auth, billing, pricing, subscription, entitlement, report generation, backend handler, package/lockfile, Hosting/rules, privacy payload or design logic changed. Keep the activation branch separate from PR128's OFF source; do not retarget/merge either as part of this assignment. Source SHA, gate results and new artifact hashes are recorded in the activation machine record and draft candidate PR.

Frozen baseline manifests/archives and every file were reverified before editing:

| Artifact | SHA256 |
| --- | --- |
| OFF Hosting manifest | d5c05b12fe251e9400ccc78397a417ff1c880625897126e067c741549e1d099c |
| OFF Hosting archive | 6af07bc4562a126e2a10848bebdca81e8ff0da0ca5228c8056bd60a385b01b0d |
| Single-callable manifest (87files) | 0899eeee2ac1c35123226232081a907f4d9cea8c64ab1d7f0c1284edc5becc31 |
| Single-callable archive | 1b3f7b596ae7061787122c92234f05e65bebee79f4fa30932083cbd5658abf78 |
| Isolated Hosting configuration | a985fa400017d793640bd4c895435d0c8d4a302c183efcb7d50999794ce5dec0 |

The existing callable package is reusable unchanged: oneexport, idempotentAdminbootstrap, us-central1/15seconds/max2/concurrency10/zero secrets. Its source remainsa661acd1; do not relabel it as a newly compiled backend. Only the Hosting activation artifact requires a new source/hash. Original OFF archives are not overwritten.

## Production readback and unchanged surfaces

Read-only18:56:32.596UTC observation: Hosting **08500dca665abbab FINALIZED**, all64serverfile hashes and configuration match the approved marketing release. All34Functions state/update/build/service configuration match the retained production baseline, including Checkout, both Stripe webhooks, Billing Portal, commercial status and AI. Prior rollback **2bb9f7f3c6545b0e** remainsFINALIZED. The actual deployed commercial-status environment still has one explicit enrollment allowlist entry; no public enrollment is opened. A404on an unused configuration-document path was not treated as enrollment evidence; the source and deployed environment are authoritative. No customer documents or Stripe APIs were inspected.

All six public marketing JPEGs and private Discovery assets must match the retained hashes in the prepared activation package. Prices and all commercial source remain byte-identical. No payment, subscription, AI, account, rule, IAM or production-data write was performed.

## Focused verification and costs

Run native production/local builds, web/policy tests, consent/privacy and existing customer journeys, the new offline production-origin probe, receipt/rules checks and production-bundle/isolation guards. Retain the full453-test verified OFF baseline separately: backend implementation is unchanged. Use a fresh owned demo stack for fixed-ID backend suites; preserve the unrelated emulator. Do not repeat rejected Firestore SDK experiments or claim hostedCI/physicalSafari/VoiceOver/Linux or realGAcollector coverage.

New probe command:

```sh
QA_BROWSER_CHANNEL=chrome node node_modules/@playwright/test/cli.js test \
  --config e2e/ga4-activation.config.mjs
```

No paidGitHub dependency, new provider/license, advertising spend, payment or OpenAI request is introduced. ExistingFirebase usage billing applies after an authorized deployment: receipt claims need bounded Firestore reads plus one dedupe write; refresh/replay may add reads but not duplicate claims. Precise marginal production cost is not measured. maxInstances2/concurrency10/15secondlimits bound concurrency/execution, **not a monthly hard spending cap**. No budgets or quotas were changed.

## Exact future deployment/rollback plan — not executed

1. Obtain founder authorization for the frozen activation Hosting source/hash and unchanged single-callable source/hash, project`ifyoumind-473fe`, using existingCLI13.35.1. No merge or broad workflow is needed. The savedOFF prerequisite is complete; freshly verify it rather than editing Google again. Capture currentrelease, rollback availability/permissions, no known overlapping release and runtime/IAM readiness. Abort unexpected grants/secrets/config changes.
2. Deploy only`claimVerifiedPurchase` from the reviewed isolated87-file package using its functions-only config and `--only functions:claimVerifiedPurchase`. VerifyACTIVE/Ready/100%, approvedexistingruntime, region/limits and zero secrets. No other function/rule/Storage/IAM/AI/billing change. The new callable has no previous revision; payment/report behavior must not depend on it.
3. Deploy only the newly verified activation static archive/config using explicitproject and `--only hosting`. Preserve all marketing/Discovery files and the reviewed security configuration. Never substitute the oldOFFarchive or rebuild during deployment. Independently read back servingversion/file hashes and unchanged protectedFunctions/enrollment.
4. Only under that release authorization, perform bounded, consented QA navigation and Network/Realtime/DebugView readback: no collection pending/rejected/expired; exactly one destination/manualview per route; no sensitive URLs/payloads; withdrawal/regrant/cross-tabclear; Discovery zero post-load traffic. This assignment does not authorize those production events. No real purchase is needed or requested.
5. Stop for unexpected collection, duplicate routes, private data or drift. With separate rollback authorization, restore then-current **08500dca665abbab** artifact/release (freshly recheck at execution); read back routing/assets and confirm trackingOFF. Older2bb9version is retained secondary evidence, not the defaulttarget. Do not automatically roll back, delete claims, alter Stripe/AI/rules or erase customer records.

**Outstanding authorization:** deployment and controlled live collection only. Do not ask for another Enhanced Measurement change unless actual drift is observed. GA delivery remains unverified until release; at-most-once claim-before-delivery can undercount and Stripe remains the sole financial authority. No traffic/customer/revenue result is inferred from readiness.
