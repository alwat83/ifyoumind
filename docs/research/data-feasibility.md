# API and data-ingestion feasibility (Work Package 5)

**Status:**
- Research and technical design only.
- No paid API activated, no key created, no customer file collected, nothing built.
- Checked against production `92b3196` on 2026-10-14.

**Evidence labels used below:**
- **Verified (code):** read in the repository.
- **Verified (official source):** confirmed on the publisher's page, either in the 2026-10-11 research recorded in `IFYOUMIND_MASTER_PROJECT.md` or in today's search of the publisher's pages.
- **To confirm:** seen only in secondary sources, or not yet read on the publisher's own page. Read the terms page in a browser before any build. This session's network could not open .gov pages directly.

## 1. The 10 deployed "universal" data functions: review (verified, code)
| Function | What it does | Limits today | Risk found |
| --- | --- | --- | --- |
| `createUniversalDataset` | Creates a dataset (name, metric, unit, source label) in the caller's workspace | Text lengths only; owner/admin role | **No cap on datasets per workspace** |
| `addUniversalObservation` | Adds one value | Owner/admin | **No cap on observations per dataset** |
| `importUniversalObservations` | Adds up to 400 typed observations (parsed in the browser) | 400 per call; the browser limits files to 2 MB | Unlimited calls; no daily quota |
| `listUniversalDatasets` / `getUniversalDataset` | Reads datasets (100) and observations (500) | Member role | — |
| `analyzeUniversalDatasets` | Aligns two datasets; Pearson correlation | 500 observations each | Correlation wording must never imply cause (section 5) |
| `reasonAcrossUniversalDatasets` | Correlates 2–8 datasets with a target | 500 observations each | Labels "high confidence" at r ≥ 0.7 and n ≥ 24; still correlation only |
| `askUniversalIntelligence` | Matches a question to datasets by keywords, then correlates | Reads up to **100 datasets × 500 observations** | **Up to about 50,000 document reads per call**, with no rate limit: a cost-abuse path |
| `getRecentUniversalAnalysisRuns` | Lists 12 recent runs | Member | — |
| `seedUniversalDemoData` | Writes 4 synthetic datasets to the caller's workspace | Owner/admin | Synthetic data can sit beside real data in the same workspace |

