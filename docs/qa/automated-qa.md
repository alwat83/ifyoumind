# Automated authenticated QA (Firebase emulators + Playwright)

These tests sign in, verify email, create decisions and try to reach other people's data. They run the
real application against the Firebase **Auth, Firestore and Functions emulators** for the
`demo-ifyoumind` project. Nothing touches `ifyoumind-473fe`, Stripe, Census or any mailbox.

## Commands

| Command | What it runs | Needs |
|---|---|---|
| `npm run build:local` | The app with the emulator Firebase config, written to `dist/ifyoumind-local` (never the deploy folder) | — |
| `npm run test:e2e` | Playwright, desktop (1280×800) and mobile (Pixel 7, 390×844), under `firebase emulators:exec` | Java 11+, `build:local` first |
| `npm run test:qa-integration` | Fixture lifecycle and server-side access checks (`test/qa-fixtures.integration.test.mjs`) | Java 11+ |
| `npm run test:seo` | Fast tests, including the QA safety rails (`test/qa-guard.test.mjs`) | — |
| `npm run check:production-bundle` | Fails if the production build contains emulator config or QA strings | `npm run build` first |
| `npm run qa:seed` / `npm run qa:seed -- --clean` | Named local accounts in a running `npm run emulators`, for manual testing | Emulators running |

