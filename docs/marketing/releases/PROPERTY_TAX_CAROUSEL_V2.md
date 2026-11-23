# Property-tax carousel v2 — Hosting release verified

November22,2026 (Pacific) · OpenAI / Codex · existing draft [PR127](https://github.com/alwat83/ifyoumind/pull/127). **GO: all five public JPEGs verified; no Instagram publication attempted by Codex.**

## Authorization and exact artifact

Founder [authorization7087580868](https://github.com/alwat83/ifyoumind/pull/127#issuecomment-7087580868) approves the exact five JPEGs and caption at `33577c342fc49fa02891dfb01da3fc9ba4f1e677`. [Reconciliation7087807560](https://github.com/alwat83/ifyoumind/pull/127#issuecomment-7087807560) confirms identical exports/caption at pipeline head `72fa09faf825107c7d56cefa0bf4c98a45156672`. The prior pending-registry state is superseded, not a new approval gate.

Deployment source: **`a71cad822e40515b7e9f56ee926762ae53fd73e3`**. This only records the existing approval, copies exact JPEGs to public/ and corrects isolated test fixtures so draft-denial tests do not depend on real campaign approval. No creative regeneration, caption edit, application build, business-logic/configuration change or merge.

- Isolated artifact: ignored `test-results/marketing-assets/hosting-tax-a71cad82/`.
- Manifest SHA256: `041091799b09ac159063df0011ebf2acc5b77869d235d6b8b2dd1f356384deb4`.
- Identical Hosting-only config SHA256: `a985fa400017d793640bd4c895435d0c8d4a302c183efcb7d50999794ce5dec0`.
- Exact caption SHA256: `1d4ac9955e102ac5f76b5cb9899d3596f15092f30512e232838d5c209616ca67`.
-64static files:59previous files, including58application files and the welcome image, plus only5approved JPEGs. No docs/drafts/placeholders/private logs or Functions/rules/Storage/hooks included.

## Actual production evidence

| Item | Verified result |
|---|---|
| Firebase target | ifyoumind-473fe, project528549191581, existing founder-controlled CLI identity |
| Tooling | Node22.23.2 / Firebase CLI13.35.1, isolated config, explicit project, `--only hosting` |
| Last preflight |2026-11-23T00:05:23.525Z;59live files/config match, current rollback finalized, no known local or production-workflow deployment |
| Hosting version | **08500dca665abbab**, FINALIZED |
| Hosting release | **1795392328755000** |
| Release timestamp |2026-11-23T00:05:28.755Z / November22,2026 16:05:28.755PST |
| Independent verification |2026-11-23T00:06:24.078Z |
| Source integrity | Clean exact-source check before/after deployment PASS |
| Static/config preservation | All64provider file hashes verified, all59previous hashes/config unchanged, only5new paths |
| Routes |/,/pricing,/privacy-policy,/sample-report,/discover/,/login:200, exact prior bytes; Discovery connect-src:none retained |
| Backend | All34Functions state/update time/build/service configuration unchanged |
| AI |00006-ruk / reader00090-zob remain ACTIVE/Ready/100%; quota unchanged; zero provider requests |
| Enrollment | Existing subscription configuration unchanged; public monthly enrollment remains closed |
| Rollback | Prior2bb9f7f3c6545b0e independently read FINALIZED/retained; no rollback attempted |
| Social | No Codex publishing/container/Instagram request, post ID or permalink for this carousel |

All checks used actual production readbacks. No synthetic provider/payment result stands in for a live observation. No Stripe operation, billing/entitlement adjustment, auth/customer-data write, security-rule/Storage/IAM change, paid advertising, new service, workflow modification or broad deployment.

## Ordered publishing handoff

Each URL was anonymously fetched directly with HTTP200, `image/jpeg`, no redirect, decoded JPEG header1080×1350, expected byte count and exact approved SHA256. Matching original export hashes also preserve the prior actual rendering/decoding evidence.

| Slide | Public URL | Bytes | SHA256 |
|---|---|---:|---|
|1|[property-tax-carousel-01-v2.jpg](https://ifyoumind.com/assets/marketing/social/instagram/carousels/property-tax-carousel-01-v2.jpg)|159449|237fd791af550fe0af727b9cb6b6ba4a1abcfebf92e61316d792870b60c6a67c|
|2|[property-tax-carousel-02-v2.jpg](https://ifyoumind.com/assets/marketing/social/instagram/carousels/property-tax-carousel-02-v2.jpg)|141251|a1a3e44c89fe609eb144586fcbb32f9f11a870b336b289ea70c69f981fc03561|
|3|[property-tax-carousel-03-v2.jpg](https://ifyoumind.com/assets/marketing/social/instagram/carousels/property-tax-carousel-03-v2.jpg)|156054|afbbf61a2bedc4f59373e75d2b181536b9c66da974158000c68e32fe9b826998|
|4|[property-tax-carousel-04-v2.jpg](https://ifyoumind.com/assets/marketing/social/instagram/carousels/property-tax-carousel-04-v2.jpg)|180488|93ba4a70ea4877b76ad02d68dd9ff0460d9b3be8b1c4f93d2902b426fcc11be1|
|5|[property-tax-carousel-05-v2.jpg](https://ifyoumind.com/assets/marketing/social/instagram/carousels/property-tax-carousel-05-v2.jpg)|173011|7dade1d76a8d10a6487d2a276ee75ca63ffaae8d6b3e909e7a7fb3a28b3a1041|

Use the **exact [approved caption](../drafts/property-tax/caption-v2.txt)** and [individual alt text/ready handoff](../drafts/property-tax/publication-handoff.json). Both Hosting and organic publication are already founder-authorized; ChatGPT/Windsor handles the one organic Instagram carousel to @ifyoumindapp. No duplicate posting by Codex. Record actual media ID/permalink/timestamp only after that workflow succeeds. No social acceptance, visitors, engagement, customer or revenue claim from file Hosting alone.

## Verification scope and operational notes

Executed `marketing:assets:validate`, `marketing:assets:prepare --promote` and clean exact-source `marketing:assets:prepare` with fresh live baseline.21targeted regression tests PASS; draft-negative tests use isolated pending fixtures even when the real campaign is approved/hosted. Approval and caption hashes remain strict. No rendering command ran; all fiveJPEGs and caption are byte-identical to the approved versions. No new hosted CI/full-app/sensitive/physical-device suite pass is claimed; prior Firestore/payment/device/VoiceOver/Linux/comprehension limitations remain independent and unchanged.

The first read-only preflight encountered `gh` ENOBUFS from an oversized workflow-list response. It stopped before deployment; limiting output to production-run status fields resolved the local diagnostic. The fresh complete preflight then passed. No failed deployment or production retry occurred. Detailed preflight/intent/deploy/post records and raw CLI log remain ignored/local, mode0600.

## Retained rollback procedure

Rollback is **not automatic** and needs its own applicable founder authorization. Reconcile then-current release and competing deployments, verify prior2bb9f7f3c6545b0e is still FINALIZED, and use pinned CLI13.35.1 to clone the exact retained version to live with explicit project:

```sh
firebase hosting:clone ifyoumind-473fe@2bb9f7f3c6545b0e ifyoumind-473fe:live --project ifyoumind-473fe
```

Then independently verify old59files/config and unchanged backend. Do not rebuild old source or restore Functions. The older immutable welcome artifact remains untouched. For future approved asset additions, the new64-file retained artifact and [matching baseline record](property-tax-carousel-v2.json) are the current baseline; stale59-file packaging must fail closed.
