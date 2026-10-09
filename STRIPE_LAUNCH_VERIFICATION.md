# Stripe launch verification — ifYouMind

Status: **NOT VERIFIED END TO END**. A successful GitHub Actions deployment is not proof of successful payment fulfillment.

## Preflight
- [ ] Confirm latest commit is deployed to Firebase (GitHub Actions production workflow).
- [ ] Confirm Stripe key mode (test vs live) matches BOTH configured price IDs and webhook signing secret. Do not send real charges while testing.
- [ ] Rotate any previously exposed Stripe secret; never paste secrets into issues, logs, or chat.
- [ ] In Stripe Dashboard, verify webhook destination is the deployed `stripeCommercialWebhook` endpoint and subscribes to `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.

## Test scenarios
1. **Pro purchase**: new test user/organization → $39 Pro checkout with Stripe test card → successful Checkout → webhook HTTP 2xx → organization has Pro, correct customer/subscription IDs → refreshed app shows Pro and higher limits.
2. **Report purchase**: existing market project → $79 report checkout → paid webhook → only that existing project has `decisionReportPurchased=true` → app unlocks the report.
3. **Failed/cancelled checkout**: cancel or use a declined test card → no Pro upgrade, no report unlock.
4. **Subscription cancellation**: cancel at period end → retain paid access until period end if subscription remains active; when subscription is actually deleted/inactive → downgrade to Free. Confirm webhook subscription metadata contains `organizationId` and `offer=pro`.
5. **Past-due and recovered billing**: simulate `past_due`, `unpaid`, `active` subscription updates → verify intended entitlements, including any grace-period policy.
6. **Webhook retries**: resend the same Stripe event → no duplicate grant, no error. Check Firestore `stripeEvents`.
7. **Cross-organization isolation**: cannot initiate a report purchase for another organization's project; a missing project cannot be created by fulfillment.

## Release gates
- [ ] Automated tests cover Stripe signature verification, payment status, lifecycle events, and project ownership.
- [ ] Review handling of out-of-order Stripe events (an old active event must not reactivate a cancelled subscription).
- [ ] Review atomic/idempotent webhook processing under concurrent deliveries.
- [ ] Verify subscription status from Stripe before granting Pro; `checkout.session.completed` alone does not guarantee an active paid subscription.
- [ ] Confirm customer-facing billing support/cancellation workflow and refund policy.
- [ ] Document real production smoke test after test-mode success.

**Do not declare revenue-ready until the checks above are completed.**

## Secret rotation note
- After updating `STRIPE_SECRET_KEY` in Google Cloud Secret Manager, redeploy the Stripe-backed Firebase functions before retesting Checkout so the newest secret version is bound to production.
