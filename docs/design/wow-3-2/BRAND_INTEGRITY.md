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
