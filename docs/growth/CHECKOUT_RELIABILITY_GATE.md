# $79 Checkout reliability gate

November 15, 2026 Pacific · OpenAI / Codex. The legacy one-time path bypassed the shared Checkout reservation for unenrolled workspaces. A second request for the same unpaid decision could ask Stripe for another session. The previous revenue audit reproduced this with an emulator and fake Stripe transport. Webhook replay protection prevents repeat processing of the same event and records a separate paid session for billing review. That protection takes effect after payment. [Audit evidence](https://github.com/alwat83/ifyoumind/blob/87ce71e0f5338fd96a9753b42773270b96fc8258/docs/growth/REVENUE_VALIDATION_1.md).

The draft reserves one attempt in a Firestore transaction per workspace and decision. The attempt records the initiating buyer, Stripe account and mode, a random ID, expiry, and Stripe session ID when known. Subscriber checkout and report reservations continue sharing the same decision guard. The stored record contains no Checkout URL, email, or card details. Stripe errors are surfaced through a fixed recovery message.

| Stripe result | Customer outcome |
| --- | --- |
| Open and unpaid, with no PaymentIntent or an intent that requires a payment method | The original buyer can reopen the same hosted session. Canceling in the browser does not end the Stripe session. A different workspace member cannot obtain its link. |
| Paid, processing, complete with indeterminate payment, or failed lookup | Holds the attempt and directs the buyer to check access or contact support. No new session is opened. |
| Expired and unpaid with no PaymentIntent, or an expired or complete unpaid session with a canceled PaymentIntent | Rechecks the same stored attempt and current entitlement in a transaction before replacing it. |
| Lost response before storing the Stripe session ID | Retries use the same account and Stripe idempotency key within the fixed expiry window. After that window, the attempt stays locked for support reconciliation. |
| Existing purchased or included report | Checkout is refused, and the buyer is directed to the saved decision. |

The workflow does not use a browser return, provider lookup, or an expired session to grant entitlement. The existing signed webhook still owns fulfillment and replay handling. The one-time return hides the purchase action and checks actual saved access. [Stripe idempotency behavior](https://docs.stripe.com/api/idempotent_requests) · [Checkout session status](https://docs.stripe.com/api/checkout/sessions/object).

## Verification and release decision

The commerce emulator exercises repeated and concurrent requests, cancellation, confirmed expiry, canceled and failed payment, paid session before delayed webhook, unlock after signed delivery, unknown status, lost response and idempotent recovery, alternate account, stale unresolved attempt, and buyer/decision isolation. Stripe is simulated. Existing tests cover real signature verification logic and replay with synthetic events. Authenticated browser coverage checks the one-time return hides purchase while entitlement is pending and opens the report after access is confirmed.

**NO-GO for the supervised live purchase until release and preflight.** Before authorizing a release, rehearse the one-time path in the intended Stripe test environment and verify the production restricted key can identify its own account and retrieve Checkout Sessions with expanded PaymentIntents. The prior production code did not record open one-time sessions for ordinary workspaces. Before offering a new Checkout on any affected decision, reconcile prior live attempts and any delayed payments. For the pilot, confirm a newly created decision with no prior Checkout and follow the approved one-purchase protocol. If a session ID was lost beyond its retry window, leave the attempt blocked until support verifies provider state. Never clear a lock based solely on elapsed time or a browser cancellation.

## Stripe preflight and release plan

The originally reviewed head `5b17b1076d8cca20e6b28d8adbe70a00ac429854` rejected a genuine, open Stripe test Checkout whose URL used `https://checkout.stripe.com/g/pay/<session>`. It had assumed `/c/pay/`. The follow-up accepts both paths for one-time reports, requires that the path contain exactly the retrieved Session ID, and retains the HTTPS Stripe-origin check. The regression rejects a different Session ID, an extra path segment, and a lookalike host. This change leaves subscription Checkout handling as it was. [Draft PR #103 and exact-head checks](https://github.com/alwat83/ifyoumind/pull/103)

Read-only production preflight verified Hosting `de4cfa6b28163962`, live release `1794786392489000`, and the rollback history. The current version is the immediate pre-release rollback target. The older versions `51e354bfe0e900e2` and `1beeaa395c606d55` remain finalized and retained. The deployed Checkout revision `createcommercialcheckout-00064-lig` binds enabled Stripe secret version 5. The credential matched the intended live account and returned HTTP 200 for an existing one-time Checkout, that Checkout with `expand[]=payment_intent`, and the PaymentIntent collection. The session expansion was null and Stripe returned an empty PaymentIntent collection, so a non-empty expansion was unavailable for live readback. No new live objects were created for this check.

### After separate release authorization

1. Recheck the approved exact head, both required workflows, current master and the active Hosting release immediately before merge. Record the deployed Functions revision alongside Hosting. Verify the production workflow completes, Commerce is healthy, the $79 price is still presented, enrollment is closed, and a previously unlocked report still opens. The changes affect the callable and its pricing return.
2. A no-charge link reuse smoke needs permission to create one unpaid live Checkout on a fresh internal decision. Repeat and race the callable, verify that only one live session exists, return via Cancel, then reconcile and expire that unpaid session if explicitly authorized. Keep the signed webhook handler and any paid access available. The approved preflight itself creates no live Checkout.
3. If the release fails, pause supervised buying and reconcile any pending or paid sessions in Stripe and the app ledger. Restore Hosting `de4cfa6b28163962` and the previous reviewed Functions deployment from `89f481712d7e66f2e63b0861eb004e439d3480e1` under separate rollback authorization. A Hosting rollback alone cannot restore Functions. A rollback to the prior callable removes its new duplicate-attempt protection, so keep supervised purchasing paused until a safe callable is verified again. Preserve paid access and do not clear unresolved reservations.

### Supervised live purchase

After release and the no-charge smoke, obtain founder approval for one consenting independent buyer, one newly created decision, one payment, and a maximum of $79 plus separately approved applicable tax. Choose a buyer-approved city for a real coffee-shop question. Explain before payment that the report uses city-level evidence and needs separate site due diligence for foot traffic, lease economics and profitability. Confirm the exact merchant, item and displayed total before submitting. On any uncertain payment, stop and reconcile Stripe, the signed webhook and the entitlement. Confirm report delivery and reopening after a fresh sign-in, collect brief coded feedback, and use separate authorization for any refund. [Single-purchase protocol](https://github.com/alwat83/ifyoumind/blob/87ce71e0f5338fd96a9753b42773270b96fc8258/docs/growth/REVENUE_VALIDATION_1.md)

## Production verification for PR #103

November 15, 2026 Pacific · OpenAI / Codex. The founder authorized merge and deployment of `9442b34358936ba16a55de87f274007572803318`. Immediately before merging, GitHub confirmed both exact-head checks, mergeability and pre-release master `89f481712d7e66f2e63b0861eb004e439d3480e1`. The merge `c580337a29d1ab51e80e7586989e73478df364b0` has the authorized head as its second parent and the same tree `7f938936a40ef407cb15639ef4e1d3f17a886ff4`. [Launch build](https://github.com/alwat83/ifyoumind/actions/runs/43801473713) · [Authenticated QA](https://github.com/alwat83/ifyoumind/actions/runs/43801473726)

The [production workflow](https://github.com/alwat83/ifyoumind/actions/runs/43821604737) succeeded on the merge commit. Authenticated Hosting live-channel and release history reads both returned version `0855625f92deb226`, release `1794813058161000`, finalized at `2026-11-16T07:10:58.161Z`. The immediate rollback `de4cfa6b28163962` and older versions `51e354bfe0e900e2` and `1beeaa395c606d55` remained finalized, had retained releases, and showed active sampled files. Hosting rollback permission was verified.

Cloud Functions and Cloud Run independently showed all 27 workflow Functions on their new Ready revisions at 100% traffic. The prior revisions were retained and Ready. Traffic update permission was verified for the commerce and report surfaces below. Runtime commercial environment and secret bindings matched before and after. Subscription enrollment remained empty. Staging `explainsyntheticmarket-00004-lor` stayed OFF.

| Function | Serving revision, 100% traffic | Verified rollback revision |
| --- | --- | --- |
| Checkout | `createcommercialcheckout-00065-pez` | `createcommercialcheckout-00064-lig` |
| Commercial status | `getcommercialstatus-00082-nij` | `getcommercialstatus-00081-can` |
| Commerce webhook | `stripecommercialwebhook-00065-quk` | `stripecommercialwebhook-00064-jil` |
| Paid report generation | `generatepaiddecisionreport-00009-xef` | `generatepaiddecisionreport-00008-muj` |
| Saved decision read | `getmarketintelligenceproject-00080-yem` | `getmarketintelligenceproject-00079-rup` |
| Public sample read | `getsampledecisionreport-00039-dak` | `getsampledecisionreport-00038-rop` |
| Billing portal | `createbillingportalsession-00051-qig` | `createbillingportalsession-00050-van` |
| Subscription webhook | `stripesubscriptionwebhook-00009-yel` | `stripesubscriptionwebhook-00008-pir` |

If a rollback is separately authorized, reconcile open and paid attempts, restore Hosting `de4cfa6b28163962` if needed, and pin affected Cloud Run services to the recorded preceding Ready revisions. For Checkout, the scoped command is `gcloud run services update-traffic createcommercialcheckout --project ifyoumind-473fe --region us-central1 --to-revisions createcommercialcheckout-00064-lig=100`. Verify the new traffic assignment after each change. The [previous successful production workflow](https://github.com/alwat83/ifyoumind/actions/runs/43776389795) records the source baseline for a full Functions redeploy if needed. Restore no payment reservation during rollback. Keep supervised buying paused until the duplicate guard is verified again. No rollback was executed. [Firebase Hosting rollback](https://firebase.google.com/docs/hosting/manage-hosting-resources#roll_back_to_a_previous_version_of_your_site) · [Cloud Run traffic rollback](https://docs.cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration)

Anonymous desktop and 390 px mobile Chrome passed the live homepage, Census sample and sources, $79 entry with report intent, free sample entry, and protected pricing redirect with its return path. The sample callable returned HTTP 200 on both viewports. The browser blocked commerce mutations and Stripe requests, and observed zero attempts. Checkout, test card entry, signed-in fulfillment and live payment were outside the production smoke. The deployed release passed its navigation scope. A separate unpaid retry test and a separately approved independent purchase remain open.

## Authorized unpaid production Checkout verification

November 16, 2026 Pacific · OpenAI / Codex. **GO for the unpaid production gate.** Fresh Firebase readback verified Hosting `0855625f92deb226`, merge `c580337a29d1ab51e80e7586989e73478df364b0`, and `createcommercialcheckout-00065-pez` serving 100% of traffic. The deployed Stripe credential matched the configured live account. Subscription enrollment remained closed and OpenAI staging remained off.

| Check | Verified result |
| --- | --- |
| Baseline | The existing internal owner created one synthetic Business decision through the signed-in app. The new decision had no paid access, Checkout reservation, matching Stripe Session, or decision-scoped subscription reservation. |
| Initial, serial and concurrent calls | Four authenticated calls succeeded. One was the initial call, one a serial retry, and two were dispatched concurrently from separate browser tabs. All four returned the same hosted Stripe Session. Independent Stripe listing found exactly one matching session. |
| Hosted cancellation | Stripe's Back link returned to the same decision's pricing page with the cancellation notice. The report remained locked. Stripe still showed the same open session and no extra session. |
| Reconciliation and expiration | Direct Stripe reads verified live mode, the $79 total and exact decision and attempt metadata. Immediately before expiration the session was open and unpaid and expanded PaymentIntent was null. The one supported expiration request succeeded. A subsequent Stripe read showed the same single session expired and unpaid, with no PaymentIntent and zero active sessions. |
| Entitlement and audit | The decision remained without entitlement or a paid ledger record, and the app reopened it as a locked brief. The original reservation and Session ID remain recorded on the decision. No charge, refund, payment submission or lock removal occurred. |

The session and decision identifiers, browser observations and Stripe readbacks are recorded in a permission-restricted, Git-ignored local evidence file. One pricing navigation was retried before any Checkout invocation. All four actual calls succeeded. No production code, deployment, Stripe setting, enrollment, or OpenAI setting changed in this smoke.

The next gate is separate founder approval for one independent consenting buyer on a fresh decision, a relevant buyer-approved city and question, and one $79 payment plus separately approved applicable tax. During that purchase, stop on any uncertain result, reconcile the signed webhook and entitlement, and verify report delivery and reopening in a fresh session. Keep the internal unpaid attempt out of customer and revenue totals.
