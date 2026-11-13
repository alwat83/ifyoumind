# Wow homepage founder review

## Wow 3.1 — Experience, clarity and conversion

The founder approved Wow 3.0 as the preferred visual direction. This iteration continues [draft PR #91](https://github.com/alwat83/ifyoumind/pull/91) from `69cc8c985b7c7e5d0e9a904530b24a42506647a5`. The editorial composition, serif, neighborhood image, palette and three sections remain.

The follow-up [cross-surface review](CROSS_SURFACE.md) carries the final impact matrix, journeys, and matched five-width captures.

### Five-second audit

The original CTA was clear, but the supporting line named categories more readily than it invited a discovery. The revised line asks visitors to find what changed in a bill or what sets two places apart. The free CTA still opens the demo on the same page. A shallower image crop and tighter spacing bring the demo 25 px earlier at 320 px and 29 px earlier at 390 px. Desktop composition and first-screen section positions are preserved.

### Thirty-second experience and report path

- The synthetic tax question now asks what added the most to the bill. Both chart bars say what increased. Phones use horizontal bars with the same proportional data, so the takeaway, chart and evidence control fit after the CTA jump at 320 × 568. The previous bar entrance animation was removed.
- **Show the evidence** opens on `($240.00 ÷ $420.00) × 100 = 57.1%`. The rest of the disclosure retains the original raw cells, component arithmetic and limitations. Electricity and city comparisons retain their numbers and evidence.
- The Decision Reports copy distinguishes the personalized free brief from the full report, which adds more comparisons, a sourced market analysis and an action plan. **Start a Free Brief** leads through the existing sign-in guard to Business location entry. The sample stays public and keeps its existing free signup and $79 report registration paths. Signed-in pricing and checkout behavior remain in their existing surfaces.

### Before and after

The before captures come from the reviewed Wow 3.0 exact head. The after captures use the production Angular build served locally with the same Chrome viewport dimensions.

| Viewport | First screen before | First screen after | Full page before | Full page after |
| --- | --- | --- | --- | --- |
| 390 × 844 | [Before](screenshots/390.jpg) | [After](screenshots/wow-3-1/390.jpg) | [Before](screenshots/390-full.jpg) | [After](screenshots/wow-3-1/390-full.jpg) |
| 1440 × 900 | [Before](screenshots/1440.jpg) | [After](screenshots/wow-3-1/1440.jpg) | [Before](screenshots/1440-full.jpg) | [After](screenshots/wow-3-1/1440-full.jpg) |

[320 px](screenshots/wow-3-1/320.jpg) · [768 px](screenshots/wow-3-1/768.jpg) · [1024 px](screenshots/wow-3-1/1024.jpg) · [Mobile demo](screenshots/wow-3-1/390-demo.jpg) · [Mobile evidence](screenshots/wow-3-1/390-evidence.jpg) · [Desktop demo](screenshots/wow-3-1/1440-demo.jpg)

### Responsive and performance checks

Three fresh loopback Chrome contexts per viewport, device scale 1, remote requests blocked, reduced motion. At 320 px, the evidence control bottom moves from y=632 to y=556 after the CTA jump. At 390 px it moves from y=611 to y=535. The 1024 px viewport selects the 77,842-byte image instead of the 251,544-byte image with the corrected responsive size hint. The served mobile and desktop images are otherwise identical. Encoded JavaScript grows by 355 bytes in the sampled load. Maximum measured initial layout shift stays about 0.052. Loopback LCP varied from 96 to 188 ms by median on the final capture and ran slower at several widths. These small local samples do not establish a field performance trend.

### Verification and founder review

Browser regressions cover the first viewport, focus after the CTA, responsive chart proportions, the formula and original cells, all three examples, keyboard navigation, forced colors, reduced motion, text spacing and no overflow. Authenticated checks cover paid-intent and free registration from the public sample, guarded pricing and the free brief's return to Business location entry after sign-in. GitHub holds the exact-head test totals. Baseline build-budget warnings and the existing fixture skip are separate from homepage regressions.

Hypothesis to test with first-time visitors: after five seconds, they can say what ifYouMind helps them find and identify the free action. After thirty seconds, they can explain the 57.1%, open its proof, and tell a free brief from the full report. Visual review, native screen-reader behavior, real user comprehension, field performance and live conversion remain unmeasured. Use already permitted participants. Founder visual preference does not authorize merge or deployment.

---

## Wow 3.0 founder review

[Wow 2.2 comparison draft](https://github.com/alwat83/ifyoumind/pull/90) · [ifYouMind Notion hub](https://app.notion.com/p/3eb02474659c81ecba55cc4eed184a71)

## Three sections

- **Hero.** A left-aligned serif headline and a dedicated neighborhood photograph replace the centered type over a faded background. On phones the photograph follows the CTA as a wide crop. The wordmark and original headline carry the brand.
- **Product experience.** The hero action moves keyboard focus to the live demo. The dark section pairs the 57.1% takeaway with a two-bar comparison from the existing synthetic property-tax fixture. Electricity and city comparisons use their own labeled values and source notes. “Show the evidence” reveals the arithmetic, source cells, and limitations. The full examples still lead to the existing discovery and sample report experiences.
- **Decision Reports.** A short warm-colored section leads to the existing public sample and guarded report creation. The detailed offers remain at account pricing, and the public sample retains the direct $79 report and free Business entry points. The footer links to guides, the browser-local discovery and privacy disclosures, terms, sources, and contact.

The skyline is part of a new AI-generated decorative neighborhood image. It does not depict a location in the sample data. Two responsive WebP assets weigh about 76 and 246 KiB. Instrument Serif is served locally with its OFL notice. Layout restraint and hierarchy were informed by [tday](https://tday.com/). Typeface source and license are in the [Google Fonts repository](https://github.com/google/fonts/tree/main/ofl/instrumentserif).

## Full homepage comparison

Wow 2.2 is the founder-rejected comparison baseline, captured at exact draft head `6a1f33d35e3547d218e22351ee89e81aaedfdf36`. Wow 3.0 is a separate branch from master `449f829f733553c4c8afbf6c0748d82566b0048e`. Captures use Chrome, reduced motion, and device scale factor 1. Wow 3.0 uses the production Angular build served from the loopback Firebase Hosting emulator.

| Viewport | Wow 2.2 full page | Wow 3.0 full page |
| --- | --- | --- |
| Mobile 390 × 844 | [Before](https://github.com/alwat83/ifyoumind/blob/6a1f33d35e3547d218e22351ee89e81aaedfdf36/docs/design/wow-2-1-20261112/screenshots/wow-2-2-390-full.jpg) | [After](screenshots/390-full.jpg) |
| Desktop 1440 × 900 | [Before](https://github.com/alwat83/ifyoumind/blob/6a1f33d35e3547d218e22351ee89e81aaedfdf36/docs/design/wow-2-1-20261112/screenshots/wow-2-2-1440-full.jpg) | [After](screenshots/1440-full.jpg) |

[320 px](screenshots/320.jpg) · [390 px](screenshots/390.jpg) · [768 px](screenshots/768.jpg) · [1024 px](screenshots/1024.jpg) · [1440 px](screenshots/1440.jpg)

[Mobile demo](screenshots/390-demo.jpg) · [Desktop demo](screenshots/1440-demo.jpg) · [Open evidence](screenshots/390-evidence.jpg)

At 320 × 568, the CTA and image are visible and the product section begins at 491 px. The interactive finding is below the image on initial load. Activating the CTA scrolls and focuses the example directly. At 390 × 844, the product section starts at 536 px and the finding begins to appear at the bottom. Across the five captured widths, no horizontal overflow was measured.

## Verification and release

Local checks cover the hero action and focus, image and font loading, fixture chart labels and proportions, all three evidence states, visible keyboard focus, reduced motion, forced colors, text spacing, contrast, and legal and discovery routes. Authenticated regression coverage follows the public sample through paid-intent and free registration, verifies guarded return paths, and checks the actual account pricing surface. Hosting isolation guards still verify that bill inputs stay inside the existing browser-local discovery experience.

The draft PR carries the exact-head workflows and final test totals. Approval is for the visual design first. Any merge or deployment needs separate explicit authorization. Production remains on PR #88. The first-use impression and real conversion are unmeasured.
