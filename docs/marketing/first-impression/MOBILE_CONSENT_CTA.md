# Mobile first impression: CTA above the consent banner (November 26, 2026)

**Status:** draft PR for founder review. **Not deployed. Production deployment is not authorized.**
**Provider/agent:** Anthropic / Claude Code, local session on the founder's machine.
**Base:** `b9151c64b602e29b0ba98fd8b256b5d618e722d1`. This is the source of production Hosting `d47dcec2093b625f` (release `1795723013497000`), on branch `claude/mobile-consent-cta`.

## What was broken
On short phone screens, the analytics consent banner covered the only primary action, **Reveal what changed**. Before choosing anything, visitors saw a cookie question and no product action.

Measured on the deployed bytes, served locally with real web fonts:

| Viewport | CTA (px) | Banner top (px) | Result |
|---|---|---|---|
| 390×664 (Instagram in-app) | 414–466 | 489 | Visible, 23px clear |
| 375×667 | 414–466 | 492 | Visible, 26px clear |
| 375×553 (iPhone SE-class Safari) | 414–466 | 378 | **Covered** |
| 360×640 (common Android) | 438–490 | 465 | **Covered** |
| 320×568 | 422–474 | 370 | **Covered** |

## What changed (CSS only, 2 files)
1. **`cookie-consent-banner.component.scss`**, phones (≤820px) only:
   - Padding 16px → 10px, and the banner now respects the safe-area insets.
   - Text 15px → 14px with line height 1.4.
   - Buttons sit on one grid row as **Allow | Reject | Manage**. Allow and Reject are always equal width, and every button stays at least 44px tall.
   - The banner shrinks from 176px to 132px tall at 375px wide. Desktop is unchanged.
2. **`public-landing-visual-mobile.component.scss`**, only when the screen is ≤740px wide and **≤600px tall**:
   - Hero spacing tightened by 8–12px per gap.
   - Headline 46px → 42px, or 39px → 34px at 320px wide.
   - Taller phones are unchanged, including the 390×664 Instagram in-app view.

**Not changed:**
- Consent wording, button labels, the default or stored choice, analytics initialization, events, tag configuration or Private Discovery.
- Hosting config, backend, billing and entitlements.
- The $420/$240 reveal, "Show the evidence", and the example navigation.

### Why this is minimal
The banner change alone clears 390×664, 375×667 and 360×640. Clearing 375×553 and 320×568 also needs about 55–90px of hero space. I tried tightening spacing alone first, but it left the CTA 15px short. A slightly smaller headline, only on screens 600px tall or less, was the smallest change that worked. Headline text, colour, weight and both typefaces are unchanged.

## Mobile verification (new build, real fonts, no choice made yet)

| Viewport | CTA (px) | Banner top (px) | Clearance | Consent controls |
|---|---|---|---|---|
| 1280×800 | 260–312 | 722 | 410 | unchanged |
| 390×844 | 414–466 | 712 | 246 | 135/135/73 × 44 |
| 414×715 | 414–466 | 583 | 117 | 147/147/73 × 44 |
| 390×664 | 414–466 | 532 | 66 | 135/135/73 × 44 |
| 375×667 | 414–466 | 535 | 69 | 127/127/73 × 44 |
| 375×553 | 361–413 | 421 | 8 | 127/127/73 × 44 |
| 360×640 | 438–490 | 503 | 13 | 120/120/73 × 49 |
| 320×568 | 335–387 | 412 | 25 | 100/100/73 × 49 |
| 320×460 | 335–387 | 304 | **−83** | all visible |

Screenshots are in [`screenshots/`](screenshots/), named `before-*` and `after-*`.

**Remaining limitation, 320×460:** this is about the visible area of a 4-inch iPhone in Safari with both toolbars. Below the 68px header, about 236px remain once the banner shows, which is less than the headline alone needs. Shrinking the banner further would mean smaller tap targets or hiding consent text. Hiding the banner would make the analytics choice invisible. So the full banner stays visible, and the CTA is one short scroll away. The page already reserves the banner's height at the bottom, so nothing is lost behind it.

**No unrelated visual change:**
- I took full-page screenshots after a rejection, with the banner gone, of `/`, `/pricing` and `/privacy-policy`. They are pixel-identical to production at 1280×800, 390×844, 414×715 and 390×664.
- At 375×553 and 320×568, only `/` differs, and only in the intended hero spacing.
- Built output differs from the deployed artifact only in the main bundle (banner CSS), the landing chunk, and the 6 HTML pages that reference those renamed files. The other 58 files are byte-identical.

