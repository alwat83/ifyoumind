# Production smoke test: ifYouMind release 2 (2026-10-11)

- **Target:** https://ifyoumind.com, master `9ba3ff7` (PR #15, merge `d80f83b`: free brief shows 1 of up to 3 comparisons; PR #14, merge `9ba3ff7`: homepage positioning).
- **Run:** 2026-10-11, about 15:30–15:45 UTC. Playwright 1.56.1 with the pre-installed Chromium, headless. Desktop 1440x900. Mobile 390x844 (isMobile, DPR 2).
- **Agent:** Claude Code (Anthropic) automated session. Evidence only; no code changes.
- **Hard rules kept:** no purchases, and Stripe Checkout was never opened (no buy button clicked). No refunds. No secrets read or rotated. No Stripe or Firebase config changes. No admin claims. Exactly 1 test account and 2 decisions created. Nobody contacted. Nothing pushed to master and no PR opened.

## Test account and data

| Item | Value |
|---|---|
| Test account email | `iym-smoke2-20261011-dcb8b4@maxxspace.com` (mail.tm disposable inbox; verified through the Firebase action link: "Your email has been verified") |
| Display name | Release Smoke Test 2 |
| Decision 1: Denver vs Austin; Raleigh; Boise, "Specialty coffee shop" | `PHGwgbjzAKQ9zcCU2nUU` |
| Decision 2: Nashville vs Charlotte, "Gym" | `NXdZbvkKr5tsigKANpMF` |

Passwords are not recorded.

## Results

| # | Check | Result |
|---|---|---|
| 1 | Homepage (signed out) | **PASS** |
| 2 | Sample report still works | **PASS** |
| 3 | Three-city free decision (a–e) | **PASS** (see the note on the create-callable capture) |
| 4 | Pricing copy | **PASS** |
| 5 | Regression: single-comparison decision | **PASS** (the optional blank-business check was skipped to stay within 2 decisions) |
| 6 | Console errors / failed requests | **PASS** (none release-related) |

### 1. Homepage: PASS
- h1: "The market analysis for your business plan, done in minutes." (exact, at both widths)
- Subhead: "Compare the U.S. cities you’re considering on population, growth, income and home values, with every figure cited to the Census, written up for your business."
- Primary CTA: "Build my market analysis free", `href="/register"`. Secondary CTA: "See a sample report", `href="/sample-report"`.
- Footer: "Decision intelligence, starting with where to build your business."
- `document.title`: "ifYouMind — Market analysis for your business plan"
- Meta description: "Compare the U.S. cities you're considering with Census-cited population, growth, income and home values, written up as a market analysis for your business plan. Start free."
- At 1440x900, both CTAs are fully above the fold: top 661.75px, bottom 713.75px (viewport 900). At 390x844 they are also in the first viewport: primary 596–646px, secondary 656–708px.
- Overflow: scrollWidth/innerWidth is 1440/1440 on desktop and 390/390 on mobile.
- Screenshots: `home-desktop.png`, `home-mobile.png`, `home-desktop-full.png`, `home-mobile-full.png`.

### 2. Sample report: PASS
- `/sample-report` loaded signed out (URL stayed `https://ifyoumind.com/sample-report`).
- Cards for "Austin, TX", "Nashville, TN" and "Charlotte, NC".
- Heading "Market analysis: specialty coffee shop in Austin, TX", with subsections "Market size and growth", "Household purchasing power", "Property cost context", "Comparative position" and "Further research before committing".
- Overflow: 1440/1440 and 390/390.
- Screenshots: `sample-report-desktop.png`, `sample-report-mobile.png`.

