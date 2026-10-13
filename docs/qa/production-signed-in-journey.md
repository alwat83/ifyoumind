# Production signed-in journey test: minimal plan

**Status: proposed. Runs only after founder approval.** It covers what the emulator suite (#38) can't:
- real verification email delivery;
- the hosted verification link;
- Google OAuth on ifyoumind.com;
- real Census data for a decision;
- a returning user on production.

**No purchase is made.** The live $79 test is still deferred.

## Setup: one account, about 5 minutes (founder)
Create **one new Google account used only for ifYouMind QA**, for example `ifyoumind.qa.<something>@gmail.com`.
- It must not be a Dose Ninja account, and it must not be linked to one.
- Add 2-step verification, and keep the password in your password manager.

That single account covers everything:
- **Google sign-in:** sign in with it directly.
- **Email/password sign-up and real delivery:** Gmail delivers `name+anything@gmail.com` to the same inbox, and Firebase treats each `+tag` address as a separate account. So `…+r1@gmail.com`, `…+r2@gmail.com` and so on are fresh email/password accounts for each run, with no mail server to set up.
- **Cross-device:** open the same Gmail on your phone.

The Hestia mailbox plan stays available, but it isn't needed for this.

## The run: about 15 minutes, desktop plus phone
Before and after the run, Claude runs the read-only signed-out smoke checks. You do the steps below. Record each one as pass or fail, with a screenshot.

| # | Step | Expected |
|---|---|---|
| 1 | Desktop, private window: open `ifyoumind.com/login?returnUrl=%2Fapp%2Fdecide%3Ftype%3Dbusiness%26intent%3Dreport` and choose **Continue with Google** with the QA account | You land on `/app/decide?type=business&intent=report`. The console shows no frame errors |
| 2 | Create one decision with a real city and two comparisons (for example Boise, ID vs Spokane, WA; Reno, NV) | The result page shows the free brief, "Sources cited" and the $79 panel. **Don't click buy** |
| 3 | Account → **Sign out**, then sign in with Google again | `/app` lists the decision from step 2 (returning user) |
| 4 | New private window: register at `/register?intent=report` as `…+r1@gmail.com` | You land on `/verify-email`. Record the time |
| 5 | Check the inbox | The verification email arrives. Record the sender, how long it took, and whether it was in the inbox or spam |
| 6 | **On the phone:** open the email's link, then sign in there as `…+r1` | You land on `/app/decide?type=business&intent=report`. This is the cross-device continue URL |
| 7 | Back on the desktop window from step 4: click **I've verified, continue** | You continue to the same page without signing in again |
| 8 | Register `…+r2@gmail.com` and **don't** verify. Open `/app` | You're sent to `/verify-email`. Once #26 ships, also confirm a decision can't be created |
| 9 | Send Claude the times, sender and spam placement, the screenshots, and the **QA account emails** | Claude records the results and the exclusion list |

## Keeping QA out of customer numbers
- **Exclusion rule:** every Auth account whose email is `ifyoumind.qa…@gmail.com` (with or without `+tag`), and every workspace those accounts created, goes on the **QA exclusion list** used by #39's `revenueSummary` (`excludedOrganizations`) and by the funnel review.
- **No payments:** QA accounts never make a purchase, so they can't affect revenue.
- **After each run:** delete the `+rN` accounts in the Firebase console (Authentication → Users). Keep the main Google QA account and its workspace for returning-user checks.
- **Free limit:** each decision uses one of that workspace's 3 free decisions for the month. This plan creates one decision per run.

## What this still doesn't cover
- A live payment, refund or report unlock after payment (the deferred live $79 test).
- Safari and iOS specifically. Use an iPhone for step 6 if you have one; that covers it.
- A purchase intent that survives a device switch without the email link. It doesn't survive, by design: intent is stored per browser.

## Rollback
Nothing changes in the product. To undo, delete the QA accounts.
