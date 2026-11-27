# ifYouMind GA4 measurement guide (post-release baseline)

**Scope:** read-only use of the events already live. No new tracking, parameters, custom dimensions or GA4 settings changes are proposed here; any of those needs separate review.
**Property:** ifYouMind — Production `565380927` · stream `16394318092` · `G-NRT31062LW`.
**Prepared:** 2026-11-27 by Anthropic / Claude Code.

## 1. Live baseline
| | |
|---|---|
| Live Hosting | version `4315f71caa9b7cd1`, release `1795753246113000`, live since **2026-11-27 04:20:46 UTC** |
| Frozen copy | git tag `hosting-live-4315f71caa9b7cd1` → `release-artifacts/focus-not-obscured-d1e815f7/` (archive `304c82f3…`, 66 files, manifest `d9a9bf13…`) |
| Earlier releases | GA4 on: `d47dcec2` at 2026-11-26 19:56:53 UTC · mobile CTA fix: `e0240db8` at 2026-11-27 03:24:47 UTC |

**The post-fix baseline starts 2026-11-27 04:20:46 UTC**, after both mobile fixes went live. The ~7.5 hours of data before that are too short to serve as a "before" period, so no before/after claim about the two fixes should be made.

**Exclude internal QA traffic.** These windows contain synthetic consented `page_view` hits from release verification. Each run produced 4 hits (`/`, `/pricing`, `/`, `/privacy-policy`):

| Window (UTC) | Synthetic hits |
|---|---|
| 2026-11-26 19:58–20:02 | 10 (three runs) |
| 2026-11-27 03:26 | 4 |
| 2026-11-27 04:22 | 4 |

Earlier Nov 23 QA hits are recorded in `production-release.json`.

## 2. The three events

| Event | Sent when (consent granted) | Not sent | Parameters |
|---|---|---|---|
| `page_view` | Every SPA route view of an allowlisted page. One per view; the automatic first page view is suppressed | Pending or rejected consent; private Discovery (`/discover/`) | `page_location` is canonical with **no query or hash**: `/?example=tax#business` is reported as `https://ifyoumind.com/`. `page_title` is a fixed label, e.g. "Explore examples", "Pricing", "Privacy policy". Allowlisted campaign labels are attached when present |
| `free_tax_example_viewed` | The homepage tax example is shown, by **any** of: (a) the **Reveal what changed** button; (b) the **Property taxes** example tab; (c) **arriving** on `/?example=tax` or `/#business` (for example the menu's example link `/?example=tax#business`), which auto-reveals; (d) granting consent **after** revealing on the same page | More than once per page view (deduplicated per page view; it can fire again after navigating away and back) | none |
| `evidence_revealed` | "Show the evidence" is opened on the homepage | More than once per example per page view | `example` = `tax` \| `electricity` \| `cities` |

**`free_tax_example_viewed` is not a Reveal-button click.** Because of (b) and (c), read it as **"saw the tax example"**. URLs are canonicalized, so GA4 cannot tell how the example was reached.

## 3. Metrics and how to build them (GA4 UI, no configuration changes)

| Metric | Definition |
|---|---|
| **Tax-example engagement rate** (primary) | Users with `free_tax_example_viewed` ÷ users with a homepage `page_view` |
| **Evidence rate** (secondary) | Users with `evidence_revealed` ÷ homepage users |
| Guardrails | Users with `registration_completed` and `checkout_started` ÷ homepage users. These are sparse, so watch for direction only |

**Funnel exploration** (recommended):
1. Go to **Explore → Funnel exploration**.
2. Set the date range to start **2026-11-27** (and exclude the QA windows above when reading).
3. Add the steps:
   - **Step 1, Homepage:** Event name = `page_view` AND Page location exactly matches `https://ifyoumind.com/`. Page title = "Explore examples" works as an equivalent.
   - **Step 2, Saw tax example:** Event name = `free_tax_example_viewed`.
   - **Step 3, Opened evidence:** Event name = `evidence_revealed`.
4. Use a **closed** funnel and leave "Make open funnel" off.
5. Under Breakdown, add **Device category** and, optionally, **Session source / medium**.
6. Read **Active users** per step. Step 2 ÷ Step 1 is the primary rate.

**Notes:**
- `evidence_revealed` can't be split by `example` without registering a custom dimension. That's a GA4 configuration change that needs separate approval. Until then, step 3 counts evidence opened for **any** example.
- Campaign/source attribution comes from allowlisted campaign labels sent with `page_view`. **This hasn't been verified in GA4 reporting.** Before relying on the Session source breakdown, check that an Instagram-tagged visit (`utm_source=instagram`) appears as source `instagram`.

**Free-form exploration** (counts over time): rows = Date; columns = Event name (filter to the three events); value = Active users and Event count.

## 4. Limitations of opt-in analytics
1. **Consent only.** GA4 sees only visitors who choose **Allow analytics**.
   - Visitors who reject, or never choose, are invisible.
   - **The consent rate can't be measured** (first-party telemetry is consent-gated too).
   - All rates describe consenting visitors only, who may behave differently from everyone else.
2. **Late consent.** A visitor who reveals first and allows later is counted, once consent is granted on that page. A visitor who reveals and never consents is not.
3. **Changes to consent behaviour shift the sample.** Banner changes (like #132) change *who* is measured. Compare periods only when the banner is unchanged.
4. **Withdrawal timing** ([issue #135](https://github.com/alwat83/ifyoumind/issues/135)). Up to about 5s of activity recorded before a withdrawal may still be delivered. This has no material effect on counts, but affects disclosure.
5. **Undercounting** from ad blockers, private browsing and cookie clearing. Without signals, cross-device users count separately.
6. **Small numbers.** Low counts fluctuate. Report counts alongside rates.
7. **No Reveal-button-specific signal** (see section 2). Adding one would be new tracking and needs separate review.

## 5. Sample size and decision rules
Consenting homepage users needed **per period** (80% power, α 0.05, two-sided):

| Baseline → change to detect | Users per period |
|---|---|
| 30% → 40% | ~350 |
| 20% → 25% | ~1,100 |
| 30% → 35% | ~1,370 |

- Collect the post-fix baseline in **whole weeks**, with the campaign mix unchanged.
- Don't start the PR #133 copy test until the baseline reaches the size its observed rate requires.
- If that doesn't happen within about six weeks, treat results as directional and keep collecting.
- Never declare a win from an underpowered comparison, and never from a single week.

**PR #133 (copy) stays unreleased** until the baseline is adequate. Then release only the copy, so one variable changes, and compare equal-length periods.

## 6. Maintenance items tracked separately (not measurement blockers)
- Issue #135: withdrawal wording.
- CI: 14 stale `visual-journeys` baselines and a flaky `session.spec` duplicate-link selector.
- Physical iOS Safari check of keyboard-focus scrolling (#134 was verified in Chromium).
