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

## November 14, 2026 — Final release review

**GO for separate founder authorization.** [Draft PR #97](https://github.com/alwat83/ifyoumind/pull/97) is open, clean and targets `master` at `59a4b80a8e427a13e0d8bee0f753f8954ea8611f`. Exact head `53de0c7797c3a071043606dd4ff2978cf27e9ad3` passed [Launch build](https://github.com/alwat83/ifyoumind/actions/runs/43573014040) and [Authenticated QA](https://github.com/alwat83/ifyoumind/actions/runs/43573014026), including 132 authenticated desktop/mobile browser tests and the reviewed homepage snapshots. Functions, Firestore rules, organization and commerce emulator suites passed. The 25 changed files contain six landing-page files, eight test/baseline files and eleven documentation/capture files. No authentication, pricing, checkout, rules, report or deployment source changed. PR #95 and #96 are separate drafts; neither exact head is an ancestor and neither implementation appears in the diff.

The desktop and mobile captures show one hero action and the $420 finding first after activation. The made-up example compares $4,620 to $4,200 on the same property; $240 of the increase came from school taxes (57.1%). The note points to assessed value and local rates without determining whether a bill is fair, wrong or appealable. Electricity and city comparisons remain accessible beneath the evidence and full example link. Browser checks covered mobile menu and Escape focus restoration, keyboard and touch targets, axe and contrast, reduced motion, offline Discovery, the public sample, free brief, and the $79 report registration and pricing sign-in return paths. No release-blocking issue was found. The secondary choices sit further down on narrow screens. Real-device Safari/VoiceOver, field load times, live checkout, and actual first-use comprehension or conversion were not newly measured.

### Production release and rollback

1. Before a separately authorized merge, recheck the exact head, master and both successful workflows; confirm the active Hosting version and the empty enrollment settings have not drifted. The last successful [production workflow](https://github.com/alwat83/ifyoumind/actions/runs/43392378321) deployed `59a4b80a8e427a13e0d8bee0f753f8954ea8611f`. Read-only Firebase metadata confirmed production site `ifyoumind-473fe` release `1794558219914000`, finalized version `489bafdb7548f7fd` (57 files), and active commercial checkout/status callables with empty `SUBSCRIPTION_ENROLLMENT`.
2. A push to `master` triggers the existing production workflow, which publishes Hosting and redeploys its existing Functions, Firestore rules/indexes and Storage rules. It forces enrollment empty. After the authorized release, verify the workflow and active Hosting version, then smoke the homepage, evidence, Discovery, electricity/city examples, sample and login return paths. Confirm enrollment stays empty. Use non-transactional checks.
3. For a homepage regression, with rollback authorization select **Roll back** on version `489bafdb7548f7fd` (or the reverified immediately preceding version) in [Firebase Hosting Release history](https://firebase.google.com/docs/hosting/manage-hosting-resources#roll_back_to_a_previous_version_of_your_site). Verify the restored version and rerun the public smoke tests. Hosting rollback restores frontend assets and Hosting configuration only. Prepare a reviewed Git revert of the PR merge to realign source and verify the standard deployment; investigate and restore backend components separately if the workflow causes a backend regression. No rollback has been performed.
