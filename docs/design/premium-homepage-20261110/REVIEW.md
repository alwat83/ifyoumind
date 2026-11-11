# Premium homepage redesign

November 10, 2026 · OpenAI / Codex. `codex/premium-homepage-redesign` branches from `e5d8f15`.

## Design and working destinations

The homepage follows the supplied mockup’s section order and proportions. The sunrise skyline sits behind the headline and two calls to action. A white three-part comparison panel pairs the coffee-shop question with a semantic table and a green takeaway. The process, four illustrated use cases, dark pricing band and footer follow it. The comparison and process stack at narrow widths. Mobile navigation uses a native disclosure.

- **Try a Free Example** opens the electricity example. **Understand Your Bills** opens the existing discovery chooser for electricity or property tax.
- **View the Full Sample Report** opens the public Business sample, which also includes Nashville. **Create a Report** and **See Pricing** use the authenticated routes and preserve sign-in return URLs.
- The Explore cards use the existing business-location, market-analysis and relocation guides, plus browser-local bill discovery. **For Organizations** opens an inquiry to the existing support address.
- The public homepage shows the $79 one-time report and $39 monthly Pro with five included reports. The live public page displayed those terms at review. The $79 link keeps `intent=report`, and the free brief and Pro use existing registration.

## Evidence and imagery

The public sample callable returned 200 during review. Its saved report date is October 11, 2026. Austin and Charlotte population, median household income, and population change match its figures. Population and income use the 2020–2024 ACS five-year estimates. Population change compares those with the 2015–2019 estimates. The homepage shows that dated snapshot without a new data request. It uses the two cities to show a trade-off and points readers to verify local demand, competition and rent. [Public sample](https://ifyoumind.com/sample-report) · [Census ACS](https://www.census.gov/data/developers/data-sets/acs-5year.html)

Decorative artwork comes from the built-in image generation tool. The skyline has two WebP sizes. The four photographic crops lazy-load and have explicit dimensions. The source assets are in [public/images/home](../../../public/images/home/). The icons are a local SVG sprite.

**Skyline prompt**

> Use case: photorealistic-natural. Generate one original decorative website hero photograph based on the atmosphere of the attached mockup’s background only. Broad editorial panoramic view across a fictional modern mid-size American city at sunrise, soft peach and pale blush sky, mist and muted violet mountain ridgelines layered behind the buildings. Strong composition with the recognizable skyline, warm sun and ridge on the RIGHT half and lower third; the LEFT third is nearly blank pale warm cream fog and sky so live black website copy can overlay it. Buildings soften into luminous mist at the very bottom. Sophisticated architectural photography, restrained saturation, wide landscape crop around 2.4:1, fine detail on the right. Render only the photograph, with no UI, words, numbers, logo, marks, charts, or border.

**Use-case image prompt**

> Use case: photorealistic-natural. Generate a single decorative web image sprite, a clean 2 by 2 grid of four independent landscape editorial photographs, exactly equally sized rectangular quadrants, flush edge to edge with NO gutters or borders. Top left a welcoming neighborhood coffee shop exterior with a red awning at golden hour, without legible signage. Top right an American mid-size downtown skyline at sunset. Bottom left a row of attractive tree-lined residential houses, with a prominent home in the center. Bottom right a warm dusk city scene with traffic light trails and a dark blue sky. Coordinated refined color treatment, realistic architectural photographs, subjects centered vertically and horizontally in each quadrant because each is later displayed as a shallow crop. No text, graphic overlays, people prominently shown, borders, logos, or watermarks. Output a landscape image around 3:2.

## Review captures

[1440px desktop](desktop.png) · [390px mobile](mobile.png)

## Verification

- Production and local builds, targeted template and TypeScript lint, and 137 fast tests passed. The production bundle check and discovery isolation check passed. The existing bundle budget still emits warnings.
- The final Hosting suite passed 63 checks. The six viewport widths were 320, 375, 390, 768, 1024 and 1440 pixels. Checks covered overflow, image decoding, accessible table headers, heading contrast, applicable automated WCAG 2.2 AA rules, keyboard navigation and focus, text spacing, forced colors, and reduced motion. Both bill examples, offline evidence, legal routes, guides and report intent were exercised.
- An earlier run found horizontal overflow with increased text spacing at 320 pixels. The header now wraps and the comparison columns constrain their labels. A subsequent concurrent run produced browser timeouts. The final Hosting rerun used one worker with the emulator running separately on loopback.
- All 40 targeted desktop and mobile checks passed against the demo Auth, Firestore and Functions emulators. These exercised the public sample and recovery, report and pricing return paths, registration intent, legal links, and password reset. The earlier concurrent attempt timed out in existing report and sign-in journeys. The first GitHub QA run passed 110 authenticated browser cases and timed out in two copies of the navigation test because it still targeted the old header. The corrected desktop and mobile sign-in paths both passed locally. [First CI attempt](https://github.com/alwat83/ifyoumind/actions/runs/42831198182)
- Local Chromium measured LCP at 164 ms desktop and 132 ms mobile, with CLS 0 in both unthrottled loopback runs. The hero image transferred 30,870 bytes in both profiles. Field Core Web Vitals, five-second comprehension, and conversion remain unmeasured. Physical devices, Safari, spoken screen readers, and live payments were outside these checks.

The redesign is a review candidate. The branch is separate from the discovery and report proofs in PRs #77 and #78. The earlier sharing iteration remains in local commit `9cf1e0f`. Production release requires separate founder approval. The rollback for an authorized release is to revert this homepage change and deploy the prior verified build through the existing release process.
