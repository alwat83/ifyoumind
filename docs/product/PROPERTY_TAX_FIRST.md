# Property taxes as the first public example

## Focused plan

1. Use the homeowner’s question as the homepage headline. Open the existing free tax example from the primary action.
2. Lead the made-up comparison with the dollar increase, name the biggest change and show the limit before any calculation. Keep the underlying chart, evidence and browser-local follow-through.
3. Keep electricity, city comparisons and Decision Reports available. Verify desktop and mobile, keyboard, sources, signup return paths and the current Discovery privacy boundary.

| Surface | Impact | Acceptance |
| --- | --- | --- |
| Public homepage and Discovery entry link | Change Required | A tax question, one clear action and an evidence-grounded answer visible before signup. |
| Public Discovery, evidence and accessibility | Verify Only | Existing calculations, CSV intake, offline behavior, mobile and keyboard navigation remain available. |
| Decision Reports, pricing, registration and login | Verify Only | Existing sample, offers and sign-in return paths work. |
| Authenticated app, commerce, entitlements and infrastructure | Not Affected | This changes public presentation and its tests. No account, data, billing or deployment integration is added. |
| Handoff | Change Required | Record the visual comparison, checks and release gate. |

Based on master `59a4b80a8e427a13e0d8bee0f753f8954ea8611f`, which includes the Wow 3.2 visual identity and existing offers. [Typed Bill Discovery PR #95](https://github.com/alwat83/ifyoumind/pull/95) remains a separate draft. This example compares the same property over two years. It provides no fair-tax estimate or appeal recommendation.

## Founder review

| View | Mobile 390 px | Desktop 1440 px |
| --- | --- | --- |
| Before | [Full homepage](property-tax-first/before-mobile.webp) | [Full homepage](property-tax-first/before-desktop.webp) |
| After | [Full homepage](property-tax-first/after-mobile.webp) | [Full homepage](property-tax-first/after-desktop.webp) |
| After pressing the primary action | [Result](property-tax-first/finding-mobile.webp) | [Result](property-tax-first/finding-desktop.webp) |

The home page asks the homeowner’s question in the existing editorial hero. In the same page, the example says the total rose by $420 and school taxes accounted for most of the increase. The assessment and rate check appears before the optional calculations. Secondary examples appear below the result and its actions. The existing image, evidence and report destinations are reused.

The comprehension hypothesis is that a first-time visitor will see the tax example is free, find a specific answer quickly, and understand that the example compares years and cannot establish whether their tax is fair. This has been checked in a browser with the made-up fixture. Real first-use comprehension, intent and conversion still need observation.

## Verification

- Local production and emulator app builds passed. Both production-bundle and Discovery isolation checks passed. The isolated Discovery bundle stayed at 235.41 kB raw and 66.27 kB estimated transfer. The homepage lazy chunk changed from 29.09 to 29.39 kB raw and 7.23 to 7.28 kB estimated transfer. Existing bundle-size warnings remain.
- All 138 fast tests passed. All 72 public Chromium browser tests passed, including axe, local-file and offline behavior, example switching, reduced motion, keyboard, and layouts at 320, 375, 390, 768, 1024 and 1440 px. All 20 targeted desktop and mobile browser tests passed for the homepage, Business sample, free and paid-intent registration, and sign-in return paths with local Firebase.
- The visual captures use the same local Chromium renderer, viewport and fonts before and after. Linux QA at `4194c0d029c7ba49da67bb87d6815d8558861d0d` passed 130 authenticated browser cases and failed only the two expected homepage pixel comparisons. Inspected the expected, actual and diff captures on both viewports. Changes were the intended headline, result hierarchy and resulting vertical flow. Updated only the desktop and mobile homepage references. [Initial Linux run and comparison artifacts](https://github.com/alwat83/ifyoumind/actions/runs/43572127111). [Draft PR #97 and CI](https://github.com/alwat83/ifyoumind/pull/97/checks)
