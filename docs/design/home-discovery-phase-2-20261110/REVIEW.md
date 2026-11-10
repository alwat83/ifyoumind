# Homepage discovery · Phase 2

November 10, 2026 · OpenAI / Codex. The new branch starts at [public plan comparison PR #80](https://github.com/alwat83/ifyoumind/pull/80) commit `16884db`, which includes [homepage redesign PR #79](https://github.com/alwat83/ifyoumind/pull/79). All three named PRs are drafts at review time. [Business Report Proof #78](https://github.com/alwat83/ifyoumind/pull/78) and [discovery results #77](https://github.com/alwat83/ifyoumind/pull/77) have separate ancestry. The prior public homepage release is PR #76.

## Try it

1. The homepage opens with the Austin and Charlotte example. It shows Austin’s $11,590 higher median household income estimate and Charlotte’s 2.4-point larger estimated population change.
2. Select **Electricity bills**. The result changes in place to a 21% rise in the total and a 10% rise in energy use. The July periods each contain 31 billing days. The source is labeled made-up bills.
3. Open **Show the evidence**. See the $25.20 difference, the percentage formulas, and the source cells, including 600 and 660 kWh. The full electricity link opens the existing interactive discovery route.
4. Select **Property tax**. The previous evidence closes. The new takeaway shows that school charges accounted for 57.1% of the $420 increase, and the disclosure reconciles the three underlying charge changes. The full example opens the existing property-tax route.
5. Return to **Compare two cities**. Open the dated Census evidence or continue to the public Business sample report.

| State | Capture |
| --- | --- |
| Desktop initial, 1440px | [Default city comparison](desktop-initial.png) |
| Desktop selected, 1440px | [Electricity result](desktop-electricity.png) |
| Mobile initial, 390px | [Default city comparison](mobile-initial.png) |
| Mobile selected, 390px | [Electricity result](mobile-electricity.png) |
| Mobile evidence, 390px | [Exact calculations and source cells](mobile-evidence.png) |

## Evidence and scope

City figures come from the existing homepage’s dated public sample. Population and income use 2020–2024 ACS five-year estimates. Population change compares 2015–2019 and 2020–2024 estimates. The preview shows arithmetic differences without testing statistical significance. Demand, rent, and competition need their own evidence. [Public Business sample](https://ifyoumind.com/sample-report) · [Population variable](https://api.census.gov/data/2024/acs/acs5/groups/B01003.html) · [Income variable](https://api.census.gov/data/2024/acs/acs5/groups/B19013.html)

The two bill previews render a projection of the public discovery fixtures and their evidence contract. A fast check regenerates the projection with the existing analyzers and rejects drift in the values, calculations, source cells and highlight proportions. The browser bundle contains only that small public projection. The private CSV parsers and upload controls stay in the existing discovery entry. Changing the selection uses local state, keeps keyboard focus on the choice, and announces the new takeaway. The user can open the source disclosure with the keyboard. Bars share a scale within each bill example and have visible numeric equivalents. The city example uses text for gaps with different units.

The premium hero, navigation, pricing options, discovery routes and Business links remain the surrounding experience. PR #80’s configured $79 one-time and $39/month Pro presentation is carried forward. The phase uses existing example destinations and does not request production changes. A rollback reverts the homepage discovery commit.

## Measurement

The app config has an existing analytics provider and an organization-scoped product analytics service. The public Angular root does not mount the repository’s consent controls. This branch adds no event emissions or SDKs. Existing analytics behavior is separate from the following proposed definitions.

| Proposed event | Count when | Allowed fields |
| --- | --- | --- |
| `home_discovery_question_selected` | A visitor activates a different example | `example_id` from `cities`, `electricity`, `tax` |
| `home_discovery_result_viewed` | The result first enters the viewport for that example during the current page visit | `example_id` |
| `home_discovery_evidence_expanded` | A visitor opens the closed evidence disclosure | `example_id` |
| `home_discovery_sample_opened` | The full sample route loads after following its homepage discovery link | `example_id=cities` |
| `home_report_creation_selected` | A visitor activates the homepage Create a Report link | No additional fields |
| `home_registration_started` | A visitor starts the registration journey from the homepage, once per attempt | An allowlisted entry label only |

Any implementation needs an active consent path and should reconcile with existing route and product events before adding instrumentation. The proposed payloads contain no source values, project identifiers, email addresses, raw routes, or uploaded contents.

## Verification

- Production and local Angular builds, targeted template and TypeScript lint, all 138 fast checks, production bundle guard, and discovery isolation guard passed.
- All 69 public Hosting browser checks passed. The question-switch test exercised the initial city view, evidence reset, electricity and property tax proof, and correct next links at 320, 375, 390, 768, 1024, and 1440 pixels. It checked keyboard focus, selection announcements, reduced motion, automated WCAG checks and horizontal overflow. Existing discovery privacy and both bill journeys passed.
- Forty targeted authenticated browser checks passed in the demo Firebase environment. They covered the sample and recovery, public pricing disclosure and paid intent, report creation and account pricing return paths, and registration and accessibility journeys.

## Local render observations

Five alternating Chrome loads of each production build used the same local asset replay with external requests blocked. Median LCP moved from 112 to 128 ms at 1440 pixels and from 100 to 104 ms at 390 pixels. Maximum observed CLS was zero in both builds at both widths. Switching to electricity and expanding evidence fetched the existing icon sprite and, on mobile, lazy images brought into view. The trace showed no analysis or analytics request from the feature. These are unthrottled local observations. Field performance remains unmeasured.

The build estimates the homepage chunk at 10.17 kB transferred, up from 7.22 kB in PR #80, and the initial bundle at 179.81 kB, up from 178.34 kB. The new stylesheet exceeds the existing 4 kB warning threshold and remains below the 8 kB error threshold. The budgets are the existing project settings.

## Assessment and next steps

The same visual frame gives each answer an immediate context, a quantified takeaway and an evidence path. Mobile puts the takeaway ahead of the table. At 320 pixels, the raw-cell tables still need ordinary vertical scrolling, and the three-choice row wraps its descriptions. The figures support descriptive comparisons. Fresh arbitrary questions would need a defined data source, request limits, and a source-backed analysis contract. Five-second comprehension, physical-device and spoken screen-reader behavior, and conversion remain unmeasured.

1. Run the deferred first-use walkthrough and record whether visitors can find the result, explain it and locate its evidence without prompting.
2. Review the transition from the homepage’s city result into the full report using PR #78 as a separate candidate.
3. Resolve consent and event overlap, then measure question selection, evidence use and report entry before drawing conversion conclusions.
