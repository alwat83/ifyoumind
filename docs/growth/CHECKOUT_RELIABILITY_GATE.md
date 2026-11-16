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
