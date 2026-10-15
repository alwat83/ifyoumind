# Appendix A: official data sources for the job-offer comparison (verified 2026-10-14)

**How this was checked:**
- Direct downloads from .gov hosts were blocked in the research environment. Facts come from web-search extracts of the publisher's own pages, at the URLs cited.
- **Verified** means a publisher-page extract confirmed it. **To confirm** means a secondary source only, or prior knowledge.
- Open every URL in a normal browser once before the data pipeline is built.

| Source | What we'd use | Geography | Latest period | Licence / notice | Access | Status |
|---|---|---|---|---|---|---|
| BEA Regional Price Parities ([release](https://bea.gov/news/2026/real-personal-consumption-expenditures-state-and-real-personal-income-state-2024)) | All-items, goods and services price levels; housing, utilities and other services split | 387 metros (2024; [BEA infographic](https://apps.bea.gov/scb/infographics/2026/0526-rpp.pdf)), states, state nonmetro portions | 2024 data, released Feb 19, 2026. The next state release is Dec 10, 2026 (whether it includes metros is to confirm) | Public domain; credit "Source: U.S. Bureau of Economic Analysis" ([FAQ](https://www.bea.gov/help/faq/147)) | Bulk CSV zip ([download](https://apps.bea.gov/regional/downloadzip.cfm)); Regional API with a free key | Verified. Table names (MARPP) to confirm |
| BEA metro real personal income | **Not usable: discontinued for metros** (Feb 2026 release) | — | — | — | — | Verified |
| Census ACS 5-year B25064 / B25031 ([release](https://www.census.gov/programs-surveys/acs/news/data-releases/2024/release.html)) | Median gross rent, overall and by bedrooms, with margins of error | CBSA, place, county | 2020–2024, released Jan 29, 2026 | [Census API terms](https://census.gov/data/developers/terms-of-service.html); non-endorsement notice | API or bulk summary file | Verified. Exact notice wording to confirm |
| ACS B08303 / B08013 / B08301 (S0801) | Commute time and mode (default commute only) | CBSA, place | 2020–2024 | As above | API or bulk | Variable IDs to confirm |
| HUD Fair Market Rents ([FMR](https://www.huduser.gov/portal/datasets/fmr.html)) | Secondary rent benchmark (40th percentile, not median) | HUD FMR areas, nonmetro counties, ZIP (Small Area FMRs) | FY2027, effective Oct 1, 2026 | HUD User terms; non-endorsement notice | XLSX bulk (no token at runtime) | Verified. Rate limit and notice to confirm |
| BLS OEWS ([release](https://www.bls.gov/news.release/ocwage.htm)) | Typical pay by occupation (a later "is this offer fair?" check) | About 530 metro and nonmetro areas | May 2025, released May 2026 | Public domain; cite BLS ([terms](https://www.bls.gov/opub/copyright-information.htm)) | XLSX zips; flat files | Verified |
| IRS / SSA constants | Rough federal plus FICA estimate (single filer, standard deduction) | Federal | Tax year 2026: [Rev. Proc. 2025-32](https://www.irs.gov/pub/irs-drop/rp-25-32.pdf); SS wage base $184,500 ([SSA](https://www.ssa.gov/oact/cola/cbb.html)) | Public domain | Static constants | Verified. The 0.9% Additional Medicare rate to confirm |
| State income tax | **Not in the MVP.** The user enters it, or the page shows "not included" | State and local | — | Tax Foundation tables: don't reuse without permission | — | To confirm |
| IRS mileage rate ([IRS](https://www.irs.gov/tax-professionals/standard-mileage-rates)) | Optional "full cost of driving" upper bound | National | 2026: 72.5¢ (Jan–Jun), 76¢ from Jul 1 | Public domain | Constant | Verified |
| AAA Your Driving Costs | Cite only | National | 2025 | Copyrighted | — | To confirm |
| OMB Bulletin 23-01 and Census delineation files ([files](https://www.census.gov/geographies/reference-files/time-series/demo/metro-micro/delineation-files.html)) | Place → county → CBSA lookup | National | July 2023 (no newer bulletin found) | Public domain | XLSX | Verified |

## BEA's caveats, to show to users
- RPPs measure **price levels, not a cost-of-living or quality-of-life index**, and they leave out taxes.
- Each year is estimated independently, so years **can't be compared** with each other.
- A metro is one number, so it hides differences within the metro.
- Data lags by about 14 months or more.

## Tax recommendation for the MVP
The user enters take-home pay or a tax share. We prefill a clearly labelled **rough** federal plus FICA estimate for a single filer on the standard deduction.

State and local tax is entered by the user or shown as "not included". Reasons:
- a confidently wrong net-pay figure could steer a job decision;
- 50+ rule sets would need maintaining every year.

A full calculator waits until there is a test suite against the official withholding tables (Pub 15-T).

## Geography
- **Lookup:** ship a static place list (principal cities plus state), then map place → county → CBSA. Ask the user to choose when a name is ambiguous ("Springfield").
- **Places outside metros:** fall back to the state nonmetro RPP. Micropolitan areas have no RPP.
- **HUD FMR and OEWS areas** don't match CBSAs exactly, so each needs its own crosswalk.

## Open items to confirm before building
- The BEA metro RPP table names, and whether a non-housing composite can be derived from the published components without unpublished weights.
- The HUD rate limit and notice wording.
- The Census notice wording.
- The 387-metro count.
- The ACS commute variable IDs.