Common to all of them:
- Tenancy checks (`authorizeOrganization`) are in place, and the Firestore rules don't expose `datasets` to clients. **Good.**
- No verified-email requirement on the server (#26 is held).
- No App Check.
- No per-user or per-workspace quotas.
- No customer journey uses them except `/app/data` and the canvas.

**Recommendations before any reuse is exposed more widely:**
1. Add per-workspace caps: datasets (e.g. 50), observations (e.g. 50,000) and calls per day.
2. Make `askUniversalIntelligence` read only the top-ranked datasets, not all 100.
3. Retire or admin-gate `seedUniversalDemoData`.
4. Require a verified email via #26.
5. Grade correlation wording with the WP2 checker (#46).

These are small, separate PRs. None is started.

## 2. Ingestion pipeline design (proposal)
```
upload (authenticated, verified email, quota)
  → private bucket path  workspaces/{orgId}/uploads/{uploadId}   (no client list/read)
  → parse in an isolated function (memory and time caps)
  → schema proposal  → the customer confirms columns, types, date format and units
  → normalise into observations (with provenance and a quality report)
  → delete the raw file (section 4)
  → evidence store (WP2 model) → analysis
```

| Format | Phase | Validation | Size limit (proposal) | Schema inference | Main risks |
| --- | --- | --- | --- | --- | --- |
| Manual entry | Now (exists) | Per-field type and range | Small | n/a | Typos; mitigated by showing the value back |
| CSV | Phase C | Extension, MIME type, UTF-8/BOM; delimiter detection; header row required | 10 MB / 50,000 rows / 50 columns | Type per column from a sample (date, currency, number, %, category, text); the customer confirms | Formula injection (cells starting `= + - @` stay text and are escaped on export); mixed date formats; duplicates |
| Excel (.xlsx) | Phase C+ | Zip and XML structure checked; macros (.xlsm) refused; no formula evaluation (cached values only) | 10 MB; one sheet chosen by the customer | As CSV | Zip bombs (cap the uncompressed size); hidden sheets ignored |
| JSON | Phase F | JSON Schema per source | 10 MB | From the schema | Deep nesting (cap the depth) |
| PDF (bills, statements) | Deferred | — | — | — | Varies by issuer, error-prone, heavy personal data. Justify only with demand evidence and a parser evaluation (WP2 suite) |
| Authorized connectors (Square, Shopify, QuickBooks) | Phase F | OAuth scopes kept minimal; read-only | Paginated pulls with quotas | From the API schema | Partner terms and app review; token storage (Secret Manager, encrypted per workspace); duty to delete on disconnect |

**Handling rules in every format:**
- **Missing values:** kept as null and counted; never filled with zero.
- **Dates and time zones:** normalised to ISO in the customer's time zone; an ambiguous format means asking the customer.
- **Currency and units:** stored as numbers plus a unit or currency code.
- **Duplicates:** exact rows removed and counted; duplicate keys flagged.
- **Parse errors and unsupported content:** reported row by row, never silently dropped.
- **Provenance:** file name, hash, upload time, parser version, and every transformation.
- **File content is data, never instructions.** Text cells are excluded from any AI input by default.

The Sales Health Check example (`docs/research/sales-health-check/`) exercises duplicates, mixed date formats, refunds and gaps.

## 3. External data sources (official publishers first)
| Source | Use | Geography | Key / quota | Licence and terms | Commercial use | Caching | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Census ACS 5-year (API) | Demographics, income, rent, age | Place, county, metro | Key required for all requests (verified 2026-10-11) | No US copyright; required notice: "This product uses the Census Bureau Data API but is not endorsed or certified by the Census Bureau." (verified 2026-10-11) | Allowed | Allowed | **Live** (4 measures); #29 adds more (draft) |
| BLS Public Data API v2 (LAUS, QCEW, OEWS) | Unemployment, employment and wages | County, metro, state (OEWS: about 530 metro and non-metro areas) | Registration key; **500 queries/day, 50 series and 20 years per query, 50 requests per 10 seconds** ([BLS FAQ](https://www.bls.gov/developers/api_faqs.htm)) | Public domain; cite BLS and the retrieval date (verified 2026-10-11) | Allowed | Allowed | Proposal. OEWS is also published as flat files ([OE database](https://download.bls.gov/pub/time.series/oe/oe.txt)); flat files avoid the query quota |
| BEA Regional (income, GDP, Regional Price Parities) | Income trends; price-level index for the Life comparison | State, metro | Free 36-character UserID; 100 requests/min and a required non-endorsement notice (verified 2026-10-11 in BEA's user guide). RPP: current release Feb 19, 2026, next Dec 10, 2026 ([BEA RPP](https://bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area)) | Public domain | Allowed | Allowed | Proposal. **To confirm:** the exact API table names for metro RPP ("MARPP" is seen only in secondary sources) |
| FHFA HPI | House-price trend | County, metro | Download only | Cite as "Source: FHFA HPI®" (trademark) | Allowed with citation | Allowed | Proposal (R5) |
| Census building permits | Construction pipeline | County, monthly | As Census | As Census | Allowed | Allowed | Proposal (R5) |
| HUD User Fair Market Rents API | Rent benchmark for Life | County, metro | Free bearer token. **To confirm:** rate limit (60/min in a secondary source only) | **To confirm** on [HUD's API terms page](https://www.huduser.gov/portal/dataset/api-terms-of-service.html). Secondary sources say a "not endorsed or certified by HUD User" notice is required | To confirm | To confirm | Proposal |
| EIA Open Data API v2 | Average retail electricity price (utility scenario) | State | Free key with email; per-key limits not published; access can be blocked for circumvention ([EIA terms](https://www.eia.gov/opendata/terms-of-service.php)) | Must name EIA as the source; no implied endorsement; no altering content while naming EIA; the logo needs permission | Allowed with attribution | Allowed | Deferred with the utility scenario |
| NOAA NCEI Climate Data Online v2 | Weather context for sales | Station | Token; **5 requests/second, 10,000/day** ([NCEI access](https://ncei.noaa.gov/access)) | Public domain (to confirm on the NCEI page) | Expected allowed | Expected allowed | Proposal (Phase C, optional) |
| FRED | — | — | — | Terms forbid caching or storing FRED content and commercial use without written consent (verified 2026-10-11) | **No** | **No** | **Excluded**. Use the original agencies instead |
| Commercial rent, foot traffic, reviews, business listings | Competition and cost | Site | Paid | Licences often ban caching or resale | Varies | Often no | Not proposed (approval and budget needed) |

**Connector interface:** see blueprint section 8. Each connector declares its coverage, licence text, notice, quota and cache policy, and returns WP2 `fact` objects with the source, period, geography and margin of error. When a source fails, the result says what is missing and lowers its confidence; it never estimates the gap.

**Cost:** every source above except the commercial ones is free. The binding constraints are quotas, not money. BLS's 500 queries a day is the tightest, so cache by series and period (permitted).

## 4. Raw-file retention (the blueprint proposed 30 days; not approved)
- **What the raw file is for:**
    - re-parsing if the customer corrects a column mapping;
    - answering "where did this number come from?";
    - support.
- **Why it can go soon:** once the customer confirms the schema and the observations are written with provenance (file hash, row numbers), the raw file is no longer needed for analysis.
- **Legal obligations:** none identified that require ifYouMind to keep a customer's sales file. Tax and billing records concern ifYouMind's own transactions, not uploads. **Counsel should confirm**, together with the privacy-policy wording (#12) and deletion design (#41).
- **Customer expectation:** the interview guide asks about this directly (Sales Health Check guide, Q6).
- **Recommendation:**
    - Delete the raw file as soon as the customer confirms the import, and in any case within **7 days** of upload.
    - Keep normalised observations until the customer deletes the analysis or the account.
    - For the concierge research, keep the file only until notes are final, at most **45 days** (covering the follow-up).

    Both periods are founder decisions.

## 5. AI integration (design requirements; no provider activated)
**Production has no AI** (verified: the OpenAI modules `market-ai.ts` and `ai-synthesis.ts` are not exported or deployed).

**Allowed jobs for a future model:**
1. Turn a question into a decision spec: options, criteria, the data needed, and clarifying questions.
2. Phrase findings from claims that already pass the WP2 checker.
3. Summarise trade-offs that already exist in the evidence.

**Never:** numbers, sources, causes, or anything not backed by evidence ids. Every model sentence is parsed back into a claim and checked. A failure falls back to the template.

**What comes to the founder before approval:**

| Item | Content |
| --- | --- |
| Provider comparison | At least 2 providers: a DPA with no training on customer data, retention, region, price per 1M tokens, latency |
| Privacy review | Disclosure text, opt-out, and what is sent (structured facts only; no raw files, no free-text cells) |
| Evaluation | The WP2 suite plus an AI-specific set (consistency at 95% or more across 5 runs, 0 ungrounded claims), run on a sandbox key |
| Cost and latency | Measured per analysis on the evaluation set; a daily spend cap with alerts |
| Failure and fallback | Timeout, refusal or a failed check means the template sentence. No outage blocks a result |
| Prompt injection | Inputs limited to typed facts; adversarial fixtures in the suite (as A6 in #46) |
