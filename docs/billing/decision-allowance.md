# Monthly decision allowance (Free 3, Pro 50): design

**Status: draft implementation (this PR). Not deployed.** Releasing it needs founder approval. It
changes no price, plan, Stripe setting or report entitlement.

## What customers are told today
- **Free:** "3 free decisions a month". Enforced since before this PR; #40 made it testable on the emulator.
- **Pro:** the pricing page and account page say **"up to 50 decisions … each month"**. Before this PR, **nothing enforced it.**

## Rules

| Topic | Rule | Why |
|---|---|---|
| Limit | Free 3 and Pro 50 decisions per period: `decisionLimitFor(plan)` | Matches what the product already advertises |
| Period | Calendar month, starting **00:00 UTC on the 1st** (`allowancePeriod()`, the same `YYYY-MM` key as Pro's 5 included reports) | One rule for every allowance. The copy already says "resets on the 1st (UTC)". Stripe billing anchors aren't stored, and on current API versions the period has moved to subscription items |
| What counts | A decision counts once it's **reserved**, and keeps counting once it's saved. A request that fails (bad location, Census down, any error) **gives its slot back** | Customers never lose an allowance to our errors |
| Concurrency | The slot is reserved in a Firestore **transaction on the workspace** (`decisionAllowance: {period, used}`) **before** any Census call. Transactions on one document serialise, so at most `limit` requests succeed | A `count()` check outside a transaction let two requests at 49 both pass. Tested: 6 concurrent requests with 2 slots left give exactly 2 successes |
| Rollout | `used = max(stored counter, decisions already stored this month)` | Existing decisions count from day one, so the rollout grants no extra allowance. Tested |
| Renewals | No effect. The allowance follows the calendar month, not the billing date | Simple and predictable |
| Upgrade mid-month | Decisions already made this month count toward 50 | One allowance per workspace per month |
| Downgrade or cancellation mid-month | The free limit applies to what was already used. Existing decisions and unlocked reports stay readable | Tested. Matches the cancellation copy: unlocked reports stay unlocked |
| Grandfathering | Not needed: the 50 limit is what Pro subscribers were sold. **Before release, the founder should check that no live Pro workspace has more than 50 decisions this month.** The read-only query is below | Avoids surprising anyone who relied on the missing limit |
| Admin or QA | No bypass. QA fixtures create at most 3 decisions | Keeps tests honest |

## Messages (`decisionLimitMessage`)
- **Free:** "You have used your 3 free decisions this month. They reset on the 1st (UTC). You can still buy the full Decision Report for any decision you have already created." This wording is unchanged.
- **Pro:** "You have used the 50 decisions included with Pro this month. They reset on the 1st (UTC). Your existing decisions and reports stay available."
- **Where they appear:** both are shown as the decision flow's error and are returned with `resource-exhausted`. The account page already shows "n / 50 decisions used".

## Pre-release check (founder, read-only)
In the Firebase console, for each Pro workspace, count the `marketProjects` documents with `createdAt` this month. Or run the reconciliation's Firestore read with a viewer-only account. If any count is above 50, decide one of the following before releasing:
- a one-month grace period;
- or proceed as is: their existing decisions stay available.

## Tests
- **Unit:** limits, period reset, the counter heal, the floor on release, other months untouched, and both messages.
- **Commerce (emulator, real callable):**
  - 50 Pro decisions, then the 51st is refused and nothing is written;
  - 6 concurrent requests give exactly 2;
  - a failed request gives its slot back;
  - a mid-month downgrade applies the free limit;
  - decisions stored before the counter existed still count.
- **QA integration and browser:** the free-limit tests from #40 still pass, 12 + 1 skipped and 66/66.

## Rollback
Revert. The `decisionAllowance` field is then unused. The count-only free check from #40 returns.
