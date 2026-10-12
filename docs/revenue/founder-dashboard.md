# Founder revenue dashboard: definitions (read-only)

**Status: definitions plus a draft webhook ledger (this PR).** It isn't deployed. Nothing here changes
prices, checkout, billing or entitlements. The ledger records what Stripe reports and never grants or
removes access.

## Source of truth
**Stripe live mode is authoritative for money.** The figures read only Firestore records that the
webhook writes from Stripe-signed events with `livemode: true`.

The following are **never** counted as revenue or as customers:
- test-mode events;
- emulator or commerce-suite payments;
- browser returns from Checkout (`?checkout=success`);
- `checkout_started` or `intent_prompt_clicked` events;
- Pro-included or manually unlocked reports;
- QA accounts.

| Record | Written by | What it holds |
|---|---|---|
| `stripePayments/{checkoutSessionId}` | `checkout.session.completed`, `checkout.session.async_payment_succeeded` (existing) | First payment per checkout: offer, workspace, amount, `livemode`. **New:** `paymentIntentId` and `invoiceId` |
| `stripeLedger/invoice_{id}` | **New:** `invoice.paid`, `invoice.payment_failed` | Renewals (`billing_reason = subscription_cycle`) and failed renewals, with workspace, amount and attempt |
| `stripeLedger/charge_{id}` | **New:** `charge.refunded`, `charge.refund.updated` | Cumulative `amountRefunded` and `fullyRefunded`, plus the latest refund status |
| `stripeLedger/dispute_{id}` | **New:** `charge.dispute.created/updated/closed/funds_withdrawn/funds_reinstated` | Dispute status, amount and reason. A new dispute also opens a `billingReviews` entry |
| `stripeEvents/{eventId}` | Existing | Deduplication: each Stripe event is processed once |
| `billingReviews` | Existing, plus `dispute_opened` | Items for the founder to decide, such as duplicate payments and disputes |

## Delivery guarantees (tested in `npm run test:commerce`)
- **Idempotent:**
  - A redelivered event ID is acknowledged and skipped (`stripeEvents`).
  - Ledger documents are keyed by Stripe object ID, so one invoice, charge or dispute is one document.
  - A test proves a renewal delivered twice is recorded once.
- **Out of order:**
  - A ledger event older than the stored `eventCreated` is ignored.
  - Charge totals are Stripe's own cumulative values, so the newest event is always correct.
  - A test proves a late, older refund event can't lower the recorded refund.
- **Access:**
  - Refunds don't re-lock reports. This matches the current policy and #12's proposed wording.
  - Disputes and failed renewals don't change the plan. Subscription status events still decide Pro, as before.
  - Tests prove all three.

## Dashboard figures (`revenueSummary` in `functions/src/intelligence/revenue-ledger-logic.ts`)

| Figure | Definition |
|---|---|
| Genuine paying customers (verified) | Distinct workspaces with at least one live payment still standing after resolved reversals **and** after assuming every unresolved reversal applies to them. QA, test and founder workspaces are excluded |
| Paying customers needing review | Workspaces that are paying only if their unresolved reversals turn out to apply to other purchases. **Not counted** until reviewed |
| Report purchases | Live `stripePayments` with offer `report`, excluding duplicates (which are flagged for refund) |
| Report purchases net of refunds | The above minus fully refunded ones |
| Report conversion | Report purchases ÷ decisions created by non-excluded workspaces, in the same period |
| Pro subscriptions started | Live `stripePayments` with offer `pro` |
| Pro renewals paid / failed | Live ledger invoices with `renewal: true`: paid, or `payment_failed` |
| Active Pro now | Workspaces with `plan: 'pro'` and `stripeSubscriptionStatus` `active` or `trialing`, live customer, not excluded |
| Refunded amount (resolved / unresolved) | `amountRefunded` on live charges tied to a purchase, and separately on charges that match a customer but not one purchase |
| Refunds failed | Matched charges whose latest refund status is `failed` |
| Disputes open / lost | Live disputes not yet `won`/`lost`, and those `lost` |
| Unmatched ledger entries | Live refunds or disputes that can't be tied to a recorded payment. **Investigate by hand; never guess** |

## Excluding QA, test and founder activity
- **Excluded workspaces** are those whose creator's Auth account matches any of:
  - an address on the QA allowlist (see `docs/qa/production-qa-proposal.md`);
  - the `qa: true` claim;
  - `*@qa.ifyoumind.test`;
  - the founder's own accounts.
- **This list doesn't exist yet.** It's a founder decision, and the figures stay **unverified** until it does.
- Emulator fixtures can't appear here at all, because they live only in the `demo-ifyoumind` emulator.

## Audit (2026-10-12): what was checked and fixed

