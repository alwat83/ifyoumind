# Wow 3.2 brand integrity and customer trust

[PR #91](https://github.com/alwat83/ifyoumind/pull/91) at `165b5bbe6f2d9f2c3ceb424ffc289ce7bcf4080c` remains the approved visual reference. This follow-up continues [draft PR #92](https://github.com/alwat83/ifyoumind/pull/92) from its previously green head `267b622fbee5e9d60e0f03dd7d919e5c59f8e6c8`. Its [earlier visual inventory](REVIEW.md) provides 82 pairs of rendered screenshots and remains part of the review.

## Pre-change rendered inventory

The follow-up used the existing demo build from the green PR #92 head, the Firebase demo project, and 390 and 1440 px Chromium views. The previous visual review supplies the 320 and 768 px coverage and existing journey evidence. Subscription, checkout failure and portal responses in this audit use synthetic callable responses. The admin view uses a local user with an admin claim.

| Surface | Before state and classification | Follow-up |
| --- | --- | --- |
| Home, nav, footer, support and Organizations | Already consistent. Both contact actions resolve to the existing support address. | Preserve the approved composition and mail links. |
| Examples, Discovery, disclosures, tables and charts | Already consistent. Local examples and open evidence are captured in the earlier review. | Pin the homepage, Discovery entry and evidence in visual regression. |
| Guides, legal and privacy | Already consistent. Opened the guide index, an actual article and the legal routes. | Preserve their typography and links. |
| Static not-found page | Visual adjustment. The 404 rendered in browser-default Times at both widths. | Brand the static page with the existing tokens and keep HTTP 404, noindex, and useful recovery links. |
| Registration, login, reset, verify, auth errors, expired session and return URLs | Already consistent across rendered routes. Sign-in errors and gated Account return were rendered. Existing browser tests exercise email verification, expired sessions and return guards. | Pin registration. Announce sign-in failure to assistive technology. |
| Dashboard, profile, account, settings and saved decisions | Already consistent. Rendered populated/empty dashboard and profile/plan/security cards. | Pin empty dashboard and Account. |
| Decision creation, generation, sample and report history | Mostly consistent. Sample's introductory notice still used hard-coded yellow outside the shared warning role. | Apply shared warning tokens. Pin sample, loading, and retry. Preserve report content and print. |
| Report viewer, evidence, copy and PDF/print | Already consistent. Inspected the print view with a synthetic unlocked report and reviewed source links and comparison data. | Preserve print and evidence behavior. Existing browser checks exercise copy and print invocation. |
| My Data, Ask and Advanced | Visual adjustment. Prior audit rendered all three. Ask/Advanced still showed a separate “2.0” wordmark and stale tabs whose routes fell through to the homepage. | Use the ordinary wordmark and link to the existing workspace, My Data, Ask and Advanced destinations. |
| One-time checkout, Starter, Plus, Pro, confirmations and cancellations | Offers and returned states are already styled. Starter/Plus and checkout failure rendered via fixtures. | Pin pricing with monthly offers and verify the existing purchase contracts. |
| Account billing portal and failed renewal | Visual adjustment. The handoff label did not name the provider and failed renewal appeared as regular body text. Rendered both payment attention and portal-call failure. | Explain the Stripe handoff and use the shared warning treatment for payment attention. Keep customer and return logic. |
| Stripe-hosted Checkout and portal, Google sign-in, system print and mail client | External exceptions. Stripe and Google own their screens. System print and email UI are native. | Verify app-side initiation, intentional handoff and return where available. Track live portal and optional provider branding separately. |
| Loading, empty, success, error, forms and validation | Existing sample, auth and billing examples rendered. Route-local feedback and native disclosures drive the primary paths. | Add visual regression for loading, error and empty states. |
| Dialogs and modals | Native Google sign-in and print UI are provider/browser-owned. No custom application modal in the audited route tree. | Preserve browser/provider semantics. |
| Admin and restricted growth | Already consistent. Rendered both authorized metrics with the QA warning and the prior restricted state. | Use the shared warning role for advisory admin notices. Preserve claims and data. |
| Responsive, touch, focus and motion | Prior review checked 320, 390, 768 and 1440 px, keyboard and reduced motion. No overflow in the new 390/1440 captures. | Use two fixed viewport profiles for pixel checks and keep existing multi-width, keyboard and reduced-motion checks. |

## Provider boundaries

Stripe Checkout supports a recognizable display name, logo or icon, supported fonts, colors and shapes. The customer portal uses Dashboard branding and supports a business headline and return link. The app's existing checkout and billing calls still own initiation and return routing. Test the hosted appearance in the appropriate sandbox or through the existing [live portal gate](https://github.com/alwat83/ifyoumind/issues/84) before relying on it. Google renders its own consent flow. The app retains its standard account and sign-in return paths. [Stripe Checkout appearance](https://docs.stripe.com/payments/checkout/customization/appearance) · [Stripe customer portal configuration](https://docs.stripe.com/customer-management/configure-portal)

## Initial baseline review

Each of the 22 Linux candidates from [CI run 43361513765](https://github.com/alwat83/ifyoumind/actions/runs/43361513765) was opened and inspected on desktop and mobile before acceptance. The run recorded 120 passing tests, missing initial baselines, and a Workspace test whose direct sign-in return targeted a route outside the existing allowlist. That setup was corrected without changing auth.

| Reviewed image pair | Review result |
| --- | --- |
| Homepage | Approved hero, the visible finding, controls and footer match the reference. |
| Discovery | Both example cards, privacy note and CTA contrast match the established paper layout. |
| Discovery evidence | The sample label, finding, chart, open disclosure and first evidence text fit the captured viewport. |
| Registration | The editorial heading, field spacing and existing alternatives are legible. |
| Not found | The wordmark, clear 404 heading and recovery actions use the shared visual roles. |
| Report | The sample disclosure, editorial title and recommendation hierarchy are coherent. The visible fixture date is pinned to the reviewed date for future comparisons. |
| Report loading | The loading message stays in the report shell and leaves other routes visible. |
| Report retry | The error role, retry button and alternative paths are distinct. |
| Dashboard empty | The existing quick starts and empty-state action share the dashboard visual hierarchy. |
| Pricing | Monthly terms and both gated offers stay visible with the separate one-time option. |
| Account | Profile, plan, security and privacy cards use shared surfaces and controls. All personal details are demo fixtures. |

## Full-page follow-up evidence

The [first review](REVIEW.md#before-and-after-by-journey) covers the full homepage, Discovery, signup, Business creation, dashboard, reports, pricing and account at four widths. These supplemental pairs use 390 and 1440 px captures of the pre-follow-up and revised draft. Test-only emails, dates and admin metrics are fixtures.

| Surface | 390 px | 1440 px | After and functional evidence |
| --- | --- | --- | --- |
| Static 404 | [Before](screenshots/follow-up/before/390/not-found.webp) · [After](screenshots/follow-up/after/390/not-found.webp) | [Before](screenshots/follow-up/before/1440/not-found.webp) · [After](screenshots/follow-up/after/1440/not-found.webp) | Shared type and buttons. Actual Hosting 404, noindex, no scripts, keyboard recovery and axe. |
| Guide article and contact | [Before](screenshots/follow-up/before/390/guide-article.webp) · [After](screenshots/follow-up/after/390/guide-article.webp) | [Before](screenshots/follow-up/before/1440/guide-article.webp) · [After](screenshots/follow-up/after/1440/guide-article.webp) | Reading system retained. Existing guide and footer destinations verified. |
| Sign-in failure | [Before](screenshots/follow-up/before/390/sign-in-error.webp) · [After](screenshots/follow-up/after/390/sign-in-error.webp) | [Before](screenshots/follow-up/before/1440/sign-in-error.webp) · [After](screenshots/follow-up/after/1440/sign-in-error.webp) | Retains layout and exposes the error to assistive technology. |
| Sign-in return | [Before](screenshots/follow-up/before/390/sign-in-return.webp) · [After](screenshots/follow-up/after/390/sign-in-return.webp) | [Before](screenshots/follow-up/before/1440/sign-in-return.webp) · [After](screenshots/follow-up/after/1440/sign-in-return.webp) | Existing Account return remains guarded. Existing session tests cover disabled and invalid-refresh states. |
| Starter and Plus | [Before](screenshots/follow-up/before/390/starter-plus.webp) · [After](screenshots/follow-up/after/390/starter-plus.webp) | [Before](screenshots/follow-up/before/1440/starter-plus.webp) · [After](screenshots/follow-up/after/1440/starter-plus.webp) | Eligible views retain existing terms and purchase destinations. The public entry remains gated. |
| Checkout error | [Before](screenshots/follow-up/before/390/checkout-error.webp) · [After](screenshots/follow-up/after/390/checkout-error.webp) | [Before](screenshots/follow-up/before/1440/checkout-error.webp) · [After](screenshots/follow-up/after/1440/checkout-error.webp) | Callable failure remains visible in pricing. No real checkout used. |
| Renewal warning | [Before](screenshots/follow-up/before/390/payment-attention.webp) · [After](screenshots/follow-up/after/390/payment-attention.webp) | [Before](screenshots/follow-up/before/1440/payment-attention.webp) · [After](screenshots/follow-up/after/1440/payment-attention.webp) | Warning role distinguishes payment attention. Copy explains the Stripe transition. |
| Portal failure and recovery | [Before](screenshots/follow-up/before/390/billing-error.webp) · [After](screenshots/follow-up/after/390/billing-error.webp) | [Before](screenshots/follow-up/before/1440/billing-error.webp) · [After](screenshots/follow-up/after/1440/billing-error.webp) | Browser asserts failure announcement, retry, the expected workspace request, intercepted Stripe navigation and return to Account. |
| Legacy Pro account | [Before](screenshots/follow-up/before/390/legacy-pro.webp) · [After](screenshots/follow-up/after/390/legacy-pro.webp) | [Before](screenshots/follow-up/before/1440/legacy-pro.webp) · [After](screenshots/follow-up/after/1440/legacy-pro.webp) | Shares the Stripe handoff label. Existing plan and report access contracts remain. |
| Paid report print | [Before](screenshots/follow-up/before/390/report-print.webp) · [After](screenshots/follow-up/after/390/report-print.webp) | [Before](screenshots/follow-up/before/1440/report-print.webp) · [After](screenshots/follow-up/after/1440/report-print.webp) | Print media retains analysis and evidence. The existing test verifies print invocation and copy. The OS dialog remains native. |
| Founder growth | [Before](screenshots/follow-up/before/390/admin.webp) · [After](screenshots/follow-up/after/390/admin.webp) | [Before](screenshots/follow-up/before/1440/admin.webp) · [After](screenshots/follow-up/after/1440/admin.webp) | The existing advisory uses the shared warning role. Admin and non-admin paths are covered by the existing browser tests. |

## Journey verification

1. **Home → free example → evidence → Discovery.** Existing Hosting suite follows the home and Discovery entry points, selects both bill types, toggles evidence, verifies responsive findings, and checks browser-local isolation and clearing.
2. **Home → registration → dashboard.** Browser tests cover public registration, error feedback, verification, signup intent and the dashboard. Visual baselines pin signup and the empty dashboard.
3. **Home → Decision Reports → public sample.** Existing public navigation and rendering tests verify the sample link, report data and source links. The sample, loading and retry views are pinned.
4. **Sample → registration → report creation.** Existing authenticated tests verify the free brief and paid intent through verification, and create a sourced Business decision in the demo project.
5. **Dashboard → saved report → viewer.** Existing browser tests reopen a saved report, verify tenant isolation and exercise paid-report rendering, copy and print.
6. **Decision Report → pricing → checkout.** Existing browser tests verify report and Pro redirects, Starter enrollment with mocked billing responses, and pricing display for both Starter and Plus. The reviewed capture includes eligible plans. The separate subscription launch evidence includes prior [sandbox Plus checkout](../../growth/SUBSCRIPTION_LAUNCH.md).
7. **Checkout → confirmation → Account.** App-side pending, success and cancellation states were captured. The current flow is covered by intercepted browser and commerce tests.
8. **Account → subscription management → Account.** The app names Stripe, retains payment attention and recovers from a fixture failure. Retry and redirect use an intercepted response. Live portal and Stripe-hosted appearance remain outside this run.
9. **Error → recovery → intended route.** Hosting serves a real styled 404. Sample retry, auth guard, expired session and allowed return paths are covered. Ask and Advanced now link between real workspace routes. No sign-in return rules changed.

## Review status

Local production and demo builds, bundle and Discovery isolation guards, 138 web tests, 72 Functions tests, 22 targeted authenticated browser cases and three actual Hosting 404 cases passed. The Angular Karma command remains blocked at compile by the 11 documented legacy TypeScript diagnostics. Standalone unit tests did not run. [Exact-head checks](https://github.com/alwat83/ifyoumind/pull/92/checks) hold the release evidence for the draft.

Manual physical iOS Safari and spoken screen-reader coverage, live Stripe portal behavior and Stripe/Google hosted appearance remain open. The project currently has no measured customer trust, comprehension, conversion or revenue result from this design change.
