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
| Genuine paying customers | Distinct workspaces with at least one live payment that isn't fully refunded or lost in a dispute, excluding QA, test and founder workspaces |
| Report purchases | Live `stripePayments` with offer `report`, excluding duplicates (which are flagged for refund) |
| Report purchases net of refunds | The above minus fully refunded ones |
| Report conversion | Report purchases ÷ decisions created by non-excluded workspaces, in the same period |
| Pro subscriptions started | Live `stripePayments` with offer `pro` |
| Pro renewals paid / failed | Live ledger invoices with `renewal: true`: paid, or `payment_failed` |
| Active Pro now | Workspaces with `plan: 'pro'` and `stripeSubscriptionStatus` `active` or `trialing`, live customer, not excluded |
| Refunded amount | The sum of `amountRefunded` on live charges matched to the workspace's own payments |
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
