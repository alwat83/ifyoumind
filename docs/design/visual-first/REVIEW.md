# Visual-first redesign — founder review

November 4, 2026 · OpenAI / Codex · **Committed and locally tested; not deployed.**

[Draft PR75](https://github.com/alwat83/ifyoumind/pull/75) · Implementation `cff948a1207305b789ffeeca8bbb73b1d6c03957`. New-head CI was not yet listed at the first post-creation observation; no CI pass claimed.

[Interactive local preview](http://127.0.0.1:4320/) · [Art direction and exact image prompt](ART_DIRECTION.md) · [Asset hashes](asset-manifest.json)

## What to try

1. Open the homepage on a phone. The first action opens the real electricity example directly, without signup or a second category selection.
2. Switch the homepage preview to Property tax, then select “Explore this example.” Inspect the actual source cells, correct data, rerun and clear.
3. Open the separate Business sample or review the optional Business offers. The paid report retains `/register?intent=report`; free/Pro registration stays plain.

## Design

Warm ivory, bold type, original sculptural 3D art, lavender/lime example cards and a short visual explanation replace the long text-led homepage. There is no autoplay or fake chat. Examples are visibly synthetic. Discovery entry/results share the palette, source access and honest limitations. The visual design shows today's supported bill formats; it does not narrow the durable general-purpose product vision or imply arbitrary uploads/AI are available.

The compact mobile entry preserves access to **both example buttons within 390×844**. The homepage action is inside the first viewport at1280×900,390×844 and320×568. Guides remain reachable. Business free brief/$79 one-time/$39 monthly Pro with five full reports and the public sample remain available; no commercial configuration changed.

## Screenshots from the final production candidate

| Desktop | Mobile | Narrow |
|---|---|---|
| [First screen](screenshots/desktop-home-fold.png) | [First screen](screenshots/mobile-home-fold.png) | [First screen](screenshots/narrow-home-fold.png) |
| [Full homepage](screenshots/desktop-home-full.png) | [Full homepage](screenshots/mobile-home-full.png) | [Full homepage](screenshots/narrow-home-full.png) |
| [Discovery choices](screenshots/desktop-discovery-entry.png) | [Discovery choices](screenshots/mobile-discovery-entry.png) | Covered by browser suite |

## Fresh verification

| Check | Result |
|---|---|
| `npm run build` | PASS; main660.52kB, existing500kB warning, under1.1MB error limit |
| `npm run build:local` | PASS |
| `npm run test:seo` | 137/137 PASS |
| `QA_BROWSER_CHANNEL=chrome npm run test:discover` | 63/63 PASS, exit0, zero failures/skips; actual Firebase Hosting emulator, desktop/mobile/320px |
| Public navigation/SEO/accessibility (local-only focused run) | 18/18 PASS, exit0; existing tests updated to new layout |
| Changed homepage/unified TS and HTML ESLint | PASS, no diagnostics |
| Production bundle guard | PASS,36files |
| Production discovery isolation | PASS: separate public island, no provider endpoints/noindex/privacy headers, main bundle excludes engine |
| Three existing standalone preview builds/isolation | PASS; shared styling compiles in tax/electricity/unified configurations |
| Accessibility/layout | Checked WCAG A/AA automatic violations0; direct heading contrast>=3; visible home links/buttons>=44px; no horizontal overflow; keyboard preview/focus/evidence/offline/clear tested |
| Commerce navigation | Existing sample route, Free/Pro registration, prices, five reports and report intent verified; no purchase attempted |

The first browser pass was62PASS/1FAIL: enlarged imagery put the second example below the first390px screen. Compact illustrated mobile cards fixed the regression; the complete final run passed. Initial sandbox build/server attempts were blocked; approved local execution succeeded. In-app screenshot capture was unavailable; Playwright screenshots were captured and visually reviewed. No failed attempt counted as a pass.

The production build retains initial/component-style warnings; changed homepage main style6.18kB and unified shell7.22kB are below the8kB error budget. Historical full-source91lint/11Angular compiler failures and one intentional integration skip were not rerun or claimed fixed here. This focused suite does not establish full authenticated QA, real signup/email, payment/PDF export, physical-device/Safari/iOS, screen-reader speech, novice comprehension, field performance or conversion improvement. CI status must be checked on the new exact head; prior-master checks cannot substitute.

## Git, release and preservation

Branch `codex/visual-first-discovery`, directly from production master `65dc4912a8bf7ccde31926651eb0f3c4b05cd039`. Isolated checkout `/private/tmp/ifyoumind-visual-discovery`. Root FRED branch and its pre-existing sitemap modification are untouched. PR74's marketing/ownership/private-acquisition work is preserved, not merged or imported. No backend, rules, entitlement, auth, dependency, Stripe or price changes.

Prior production source65dc491 and successful [October26 deployment40344228960](https://github.com/alwat83/ifyoumind/actions/runs/40344228960) remain historical release evidence. This redesign has not been merged/deployed. No outreach, accounts, transactions, spending or new AI/PDF/storage functionality. Exact source commit, draft PR and CI links are supplied in the final handoff.

Rollback is a reviewed revert of this focused UI/metadata/test/documentation change, followed by a separately authorized build/deployment if it had been released. No backend/data migration. Keep previous Hosting version evidence separately; no production rollback executed.

## Business hypothesis and next three

Founder identified text-heavy design/comprehension friction. A familiar visual example and immediate real findings should make trying the product easier. No human understanding, conversion lift, qualified inquiry, customer or revenue outcome has been measured. Financial baseline/launch scoreboard unchanged.

1. Review this concrete design and refine the highest-priority visual feedback.
2. Observe first-use understanding and example completion, without adding categories or speculative features.
3. After exact release approval and current CI, deploy only the approved scope and verify live; outreach remains Pending Founder Setup.


## November 4 release authorization and CI runner repair

Founder explicitly requested “For now lets make that live,” authorizing the reviewed PR75 release. Exact0cbc3be build41882126193 PASS; automatic QA41882126106 and duplicate manual QA41882210679 stopped before browser tests because ubuntu-latest moved to Ubuntu26.04, unsupported by pinned Playwright1.56.0. This is not a successful full QA run. Pin the existing QA job to supported Ubuntu24.04; app/assets/auth/Stripe/dependencies unchanged. New exact-head build/full QA must pass before expected-head merge/automatic configured deployment. Premerge Hostingef3836b4e2285dfe FINALIZED44files/notdeleted, observed2026-11-04T17:58:45.864Z.
