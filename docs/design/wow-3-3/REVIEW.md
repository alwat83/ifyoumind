# Wow 3.3 homepage review

November 16, 2026 Pacific · OpenAI / Codex · [Draft PR #104](https://github.com/alwat83/ifyoumind/pull/104)

Production presented the tax-specific headline, separate jump link and neighborhood image before the worked finding, especially on mobile. The full-width demo also repeated the same amounts in a chart. The draft gives the product promise and its worked finding one hero. The existing neighborhood crop sits beside it on desktop and follows the example on mobile. The lower Decision Reports section and its routes still serve people deciding about a business or city.

The open question is “Why did my property taxes go up?” The sample immediately shows a $420 increase and identifies the $240 school-tax contribution. “Made-up example · Fixed calculations” is visible beside the finding. The supporting hero line describes the AI product direction. The shown interpretation comes from the checked-in fixture and does not involve a provider request. The evidence retains the $240 ÷ $420 calculation, CSV source cells, and limits on explaining causation or the accuracy of a tax bill. Electricity and city comparisons use their existing source material. Each example exposes one primary next action.

## Before and after

Paired full-page captures from production and the local candidate use Chrome at the same viewport and device scale. These are founder review images. The repository's Linux Playwright snapshots remain the CI comparison source.

| Viewport | Production before | Draft after |
| --- | --- | --- |
| Desktop · 1440 × 900 | [Open](screenshots/before-desktop.jpg) | [Open](screenshots/after-desktop.jpg) |
| Tablet · 768 × 1024 | [Open](screenshots/before-tablet.jpg) | [Open](screenshots/after-tablet.jpg) |
| Mobile · 390 × 844 | [Open](screenshots/before-mobile.jpg) | [Open](screenshots/after-mobile.jpg) |
| Narrow · 320 × 568 | [Open](screenshots/before-narrow.jpg) | [Open](screenshots/after-narrow.jpg) |

## Verification

- Local app and production-equivalent builds passed. `npm run test:seo` passed 138 tests, including the checked-in bill fixture and source evidence.
- The Hosting integration and hero browser specs passed 36 cases with axe, keyboard disclosure, text-spacing overrides, forced colors, reduced motion, and checks at 320, 375, 390, 768, 1024 and 1440 px. At 320 × 568, the question, finding, and evidence control are in the first viewport. The full-example action follows below.
- The focused authenticated and public browser suites passed 46 cases across desktop and mobile. They cover Discovery entry, returning to sign-in, public sample and report intent, and existing account and pricing navigation.
- The first Ubuntu comparison passed 148 authenticated browser cases. Its two expected differences were the full-page homepage images. Desktop and mobile expected, actual, and diff images were reviewed. They show the new top composition, relocated photo, and the unchanged report section and footer moving up as the page gets shorter. Only those two homepage baselines were replaced. [Initial visual comparison and artifacts](https://github.com/alwat83/ifyoumind/actions/runs/43904723399)

## Review boundaries

The homepage change removes the introductory jump CTA, repeated chart, and duplicate registration link in the mobile menu. The report section, sign-in and pricing routes, footer Discovery and legal destinations, browser-local data boundary, and commercial and OpenAI configuration remain intact. No new dependency, endpoint, or tracking event.

The review tests whether a visitor can see the question and finding immediately and reach the calculation or full example. Five-second comprehension and conversion require observation with people. The draft is for founder visual review. Merge and deployment require separate authorization. The independent $79 pilot remains a separate workstream.
