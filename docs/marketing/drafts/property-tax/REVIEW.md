# Property-tax carousel — refined founder-review pack

November 22, 2026 · OpenAI / Codex · Version 2 · **Ready for final visual approval, not publication.**

[Before / after overview](comparison.jpg) · [Interactive file gallery](comparison.html) · [Refined slides](index.html) · [Numbers, alt text and checksums](manifest.json)

Five 1080 × 1350 JPEG exports reuse the existing Midnight Slate template, local Instrument Serif/Arial typography and the original deterministic example. No production application changes, deployment, social publishing, advertising spend or provider request.

| Slide | Refinement | Export |
|---|---|---|
| 1 — Hook | A much larger +$420, the specific property-tax question, and 2024/2025 totals | [01-question.jpg](01-question.jpg) |
| 2 — Discovery | $240 contribution with zero-based school-tax bars: $2,400 → $2,640 | [02-school.jpg](02-school.jpg) |
| 3 — Evidence | 57.1% proportional split: school $240, other charges $180; explicit “not your tax rate” | [03-evidence.jpg](03-evidence.jpg) |
| 4 — Context | What changed versus what is not established, without claiming error or appeal eligibility | [04-limitation.jpg](04-limitation.jpg) |
| 5 — Action | “Your numbers have a story. Reveal what changed.” Authentic product preview and prominent free-example invitation | [05-action.jpg](05-action.jpg) |

The [preserved originals](before-v1/manifest.json) match commit ea70bb9c8611340e09d08fe12c861febf7c27655. Old JPEGs are retained in before-v1; no bulk baseline acceptance or silent replacement of historical evidence. Smaller [390-pixel review images](mobile-review/01-question.jpg) supplement full-resolution inspection.

## Evidence and product preview

The unchanged source `src/app/intelligence/home-bill-examples.json` establishes annual tax $4,200 → $4,620 (2024 → 2025), school tax $2,400 → $2,640, county +$90 and municipal +$90. Thus total increase = $420; school increase = $240; remaining increase = $180; $240 / $420 × 100 = 57.1% rounded. The renderer validates these relationships against the original source cells. Bar lengths use unrounded ratios and a zero baseline; the share graphic is a share of the increase, not a tax rate.

Every slide labels synthetic figures and retains that no assessment error or appeal eligibility is established. No savings, customer outcome, local tax rate, unsupported cause, citation or bill-AI claim is added.

Slide 5 uses an **unaltered** screenshot of the live free example at https://ifyoumind.com/?example=tax, captured through the browser on November 22. [Capture/provenance](sources/live-tax-finding.json) records source URL, viewport, crop and SHA256. Only a public synthetic demonstration was captured, with no private data. The preview is scaled proportionally in the artwork; no product text or finding was fabricated/retouched. Its smaller embedded text is supplementary to the large headline, invitation and prepared alt text.

## Verification

Run with existing installed Chrome/Playwright, no new dependency:

```sh
node docs/marketing/drafts/property-tax/render.mjs
```

All five exports pass: exact dimensions/JPEG format; loaded local type; text/canvas bounds and disclosure separation; chart proportions; numerical/source-cell reconciliation; text contrast at least **7.45:1**; primary copy/values at least **13.33 px equivalent at 360 px width**; disclosure text 10.67 px equivalent. Full-resolution and all five 390 px previews were individually reviewed. Offline render, comparison and phone previews report zero external requests and zero page errors. Alt text/caption are updated. Native rendering requires the existing permitted headless-Chrome environment; no browser/OS installation occurred.

The live preview retains the actual product's typography and is not independently restyled. Physical Instagram/iPhone legibility, assistive-technology reading of a posted carousel, engagement and customer comprehension remain untested. This is targeted creative verification, not hosted CI or a repeat of unrelated application/backend suites. Public URLs for the refined exports remain null; no file was copied into public/.

## Draft caption — final founder review required

Your property-tax bill increased by $420. What changed?

In this synthetic example, $240 of the increase came from school tax — 57.1% of the total change. Follow the figures, check the calculation, and see what the evidence establishes.

Your numbers have a story. Reveal what changed. Try the free example at ifyoumind.com. No account needed for the example.

Illustrative figures, not a customer result. These figures do not establish an assessment error or eligibility for an appeal. This is a deterministic bill example, not AI-based tax analysis.

## Approval boundary

Review these five exports and the caption together. Only a separate founder approval can authorize their public asset deployment or social publication. The earlier welcome-image approval and existing Windsor connection do not automatically approve this carousel. No Instagram API call, scheduling, merge, ad spend or production operation occurred. Existing website design, privacy, billing, AI configuration and entitlements remain untouched.
