# Wow 2.1 founder review

November 12, 2026 · [Issue #89](https://github.com/alwat83/ifyoumind/issues/89) · [Notion hub](https://app.notion.com/p/3eb02474659c81ecba55cc4eed184a71)

## Design

The live #88 homepage introduced three icon cards, an always-visible comparison table, a separate colored takeaway with two more tiles, and a trust strip. Those elements competed with the primary action. On a 390 px viewport the default takeaway began 771 px down the page.

The founder selected tday for its centered, confident headline, compact explanation, one prominent action and a single framed product demonstration. Wow 2.1 applies that hierarchy using ifYouMind’s existing Outfit and Inter fonts, its skyline, and a muted plum display accent. The supporting sections keep the existing imagery and useful links with lighter spacing and fewer nested surfaces. [Visual reference](https://tday.com/)

The first CTA opens the free property-tax example at `/discover/?example=tax`. The homepage preview answers one question immediately. School charges accounted for **57.1% of a $420 increase** and rose by **$240** in the made-up example. The comparison table, original source cells, calculation and limits open together. Switching examples closes the previous evidence and announces the new finding. Electricity and cities keep their own full-example destinations. The city preview keeps the Census snapshot, ACS periods and uncertainty in its evidence.

The report CTA retains the existing sign-in return path. The Business sample, registration and $79 report and $39/month Pro entry points remain available. The free bill experience retains its browser-local CSV handling. The diff covers homepage presentation, browser tests and review evidence. No tracking was added.

## Before and after

The before captures are from public production #88. The after captures use the production Angular build of this branch served by the local Firebase Hosting emulator. Chrome, device scale factor 1, reduced motion. Screenshots use the same viewport dimensions in each pair.

| Viewport | Live #88 | Wow 2.1 candidate | Takeaway starts (before → after) |
| --- | --- | --- | --- |
| 320 × 568 | [Before](screenshots/before-320.jpg) | [After](screenshots/after-320.jpg) | 952 → 469 px |
| 375 × 812 | [Before](screenshots/before-375.jpg) | [After](screenshots/after-375.jpg) | 810 → 503 px |
| 390 × 844 | [Before](screenshots/before-390.jpg) | [After](screenshots/after-390.jpg) | 771 → 506 px |
| 768 × 1024 | [Before](screenshots/before-768.jpg) | [After](screenshots/after-768.jpg) | 880 → 485 px |
| 1024 × 800 | [Before](screenshots/before-1024.jpg) | [After](screenshots/after-1024.jpg) | 604 → 504 px |
| 1440 × 900 | [Before](screenshots/before-1440.jpg) | [After](screenshots/after-1440.jpg) | 661 → 560 px |

- **Full page.** [Mobile before](screenshots/before-390-full.jpg) · [Mobile after](screenshots/after-390-full.jpg) · [Tablet before](screenshots/before-768-full.jpg) · [Tablet after](screenshots/after-768-full.jpg) · [Desktop before](screenshots/before-1440-full.jpg) · [Desktop after](screenshots/after-1440-full.jpg)
- **Property-tax evidence open.** [Mobile before](screenshots/before-390-tax-evidence.jpg) · [Mobile after](screenshots/after-390-tax-evidence.jpg) · [Desktop before](screenshots/before-1440-tax-evidence.jpg) · [Desktop after](screenshots/after-1440-tax-evidence.jpg)

Positions refer to the top of the initial takeaway block, which featured cities in #88. The CTA and the 57.1% figure fit in the first screen at every tested width. At 320 × 568 the headline conclusion fits, and the separate $240 detail is just below the fold. Both builds have zero horizontal overflow in the captured initial states.

## Verification and release

Run `npm run build`, `npm run test:seo`, `npm --prefix functions test`, `npm run test:discover` and the authenticated QA workflow. The browser specs cover all six widths, three findings and sources, evidence reset, keyboard selection, visible focus, reduced motion, forced colors, text spacing, target size, image-load stability, and automated WCAG A/AA checks. Navigation covers the free example, the sample and the commercial links, including registration and the sign-in return paths. Draft PR checks carry the exact-head CI results. Whole-repo lint and legacy Angular/Karma compilation issues also reproduce on the master baseline. Scoped landing lint passes.

The production baseline is [PR #88](https://github.com/alwat83/ifyoumind/pull/88), master `449f829f733553c4c8afbf6c0748d82566b0048e`, with [successful Firebase deployment](https://github.com/alwat83/ifyoumind/actions/runs/43283684085) and the read-only public captures above. Wow 2.1 remains a draft until the founder reviews the primary CTA and explicitly authorizes release. If approved later, retain the current Hosting version and do a read-only smoke of homepage, tax CTA, switches, sample and guarded report links. A Hosting rollback would require a separate authorization. Physical devices, spoken screen readers, comprehension and conversion have separate verification needs.

## Five-second review

Show a first-time participant the 390 px first screen for five seconds without narration, then hide it. Ask what the site does, which example they can try, what the percentage refers to, and what they would click next. Note whether they recognize that the figures are made up. Reopen the page and ask them to find the supporting arithmetic without hints. Compare with the desktop capture if they also use desktop. Use already authorized participants only. A passing browser test cannot establish these answers.

After a separately authorized release, use existing consented reporting where it can identify the steps. Track the share of genuine homepage visits that start the flagship example, the share of those visits that inspect evidence, and the share that proceed to registration and complete it. Record unavailable steps as unknown. No new instrumentation or collection is part of this change.
