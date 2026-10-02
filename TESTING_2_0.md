# ifYouMind 2.0 — Test Drive

This branch is intentionally testable without Google Analytics, Stripe, or an OpenAI API key.

## Branch

```bash
git fetch origin
git checkout codex/ifyoumind-2-universal-data
git pull
npm install
npm --prefix functions install
```

## Fastest local test

Terminal 1:

```bash
npm run emulators
```

Terminal 2:

```bash
npm run start:local
```

Open the local Angular URL printed by the CLI (normally `http://localhost:4200`).

## Test path

1. Sign in or create a local emulator account.
2. Open `/app`.
3. Create an intelligence workspace if prompted.
4. Open **Canvas**.
5. Click **Load demo data**.
6. Four clearly synthetic datasets are created:
   - Median Home Price
   - Median Household Income
   - Population Growth Index
   - Crime Rate
7. The demo datasets are automatically selected and **Median Home Price** is selected as the target.
8. Click **Analyze together**.
9. Verify that you see:
   - an ifYouMind conclusion;
   - supporting signals;
   - counter-signals when present;
   - correlation values;
   - compatible observation counts;
   - confidence;
   - reasoning limitations;
   - a saved entry under Recent analyses.

The demo observations all use the same synthetic context:

- Geography: `Demo ZIP 35000`
- Entity: `Demo City`
- Periods: January 2025 through June 2026

They are not real-world facts.

## CSV test

1. Create a dataset in Canvas.
2. Open **Import**.
3. Choose the destination dataset.
4. Upload a CSV.
5. Map at least:
   - Value
   - Period
6. Optionally map:
   - Geography
   - Entity
   - Note
7. Remaining columns are preserved as dimensions.
8. Review the five-row preview.
9. Import.
10. Return to Canvas and analyze it with another dataset.

Current CSV limits are 2 MB and 400 rows per import.

## AI synthesis

AI synthesis is a separate optional step. The deterministic universal-data flow above does not require an OpenAI key.

To exercise **Explain with AI**, configure the Firebase secret:

```bash
firebase functions:secrets:set OPENAI_API_KEY
```

The default synthesis model is `gpt-6-luna`.

The AI receives only the saved evidence packet. It does not calculate the correlations. Server validation rejects unknown evidence IDs and unsupported numeric claims.

## Automated checks

```bash
npm run test:foundation
npm --prefix functions test
npm run build:local
```

The universal reasoning tests include contextual alignment and correlation primitives.

## What is intentionally deferred

The following are not required for this test drive:

- Google Analytics OAuth
- Google Analytics sync
- Search Console
- Google Ads
- Stripe
- production OpenAI secret

The goal of this test is to validate the core product loop:

```
arbitrary data
→ universal observations
→ contextual alignment
→ relationship analysis
→ target-based reasoning
→ evidence-backed conclusion
→ saved analysis history
```


## Universal Ask test

After loading the synthetic demo pack in Canvas:

1. Open **Ask** or navigate to `/app/ask`.
2. Try:
   - `What seems to be driving Median Home Price?`
   - `What is most strongly related to Crime Rate?`
   - `What else is related to Population Growth Index?`
3. Verify that ifYouMind:
   - identifies the intended target dataset;
   - evaluates the available compatible datasets;
   - shows the strongest observed signal;
   - shows supporting and counter-signals;
   - reports correlation, observation count, source, and confidence;
   - explicitly says that association is not proof of cause;
   - stores the question in recent history.

If the question does not clearly name or match a dataset, ifYouMind should **not guess**. It should present likely target datasets so the user can refine the question.

Universal Ask does not require an OpenAI key. It uses the deterministic evidence-first reasoning pipeline.
