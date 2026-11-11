# Appendix B: demand signals, alternatives and discovery (researched 2026-10-14)

**How this was researched:** web search only; page fetches were blocked. Figures come from search-result text pointing to the URLs shown. **Unverified** marks anything not confirmed on the original page. Check the primary page before quoting any figure publicly. **No search-volume figures were found, and none are given.**

## Demand signals for the decision
**People who move for work:**
- **Census CPS ASEC 2022:** 16.1% of moves were for employment reasons; 9.2% were for a new job or transfer. Via [PA Realtors](https://www.parealtors.org/blog/why-people-moved-in-2022/); Census story [here](https://census.gov/library/stories/2023/09/why-people-move.html). **Unverified at source.**
- **Overall moving is near record lows.** The CPS mover rate was 8.4% in 2021, the lowest since 1948, and 8.7% in 2022 (same Census story).
- **United Van Lines 2025:** 26% of its customers moved mainly for a job or transfer. [Source](https://www.unitedvanlines.com/newsroom/2025-national-movers-study). This counts that company's customers only.
- **Atlas Van Lines 2025:** affordability was the top factor influencing moves. [Source](https://www.atlasvanlines.com/company-news/atlas-van-lines-annual-migration-patterns-study-shows-affordability-as-the-top-factor-influencing-moves-in-2025)

**People who consider moving for cost of living:**
- **Redfin/Ipsos, Sept 2024:** 21.6% of 1,802 US adults gave a lower cost of living as a reason for moving. [Source](https://www.businesswire.com/news/home/20241120867826/en/Redfin-Survey-18-of-Home-Hunters-Say-SafetyCrime-is-a-Reason-Theyre-Moving-14-Cite-Climate-Risks)

**People who receive and compare job offers:**
- **Gartner, Q1 2025:** 44% of about 3,000 candidates received multiple offers (51% in Q1 2024, 72% in Q1 2023). [Source](https://www.gartner.com/en/newsroom/press-releases/2025-06-16-gartner-hr-research-finds-44-percent-of-prospective-candidates-received-multiple-job-offers-in-1q250)

**What this means:** the opportunity is not mass migration. It is a smaller group facing a high-stakes choice: job movers, people weighing more than one offer, and people tempted to move by affordability.

## Partners and family
- **Atlas Corporate Relocation Survey 2024:** 64% of companies had an employee decline a relocation. 34% cited family ties and 30% a lack of spouse/partner assistance. [Source](https://www.atlasvanlines.com/resources/corporate-relocation-survey/2024/employees-declining-relocation)
- **Couples research** (Coulter, van Ham and Feijten, IZA DP 5612): couples who both want to move go on to move more often. [Source](https://www.iza.org/publications/dp/5612)
- **No published study was found** measuring how often people share comparisons with a partner. The sharing hypothesis is an inference, to be tested.

## Alternatives people use today
| Tool | Data | Two real offers with your own rent? | Commute or priorities? | Sources or uncertainty shown? |
|---|---|---|---|---|
| [NerdWallet](https://www.nerdwallet.com/cost-of-living-calculator) | C2ER Cost of Living Index; C2ER [covers top-quintile households and excludes taxes](https://business.pacific.edu/business/centers-and-institutes/center-for-business-and-policy-research/economic-development/cost-of-living-index) | No (one salary, two cities) | No | Names C2ER; no ranges |
| [SmartAsset](https://smartasset.com/mortgage/cost-of-living-calculator) | Not disclosed | No | No | Not found |
| Payscale, Salary.com, BestPlaces, Bankrate | Not disclosed (unverified) | No | No | Not found |
| [Numbeo](https://en.wikipedia.org/wiki/Numbeo) | Crowdsourced, perception-based | No | No | Shows contributor counts; samples can be tiny |
| MIT Living Wage | BLS, Census, HUD (unverified) | No (a minimum-wage estimate) | No | Methodology published |
| Chat assistants | Varies | Possible | Possible | Rarely dated or checkable |

## Gaps ifYouMind can fill
1. **Two actual offers side by side, not one salary in two cities.** Fits Gartner's 44% of candidates with multiple offers.
2. **Your own rent.** Housing varies much more than other prices. BEA's 2024 housing-rent parity ranged from 154.3 in California to 54.2 in West Virginia.
3. **Commute as time and money.**
4. **Weighted personal priorities, with a sensitivity check and an honest "no clear winner".** No free competitor offering this was found; that check was not exhaustive.
5. **Official, dated sources**, with the facts, estimates and the user's own numbers labelled separately.
6. **No lead generation and no affiliate steering.** Several alternatives are finance publishers. Their models are unverified, but plausibly affiliate or lead-based.

## Privacy-safe sharing (references)
- **Don't put personal inputs in query strings.** They leak through referrers, logs, history and caches ([OWASP](https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url), [CWE-598](https://cwe.mitre.org/data/definitions/598.html)).
- **URL fragments are not sent to the server** ([RFC 3986 §3.5](https://www.rfc-editor.org/rfc/rfc3986#section-3.5)), but they stay in browser history.
- **Options:** copied summaries, rounded or ranges-only sharing, or revocable, expiring random IDs.

## Free ways to measure search demand
- **[Google Trends](https://trends.google.com):** relative interest only, 0–100 ([FAQ](https://support.google.com/trends/answer/4365533)).
- **Google Ads Keyword Planner:** needs an Ads account; usually shows ranges without spend.
- **Google Search Console** (after launch): real impressions and queries. The most reliable evidence.
- **Autocomplete and "People also ask":** phrasing only.

## Candidate pages (validate with Trends and Search Console; no volumes claimed)
1. **Two-offer comparison tool:** "Is the $X offer in City B worth it?" (BEA RPP, ACS rent).
2. **"Salary needed in [City] to match [City]"**, with official, dated sources.
3. **"How much more is housing in [Metro]?"** (BEA housing-rent parity, ACS median gross rent).
4. **"Remote vs in-office: what is the commute worth?"** (ACS travel time).
5. **"Typical pay for [occupation] in [Metro]"** (BLS OEWS). A later phase.
6. **Annual "most and least expensive metros"**, tied to BEA's release calendar.
7. **"Relocating with a partner: compare two offers together"**
8. **"Moving for a job: what the data says"** (Census CPS reasons for moving).
