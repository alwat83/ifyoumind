# Geography resolver (Phase 2, step R4.1)

`functions/src/intelligence/geography/` maps a Census place (city) to the counties it lies in and to its metro or micro area. Nothing uses it yet. It's the first dependency for R4 (competition by county) and R5 (economic trends by county or metro).

## Sources

| Mapping | Source | How it's used |
| --- | --- | --- |
| City → counties | ACS 5-year API, geography `county (or part)` within `state` and `place` (summary level 155). It's listed in `api.census.gov/data/2024/acs/acs5/geography.json` | One request per city. It returns each county part and its population, which is a survey estimate |
| County → metro or micro area | OMB / Census CBSA delineation, List 1, July 2023: 935 CBSAs and 1,915 counties. Public domain | Bundled in `cbsa-2023.ts`, built by `scripts/build-cbsa-2023.py`. The raw extract's SHA-256 is `0d570d2f…f99430`, and the test checks a canonical checksum |

Verified against the source file:
- Travis, Williamson, Hays and Bastrop counties map to **12420 Austin-Round Rock-San Marcos, TX**.
- Davidson maps to **34980 Nashville-Davidson--Murfreesboro--Franklin, TN**.
- Mecklenburg maps to **16740 Charlotte-Concord-Gastonia, NC-SC**.

## Rules

- **County figures are never apportioned to a city.** The resolver returns each county part's share of the city's residents, but only for display (for example, "most of Austin is in Travis County"). Shares are null when any part is unpublished.
- **One metro, or none.** A city gets a single metro only when every one of its counties belongs to the same CBSA. Otherwise the notes say which counties are outside any metro, or that several metros are involved.
- **Vintage:** the bundled delineation is July 2023. Regenerate it when OMB publishes a new one.

## Not done yet (needs approval to wire in)

- Calling the Census request through the existing server-side fetch and key, and caching the result per place.
- Showing the counties and metro on the report.