## Tests (exact branch source)
| Check | Result |
|---|---|
| Full `npm run build` | PASS. Only the existing budget warnings; this change adds none |
| `node scripts/web-tests.js` | 194/194 |
| `node --test test/ga4-browser-port.test.mjs test/ga4-policy.test.mjs` | 20/20 |
| Offline production-hostname consent spec, 1280/390/320 | 3/3 |
| **New** `e2e/analytics-activation-specs/consent-layout.spec.mjs`, 5 short viewports | 5/5 on this build. **Fails on the deployed baseline** at 375×553, 360×640 and 320×568, so it detects the regression |
| Real-tag offline transport suite, 3 cases × 1280/390/320 | 9/9, assertions unchanged. Freshly captured public tag kept outside Git |
| Offline consent flows at 375×553, 320×568 and 390×664 | 42/42 (details below) |
| Hosted CI `authenticated-qa.yml` (Java 21 emulators), [run 45928002433](https://github.com/alwat83/ifyoumind/actions/runs/45928002433) on `4aab384e` | 251 passed / 15 failed / 0 skipped. **`ga4.spec.mjs` 28/28** (desktop and mobile). The 15 failures are not caused by this PR; see below |

The offline consent flows served the build under the production hostname with Google's real captured tag. Every collector request was recorded and answered locally. They checked:
- Keyboard order Allow → Reject → Manage, with a visible focus outline.
- Manage opens a dialog whose checkbox is not preselected. Escape closes it and returns focus to Manage.
- Reject: zero tag loads and zero hits, and reopened preferences show the box unchecked.
- Allow: `page_view` and `free_tax_example_viewed` with the canonical URL, the fixed title, and no query or private values.
- Reopened preferences show the box checked. Withdrawal sets the disable flag, stores false, and sends zero further hits.

**Java 21 / emulator coverage.** firebase-tools needs Java 21, and this Mac has an older JDK, so the emulator suite couldn't run locally. Instead of installing software, I dispatched the repository's existing `authenticated-qa.yml` workflow on the exact PR head. It uses no secrets, deploys nothing, and Actions minutes are free for this public repo.
- All 28 setup, build, rules, commerce, entitlement and Discovery steps passed.
- The emulator GA4 consent suite passed 28/28, including "pending consent never obstructs registration…" and "preferences support keyboard focus…".

**The 15 CI failures are pre-existing.** A control run of the same workflow on the deployed source `b9151c64` ([run 45929693032](https://github.com/alwat83/ifyoumind/actions/runs/45929693032)) also had **251 passed / 15 failed**, with identical per-suite counts:
- 14 are the same `visual-journeys` screenshot comparisons. The baselines are stale: 80–98% of pixels differ and page heights don't match, including desktop pages this PR can't affect.
- 1 is `session.spec` "Your decisions" strict-mode duplicate link. It's flaky: it failed on mobile in the control and on desktop here. This PR changes no markup.
- Refreshing those baselines and fixing that selector is separate maintenance. Nothing in this PR needs to change.

**Existing behaviour found during testing (in production now; not changed or caused here):**
- Google's tag batches events for a few seconds.
- If a visitor withdraws consent within that window and then leaves the page, events recorded *while consent was granted* are delivered at unload.
- Nothing recorded after withdrawal is sent.
- Both the deployed baseline and this build pass 42/42 once each step waits for the batch to flush, and both show the late delivery without the wait.
- **Assessed separately**, on the GA4 evidence branch: [`docs/marketing/ga4/withdrawal-batching/ASSESSMENT.md`](https://github.com/alwat83/ifyoumind/blob/claude/trusting-fermi-7qh9l5/docs/marketing/ga4/withdrawal-batching/ASSESSMENT.md). Verdict: a disclosure gap, not collection after withdrawal. Recommended fix: a wording-only PR after founder/counsel sign-off. Not a blocker for this CSS release.

## Copy proposal (not shipped; the founder chooses)
Current line: "Understand your bills. Compare U.S. cities. See the numbers behind each finding."

| # | Option | Fits 375×553 with CTA visible | Notes |
|---|---|---|---|
| **1 (recommended)** | ifYouMind turns your bills and local data into clear answers you can check. | Yes, 2 lines | Names the product. "Bills" covers tax and electricity, "local data" covers city comparisons. "You can check" points to the evidence. Makes no free or privacy promise. |
| 2 | Make sense of your bills and compare U.S. cities, with the evidence behind every answer. | **No.** 3 lines; the CTA goes 16px under the banner | Closest to today's wording but doesn't name the product. Would need a shorter edit. |
| 3 | ifYouMind turns everyday numbers into clear answers you can check. | Yes, 2 lines (2 at 320 as well) | Shortest and broadest, but "everyday numbers" is vaguer than "your bills". |

Previews of the recommended option are in `screenshots/copy-opt1-*.png`, and option 3 in `copy-opt3-390x664.png`. They were injected into the page for review only and aren't in the source. The headline, the CTA and the "Illustrative numbers, not proof that a bill is wrong" note are unchanged in every option.

## Related items kept out of this PR
- **Copy:** founder-selected option 1 is in draft [PR #133](https://github.com/alwat83/ifyoumind/pull/133), stacked on this PR. Release it only after this fix has a post-change baseline.
- **Accessibility, existing in production:** on `/register`, with the banner pending, keyboard focus on Email (and Password at 390×664) is fully hidden behind the banner on phones. That fails WCAG 2.2 SC 2.4.11 (AA). This PR's smaller banner reduces the overlap but doesn't fix it. The fix is in separate draft [PR #134](https://github.com/alwat83/ifyoumind/pull/134): banner-height scroll padding, independent of this PR, with no visual change at rest.

## Release recommendation (Hosting only)
**GO to request production authorization** for a Hosting-only release of this PR's exact build. No privacy, accessibility or configuration regression was found:
- Consent wording, defaults and analytics behaviour are unchanged. Every consent and transport suite passes, and the withdrawal-batching behaviour is identical with and without this PR.
- `firebase.json`, rules and Functions are untouched. The built output differs from production only in the main bundle, the landing chunk and the HTML pages that reference them.

Conditions:
1. Package an exact artifact from `4aab384e` with a SHA256 manifest.
2. Run the same authenticated preflight. Live must be `d47dcec2093b625f`, all 35 Functions unchanged, enrollment unchanged.
3. Deploy only from an isolated worktree with the release `firebase.json`.
4. After deploy, recheck short-viewport CTA visibility and run the live consent/withdrawal suite.
5. Rollback target: `d47dcec2093b625f`.

**Strongly recommended:** release #134 with or right after this PR. It fixes an existing AA failure on the same banner.

**Not blockers for this release, but still open:** GA4 Realtime receipt for release `1795723013497000` needs founder confirmation, and the withdrawal-wording decision is pending.

## Separate conversion opportunity (not in this PR)
After the reveal, the next action is "Compare my tax CSV", which means preparing a redacted CSV. That's unlikely from a phone during an Instagram visit. The $79 Decision Report (city and business decisions) isn't connected to the tax story. Treat this as a separate product decision.

## Measurement plan
**Primary metric:** reveal engagement. In a GA4 Exploration, divide users with `free_tax_example_viewed` by users with `page_view` where `page_location = https://ifyoumind.com/`. Segment by `campaign_source = instagram` and by all traffic.

How reliable the existing event logic is:
- The event is deduplicated once per page view. The key resets on each SPA `page_view`, so use **user** counts, not event counts, to avoid double-counting return visits to `/`.
- A reveal before consent counts if the visitor allows analytics later on the same page, because the landing page re-sends it on consent.
- Deep links (`/?example=tax`, `#business`, the Menu's example link) and the "Property taxes" example tab also fire the event without a Reveal tap. URLs are stripped to canonical before they reach GA4, so GA4 can't tell these apart. Read the metric as "explored the tax example", and compare the same segment across periods.

**Secondary metric:** users with `evidence_revealed` divided by homepage users.

**Guardrails:**
- `registration_completed` and `checkout_started` per homepage user. These are sparse, so watch for sharp drops only.
- The new layout spec stays green.
- Page weight unchanged. This is a CSS-only change; the build's main bundle grows by a few hundred bytes.

**Opt-in limitation:** GA4 only sees visitors who allow analytics.
- The consent rate itself **cannot** be measured: people who reject are invisible to GA4, and first-party telemetry is consent-gated too. Measuring it would need new tracking and a separate review.
- The banner change may shift who consents. **So ship the banner fix and the copy change separately.**
  1. Ship the banner fix as a usability correction; it doesn't need a test to justify it.
  2. Collect a baseline after it.
  3. Then change only the copy.

**Sample size** (two proportions, 80% power, two-sided α 0.05; consenting homepage users needed per period):

| Baseline → target | Users per period |
|---|---|
| 30% → 40% | ~350 |
| 20% → 25% | ~1,100 |
| 30% → 35% | ~1,370 |

Don't fix the test at 14 days.
- Run each period in whole weeks, with the same campaign mix and no other site changes.
- Keep going until both periods reach the sample size for the baseline rate you actually observe.
- If that doesn't happen within about six weeks, report the result as directional and keep collecting. Don't declare a win.

**Conditions for a later release decision:**
1. Founder approves the PR and picks the copy option.
2. Separate production authorization for a Hosting-only release of an exact, hashed artifact, plus the same authenticated preflight, live privacy checks and rollback path used for `d47dcec2093b625f`.
3. GA4 Realtime receipt for the current release confirmed by the founder.
