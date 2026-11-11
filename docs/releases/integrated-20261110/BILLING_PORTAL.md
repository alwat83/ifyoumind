# Billing Portal verification for PR #82

November 10, 2026 · OpenAI / Codex · [Draft PR #82](https://github.com/alwat83/ifyoumind/pull/82) · `codex/integrated-release-20261110`

## Root cause and release gate

The live iFyoumind account returned zero Billing Portal configurations on a read-only request. The Firebase callable sends a Stripe customer ID and a fixed HTTPS return URL, with no explicit configuration ID. Stripe uses its account default in that case. An isolated Stripe sandbox also started with zero configurations, and its first session succeeded and materialized an active default. The empty live list leaves the live default and its feature settings unverified. The same list result in the sandbox still allowed a session. The first live session could create live settings. Live verification stopped at read-only account, price and webhook inspection. [Stripe portal session API](https://docs.stripe.com/api/customer_portal/sessions/create)

**Conditional GO.** Confirm or save and read back the desired live default with explicit founder authorization, then verify owner access to the live portal before approving the exact draft for release. The draft adds no configuration ID or new secret. Last verified production remains PR #76. The master push workflow automatically deploys Firebase.

## Application changes

- Restrict portal sessions to authenticated active owners and admins. Read the Stripe customer from the server-managed workspace. Ignore client-supplied customer or return values. Validate the provider response against Stripe's HTTPS billing session host and both supported session URL shapes. An upstream failure produces a generic app error. The session URL stays out of logs.
- Show a cancellation notice while Pro is active with an end-of-period cancellation scheduled. Keep Manage billing available after downgrade for authorized users with a linked Stripe customer, including access to that customer's invoice history. Existing one-time report buyers without a linked billing customer continue to use their checkout receipts.
- Apply Pro subscription updates and Checkout fulfillment state through the same Firestore transaction. A delayed update or Checkout event cannot reactivate the same canceled subscription. Scheduled cancellation keeps Pro while Stripe reports active or trialing. The webhook recognizes both the legacy cancellation flag and the scheduled timestamp used by the current portal. When Stripe reports the subscription canceled, the workspace becomes Free, new Pro unlocks stop, and previously unlocked reports remain available.
- Existing checkout still uses $79 one time and $39 monthly for Pro with five included reports. The proposed $9/$15/$29 plan remains a proposal. No Firestore rules, secrets, dependencies or deployment workflow changes.

## Verification

The live Stripe reads found both configured Price objects active in USD, at $79 one time and $39 monthly. The existing `stripeCommercialWebhook` destination is enabled for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.updated` and `customer.subscription.deleted`. This establishes endpoint configuration. Delivery and the deployed signing secret were outside the live read.

Stripe CLI provisioned an isolated claimable sandbox with a test-only key and disposable fixtures. Its first session initialized a default with invoice history, payment-method updates and period-end cancellation enabled. The tested default was explicitly saved with those features, no cancellation proration and plan changes disabled. Stripe's hosted portal exposed invoice history and payment methods for an active test subscription with a paid $39 invoice. The Firebase callable returned a genuine sandbox portal URL for the linked test customer. Stripe returned the query-token session URL form. The sandbox prices matched the live amounts and cadence.

| Stripe-hosted test step | Verified result |
| --- | --- |
| Open default with an empty configuration list | Real session succeeded and initialized an active default |
| Open from the candidate callable | Allowed for the linked owner. Viewer denied by the emulator callable |
| Inspect invoice and payment controls | Hosted portal showed invoice history and payment methods for the synthetic customer. Stripe reported a paid $39 test invoice |
| Confirm cancellation in the hosted portal | Stripe kept the subscription active and set `cancel_at` to its item period end. `cancel_at_period_end` was false |
| Replay the actual `customer.subscription.updated` event locally | Pro and five included reports retained. Account cancellation state set to scheduled |
| End the synthetic subscription and replay the actual `customer.subscription.deleted` event locally | Free plan, new Pro unlock denied, previously unlocked report preserved, and billing access retained |
| Replay the older schedule after cancellation | Workspace stayed Free |

The claimable sandbox key could not create a test clock. The Stripe API ended only the disposable subscription to generate a real terminal event. The scheduled date and terminal event were verified separately. The events were replayed with a local test signing secret into the Firebase handler. No external webhook delivery to an emulator or live payment was involved. The existing connected account's test catalog was outside this isolated sandbox.

The Firestore emulator tests cover missing identity and links, viewer and outsider denial, authorized owner and admin, fixed return URLs, provider error and redirect rejection, period-end scheduling and undo, duplicate and stale events, terminal downgrade, and retained reports. The signed browser test uses real Firebase demo authentication and an intercepted portal destination to verify the account UI before and after downgrade. Local production and emulator builds, lint, bundle guards, 145 fast web cases, 72 Functions cases, 31 commerce cases, 7 Firestore rules cases and 5 organization cases passed. The targeted release and session browser suites passed 16 desktop and mobile cases. The draft links the independent runs for the final billing commit.

## Live setup after explicit founder approval

1. In the live iFyoumind account, open [Stripe Billing Portal settings](https://dashboard.stripe.com/settings/billing/portal). Save an active default for the account. Enable invoice history, payment-method updates and subscription cancellation. Select cancellation at the end of the billing period and no cancellation proration. Disable plan changes unless separately approved. Set the return URL to `https://ifyoumind.com/app/account`. Review support, privacy and terms links.
2. Read back the active default and its feature flags. Confirm the existing live webhook destination and subscribed events. Keep webhook secrets in Firebase Secret Manager. Verify a linked workspace owner can open the portal and see the correct customer and cancellation option without changing a real subscription. If a linked live workspace is unavailable, record the missing smoke test for the founder's decision.
3. Recheck the draft SHA and both GitHub workflows. Obtain separate founder authorization for the merge and automatic Firebase deployment. Smoke-test Account and billing access afterward. If rollback is authorized, restore the prior Hosting revision and the corresponding Functions revision together. Keep Stripe settings and application rollback decisions separate.

[Customer portal integration and testing](https://docs.stripe.com/customer-management/integrate-customer-portal)
