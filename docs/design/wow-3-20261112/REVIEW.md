# Wow 3.0 founder review

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
