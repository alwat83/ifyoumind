# Production smoke test — ifYouMind revenue release (2026-10-11)

- **Target:** https://ifyoumind.com (Firebase project `ifyoumind-473fe`), master `65430e7` (PRs #7, #8, #11, #5).
- **Run:** 2026-10-11, ~06:28–06:40 UTC. Playwright 1.56.1, pre-installed Chromium, headless. Desktop 1440x900; mobile 390x844 (isMobile, DPR 2).
- **Agent:** Claude Code (Anthropic) automated session. This is the first Claude contribution to this repository, and it is evidence only (no code changes).
- **Hard rules kept:** no purchases and no Checkout opened (no buy button clicked). No refunds. No secrets read or rotated. No Stripe or Firebase config changes. No admin claims. Exactly 1 test account and 3 decisions created. Nobody contacted. Nothing pushed to master, and no PR opened.

## Test account and data created

| Item | Value |
|---|---|
| Test account email | `iym-smoke-20261011-eb9f12@maxxspace.com` (mail.tm disposable inbox; email verified through the Firebase action link) |
| Display name | Release Smoke Test |
| Decision 1 (Nashville) | `wAnnhDcEpKQzvgNFg04T` |
| Decision 2 (Denver, growth, blank business) | `9CWRpc4lwDNeed8bIzAj` |
| Decision 3 (Denver vs Austin, compare, blank business) | `64m1kyTKue3tJRQCG47l` |

The pricing page now shows "3 of 3 used this month" for this account. Passwords are not recorded here.

## Results

| # | Check | Result |
|---|---|---|
| 1 | Sample report (`/sample-report`, signed out) | **PASS** (see note on CTA position) |
| 2 | Nashville live Census match | **PASS** |
| 3 | Blank business field gives neutral wording (growth + compare) | **PASS** |
| 4 | Growth dashboard: shipped UI + clean non-admin refusal | **PASS** |
| 5 | Layouts at desktop and mobile | **PASS** (one pre-existing cosmetic note) |
| 6 | Console errors / failed requests | **PASS** (none release-related) |

### 1. Sample report — PASS
- Landing hero has a **"See a sample report"** link (`href="/sample-report"`) at both widths. Clicking it navigated to `https://ifyoumind.com/sample-report` without signing in.
- The notice is shown: "**This is a sample report.** The question is an example, but every figure is real U.S. Census Bureau data with its source linked…"
- The question is shown: "Should I open my specialty coffee shop in Austin, or in Nashville or Charlotte?", with cards for Austin, TX; Nashville, TN; Charlotte, NC.
- Census metrics, with source lines (Austin):
  - Population 979,539 — U.S. Census Bureau · 2024 ACS 5-year
  - Median household income $93,658 — U.S. Census Bureau · 2024 ACS 5-year
  - Median home value $555,300 — U.S. Census Bureau · 2024 ACS 5-year
  - 5-year population change 3% — U.S. Census Bureau · 2019–2024 ACS 5-year estimates
- Paid sections:
  - Heading "**Market analysis: specialty coffee shop in Austin, TX**", with subsections "Market size and growth", "Household purchasing power", "Property cost context", "Comparative position" and "Further research before committing". The page has 4 `<table>` elements.
  - Action plan ("What to do before you commit."): "Resolve the biggest risk", "Confirm local demand", "Verify operating economics".
  - Decision triggers ("What could change the call"):
    - Strengthens: "Verified demand for your specialty coffee shop plus acceptable occupancy costs would strengthen the case."
    - Weakens: "2 comparison markets show stronger 5-year population change."
    - Unresolved: "How many specialty coffee shop competitors already serve your target customers in Austin, TX?"
  - Limitations ("What this report does not know yet."): "ACS estimates describe demographic context, not concept-level demand." / "Commercial rent, foot traffic, competition, and site-specific operating economics are not yet included."
- **"Start free"** CTA links to `/register` ("Get this analysis for your own question."). The page has no `$79` purchase offer in sample mode.
- **Note:** the "Start free" block is placed after the free brief and *before* the paid sections, about 36% down the page (desktop offset 1751px of 4863px). The page itself ends with "What to check next", Sources and the footer. A persistent "Create your own report free" button is also in the top bar. All the required elements are present, so I marked this PASS, but the CTA is not literally the last element.
- **Note:** the first cold load showed "Putting your answer together…" for more than 2.5s after network idle. Later loads rendered within about 2.3s.
- Screenshots: `landing-desktop.png`, `landing-mobile.png`, `sample-report-desktop.png`, `sample-report-mobile.png`.

### 2. Nashville — PASS
Flow: "Should I open here?", Main location "Nashville, TN", Business "Specialty coffee shop" (replacing the prefilled "Fast-casual restaurant"). The question was left at its default, "Should I open this business here?". The result page loaded at `/app/result/wAnnhDcEpKQzvgNFg04T` with a **LIVE DATA** badge and the subtitle "Specialty coffee shop · Nashville, TN".
- Population 690,130; Median household income $77,371; Median home value $413,600; 5-year population change 4%. Every metric carries a "U.S. Census Bureau · … ACS 5-year" source line.
- No "couldn't match" text anywhere on the page, and no error state.
- Questions shown:
  1. "How many specialty coffee shop competitors already serve your target customers in Nashville, TN?"
  2. "What are current commercial rents and occupancy costs for the exact trade area?"
  3. "What foot-traffic or customer-demand signal would confirm demand for your specialty coffee shop?"
