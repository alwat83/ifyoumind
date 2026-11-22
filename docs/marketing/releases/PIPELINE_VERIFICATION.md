# Marketing pipeline verification — November 22, 2026

OpenAI / Codex · `codex/marketing-asset-launch` · existing [draft PR #127](https://github.com/alwat83/ifyoumind/pull/127). Builds on completed creative head `33577c342fc49fa02891dfb01da3fc9ba4f1e677`; no replacement campaign/design system. Exact final checked head and local source digest are recorded in the PR handoff and ignored `test-results/marketing-assets/pipeline-exact-head.json` generated after commit.

## Implemented and executed

| Check | Observed result |
|---|---|
| `npm run marketing:assets:render` | PASS: five 1080×1350 JPEGs, versioned HTML/caption/receipt, automatic registry reconciliation/review sheet/handoff; existing Chrome + Playwright, Node22.23.2 |
| All five v2 JPEGs versus33577c34 | Exact same SHA256 values after filename normalization; no creative regeneration/replacement |
| `npm run marketing:assets:manifest` | PASS, reconciliation repeated without changing registry bytes or welcome publication record |
| `npm run marketing:assets:validate` | PASS: 11 records (published welcome,5archived original drafts,5current review-ready exports) |
| `npm run marketing:assets:review` | PASS: actual contact sheet/index, caption and individual alt text; draft publication URLs/approved caption withheld |
| `npm run test:marketing-assets` | 21 PASS /0FAIL /0SKIP; unit/integration filesystem rehearsals only |
| `npm run marketing:assets:prepare` | Expected BLOCKED exit2: final hash-bound export/caption approval missing; no credential/network access, promotion or production package |
| Retained59-file Hosting artifact | All59listed hashes match; existing manifest/config hashes unchanged |
| Existing application/public/config source | No diff from33577c34 in public/,src/,functions/,firebase.json,.github/,package-lock.json |
| Existing public welcome JPEG | Fresh anonymous GET at2026-11-22T23:31:25.218Z:200,image/jpeg,76114bytes, exact approved SHA256 |

21 regression cases exercise checksum/MIME/dimension/truncation errors, private-text/disclosure/font/numerical/source drift, version and immutable metadata protection, caption approval binding, idempotent reconciliation, rejected unapproved promotions, public-file collisions, safe paths/symlinks, changed baseline/wrong project/dirty source/stale live readback rejection, additive configuration-preserving packages and actual-receipt recording without publication. Successful promotion/package cases use temporary synthetic approvals and synthetic app baselines; they do **not** prove a new live deployment. No test changes the real carousel's pending approval.

## Creative and evidence

[Contact sheet](../drafts/property-tax/contact-sheet.jpg) · [before/after](../drafts/property-tax/comparison.jpg) · [five exports/review](../drafts/property-tax/REVIEW.md) · [caption](../drafts/property-tax/caption-v2.txt) · [canonical registry](../assets.json).

Source periods2024/2025 and annual4200→4620 / school2400→2640 unchanged. School240/total420=57.1% rounded; county90+municipal90=other180. All slides visibly label synthetic figures and no established assessment error/appeal eligibility. Render receipts bind export/HTML/fixture/capture hashes; chart ratios, loaded local fonts, text bounds/overlap pass. Minimum contrast7.45:1, primary type≥13.33px equivalent at360px/disclosures10.67px. Actual combined sheet inspected; full-size/390px individual visual inspections from the creative task remain applicable because JPEG bytes are identical. The authentic public screenshot remains unretouched. No claim of private-bill AI, savings, real customer outcome or actual tax error.

## Production and publication boundaries

Original welcome SHA256 `0e87ff1aa9a9d1cb5db09175fe2c83624198ab86a5ef7c98cc4330e97bc19252`, Hosting2bb9f7f3c6545b0e/release1795375284691000 retained as historical verified deployment evidence. Immutable artifact manifest `d0c14a6f135d6f41ff2217d5573f07c05d851ba8c1094708ddbfbc3d16c8538c`, isolated config `a985fa400017d793640bd4c895435d0c8d4a302c183efcb7d50999794ce5dec0`. New pipeline creates a separate baseline record; it does not alter that artifact. No fresh backend inventory/deployment is claimed in this tooling task.

[Founder-supplied external publication receipt](https://github.com/alwat83/ifyoumind/pull/127#issuecomment-7086695435) records the actual welcome [Instagram post](https://www.instagram.com/p/DgD21-tiLBZ/), media ID17924317206450814,2026-11-22T22:16:28Z. Recorded in canonical registry; no new Codex Instagram API call or caption invention. This supersedes the prior historical “publication not yet known” snapshot for the welcome only. Tax direction [approval](https://github.com/alwat83/ifyoumind/pull/127#issuecomment-7087154642) and [independent creative review](https://github.com/alwat83/ifyoumind/pull/127#issuecomment-7087379621) do not approve the exact final exports/caption or external release.

No merge/deploy/Hosting PUT/social call/provider request/spend/install, customer-data write, Stripe/auth/AI/budget/enrollment/entitlement/security/workflow change occurred. No application rebuild or unrelated sensitive suite rerun; historical Firestore/payment/device risks are preserved, not relabeled passing. Hosted CI is not claimed. Physical Instagram/iPhone, spoken assistive technology, unassisted comprehension and campaign performance remain untested. Video presets exist, but real MP4 validation/export is **BLOCKED** by absent ffprobe/encoder; no software was installed.

## Impact and decision

| Surface | Disposition |
|---|---|
| Marketing CLI, registry, versioned draft paths/review outputs, permanent instructions | Change Required — reusable routine production and approval enforcement |
| Carousel creative pixels, fixture and screenshot provenance | Verify Only — exact existing approved-direction creative preserved |
| Welcome public image and publication receipt | Verify Only — exact byte preservation; import actual external post evidence |
| Public/authenticated UI, commerce, report generation, AI, privacy/backend | Not Affected — no source/config or production operation; no broader QA claim |
| Platform/mobile/accessibility | Verify Only — actual local checks; physical/human/video limitations remain explicit |

**GO for final creative review. NO-GO for tax Hosting/social publication until separate exact-export/caption approval and applicable external-action authorization.** Next three: founder reviews five exports and caption; after approval Codex prepares the exact additive Hosting package; ChatGPT/Windsor publishes only within its own authorization, then actual response/useful visitor outcomes are recorded. No visitors, conversions or revenue are manufactured.
