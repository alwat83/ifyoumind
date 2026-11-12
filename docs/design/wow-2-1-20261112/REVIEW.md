# Wow homepage founder review

## Wow 2.2 — Radical Simplicity

[Draft PR #90](https://github.com/alwat83/ifyoumind/pull/90) · [Issue #89](https://github.com/alwat83/ifyoumind/issues/89) · [Notion hub](https://app.notion.com/p/3eb02474659c81ecba55cc4eed184a71)

The hero uses the original headline, a one-sentence explanation of bill and place comparisons, and one prominent action, **Try a Free Example**. The action opens the existing free property-tax example. The subdued skyline, wordmark, and Outfit typography carry the visual identity.

Removed the hero report link, header signup button, preview box and heading, four promotional image tiles, and three-step process list. The only accent in the first screen is the finding. The default example is labeled as made up, and **Show the evidence** opens the same arithmetic, source cells, context, and caveats. Electricity and city selectors stay visible, and the city sample keeps its Census limitations and full report link.

The header’s Decision Reports link leads to one short section with the public sample and the existing guarded report creation route. The $79 report, $39 monthly Pro, free Business brief, and plan disclosures use the same routes and terms. The four guides and discovery destinations remain as text links, and the bill-file privacy statement remains visible. The compact menu retains registration.

### Before and after

The before captures are the verified Wow 2.1 candidate at `9b26904a9b93eb2e595ce9ce980ef169f5a18749`. After captures use the candidate production build in the loopback Firebase Hosting emulator. Both use Chrome at the same viewport dimensions and device scale factor 1.

| Viewport | Wow 2.1 | Wow 2.2 | Finding starts (before → after) |
| --- | --- | --- | --- |
| 320 × 568 | [Before](screenshots/after-320.jpg) | [After](screenshots/wow-2-2-320.jpg) | 469 → 408 px |
| 375 × 812 | [Before](screenshots/after-375.jpg) | [After](screenshots/wow-2-2-375.jpg) | 503 → 408 px |
| 390 × 844 | [Before](screenshots/after-390.jpg) | [After](screenshots/wow-2-2-390.jpg) | 506 → 410 px |
| 768 × 1024 | [Before](screenshots/after-768.jpg) | [After](screenshots/wow-2-2-768.jpg) | 485 → 462 px |
| 1024 × 800 | [Before](screenshots/after-1024.jpg) | [After](screenshots/wow-2-2-1024.jpg) | 504 → 481 px |
| 1440 × 900 | [Before](screenshots/after-1440.jpg) | [After](screenshots/wow-2-2-1440.jpg) | 560 → 537 px |

[Full mobile before](screenshots/after-390-full.jpg) · [Full mobile after](screenshots/wow-2-2-390-full.jpg) · [Full desktop before](screenshots/after-1440-full.jpg) · [Full desktop after](screenshots/wow-2-2-1440-full.jpg) · [Opened mobile evidence](screenshots/wow-2-2-390-evidence.jpg)

### Verification and release

The first browser pass found that the 320 px selector wrapped and pushed the evidence control below the fold. The tightened selector, shorter question and balanced hero copy put the complete finding and disclosure in the first viewport. The regression now checks the hero action, number, explanatory sentence, and disclosure against all six viewports. It also checks fallback fonts, contrast, no horizontal overflow, evidence reset and announcements, the three example paths, mobile keyboard navigation, reduced motion, forced colors, text spacing, and access to the sample and guarded report routes. The exact-head PR checks record the release results.

Use the five-second review below to test unaided comprehension with permitted participants. Ask what the product does, what 57.1% refers to, and which action they would take. Browser results and capture positions establish visibility, while human comprehension and conversion are still unmeasured. Founder review of this draft and exact-head release approval remain separate.

---

## Wow 2.1 — Property-tax-first founder review

November 12, 2026 · [Issue #89](https://github.com/alwat83/ifyoumind/issues/89) · [Notion hub](https://app.notion.com/p/3eb02474659c81ecba55cc4eed184a71)

## Design

The live #88 homepage introduced three icon cards, an always-visible comparison table, a separate colored takeaway with two more tiles, and a trust strip. Those elements competed with the primary action. On a 390 px viewport the default takeaway began 771 px down the page.

The founder selected tday for its centered, confident headline, compact explanation, one prominent action and a single framed product demonstration. Wow 2.1 applies that hierarchy using ifYouMind’s existing Outfit and Inter fonts, its skyline, and a muted plum display accent. The supporting sections keep the existing imagery and useful links with lighter spacing and fewer nested surfaces. [Visual reference](https://tday.com/)

The hero CTA opens the free property-tax example at `/discover/?example=tax`. The default preview shows one action, **Show the evidence**, and offers the full example after the calculation. The homepage preview answers one question immediately. School charges accounted for **57.1% of a $420 increase** and rose by **$240** in the made-up example. The comparison table, original source cells, calculation and limits open together. Switching examples closes the previous evidence and announces the new finding. Electricity and cities keep their own full-example destinations. The city preview keeps the Census snapshot, ACS periods and uncertainty in its evidence.

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

Run `npm run build`, `npm run test:seo`, `npm --prefix functions test`, `npm run test:discover` and the authenticated QA workflow. The browser specs cover all six widths, three findings and sources, evidence reset, keyboard selection, visible focus, reduced motion, forced colors, text spacing, target size, image-load stability, and automated WCAG A/AA checks. A separate rendered-pixel check across the six viewports found a minimum 7.60:1 contrast for the plum headline against the skyline, and 8.59:1 for the smaller hero copy. Navigation covers the free example, the sample and the commercial links, including registration and the sign-in return paths. Draft PR checks carry the exact-head CI results. Whole-repo lint and legacy Angular/Karma compilation issues also reproduce on the master baseline. Scoped landing lint passes.

The production baseline is [PR #88](https://github.com/alwat83/ifyoumind/pull/88), master `449f829f733553c4c8afbf6c0748d82566b0048e`, with [successful Firebase deployment](https://github.com/alwat83/ifyoumind/actions/runs/43283684085) and the read-only public captures above. Wow 2.1 remains a draft until the founder reviews the primary CTA and explicitly authorizes release. If approved later, retain the current Hosting version and do a read-only smoke of homepage, tax CTA, switches, sample and guarded report links. A Hosting rollback would require a separate authorization. Physical devices, spoken screen readers, comprehension and conversion have separate verification needs.

## Five-second review

Show a first-time participant the 390 px first screen for five seconds without narration, then hide it. Ask what the site does, which example they can try, what the percentage refers to, and what they would click next. Note whether they recognize that the figures are made up. Reopen the page and ask them to find the supporting arithmetic without hints. Compare with the desktop capture if they also use desktop. Use already authorized participants only. A passing browser test cannot establish these answers.

After a separately authorized release, use existing consented reporting where it can identify the steps. Track the share of genuine homepage visits that start the flagship example, the share of those visits that inspect evidence, and the share that proceed to registration and complete it. Record unavailable steps as unknown. No new instrumentation or collection is part of this change.
