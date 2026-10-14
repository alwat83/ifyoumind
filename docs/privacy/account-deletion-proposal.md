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

## Record-retention requirements (researched 2026-10-12, official sources)
**This is research, not legal advice.** Counsel should confirm it before any retention policy changes.

| Source | What it says | What it means for ifYouMind |
|---|---|---|
| **IRS**, ["How long should I keep records?"](https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records) | "Keep records for 3 years" by default. 6 years if income over 25% of gross was under-reported. 7 years for bad-debt or worthless-securities claims. "Indefinitely" if no return was filed or it was fraudulent. Employment tax records at least 4 years | Payment records (amount, date, offer, Stripe IDs) support Dose Ninja Inc.'s tax filings. **Keeping them 7 years** covers every normal case with margin |
| **CCPA/CPRA**, [California AG summary](https://oag.ca.gov/privacy/ccpa) (§1798.105(d)) | A business may keep information to "complete your transaction…", for "certain business security practices", "certain internal uses that are compatible with reasonable consumer expectations", and "to comply with legal obligations, exercise legal claims or rights, or defend legal claims" | Deleting decisions and profile data is required on request. Keeping de-identified payment records for tax and accounting is permitted. *The statute text itself couldn't be fetched (leginfo blocked automated access), so this relies on the AG's official summary only* |
| **GDPR** Art. 17(3)(b), (e) and Art. 5(1)(e) ([gdpr-info.eu](https://gdpr-info.eu/art-17-gdpr/), not the official EUR-Lex) | Erasure doesn't apply where processing is needed "for compliance with a legal obligation" or "for the establishment, exercise or defence of legal claims". Data must be kept "no longer than is necessary" | The same split applies to EU visitors: delete everything else, keep minimal payment records, and only for as long as the obligation lasts |
| **Stripe**, [Delete a customer](https://docs.stripe.com/api/customers/delete) | "Permanently deletes a customer. It cannot be undone. Also immediately cancels any active subscriptions on the customer." Deleted customers "can still be retrieved through the API … to track their history", and deletion "removes all credit card details" | **Confirms the active-subscription rule below.** Stripe keeps its own transaction history ([privacy policy](https://stripe.com/privacy) §5: legal, fraud, tax and accounting obligations) whatever we do |
| **Stripe**, [How disputes work](https://docs.stripe.com/disputes/how-disputes-work) | "Card networks typically allow cardholders to initiate disputes within 120 days of the original payment", sometimes more. Local methods such as Klarna and PayPal are "typically up to 180 days" | Keep the billing link (Stripe customer ID inside the re-keyed payment record) for **180 days after the last payment**, so a dispute can still be answered |
| **Firebase**, [Manage users](https://firebase.google.com/docs/auth/web/manage-users) | "To delete a user, the user must have signed in recently." Otherwise, re-authenticate | Confirms the recent-sign-in step. A [Delete User Data extension](https://extensions.dev/extensions/firebase/delete-user-data) exists, but our data is keyed by workspace, not uid, so a purpose-built callable fits better |
| **FTC** Negative Option ("Click to Cancel") | Vacated by the 8th Circuit on 2025-07-08. The FTC conformed the rule in Feb 2026 and opened an ANPRM in Mar 2026 | No new federal cancellation duty today. Keep cancellation easy anyway (the billing portal), and recheck before launch |

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

## The four decisions, with recommended defaults

| # | Decision | Recommended default | Tradeoffs |
|---|---|---|---|
| 1 | **How long to keep payment records after deletion** | **7 years** from the payment. Keep only amount, currency, date, offer and Stripe IDs, re-keyed to `deleted:<random>`. Keep the Stripe customer ID for **180 days after the last payment** (the dispute window), then drop it from our records | **Shorter (3 years, the IRS default):** less data held, but no margin for the 6- and 7-year cases. **Longer or indefinite:** conflicts with the storage-limitation principle. Counsel confirms |
| 2 | **Public ideas and comments** (legacy features) | **Anonymise:** keep the text, replace the author with "Deleted user" and remove the uid. Delete instead if the founder prefers or the feature is retired | **Delete:** cleanest for privacy, but breaks threads other people replied to. **Anonymise:** keeps others' conversations intact, but the text itself could still identify someone. Offer "delete my posts too" as an option |
| 3 | **Confirmation email** | **Yes:** one email *before* deletion ("You asked to delete your ifYouMind account. It will be deleted in 7 days unless you cancel"), and none after | It proves the request came from the owner and catches mistakes. It costs one transactional email. A confirmation after deletion would need the address we just deleted |
| 4 | **Immediate deletion or an undo window** | **A 7-day undo window.** The workspace is frozen at once (sign-in shows "scheduled for deletion"), then a scheduled job deletes it on day 7 | **Immediate:** simplest, and what some customers expect, but there's no recovery from a mistake or an account takeover. **The window** adds a scheduled job and a freeze state. 7 days stays well inside the CCPA's 45-day response time (to be confirmed by counsel) |

**Also recommended**, and already part of the design:
- refuse deletion while a Pro subscription is active (Stripe would cancel it immediately);
- postpone the billing link while a dispute is open;
- delete the Auth user last.

None of this is implemented, and no retention policy has changed.
