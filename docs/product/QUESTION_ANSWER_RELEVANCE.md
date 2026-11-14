# Question-to-answer relevance audit

[PR #98](https://github.com/alwat83/ifyoumind/pull/98) shipped at `dbc872a977f062f94752578ca88fd56398e0c3c5` ([deployment](https://github.com/alwat83/ifyoumind/actions/runs/43623896871)). Its `billExample` helper recognized topics only. The same “property taxes” match showed a synthetic bill link for “What are the property taxes in Birmingham?” and “Why did my property taxes increase?” It also allowed a locality comparison to appear to have a personal bill answer. The fixture is valid arithmetic, but it contains no information about Birmingham.

| Question | Evidence available today | Right next step |
| --- | --- | --- |
| “What are the property taxes in Birmingham?” or “Which city has higher property taxes?” | The existing public ACS data describe population, income, home value, and population change. They do not establish local rates, effective tax burden, assessed value or taxes due. Bare “Birmingham” also lacks a state/country. | Explain that the app has no verified local tax rates. Identify the state and county, then check the relevant tax office’s rates for the requested year and taxing district. For comparisons, use consistent property classes, years and assessment bases. The example is a separate optional link. |
| “What property tax would I owe on this house?” or “Am I overpaying my property taxes?” | No parcel, class, exemptions, or official assessed value; a city average or asking price cannot substitute. | Ask for none of this in the current app. Point to the county assessor or tax office to match the parcel/address and confirm the year, taxable assessment, districts, applicable rates and exemptions. Avoid a conclusion about correctness, overpayment or an appeal. |
| “Why did my property taxes increase?” or “What changed on my electric bill?” | Current browser-local Discovery can compare two compatible statements in a supported, redacted CSV and trace changes to their source cells. No parcel address or city needed for this arithmetic. It cannot prove policy changes, billing error, eligibility or causes. | Explain the supported CSV and offer the existing Discovery entry as the main action. The made-up example is an optional separate link. No PDF upload, typed bill fields or external processing. |
| Mixed tax/electricity or unclear topic | No evidence of one shared answer. | Make the limits explicit and let the visitor choose an example. Do not send the text to the market callable. |
| “How do these cities compare on population or household income?” | Existing Census-backed free brief and Business sample include sourced comparable city figures and limitations. | Continue to the existing city path. The free-text prompt is preserved as context; the current deterministic brief does not answer arbitrary questions. |

**Official reference checks.** The [Alabama Department of Revenue](https://www.revenue.alabama.gov/property-tax/property-tax-assessment/) explains that classification, applicable millage and exemptions affect a bill and links to rates by year. Its [property tax overview](https://www.revenue.alabama.gov/tax-types/property-ad-valorem-tax/) distinguishes rates by taxing jurisdiction. If the visitor means Birmingham, Alabama, [the city’s GIS guide](https://www.birminghamal.gov/government/city-departments/pep/divisions-pep/gis-permitting-systems-support-division) explains how to locate a parcel and check boundaries; the city itself describes that map as a reference, so parcel rates and assessed amounts would still need county verification. None of these sources is being ingested, fetched at runtime, or used to infer the visitor’s jurisdiction.

**Smallest change.** Separate clearly personal statement changes, local tax information, and property-specific checks with conservative deterministic patterns. Show an editable-question fallback in place, preserve the question, and keep the example explicitly optional. Do not ask for an address or create a market brief for these questions. This is routing and truthful guidance, not jurisdiction lookup. The next justified expansion would need a reviewed jurisdiction/year-specific source and a confirmed visitor need.

| Surface | Impact | Verification |
| --- | --- | --- |
| Authenticated decision setup and feedback | Change Required | Local, personal, property-specific and mixed fixtures; no market request, no location collection; live state and keyboard focus. |
| Public homepage, Discovery and market briefs | Verify Only | Existing explicit examples, browser-local CSV and Census journey remain available. |
| Auth, payment, entitlements, reports, analytics, SEO and operations | Not Affected | No changes to their code, data flow, provider calls, dependencies or deployment. |
| Responsive, accessibility and handoff | Change Required | Check both viewport classes and 320 px, contrast and keyboard, update PR and existing hub. |

No merge or deployment. PR #95 and #96 stay separate.

## Founder review

| Journey | Desktop | Mobile |
| --- | --- | --- |
| Birmingham on the deployed baseline | [1280 px](question-answer-relevance/before-desktop.webp) | [390 px](question-answer-relevance/before-mobile.webp) |
| Birmingham local question | [1280 px](question-answer-relevance/local-desktop.webp) | [390 px](question-answer-relevance/local-mobile.webp) |
| Personal statement change | [1280 px](question-answer-relevance/personal-desktop.webp) | [390 px](question-answer-relevance/personal-mobile.webp) |

The existing deployed behavior provides the baseline: typing either question showed the same example action. The candidate uses the existing question screen and design tokens, with no added dialogue or search form. The sample dollar amount stays in the explicit sample; the local fallback sends nothing to Census, creates no workspace/project, and never asks for a personal address. Rules recognize common language, not every paraphrase or arbitrary question.

## Verification and release

- Local production/demo builds, production-bundle check and isolated Discovery guard passed. All 138 fast tests passed. The decision chunk is 6.78 kB estimated transfer (previously 5.96 kB); the public Discovery bundle is unchanged.
- Initial local browser run had two desktop timeouts on existing market/saved-decision journeys. The full rerun passed all 24 affected desktop/mobile cases; four final bill-route retests also passed. The Birmingham regression explicitly checks 320, 390, 768 and 1280 px, keyboard, axe, no `$420` before explicit sample selection, and no market/workspace creation request. Personal bill, mixed, parcel and tariff states are covered alongside the unchanged homepage, city comparison and report routes.
- CI runs are on [draft PR #99](https://github.com/alwat83/ifyoumind/pull/99/checks). No live tax lookup, device screen-reader test or release. After founder review, a separately authorized release should retain the preceding Hosting version and recheck the Birmingham, personal bill and ordinary city routes. A Hosting restore and reviewed source revert are the rollback path if needed.

[Initial Linux QA](https://github.com/alwat83/ifyoumind/actions/runs/43630934479) passed 142 browser cases; the two new Birmingham visual cases intentionally failed for missing reference images. Reviewed both candidates against the baseline and local screenshots: the question stays intact, then the evidence limit, next check and secondary example appear in that order. Added only the two new references. The final exact-head workflows recheck these references.
