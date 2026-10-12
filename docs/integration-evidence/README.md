# Combined integration check: R2 (#28) and R3 (#29)

These checks ran on 2026-10-11 against the stacked branch (`claude/jolly-ramanujan-ofr18a-r3-report-core`, which contains R2). They used a local production build with the sample callable stubbed. The fixture data is the same as in `docs/r3-visual-evidence`: real ACS point estimates for the four headline figures, with synthetic margins of error, brackets and age cells.

## Automated suites

| Suite | Result |
|---|---|
| `npm run test:seo` (fast web tests) | 35/35 |
| `npm --prefix functions test` | 66/66 |
| `npm run test:commerce` (entitlements, Stripe stub, Census stub) | 31/31 |
| `npm run test:organizations` | 5/5 |
| `npm run test:rules` | 5/5 |
| `npm run build` | Passes. The only warnings are the existing bundle-budget ones |

## Browser checks (Chromium, 390 px and 1280 px)

- **Accessibility:** axe (WCAG 2.0 A and AA, and 2.1 AA) found 0 violations on `/`, `/sample-report`, `/register`, `/register?intent=report`, `/login` and `/verify-email`. None of these pages scrolls sideways, and there were no console errors.
- **Sample report:**
  - The eyebrow reads "Decision Report · Sample".
  - There are 6 "Included in the $79 report" pills.
  - The "In this report" list links to the new Target market and confidence section.
  - The comparative wording uses the difference tests, and "margins of error not checked" doesn't appear.
- **Purchase intent:**
  - Both sample "$79" buttons go to `/register?intent=report`.
  - The register page shows the free-brief-first note and saves the intent in session storage. `register-intent-390.png` shows this.
  - Verification and Stripe checkout are unchanged: the intent only adds a prompt on the first result page.
- **Business-plan text:** "Copy as text" copies the market analysis, then the target-market section, then "How sure the comparisons are". After that comes the source line, which names the tables and the 90% method.
- **PDF (browser print):** printing keeps the evidence section and the market analysis, and hides every `.no-print` element and the income-threshold buttons.

## Entitlements (covered by the commerce suite)

- A free brief never includes `decisionReport` or evidence, and it triggers no extra Census requests.
- Paid views (bought outright, or included with Pro) fetch the evidence once and store it. Later views reuse the stored copy.
- If Census is down, the paid report still loads. The evidence shows as unavailable, isn't stored, and loads on the next view.
- The paid narrative and comparison takeaways are rewritten to follow the difference tests.