- Screenshots: `nashville-step3-desktop.png`, `nashville-step4-desktop.png`, `nashville-brief-desktop.png`, `nashville-brief-mobile.png`.

### 3. Blank business field — PASS
**Decision 2:** "Is this area growing?", Main location "Denver, CO". The business field was prefilled with "Market growth" and was **cleared to empty** before continuing. The question was left at its default, "Is this area growing in a healthy way?". ID `9CWRpc4lwDNeed8bIzAj`, LIVE DATA, Population 718,877, income $94,718, home value $616,000, change 1.9%. Questions shown:
1. "What local competitors serve the same customer as Denver, CO?"
2. "What are current commercial rents and occupancy costs for the exact trade area?"
3. "What foot-traffic or customer-demand signal would confirm this opportunity?"

**Decision 3:** "Which place is better?", Main location "Denver, CO", compare with "Austin, TX". The business field was prefilled with "Location comparison" and **cleared to empty**. The question was left at its default, "Which location looks stronger for this decision?". ID `64m1kyTKue3tJRQCG47l`, LIVE DATA. The comparison table shows Denver (718,877 / $94,718 / $616,000 / 1.9%) and Austin (979,539 / $93,658 / $555,300 / 3%). The "What gives us pause" section shows "1 comparison market shows stronger 5-year population change." The three questions are identical to Decision 2.

The full page text of both briefs was scanned for "market growth competitors", "your market growth", "location decision competitors" and "location comparison competitors". **None were found.**

Observation (not a failure): the generic label still appears as the context line under the title, "Market growth · Denver, CO" and "Location decision · Denver, CO". This is because the client falls back to `defaultConcept()` when the field is blank. It is not written as a business anywhere in the generated text.

Screenshots: `denver-growth-*.png`, `denver-compare-*.png` (step3, step4, brief desktop, brief mobile).

### 4. Growth dashboard — PASS
- `/app/growth` as the test (non-admin) account, at both widths: the page shows the "Founder growth / 30-day funnel" header and a single notice, "**Admin access required.**" The data callable `getProductFunnelMetrics` returned HTTP 403 (this is the expected refusal; the message comes from `functions/src/intelligence/growth-metrics.ts`). No funnel data was exposed, the page did not crash, and no other errors appeared. No bypass was attempted.
- Deployed bundle proof: I loaded `https://ifyoumind.com/` (`main-RE43KP6Y.js`, `polyfills-5CFQRCPP.js`) and downloaded the 11 lazy chunks served during the session. **"Stripe-confirmed payments"** and **"Returned from checkout"** are both present in `https://ifyoumind.com/chunk-B6JYO6YR.js`.
- Screenshots: `growth-desktop.png`, `growth-mobile.png`.

### 5. Layouts — PASS
`document.documentElement.scrollWidth` vs `innerWidth`. I also scanned every element whose box extends past the viewport, and every button or CTA that is zero-size or off-screen horizontally:

| Page | Desktop 1440 | Mobile 390 | Offending elements | Unreachable buttons |
|---|---|---|---|---|
| Landing `/` | 1440 / 1440 | 390 / 390 | none | none |
| `/sample-report` | 1440 / 1440 | 390 / 390 | none | none |
| Decision Brief (all 3) | 1440 / 1440 | 390 / 390 | none | none |
| `/app/pricing` | 1440 / 1440 | 390 / 390 | none | none |
| `/app/growth` | 1440 / 1440 | 390 / 390 | none | none |

I reviewed the screenshots visually and found no clipped or overlapping content. On `/app/pricing`, "Start a decision", "Get Pro access" and "Buy Decision Report" are visible and inside the viewport at both widths. **None of them were clicked.**

Cosmetic note (pre-existing, not from this release): on `/app/growth` the `<h1>30-day funnel</h1>` renders almost white on the light `#f6f7f9` background and is barely visible (`growth-desktop.png`). Its scss sets no `color`, so it inherits a global heading colour. The heading dates from commit `3853c43` ("Add growth funnel dashboard UI"), before PR #11. I made no fix.

### 6. Console errors and failed requests — PASS
These events were captured across the final runs of every check. The log was reset once, before the corrected re-run of check 1, so the initial cold-load run of check 1 is not included.

| Count | Type | Detail | Assessment |
|---|---|---|---|
| 4 | HTTP 403 | `us-central1-ifyoumind-473fe.cloudfunctions.net/getProductFunnelMetrics` | Expected admin refusal (check 4) |
| 2 | console error | "Failed to load resource: the server responded with a status of 403 ()" on `/app/growth` | Same expected refusal |
| 1 | requestfailed `net::ERR_ABORTED` | `createIntelligenceOrganization` | Test-harness artifact. After sign-in the app landed on `/app`, which auto-creates the workspace, and the script navigated to `/app/decide` immediately, cancelling that in-flight call on the client side. The decision flow then completed normally. Not a release defect. |

There were no other console errors, uncaught page errors, or 4xx/5xx responses on the landing page, sample report, register, email verification, login, decision flow, Decision Briefs or pricing.

## Method notes
- Disposable inbox: mail.tm API, domain `maxxspace.com`. The verification email came from `noreply@ifyoumind-473fe.firebaseapp.com`, subject "Verify your email for ifYouMind". Clicking "Complete verification" on the Firebase action page showed "Your email has been verified".
- Firebase Auth keeps its session in IndexedDB, so each new browser context signs in again. The first attempt at the mobile brief screenshots captured the login page; I re-ran them signed in, and the committed screenshots show the briefs.
- No code was changed. This branch contains evidence only.
