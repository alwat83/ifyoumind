# Self-service account deletion: research and design proposal

**Status: proposal only. Nothing here is implemented or deployed.** Building it needs founder approval.
The retention periods also need a short legal review: they are working assumptions, not legal advice.

## Why
- Today there is no way for a customer to delete their account. Deletion is a manual admin task, and nothing tells customers it exists.
- The privacy policy should describe a real deletion process.
- Some app stores and privacy laws expect self-service deletion (for example CCPA/CPRA access and deletion rights, and GDPR Article 17 for EU visitors).

## What an ifYouMind account holds (inventory from the code, 2026-10-12)

| Data | Location | Personal? | Proposed handling |
|---|---|---|---|
| Sign-in identity: email, name, provider, password hash | Firebase Auth user | Yes | **Delete** (last step) |
| Workspace ownership index | `intelligenceWorkspaceOwners/{uid}` | ID link | Delete |
| Workspace and membership | `intelligenceOrganizations/{org}`, `.../members/{uid}` | Name you typed, ID | Delete when the user is the **only** member, otherwise remove only their membership |
| Decisions and reports, with the questions and places typed | `.../marketProjects/*` | Free text may be personal | Delete with the workspace |
| Uploaded datasets, observations, saved questions, analysis runs, connections | `.../datasets`, `observations`, `savedQuestions`, `questions`, `analysisRuns`, `connections`, `metricFacts` | May be personal | Delete with the workspace |
| Plan fields and Stripe IDs | Fields on the workspace document | IDs | Deleted with the workspace. The billing record is kept separately (below) |
| Sales enquiries | `.../commercialLeads` | Contact details | Delete |
| Product events | `productEvents` (uid, workspace ID, allowlisted context) | Pseudonymous | Delete, or strip `uid` and `organizationId` for aggregate counts |
| Legacy profile, bookmarks, ideas, comments | `users/{uid}`, `users/{uid}/bookmarks`, `ideas`, `comments` | Yes | Delete the profile and bookmarks. For public ideas and comments, delete or anonymise (founder decision) |
| Google Analytics, only if allowed (#18, not live) | GA4 property | Pseudonymous | GA4 user deletion API, or rely on 2-month retention |
| **Payment records** | `stripePayments`, `stripeLedger` (#39), `billingReviews`, `stripeEvents` | Workspace and Stripe IDs, amounts | **Keep for the legal retention period**, re-keyed so no live account links to them (below) |
| **Stripe customer:** name, email, address, card fingerprint, invoices | Stripe | Yes | See "Stripe" below. Financial records stay with Stripe |

## The decisions this needs

1. **Retention of financial records.**
   - Businesses generally must keep transaction records for tax and accounting. The period is often quoted as up to 7 years in the US, and it depends on jurisdiction.
   - **Proposal:** keep `stripePayments` and `stripeLedger` entries, with amount, currency, date, offer and Stripe IDs only, for the retention period. Remove the workspace link by replacing `organizationId` with a one-way tag such as `deleted:<random>`.
   - **Counsel to confirm the period.**
2. **Active Pro subscription.**
   - Stripe's API reference says deleting a Customer **immediately cancels its active subscriptions**. That would cut paid time short without notice. (This wasn't re-fetched in this session; verify it before building.)
   - **Proposal:** refuse to delete while a subscription is active or `cancel_at_period_end` is pending. Instead, offer "Cancel Pro in Manage billing first, then delete."
   - The alternative is to cancel at period end and delete afterwards with a scheduled job. That's more complex.
3. **Stripe customer object.**
   - **Option A:** delete the Customer, which removes the stored payment methods. Stripe still keeps charges and invoices for its own obligations.
   - **Option B:** keep it, and only remove our link to it.
   - **Proposal:** Option A, after any subscription has ended and once no refund window is open. With the proposed 14-day report refund and 7-day Pro refund, wait 14 days after the last payment, or process any refund first.
4. **Disputes.** If a dispute is open, postpone deletion of the billing link until it closes, so evidence can still be submitted. Everything else is deleted immediately.
5. **Shared workspaces.** Today every workspace has one owner. If invitations ship later, deleting an owner must transfer ownership or delete the workspace; that's out of scope now.

## Proposed flow (not built)
1. **Request** (Account page → "Delete my account"):
   - The user must have **signed in recently**. Firebase requires a recent login for `deleteUser`. Email accounts re-enter their password; Google accounts re-authenticate with Google.
   - They type `DELETE` to confirm.
   - The page shows exactly what will be deleted and what is kept, and why.
2. **The callable `deleteMyAccount`** (server, Admin SDK, verified identity required):
   1. **Checks:** caller is verified, owns the workspace, has no active or pending-cancel subscription and no open dispute. Otherwise it refuses with a clear message and changes nothing.
   2. **Marks** the workspace `deletionRequestedAt` and blocks new decisions and checkout, so nothing new is created mid-deletion.
   3. **Re-keys billing records:** `organizationId` → `deleted:<random>`, and `customerId` is kept only inside the billing record.
   4. **Deletes Firestore data** with `recursiveDelete` on the workspace, plus the owner index, product events (or strips their IDs), legacy profile, bookmarks and the ideas/comments decision.
   5. **Stripe** (only when the refund window has passed): `DELETE /v1/customers/{id}`. Otherwise it schedules this for the date the window closes, in a minimal `deletionQueue/{random}` that holds only the Stripe customer ID and the date.
   6. **Deletes the Auth user last.** If an earlier step fails, the user can sign in and retry, and the call is idempotent at each step.
   7. **Audit:** writes `deletionLog/{random}` with timestamp, the steps completed and counts. It holds no email, name or uid. Clients are denied by default because `firestore.rules` has no match for it.
3. **Confirmation:** the page signs the user out and shows "Your account was deleted." No email is sent, because the address is gone. Sending a confirmation before deleting is a product choice.

## Ordering rationale
Billing is re-keyed before workspace deletion, so no payment record is ever left pointing at a deleted
workspace and no customer data survives in it. The Auth user goes last, so a partial failure can always
be retried by the same person. Nothing is deleted before every precondition passes.

## Testing plan (emulator, once approved)
- **Fixtures:** new F12 and F13 fixtures in `e2e/support/fixtures.mjs`: a free workspace with decisions, and a "Pro" workspace via signed test-mode webhooks.
- **Integration:**
  - every listed collection is gone for the user and **untouched for another fixture**;
  - billing records are re-keyed, not deleted;
  - an active subscription refuses deletion;
  - a stale login is refused;
  - a second call is a no-op.
- **Browser:** the confirmation flow, a stale-login prompt, and the post-deletion sign-in failing with a generic message.
- **No production run** without a separate approval and the production QA account process.

## Privacy policy changes (with the release)
- Say how to delete an account, and what is kept and for how long.
- Remove the inaccurate AI-provider sentence (see #12).

## Open questions for the founder
1. The retention period for payment records (counsel).
2. Should public ideas and comments (legacy features) be deleted or anonymised?
3. Should a confirmation email be sent before deletion?
4. Should deletion be immediate, or follow a 7-day undo window?
