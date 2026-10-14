# App Check rollout plan

**Status:** planned. Nothing is enabled or enforced. Every step needs founder approval.

## Why
- **The gap.** Any signed-in account can call every callable from a script. #47 bounds what one account can spend, but App Check raises the cost of scripted and many-account abuse. It requires that calls come from the real ifyoumind.com web app.
- **What it doesn't do.** App Check is not authentication and not a spending cap.

## Scope and platforms
- **Platform:** the Angular web app on Firebase Hosting only, for desktop and mobile browsers. There are no native apps, so there is no iOS or Android registration.
- **Domains:** `ifyoumind.com`, `www.ifyoumind.com`, `ifyoumind-473fe.web.app` and `ifyoumind-473fe.firebaseapp.com`.
- **Provider:** reCAPTCHA Enterprise, which is invisible and score-based, and is Firebase's recommended web provider.
  - **Cost, to confirm on Google's pricing page:** there is a free monthly assessment allowance. App Check tokens are cached for about an hour, so assessments run roughly once per session, not once per call. Expected cost at today's traffic is $0, but **confirm before step 1, since spending isn't authorised**.

## Steps
| Step | What | Who approves | Rollback |
| --- | --- | --- | --- |
| 1. Register | Create a reCAPTCHA Enterprise key for the four domains and register the web app in the Firebase console under App Check. The site key is public, not a secret. | Founder (console change) | Delete the key |
| 2. Client | A PR adds `provideAppCheck(ReCaptchaEnterpriseProvider, autoRefresh)` to the Angular bootstrap for production builds only. Emulator, e2e and local builds stay without App Check, or use the debug provider. | Merge and deploy approval | Revert the PR |
| 3. Monitor (≥ 14 days) | Callables log whether `request.app` is present. Watch the verified share per function and Firestore's App Check metrics in the console. **Target:** ≥ 99% of real-user calls verified. Investigate failures by browser, network and privacy extension. | — | — |
| 4. Enforce: universal functions | Set `enforceAppCheck: true` on the 10 universal functions first, since this product area has the highest abuse potential and the lowest revenue impact. | Founder | Set `false`, then redeploy |
| 5. Enforce: report and account functions | Next the market, report and organization functions, then the commerce callables. **Never `stripeCommercialWebhook`**: Stripe calls it server-to-server. | Founder, after 7 clean days at step 4 | Same |
| 6. Firestore (optional) | Enforce for Firestore direct reads in the console. | Founder | Un-enforce in the console (instant) |
| 7. Replay protection (later) | Limited-use tokens (`consumeAppCheckToken`) on Ask and analysis. | Founder | Remove the option |

## Monitoring and alerts
- **Daily during steps 3–5:**
  - the verified share of calls per function;
  - the count of `unauthenticated` or App Check rejections per function, in Cloud Logging;
  - sign-up, report and checkout completion rates against the prior week.
- **Stop and roll back** if checkout or report completion drops by 10% or more, or if verified share falls below 98%.

## Risks
- **Blocked browsers.** Strict privacy settings or extensions, and some corporate networks, block reCAPTCHA. Those users would fail on enforced functions, so the app needs a clear "Please allow the security check" message (step 2 work).
- **QA and e2e.** The emulators don't enforce App Check, so CI is unaffected. Production QA, if ever approved, would need a debug token, stored as a secret and never committed.
- **Public sample report.** `getSampleDecisionReport` is called by anonymous visitors. App Check still works without sign-in, but enforce it only after monitoring shows anonymous traffic verifying.
