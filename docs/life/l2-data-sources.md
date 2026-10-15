# ifYouMind Life L2: place data, sources and method

Status: **draft PR, not merged, not deployed.** Nothing in production loads this data. L3 (the `/life` UI) will be the first consumer.

**Output:** `data/life/build/life-places-v2024-1.json`, about 345 KB. It is outside `public/`, so a merge would not publish it. It contains:
- 935 metro and micropolitan areas (CBSAs);
- 1,294 principal cities;
- 47 state nonmetro price levels.

**Rebuild:** `python3 -I scripts/life-data/build.py`. The build uses the Python standard library only, is deterministic and has no timestamps. `--check` fails when the committed output differs from a fresh build, and the tests run that check.

**Contract:** `src/app/life/data/places.ts` holds the types and four functions:
- `validatePlaces` checks the schema;
- `findPlaces` searches city names;
- `priceInput` returns the engine's price-level fields;
- `rentEstimate` returns a rent and its margin of error.

**Tests:** `test/life-data.test.mjs` has 10 tests, run by `npm run test:seo`.

## Sources

Every file is recorded with its URL, SHA-256, Last-Modified date and retrieval time in `data/life/raw/MANIFEST.json`. The files were downloaded on the `ifyou` environment, which can reach the .gov hosts.

| Source | What we use | Release | Committed |
|---|---|---|---|
| BEA Regional Price Parities, MARPP | 2024 RPPs for 387 metros, U.S. and U.S. nonmetro: all items, goods, housing, utilities, other services | 2026-02-19 (2024 new; 2008–2023 revised) | MARPP.zip as published |
| BEA RPPs by state portion, PARPP | 2024 nonmetropolitan portion of each state (includes micropolitan counties, per BEA's footnote) | 2026-02-19 | PARPP.zip as published |
| BEA RPPs by state, SARPP | Kept for reference and later state-level checks. Not used in the output. | 2026-02-19 | SARPP.zip as published |
| ACS 2020–2024 5-year, B25031 | Median gross rent, 1 and 2 bedrooms, with the 90% margin of error, by CBSA | 2026-01-29 | CBSA rows only (see below) |
| ACS 2020–2024 5-year, B25064 | Median gross rent, all units, with the 90% margin of error, by CBSA | 2026-01-29 | CBSA rows only |
| Census API variable labels | Confirms which column is which (B25031_003 is 1 bedroom, _004 is 2 bedrooms) | — | B25031.json, B25064.json |
| OMB delineations, July 2023 (Census lists 1 and 2) | CBSA titles, metro or micro, counties and states, principal cities | 2023-08-04 | list1_2023.xlsx, list2_2023.xlsx |

**The ACS files.** The full ACS summary files are 38 MB and 17 MB, so they are not committed. `scripts/life-data/extract_acs.py` checks the full file against its hash in the manifest, then keeps the header and the 935 lines whose GEO_ID starts with `310M` (CBSA summary level), byte for byte. `data/life/extracts/EXTRACTS.json` records both hashes. Anyone can repeat this from the public URLs.

**Why not the Census API.** It now redirects keyless requests to `missing_key.html`. We use the published summary files instead, so no key is needed or stored.

**Geography.** BEA (bulletin 23-01), the ACS 2024 tables and the OMB lists all use the July 2023 delineations, so the CBSA codes line up directly. All 387 BEA metros are found in the OMB list; the build stops if one is not.

## Method

**Price level for the engine: non-housing composite (proposed, needs your approval).**
- The L1 engine subtracts the user's own housing cost (rent includes utilities), then divides what is left by a price level. If the price level is BEA "all items", rent is counted twice.
- BEA publishes no non-housing index and no area expenditure weights. We therefore derive one from the published components:

  `nonHousing = exp(0.38 × ln(goods) + 0.62 × ln(other services))`

- **Where the weights come from.** A least-squares fit of ln(all items) on the four components across the 387 metros gives:

  | Component | Weight |
  |---|---|
  | Goods | 0.313 |
  | Housing | 0.169 |
  | Utilities | 0.017 |
  | Other services | 0.510 |

  This fit reproduces all items with an RMSE of 0.72 index points (worst case 5.95). Goods and other services, rescaled to sum to 1, give 0.38 and 0.62.
- **Why utilities are left out.** ACS gross rent already includes renter-paid utilities, so including them would count them twice.

**How defensible it is:**
- Only published BEA values go in.
- The composite always lies between the goods and other-services values (the tests check this). Those two values are close: their gap has a median of 2.6, a 95th percentile of 5.9 and a maximum of 9.0 index points.
- The exact weights hardly matter. With equal weights, the composite moves by a median of 0.3 (max 1.1). Adding utilities at their fitted weight moves it by a median of 0.2 (max 1.2).
- Across metros the composite ranges from 92.9 to 107.9, against 81.7 to 115.6 for all items.
- Effect on the same $3,000 a month left after housing:

  | Metro | All items | Non-housing composite |
  |---|---|---|
  | San Francisco | $2,595 | $2,802 |
  | Shreveport | $3,539 | $3,160 |
  | Austin | $3,059 | $3,148 |
  | Denver | $2,836 | $2,999 |

  All items would penalise expensive-rent cities a second time.

**How to label it.** It is a derived measure, not a BEA statistic. The UI should call it "prices other than housing (derived from BEA Regional Price Parities)" and link this method.

**Alternatives, if you prefer not to use a derived measure:**

| Option | Pros | Cons |
|---|---|---|
| **A. Composite (built, recommended)** | Removes the double count. Small, stable and disclosed. | Derived. Weights estimated, not published. |
| B. BEA all items + the engine's existing `price_level_includes_rent` warning | Official figure, no derivation. | Counts rent twice. The gap reaches ±13 index points vs the composite in some metros, enough to change some verdicts. |
| C. Show goods and other services separately and use one of them (e.g. other services) | Each is an official BEA figure. | Either one alone leaves out part of spending. Harder to explain. |
| D. Composite with national PCE weights (BEA NIPA table 2.4.5) | Weights from a published source. | Needs another dataset and adds a national-to-local mismatch. Not computed yet. |

Switching between A, B and C needs no rebuild, because every component is in the output.

**Fallbacks (no invented values).** The order is metro, then state nonmetro, then none.
- **Micropolitan areas** (537 of them) use their state's nonmetropolitan portion, which by BEA's definition includes micropolitan counties. The engine then shows its `price_level_fallback` warning.
- **No price level at all** (11 areas: 10 in Puerto Rico, which BEA does not cover, and Seaford, DE, because BEA prints 0.000 for Delaware's nonmetro portion). `priceInput` returns NaN with source `national_default`, and the engine warns that it assumed the U.S. average.
- **Multi-state areas** use the state of their first principal city.

**Rents.**
- These are ACS medians with their 90% margins of error, in 2024 dollars, pooled over 2020–2024.
- Values published only as a bound are left out (null): the ACS code −333333333 marks an open-ended interval, such as "3,500+" or "<100". Values with no estimate (−666666666) are also left out. `excluded` in the output lists each one: only two 1-bedroom values, Huron, SD and Murrells Inlet, SC.
- `rentEstimate` then falls back to the all-units median and says so (`basis: 'all'`).
- The rent is a starting estimate that the user can replace; the engine marks it as an estimate.

## Known limitations (to show users)
- **The rents are not current asking rents.** They are 5-year pooled medians (2020–2024) of what sitting tenants pay.
- **The price levels are a year old.** They are for 2024 (published February 2026), and prices may have moved since. The engine's `price_level_outdated` warning starts after 2 years.
- **A micropolitan area gets its whole state's nonmetro average,** not a local value.
- **The place list is limited.** It covers principal cities only (1,294). Smaller towns need a county or place lookup, which is not built.
- **Puerto Rico has no price level.**

## Licence
BEA, Census and OMB data are U.S. government works in the public domain. We cite the sources as above.
