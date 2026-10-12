# QA: return URL after sign-in, and the homepage $79 intent (PR #34)

These checks need a signed-in browser, so they run after release with ifYouMind QA accounts only. Never use a customer account or a Dose Ninja mailbox. Record the result of each check (pass or fail) with a screenshot in the release notes.

## Accounts needed
- **QA-A**: a verified email account with at least one decision.
- **QA-B**: a new email account created during the check, which needs a working ifYouMind QA mailbox. Blocked until the Hestia QA mailboxes exist.
- **QA-G**: a Google account controlled by ifYouMind. Mark the check "untested" if there isn't one.

## Signed-out checks (no account needed)
| # | Step | Expected |
|---|---|---|
| 1 | Open `/app/decide?type=business&intent=report` in a private window | You land on `/login`, and the address contains `returnUrl=` with that path |
| 2 | Open `/app/growth` signed out | `/login` with **no** `returnUrl` (the path isn't allowlisted) |
| 3 | Open `/login?returnUrl=//evil.example`, then `?returnUrl=https://evil.example` and `?returnUrl=/app%2F..%2Flogin` | The sign-in page loads normally. Signing in later goes to `/app` (checks 6–7) |
| 4 | On the homepage, click "Build a report" on the $79 card | `/register?intent=report` shows "You'll see your free brief first…" |
| 5 | On the homepage, click "Try it" and Pro's button | Plain `/register` with no intent note |

## Signed-in checks
| # | Account | Step | Expected |
|---|---|---|---|
| 6 | QA-A | From check 1, sign in with email and password | You land on `/app/decide?type=business&intent=report` |
| 7 | QA-A | Sign out, open `/login?returnUrl=//evil.example`, sign in | You land on `/app`, and the browser never leaves ifyoumind.com |
| 8 | QA-A | Sign out, open `/app/result/<a real project id>`, sign in | You land back on that result page. Access is still decided by that page, and another workspace's id shows nothing |
| 9 | QA-A | Sign out, open `/login?returnUrl=/app/pricing?offer=report%26checkout=success`, sign in | `/app/pricing?offer=report` with no checkout-success message or event |
| 10 | QA-G | From check 1, choose "Continue with Google" | Same as check 6. The popup and auth frame work (no frame errors in the console) |
| 11 | QA-B | Register from check 4, open the verification email **in a different browser**, follow its link, sign in | You land on `/app/decide?type=business&intent=report`. After the first result, the $79 prompt appears for the unpaid decision |
| 12 | QA-B (unverified) | Sign in on a second browser before verifying | You go to `/verify-email` as today. Known limitation: that browser's verify page has no stored intent (roadmap D5) |

## Regression checks
- Email sign-up still goes to `/verify-email` first. The route guard still sends unverified accounts there.
- Checkout still starts only from `/app/pricing` through Stripe, and nothing in this change starts it.
- There are no new console errors on `/`, `/login` and `/register`, axe still reports 0 violations, and no page scrolls sideways at 390 px.

## Rollback
Revert the merge commit. Hosting redeploys from master. There are no data or configuration changes.