### 3. Three-city free decision: PASS
- Help text in `/app/decide` step 2: "Separate multiple places with semicolons. Add up to three. The free brief compares the first one; the full Decision Report compares all three." (`denver-3city-step2-desktop.png`; the same text was read from the DOM in the decision-2 run.)
- Inputs: "Should I open here?", Main location "Denver, CO", Compare "Austin, TX; Raleigh, NC; Boise, ID", Business "Specialty coffee shop". Result: `/app/result/PHGwgbjzAKQ9zcCU2nUU`.
- **(a) PASS.** The brief shows a LIVE DATA badge: Population 718,877; Median household income $94,718; Median home value $616,000; 5-year population change 1.9%. Each figure carries a "U.S. Census Bureau · … ACS 5-year" source line.
- **(b) PASS.** "How the other places compare" contains the main-location card (Denver, CO) and exactly one card marked "Comparison": **Austin, TX** (979,539 / $93,658 / $555,300 / 3%).
- **(c) PASS.** The offer reads: "**Your full report also compares Raleigh, NC and Boise, ID.** The free brief shows one comparison."
- **(d) PASS.**
  - Page text: "Raleigh" and "Boise" appear on exactly one line, the offer line.
  - `getMarketIntelligenceProject` response: they appear only in `"reportOnlyLocations":["Raleigh, NC","Boise, ID"]`. `comparisonLocations` is `["Austin, TX"]` and `brief.comparisons` holds Austin only. No Raleigh or Boise metrics, and no `decisionReport` field. The full response is saved as `denver-3city-getMarketIntelligenceProject.json`.
  - `getRecentMarketIntelligenceProjects`: no mention of either city.
  - "What gives us pause" reads "1 comparison market shows stronger 5-year population change". That count covers Austin only, so Raleigh and Boise data does not leak in through the risk text either.
  - **Capture note:** this decision's `createMarketIntelligenceProject` response was **not saved**. My first script's wait used a case-sensitive match on the CSS-uppercased "The signals underneath" eyebrow. The decision was created and rendered, but the script timed out before writing the captured responses. To stay within the 2-decision limit I did not re-create it, and instead re-inspected the saved decision.
  - Supporting evidence from decision 2: the create response has the same shape as the get response (`comparisonLocations`, `reportOnlyLocations`, `brief.comparisons`; see `nashville-gym-createMarketIntelligenceProject.json`). The server code builds both from the same `view` (`functions/src/intelligence/market-intelligence.ts:406` and `:468`).
- **(e) PASS.** No "Market analysis:" heading, no `app-market-analysis` element and no `.action-plan` section. The page headings are just the question, the recommendation, the two location cards, "Turn this brief into a full Decision Report." and "These are the questions worth answering before you act."
- Overflow: 1440/1440 on desktop, 390/390 on mobile.
- Screenshots: `denver-3city-step2/3/4-desktop.png`, `denver-3city-brief-desktop.png` (full page), `denver-3city-brief-desktop-viewport.png`, `denver-3city-brief-mobile.png`.

### 4. Pricing copy: PASS
- Free card: "1 comparison place in the brief".
- Report card: "Full Decision Report for one decision, comparing your main location with up to three other places".
- Pro card (for reference): "Up to 3 comparison locations per decision".
- No buy button was clicked. Overflow: 1440/1440 and 390/390.
- Screenshots: `pricing-desktop.png`, `pricing-mobile.png`.

### 5. Regression: single comparison: PASS
- Inputs: "Should I open here?", Nashville, TN vs Charlotte, NC, "Gym". Result: `/app/result/NXdZbvkKr5tsigKANpMF`, LIVE DATA.
- Figures: Population 690,130; income $77,371; home value $413,600; change 4%.
- Comparison section: Nashville, TN (main location) and one comparison card, **Charlotte, NC**.
- The offer contains no "also compares" line. The create and get responses both show `comparisonLocations: ["Charlotte, NC"]` and `reportOnlyLocations: []`.
- No paid sections. Overflow: 1440/1440 and 390/390.
- Screenshots: `nashville-gym-step2/3/4-desktop.png`, `nashville-gym-brief-desktop.png`, `nashville-gym-brief-desktop-viewport.png`, `nashville-gym-brief-mobile.png`.
- The optional blank-business check was **not run**. It would have needed a third decision, and the limit is 2. It passed in the previous smoke test (`verification/2026-10-11-release/`).

### 6. Console errors and failed requests: PASS
Every page in every run was captured: homepage, sample report, register, verification, login, decision flow, briefs and pricing, at both widths.

| Count | Type | Detail | Assessment |
|---|---|---|---|
| 1 | requestfailed `net::ERR_ABORTED` | `recordProductEvent` | Harness artifact: the script navigated from `/app` to `/app/decide` right after sign-in, which cancelled in-flight calls on the client. |
| 1 | requestfailed `net::ERR_ABORTED` | `getRecentMarketIntelligenceProjects` | Same cause. |

There were no console errors, no uncaught page errors and no 4xx/5xx responses.

## Method notes
- Disposable inbox: mail.tm, domain `maxxspace.com`. The verification email came from `noreply@ifyoumind-473fe.firebaseapp.com`, subject "Verify your email for ifYouMind".
- Each run signed in through `/login`. Mobile views reused the desktop session through Playwright `storageState({indexedDB:true})`.
- The pricing page was only viewed. No checkout or billing endpoint was called.
