# Production QA accounts: proposal (not implemented)

**Status: proposed. Nothing in this document has been built or run.** No production Auth user or
Firestore record has been created or deleted. Building the provisioning script, and creating any
production QA account, each need separate founder approval.

## Why production QA is still needed
The emulator suite (`docs/qa/automated-qa.md`) covers most authenticated journeys. A few things only
exist in production:
- real email delivery and the hosted action page;
- Google OAuth;
- the production authorized-domain list;
- the deployed Functions with their secrets and real Census data;
- Hosting headers on `ifyoumind.com`.

The goal is a **short post-release smoke test**, not a second test suite.

## What an Admin-created account can and can't prove

| Check | Admin-created verified account | Needs a real email link or Google OAuth |
|---|---|---|
| Sign-in, return URL, protected routes, decisions, ownership, sign-out | Yes | — |
| Deployed callables refuse unverified callers (#26) | Yes: create one unverified and one verified account | — |
| Signed-in pricing copy, account page, free brief from real Census | Yes | — |
| Verification email arrives (sender, spam placement, delay) | **No.** `emailVerified: true` set by the Admin SDK proves nothing about delivery | Real inbox |
| Verification link completes on the hosted action page and the continue URL is accepted | **No** | Real link |
| Google sign-in popup in production | **No** | Real Google account |
| Paid report after a real purchase | **No** (no synthetic entitlements, no live charges) | Deferred live $79 test |

## Proposed design: `scripts/prod-qa.mjs` (not written)
1. **Identities**
   - Only addresses on an allowlist checked into the repo: `qa-a@<qa mail domain>`, `qa-b1…qa-b9@<qa mail domain>`, and the QA Google account.
   - The mail domain is the one chosen in the Hestia guide.
   - Display names start with `ifYouMind QA`. Accounts get the custom claim `qa: true`, which grants no access by itself.
2. **Credentials**
   - A dedicated service account, used only by this script.
   - Roles: **Firebase Authentication Admin** (create, disable or delete users and set claims) and **Cloud Datastore User** (targeted Firestore cleanup). No Owner/Editor, no Functions or Hosting roles, and no Stripe access.
   - The key lives only in the founder's password manager or a GitHub environment secret with required reviewers. It's never in source, logs, Notion or chat.
   - An alternative is short-lived impersonation (`gcloud auth print-access-token --impersonate-service-account`), so no key file exists at all.
3. **Project check:** the script refuses unless `--project ifyoumind-473fe` is passed **and** the credentials' project matches **and** the operator types the project ID at a prompt.
4. **Dry run by default.** It prints every intended create, claim and delete. Only `--apply` performs them.
5. **No wildcard deletion.** Deletes take an explicit UID from the allowlist plus its owner index. The script refuses any account without the `qa` claim, or whose address isn't on the allowlist. It never lists or touches other users' documents.
6. **No paid entitlements.** The script never writes `plan`, `decisionReportPurchased`, `decisionReportIncludedWithPro` or Stripe fields. It never calls Stripe, and checkout is never completed.
7. **Audit trail.** Each applied action appends one entry to `qaAuditLog/{autoId}`, a new collection. `firestore.rules` has no match for it, so clients are already denied by default and no rules change is needed. An entry records the operator, the action, the QA UID, a timestamp and the git SHA. The same line is printed locally.
8. **Cleanup.** `--cleanup <qa-id>` removes that QA account's workspace, decisions, owner index and product events, exactly like the emulator fixtures. It leaves the audit entries.

## Smallest real-world procedure (after each auth-affecting release, about 15 minutes)
The founder runs this, or Claude does once credentials are shared as an environment secret:
1. **Delivery and link (QA-B):**
   1. Register `qa-bN@…` on `ifyoumind.com/register?intent=report`.
   2. Record the sender, the arrival time and whether the email reached the inbox or spam.
   3. Open the link **on a phone** (a different device), sign in there, and confirm you land on `/app/decide?type=business&intent=report`.
2. **Same-browser continue:** back on the desktop, click "I've verified, continue". You should land on the same page.
3. **Google (QA-G):** on `/login?returnUrl=/app/decide?type=business%26intent=report`, choose "Continue with Google". You should land on that page, with no frame errors in the console.
4. **Returning user (QA-A):** sign in and confirm your saved decisions are listed. Open one, sign out, and check that `/app` asks you to sign in again.
5. **Record and clean up:**
   - Record pass or fail with screenshots in the release notes.
   - Delete the `qa-bN` account with the cleanup script, once approved, or from the Firebase console.

**What this procedure deliberately skips:** live payments, refunds, and whether purchase intent
survives a device switch when there's no continue URL. Intent is in `sessionStorage`, which does
**not** move between devices. Only the verification email's continue URL carries it, and the
procedure tests only that path.

## Excluding QA from customer and revenue numbers

| Metric | Source of truth | Exclusion rule |
|---|---|---|
| Registered customers | Firebase Auth | Exclude addresses on the QA allowlist, the `qa: true` claim, `*@qa.ifyoumind.test` and the founder's own accounts |
| First-time activation (engagement) | `productEvents` by `organizationId` | Exclude workspaces whose `createdBy` UID is excluded above |
| Report conversion | `stripePayments` (live) ÷ decisions | Count only `livemode: true` payments from non-excluded workspaces |
| Genuine paying customers | Stripe **live** mode | Distinct live customers with a successful charge, minus fully refunded and disputed charges, minus excluded workspaces |
| Subscriptions | Stripe live subscriptions | `status` active or past_due, live only, excluded workspaces removed |
| Retention | Repeat `decision_created` per workspace | Excluded workspaces removed |

**Never counted as a paying customer:**
- test-mode Stripe activity (`livemode: false`);
- emulator or commerce-suite payments;
- anything a QA script created;
- reports unlocked without a live `stripePayments` record.

The emulator fixtures can't reach production numbers at all, because they live only in `demo-ifyoumind`.

## Approvals this proposal needs
1. Building `scripts/prod-qa.mjs` (code only, draft PR).
2. Creating the service account and its two roles.
3. Creating the QA identities: Hestia mailboxes and the QA Google account.
4. Each production run of `--apply`.
