# Bill Discovery Phase 2A — The first useful result

**Scope.** Build on production master `59a4b80a8e427a13e0d8bee0f753f8954ea8611f` and the [Phase 1 specification](BILL_DISCOVERY_MVP.md) from [PR #94](https://github.com/alwat83/ifyoumind/pull/94). The first useful result comes from typed numbers. County and utility PDF readiness is test-only and cannot enter the deployed bundle.

## Cross-surface impact before implementation

| Surface | Status | Acceptance |
| --- | --- | --- |
| Discovery, responsiveness, accessibility, error/empty and correction states | Change Required | Both categories lead to a local result with evidence, an optional comparison, clear and focused error recovery. Verify at 320, 390 and 1440 px with keyboard and touch. Preserve CSV and examples. |
| Privacy, isolation and public metadata | Change Required | Explain local handling before fields. Keep the existing CSP and noindex boundary. Test offline, zero post-load requests and no bill persistence, including navigation and stale reads. |
| Homepage, Business, Decision Reports, registration and login | Verify Only | Existing links still work. Registration follows a meaningful typed result through a fixed URL with no payload. No bill saving or report entitlement. |
| Dashboard, Account, pricing, checkout, subscriptions and infrastructure | Not Affected | The isolated browser bundle has no connection to those features. No production configuration or deployment changes. |
| PDF readiness | Change Required | Test-only adapters for one county and one utility candidate with synthetic, issuer-informed fixtures. Keep them out of all app bundles. No real PDF compatibility claims. |
| Handoff | Change Required | Record screenshots, measured size and performance, exact-head checks, limitations, and next gate. |

## Founder preview

Run `npm ci`, `npm run build`, then `DISCOVER_PORT=4317 npm run start:discover` from the repository root. Open [local Discovery](http://127.0.0.1:4317/discover/). The loopback Hosting emulator serves the production-target bundle. Use synthetic numbers in the review. The browser analysis is usable offline after the initial assets have loaded.

| State | Mobile 390 px | Desktop 1440 px |
| --- | --- | --- |
| Discovery entry, production baseline | [Before](bill-discovery-phase-2a/before/390/entry.webp) | [Before](bill-discovery-phase-2a/before/1440/entry.webp) |
| Discovery entry, Phase 2A | [After](bill-discovery-phase-2a/after/390/entry.webp) | [After](bill-discovery-phase-2a/after/1440/entry.webp) |
| Tax form and privacy | [After](bill-discovery-phase-2a/after/390/tax-form.webp) | [After](bill-discovery-phase-2a/after/1440/tax-form.webp) |
| Single tax result | [After](bill-discovery-phase-2a/after/390/tax-result.webp) | [After](bill-discovery-phase-2a/after/1440/tax-result.webp) |
| Electricity comparison and evidence | [After](bill-discovery-phase-2a/after/390/electricity-evidence.webp) | [After](bill-discovery-phase-2a/after/1440/electricity-evidence.webp) |

The property-tax form asks for tax year and full annual USD tax. A single result gives a monthly budgeting average. It refers the visitor to the bill for actual payment timing. Consecutive-year comparisons require confirmation of the same property. There is no component breakdown from totals alone. The electricity form asks for current-period electric charges in USD, billed kWh, and the start/end meter-read dates. It distinguishes current-period fees and taxes from prior balances, payments, and gas. The first result uses the whole-bill average when usage is positive. Comparisons require confirmation of the same electric service and non-overlapping meter-read periods. The result shows days and usage, with kWh/day when the periods differ in length. No utility tariff, cause, or adjustment is inferred. The supported numeric scope is nonnegative USD and kWh. Net credits and other units have no typed result.

Discovery uses volatile component state and the existing isolated island. The page keeps `connect-src 'none'` and `form-action 'none'`. Form submission is handled in the browser. The optional registration link is a fixed GET to `/register` with no referrer, payload, query, account association or cross-route state. In-flow privacy copy comes before inputs. The existing legal policy describes typed entry alongside CSV and its clearing boundaries. No analytics or reporting integration was added.

## PDF readiness

Two test-only field-mapping candidates cover a Lake County, Illinois current-year tax label and a PG&E residential electric detail section. Their input is synthetic page-positioned label/value rows. The tests prove draft mapping, page and label evidence, and rejection for missing, duplicate, shifted, ambiguous, or incompatible fields. They do not run a PDF text-layer reader. The PG&E candidate requires date confirmation before calculation. Authorized issuer originals must establish real text coordinates, labels, date conventions and reliable rejection rules before integrating a worker or advertising support. [Lake County example](https://www.lakecountyil.gov/DocumentCenter/View/21789/Example-Tax-Bill?bidId=) · [PG&E bill guide](https://www.pge.com/en/account/billing-and-assistance/understand-your-bill.html)

## Verification and performance

- Local `npm run build`, both production/isolation guards, `npm run test:seo` (146 fast tests) and `QA_BROWSER_CHANNEL=chrome npm run test:discover` (81 browser tests) passed. The added tests cover typed tax and electricity, invalid amounts and periods, zero, same-property/service confirmation, keyboard, focus, forced colors, reduced motion, axe, stale CSV reads, correction, clear, history restoration and registration. At 320, 390 and 1440 px the typed flow passed no-overflow checks. The offline run observed zero post-load requests and no local/session storage, IndexedDB, Cache Storage or cookies. Native mobile date controls and spoken screen-reader behavior still require a device check.
- The first forced-colors check exposed light CTA text on the forced background. The corrected controls use system colors. The release candidate retains the existing noindex, no-referrer and no-store Hosting policy. [Exact-head workflows](https://github.com/alwat83/ifyoumind/pull/95/checks).
- Initial Discovery JavaScript changed from 235,407 to 254,544 bytes raw (+19,137), 74,788 to 80,632 gzip (+5,844), and 66,267 to 70,245 Brotli (+3,978). Same local Angular toolchain for both builds from production source and the candidate. The new code is in the isolated Discovery bundle. The privacy-policy copy changes separately.
- Ten alternating cold browser contexts per build in loopback Chrome at 390 px showed median DOMContentLoaded of 36.6 ms baseline and 38.2 ms candidate. Median typed submission to result DOM was 7.2 ms (6.9–7.4 ms). This is a local measurement with synthetic numbers and unthrottled loopback. It does not estimate field performance or conversion.
- [Linux candidate run](https://github.com/alwat83/ifyoumind/actions/runs/43451792766) passed the functional suites. Two visual cases surfaced only the intended entry changes and the missing new result baselines. The desktop and mobile actuals and diffs were reviewed individually. The entry is shorter and elevates typed input. The new baselines pin the single-result hierarchy and optional next actions. Only those four image files changed.
