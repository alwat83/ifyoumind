# City Decision Brief evidence

November 16, 2026 Pacific · OpenAI / Codex · [Issue #108](https://github.com/alwat83/ifyoumind/issues/108)

Ask “What is the difference in cost of living between Los Angeles and Birmingham, Alabama, if someone makes $90,000?” from the signed-in decision entry. The existing free brief opens after one submit. Expand **Show the evidence** to see the 2020–2024 ACS estimates, the place and state FIPS codes, table variables, and the exact operands for the differences. The answer labels the salary as user input and the answer as partial. These city-level estimates cannot establish personal expenses, savings, or a salary equivalent.

| View | Desktop | Mobile |
| --- | --- | --- |
| Before, merged Phase 1 comparison | [Answer](question-to-answer-phase-1/after-desktop.jpg) | [Answer](question-to-answer-phase-1/after-mobile.jpg) |
| After, disclosure closed | [Answer](city-decision-evidence/desktop-answer.jpg) | [Answer](city-decision-evidence/mobile-answer.jpg) |
| After, disclosure open | [Evidence](city-decision-evidence/desktop-expanded.jpg) | [Evidence](city-decision-evidence/mobile-expanded.jpg) |

The images show emulator fixtures. The example's $665,000 difference is $810,000 − $145,000 using those fixtures, not a current estimate for either city.

The read-only browser projection validates the existing authorized free comparison payload. Each supported observation must match the 2024 ACS dataset, allowed variable, units, state and place references. Each calculated difference references both observed inputs. Missing or malformed receipts remove the claim from the comparison; valid estimates remain visible. The first release covers population, household income and median home value. It omits growth from this view because old payloads carry only one of the two required vintages. Sources link to public Census tables scoped to the same geography. [Census API access guidance](https://www.census.gov/library/video/2026/adrm/requesting-a-census-data-api-key.html)

The city writer, quota policy, existing saved schema, private bill paths, paid views, pricing and checkout are shared with the current product and untouched by this change. Opening or reopening evidence uses the same authorized project data and no source request or paid action. Back and repeat on the known result reopen the same project. A save whose response was lost before the browser received a project ID remains the separate retry reliability workstream.

For a local demo, install the locked app and Functions dependencies, run `npm run build:local` and `npm --prefix functions run build`, then run:

```sh
npx firebase emulators:exec --project demo-ifyoumind --only auth,firestore,functions \
  'npx playwright test --config e2e/playwright.config.mjs decisions.spec.mjs --headed -g "goes straight to a sourced answer"'
```

The browser suite provides demo-only accounts and Census fixtures. The existing result and purchase routes remain under Firebase emulator auth; no provider account is needed.

For any separately authorized rollout, the change is confined to the frontend. Restoring the preceding Hosting version or reverting the scoped change restores the earlier rendering without rewriting stored reports.
