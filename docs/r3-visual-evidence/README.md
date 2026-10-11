# R3 visual evidence

These screenshots show the new "Target market and confidence" section on a local production build of `/sample-report`. The sample callable is stubbed, so the build makes no live Census requests.

**These are test fixture values, not real Census data.** The population, median income and median home value point estimates are the published ACS 2020–2024 figures used in the ifYouMind guide. Every margin of error, income bracket and age cell is synthetic, so the shares and verdicts shown are not real findings. Population totals are marked "controlled" in the fixture, so the population-change comparison is shown without a margin-of-error test.

- `evidence-390.png`: phone width (390 px).
- `evidence-1280.png`: desktop width (1280 px).

Checks at both widths: axe (WCAG 2.0 A and AA, and 2.1 AA) found 0 violations, there is no horizontal overflow, and switching the income threshold updates the table.
