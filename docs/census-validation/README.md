# Real Census data validation for the paid-report evidence (PR #29)

This plan has to be completed before #29 is released. The harness checks what the report shows against the live Census Data API, and runs entirely on the local Firestore emulator, so nothing is written to production.

## 1. Key setup (founder action)

- **Use a separate development key**, not the production one. Census keys are free from https://api.census.gov/data/key_signup.html; registering creates an account, so it's yours to approve. The production key stays where it is: in the `CENSUS_API_KEY` Cloud Functions secret, readable only by the server.
- **Running in a Claude cloud session:** add the key in the environment settings (the cloud environment menu in the session's title bar, then **Edit**). Put it under **Network secrets** (called *API credentials* in older app versions), or as an environment variable named **`CENSUS_API_KEY`**. A new session picks it up. Never paste the key into chat, a file, a commit or a PR.
- **Running on your own machine:** `export CENSUS_API_KEY=…` in the shell, or put it in `functions/.secret.local`, which is now git-ignored along with `.env` and `.env.*`.
- **Network:** the environment must allow `api.census.gov` over HTTPS.

## 2. Run

```
npm run validate:census
```

This builds the functions and starts the Firestore emulator (project `demo-ifyoumind`). It then runs `scripts/validate-census-evidence.mjs`, which reads the key from the environment only, and writes `docs/census-validation/REPORT.md`. The script exits non-zero if any check fails.

## 3. What it checks

| Area | Check |
| --- | --- |
| Published values | Austin, TX: population 979,539, median household income $93,658 ± $1,670, and median home value $555,300. It checks the same three figures for Nashville and Charlotte. These are the values in the ifYouMind guide, cross-checked with data.census.gov and Census Reporter. |
| Estimates and margins | Every estimate and margin of error the report shows equals the value the API publishes for that place: population, income, home value and households. |
| Calculations | Households earning $75k or more, and its margin, are recomputed independently from B19001_013 to _017 using the Census sum rule. Every comparison verdict is re-derived from the published estimates and margins. |
| Missing values | Annotation codes become "unavailable". An unpublished bracket makes the total unavailable rather than zero. A missing 2015–2019 period is handled. |
| Open-ended medians | Atherton, CA (income $250,000+, home value $2,000,000+): open-ended medians are never tested or ranked. |
| Low reliability | Marfa, TX and Alpine, TX: small places with wide margins. |
| Geography | The NAME and FIPS shown are the Census place the city resolves to, including consolidated governments (Nashville-Davidson, Louisville/Jefferson County, Indianapolis "balance"). |
| Secrets | The key never appears in the evidence payload or the cached Census documents. A separate commerce test proves the same for the API response and the stored decision, and `test/no-secrets-in-frontend.test.mjs` scans `src/` and `dist/`. |

## 4. Pass criteria for release

- Every check in `REPORT.md` passes.
- Someone has looked at the sample cities' margins and verdicts by hand, to confirm they read sensibly.
- Commit `REPORT.md` to #29 as release evidence. It contains no key.

The harness was dry-run against a stubbed API, and all 157 checks passed. That proves the harness logic only, not the data.