| Area | Finding | Status |
|---|---|---|
| Duplicate events | The same event ID is processed once (`stripeEvents`). The same object in several events lands on one document. | OK, tested |
| Duplicate dispute reviews | A dispute delivered as two events, or redelivered after a failed attempt, could open two `billingReviews`. | **Fixed:** the review ID is now `dispute_opened_{disputeId}`, created once. Tested |
| Out-of-order refunds | A refund status update was ordered on the same clock as the charge totals, so a late `charge.refund.updated` was dropped behind a newer `charge.refunded`. | **Fixed:** refund status has its own `refundEventCreated`, and totals keep `eventCreated`. Tested in both directions |
| Out-of-order invoices and disputes | An older event never overwrites a newer one. | OK, tested |
| **Subscription refunds unmatched** | Checked against sandbox records on the current Stripe API version. Pro Checkout Sessions have `payment_intent: null`, and invoices carry no `payment_intent` or top-level `subscription`. Refunds and disputes on Pro charges therefore could never match a payment by intent. | **Fixed, conservatively:** `stripePayments` now stores `customerId`. A reversal is tied to a purchase **only** when its payment intent matches, or when the Stripe customer has **exactly one** live payment in **exactly one** workspace. A customer with several payments, subscriptions or reports is **never guessed**; the reversal stays `unresolved` for review (`resolveReversal`). Tested |
| Genuine-customer rule | A Pro workspace with renewals was treated as not paying if its first charge was refunded. | **Fixed:** `genuinePayingCustomers` counts a workspace only if at least one payment still stands **even when every unresolved reversal is assumed to apply to it**. Workspaces that depend on an unresolved reversal are reported separately as `payingCustomersNeedingReview`, never folded in. Each charge is reversed at most once |
| Dispute status | `warning_closed` (inquiries) and `prevented` counted as open. | **Fixed:** `CLOSED_DISPUTE_STATUSES` |
| Renewals vs first payment | `subscription_create` invoices aren't counted as renewals; that payment is already in `stripePayments`. `subscription_update` (proration) invoices are recorded but counted in neither. | OK, documented |
| Entitlements | Refunds, disputes and failed renewals change no plan and no report access. | OK, tested |
| **Live reconciliation** | The Stripe connector available to Claude reaches only the **sandbox** (`acct_1UNp…`, test mode), so **no live record has been compared.** | `reconcileWithStripe` (tested) plus the read-only `scripts/reconcile-stripe.mjs`. Founder-run after approval (below) |

## Reconciliation against Stripe live records (founder-run, read-only)
1. **Create a restricted key** in Stripe live mode, with **Read** on Checkout Sessions, Charges, Disputes and Invoices and **None** on everything else. Keep it in your password manager. Delete it after the run.
2. **Authenticate:** run `gcloud auth application-default login` as an account that can read Firestore.
3. **Run:** `STRIPE_RECONCILE_KEY=rk_live_… node scripts/reconcile-stripe.mjs --project ifyoumind-473fe --since 2026-10-01`.
   - The script refuses secret keys (`sk_…`), test keys, a missing `--project`, or a missing `--since`.
   - **It refuses a key that can read Customers** (names and emails), because that's broader than it needs.
   - It sends only GET requests and only reads Firestore; `test/reconcile-script.test.mjs` proves the file has no write call.
   - Errors print only the HTTP status; the key and Stripe's error bodies are never printed.
   - Run it as a Google account with only **Cloud Datastore Viewer**, so even a bug couldn't write.
4. **Read the output.** It's JSON with three parts, listing Stripe and Firestore IDs and counts only:
   - `read`: how many records were read from each side;
   - `verified`: records that match exactly;
   - `discrepancies`, kept separate from what was verified:
   - `paymentsMissing`: paid live sessions not recorded;
   - `paymentAmountMismatch`;
   - `paymentsNotInStripe`;
   - `renewalsMissing`;
   - `refundsMissingOrDifferent`;
   - `disputesMissingOrDifferent`.

   `clean: true` (exit code 0) means Firestore matches Stripe for the period. Before #39 ships and the webhook events are selected, expect every live renewal, refund and dispute to be listed as missing.

## Missing data: documented, not estimated
1. **Events before this PR ships:**
   - renewals, refunds and disputes that happened before deploy aren't in Firestore;
   - payments recorded before this PR have no `paymentIntentId`.

   A read-only backfill from the Stripe API (`invoices`, `refunds`, `disputes` lists, live key) would fill these, and needs separate approval.
2. **Webhook event selection** (founder, in Stripe live mode):
   - Developers → Webhooks (Workbench in newer dashboards) → the ifYouMind endpoint → add `invoice.paid`, `invoice.payment_failed`, `charge.refunded`, `charge.refund.updated` and `charge.dispute.*`.
   - Until then, Stripe doesn't send them and the ledger stays empty. This is a live Stripe configuration change, so it isn't done here.
3. **Refunds on renewal charges** match only when the invoice carried `payment_intent`. That depends on the Stripe API version; on newer versions they appear as unmatched.
4. **Stripe events are retrievable for 30 days only.** Older history needs the list APIs, not event replay.
5. **Taxes, fees and payouts** aren't modelled. Net revenue after Stripe fees isn't computed.

## Not in this PR
- No new callable or dashboard UI. These are definitions and tested logic only.
- No change to the deploy allowlist, prices, checkout or entitlements.
- No backfill, and no live Stripe configuration change.