Local setup, once: `npm ci && npm --prefix functions ci`. Playwright uses the Chromium that ships with
`@playwright/test` (`npx playwright install chromium` if it isn't installed).

Single spec while developing: start `npm run emulators` in one terminal, then
`FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx playwright test --config e2e/playwright.config.mjs specs/session`.

## Environment variables

| Variable | Set by | Purpose |
|---|---|---|
| `FIREBASE_AUTH_EMULATOR_HOST`, `FIRESTORE_EMULATOR_HOST` | `firebase emulators:exec` | **Required.** Fixtures refuse to start without them, so the Admin SDK can never fall back to a real project |
| `QA_PORT` (default 4300), `QA_BASE_URL` | Optional | Where the local build is served. Must be `127.0.0.1`/`localhost` |
| `QA_FUNCTIONS_EMULATOR_HOST` (default `127.0.0.1:5001`) | Optional | Functions emulator |
| `CI` | GitHub Actions | 2 workers, HTML + JUnit reports, `test.only` forbidden |

No secrets are used or needed. The run **refuses to start** when any of these are true:
`GOOGLE_APPLICATION_CREDENTIALS` is set, a project variable names anything other than `demo-ifyoumind`,
an emulator host isn't local, or the served bundle references `ifyoumind-473fe`.

## Fixtures (`e2e/support/fixtures.mjs`)

Each fixture goes through the same steps a visitor does. Nothing writes memberships, plans or
entitlements directly.
1. **Sign-up** through the Auth REST API the web SDK uses.
2. **Verification** by consuming the real `VERIFY_EMAIL` code the emulator captured. `emailVerified` is never set by hand.
3. **Workspace** from the real `createIntelligenceOrganization` callable.
4. **Decisions** from the real `createMarketIntelligenceProject` callable. Census figures come from the
   seeded `censusPlaceCache` (synthetic values, `qaFixture: true`) that the pipeline reads before it would call Census.

| ID | Scenario | Used by |
|---|---|---|
| F01-unverified | Newly registered, unverified | verification-gate, integration |
| F02-verified | Verified email/password | session, integration |
| F03-free-empty | Free user, no decisions yet | decisions |
| F04-free-decision | Free user with a saved decision | decisions, layout-a11y, integration |
| F05-returning | Returning user reopening a saved report | decisions, integration |
| F06-other-tenant | Tries to read another account's decision | decisions, integration |
| F07-restricted | Non-admin opening `/app/growth` | decisions, integration |
| F08-return-url | Arrives through a valid return URL | return-url |
| F09-hostile-return-url | Arrives through hostile or malformed return URLs | return-url |
| F10-expired-session | Session expired, refresh refused (disabled account or bad refresh token) | session |
| T01/T02 | Accounts the browser itself creates during registration tests | registration |

**Lifecycle**
- Addresses look like `f04-free-decision.<run id>@qa.ifyoumind.test`. `.test` is a reserved TLD, so the mail can never be delivered or collide with a customer.
- Each test creates its own fixtures with a fresh run ID, so tests are independent and repeatable.
- Cleanup runs after each test, even a failed one. It removes that fixture's Auth user, the workspace it created (with its decisions), its owner index and its product events.
- Cleanup refuses any non-fixture address, and any workspace not created by that fixture. There are no wildcard deletes.
- After the run, `global-teardown` fails the run if any fixture account is left.
- `emulators:exec` discards all emulator data when it exits.

## What the browser tests cover (64 tests: 32 scenarios × 2 viewports)

| Area | Checks |
|---|---|
| Registration | Inline errors, `aria-invalid` and focus. A malformed form creates no account. Axe passes |
| Email verification | Sign-up → `/verify-email`. "I've verified" refuses before verification. Protected pages stay closed. Exactly one verification email is captured, and its continue URL keeps the `$79` intent. The link is opened in a **separate browser** (no shared storage), followed by sign-in there, and the account lands on `/app/decide?type=business&intent=report`. The first browser then continues without signing in again |
| Verified vs unverified | An unverified account is sent to `/verify-email` from `/app`, `/app/decide`, `/app/pricing`, `/app/account` and `/app/result/:id` |
| Protected routes | Signed out, every allowlisted page keeps its return URL. `/app/growth`, `/app/data`, `/app/ask` and `/app/advanced` don't |
| Return URLs | Restored after sign-in for decide + intent, a result page, and pricing (with `checkout=success` stripped). Unknown parameters are dropped. Twelve hostile values (`//evil`, absolute URLs, backslash, encoded slashes, `javascript:`, `..`, fragments, NUL, 600-char, leading space) all land on `/app` on the same origin, with zero external requests |
| Decisions | Free decision created through the UI, then the free brief is shown with "Sources cited" and the upgrade panel. A returning user finds the saved decision and reopens it |
| Ownership | Another account's project ID shows an error and none of its content |
| Restricted page | Non-admin sees an error, no metrics, on `/app/growth` |
| Sessions | Sign-out ends the session. An expired session for a disabled account, and one with an invalid refresh token, are signed out and sent to `/login` with the return URL |
| Layout | No sideways scroll at 390 px or 1280 px on public and signed-in pages. Homepage and app navigation work |
| Accessibility | Axe (WCAG 2.1 A/AA, serious + critical) on 4 public and 6 signed-in pages |
| Console | Any console error or uncaught exception fails the test unless that test expects it (for example the 403 on `/app/growth`) |
| Network | Every request outside `127.0.0.1` is blocked and fails the test. The exceptions are Google Fonts (stubbed) and the Google API loader Firebase Auth preloads on mobile (blocked, expected). So any analytics or third-party call would be caught |

The integration suite adds API-level checks:
- **Cross-tenant:** 8 callables (read, list, create, unlock, checkout, status, events) are refused with `PERMISSION_DENIED` for another account, and with `UNAUTHENTICATED` without a token.
- **Non-admin:** the funnel metrics are refused.
- **Fixtures:** workspace creation is idempotent, cleanup is targeted, and fixtures are independent.
- **Server-side verification:** one test is **skipped** until #26 lands; it enables itself when `requireVerifiedIdentity` exists.

## Coverage matrix

| Journey | Before this PR | Now | Still needs real services |
|---|---|---|---|
| Registration validation and inline errors | Source-matching test only | **Automated** (browser) | — |
| Email/password sign-in | Manual (QA-A) | **Automated** | — |
| Verification gate (browser) | Manual (check 12) | **Automated** | — |
| Verification gate (server) | Not enforced (#26 pending) | Test ready, skipped until #26 | — |
| Verification email **delivery** | Manual | Emulator proves the request and continue URL | Real inbox: Firebase delivery, spam placement, sender |
| Verification link completion and continue URL | Manual (check 11) | **Automated** (emulator action link, separate browser) | Real link: production authorized domains, hosted action page |
| Intent after verifying in another browser | Manual | **Automated** (via the continue URL) | — |
| Intent after switching **device** | Unknown | Only the continue URL carries it. `sessionStorage` does not survive a device switch, and that has **not** been demonstrated | Real device pair, if needed |
| Return URL restoration and hostile values | Unit tests plus 5 signed-out production checks | **Automated** signed in | — |
| Google sign-in | Manual (QA-G) | Not automated: the popup needs a real Google account in production | Real Google OAuth in production |
| Free decision creation | Commerce test (direct handler) | **Automated** through the UI and callables | Real Census API (production key, #29 harness) |
| Saved decision retrieval | — | **Automated** | — |
| Report ownership (UI and API) | Commerce and rules tests | **Automated** for both | — |
| Restricted admin page | — | **Automated** (non-admin) | Founder's admin view: manual |
| Logout, expired or invalid session | — | **Automated** | — |
| Paid report unlock and PDF | Commerce test (webhook, test mode) | Unchanged; no synthetic entitlements in the browser | Live $79 purchase (deferred) |
| Mobile layout, accessibility, console | Signed-out sweeps | **Automated**, signed in too | Real devices and Safari (not in this suite) |
| Account deletion | No self-service deletion exists | Fixture cleanup only | Product decision (see limitations) |

## CI (`.github/workflows/authenticated-qa.yml`)
- **Trigger:** pull requests to `master`, plus manual dispatch.
- **Permissions and isolation:** `contents: read`. It uses no secrets, and fails immediately if any cloud credential variable is present.
- **Steps:**
  1. Install dependencies; build the functions and the local bundle.
  2. Run the functions unit tests and the fast tests.
  3. Run the rules, organization, commerce and QA-integration emulator suites (none of these ran in CI before).
  4. Run Playwright on desktop and mobile.
- **On failure:** uploads the HTML report and traces for 7 days.
- **Cleanup:** the emulators stop with `emulators:exec`, and the runner is discarded.
- `launch-build-check.yml` gains one step, `npm run check:production-bundle`, after the production build.
- **Untouched:** the production deploy workflow (`firebase-production.yml`).

## Behaviour changes in this PR (local and CI only)
- **The emulator verification bypass is gone.** On localhost the route guard used to admit unverified accounts (`useLocalEmulators || user.emailVerified`), and registration skipped the verification email. Both now behave as in production.
  - Locally, verify with `npm run qa:seed`, or through the Emulator UI (Authentication).
  - In production `useLocalEmulators` was always false, so production behaviour is unchanged.
- **`build:local` writes to `dist/ifyoumind-local`,** so an emulator bundle can't sit in the folder Firebase Hosting deploys.
- **Two layout fixes the new checks found:**
  - The pricing "/month" text had 2.87:1 contrast; it now meets 4.5:1.
  - Account cards overflowed by 20 px at 390 px with long email addresses; they now wrap.

## Known limitations
- **Census figures in the emulator are synthetic.** The real Census request path is tested only by #29's harness and production.
- **The free plan's 3-decisions-a-month limit isn't tested anywhere.** `createMarketIntelligenceProject` skips it in the demo project (pre-existing code), and no unit test covers it. A follow-up could move the check into a pure function and test that.
- **Stripe is never called.** Checkout buttons aren't clicked, and paid views are covered by the commerce suite's signed test-mode webhooks.
- **The browser is Chromium only.** No Safari/WebKit or Firefox, and no real phones.
- **There is no self-service account deletion**, so "cleanup" covers fixtures only. Deleting a customer's data is a manual admin task today.
- **Disabled accounts keep a valid session until their ID token expires** (up to 1 hour). This is standard Firebase behaviour; the tests prove sign-out happens at refresh.
- **Pricing on phones:** the signed-in header hides the Pricing link at 560 px and below. This is by design, but it's worth a product look.

## Rollback
Revert the PR. The app changes are limited to the two emulator bypasses (dev-only behaviour) and two
CSS rules. No data, rules, functions or deploy configuration change.
