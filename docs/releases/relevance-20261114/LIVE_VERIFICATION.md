# PR #99 release and PR #95 pilot handoff

Verified November 14, 2026 (UTC). Provider/agent: OpenAI / Codex. The founder authorized the exact #99 release after CI and rollback checks, and independently authorized up to four consenting participants on the exact #95 local build. That approval did not include publishing the pilot or enabling AI or enrollment.

## PR #99 — merged, deployed, production verified

| Check | Evidence |
| --- | --- |
| Release input | [PR #99](https://github.com/alwat83/ifyoumind/pull/99), approved head `6cabbf705c125c4c763dd4dfc2dd411a3cca8dd8`, base `master` at `0d980502b60589a757b04bf258fb9b6b3a45f6c7`; GitHub reported it mergeable. |
| Exact-head gates | [Launch build](https://github.com/alwat83/ifyoumind/actions/runs/43637067128) and [Authenticated QA](https://github.com/alwat83/ifyoumind/actions/runs/43637067205) passed on the approved head (144 browser cases and reviewed Birmingham visual comparisons). |
| What merged | [Merge commit `b22cb7582bbeb615b17b7fee34b7f6a3ec216560`](https://github.com/alwat83/ifyoumind/commit/b22cb7582bbeb615b17b7fee34b7f6a3ec216560), with the exact approved second parent. The merged tree matched the approved head's tree. |
| Production | [Established production workflow](https://github.com/alwat83/ifyoumind/actions/runs/43640676326) succeeded. The `ifyoumind-473fe` live Hosting release `1794690322738000` points to finalized version `51e354bfe0e900e2` (November 14, 21:05:22 UTC). |
| Rollback | `1beeaa395c606d55` served immediately before deployment and remains available and finalized with 57 files; sampled files were still retrievable. Firebase granted both Hosting site read and update permissions in a read-only permission check. Use the [previous release's Roll back action](https://firebase.google.com/docs/hosting/manage-hosting-resources#roll_back_to_a_previous_version_of_your_site), check that the live release points to that version, and re-smoke `/app/decide` and `/discover/`. No rollback was performed. |

Signed-in smoke test on [production decision creation](https://ifyoumind.com/app/decide):

| Prompt | Observed |
| --- | --- |
| “What are the property taxes in Birmingham?” | Explains that verified rates are unavailable and gives a state/county next step. No rate, computed bill, or automatic example was presented. |
| “Why did my property taxes increase?” | Offers to compare personal statements through the existing browser-local Discovery route, with no inferred tax cause. |
| “What property tax would I owe on this house?” | Says the parcel amount cannot be verified and explains which assessment details to look for. No estimate is shown. |
| “See a made-up property tax example” | Present as an optional link in all three branches. Clicking it opened `/discover/?example=tax`, where the `$420.00` increase is explicitly labeled “Example data—not your taxes.” |

Runtime changes are limited to the decision-flow component and its decision-step definitions. The source diff introduced no auth, billing, entitlement, Discovery calculator, or provider implementation change. Production subscription enrollment remains empty in checkout and status configuration, and the production synthetic AI function lookup returned 404. The separate PR #96 staging revision `explainsyntheticmarket-00004-lor` remained active, serving with its flag off. No live charge, checkout, subscription enrollment, staging provider call, or production customer-data transfer was performed.

## PR #95 — supervised loopback pilot prepared; no participant sessions

[Draft PR #95](https://github.com/alwat83/ifyoumind/pull/95) remained at the approved `b249ee122b19f3ee5500cec8873a17c97975c986`. It was not merged or deployed. Existing exact-head [build](https://github.com/alwat83/ifyoumind/actions/runs/43637297222) and [QA](https://github.com/alwat83/ifyoumind/actions/runs/43637297175) passed, including 81 Discovery and 140 authenticated browser tests. That coverage includes both one-statement analyses, optional comparisons, evidence, keyboard, correction, clearing, and offline/persistence checks.

- Fresh `NG_BUILD_MAX_WORKERS=2 npm run build` and `node scripts/check-discovery-isolation.mjs --production` passed. The existing loopback Hosting emulator served the exact built Discovery files. Hosting returned `connect-src 'none'`, `form-action 'none'`, `no-referrer`, `noindex, nofollow` and `no-store`.
- Fresh Playwright mobile WebKit smoke on [loopback](http://127.0.0.1:4317/discover/) exercised current electricity `$145.20` / `660 kWh`, an optional `$25.20` comparison and `600 kWh` evidence. The browser was offline after load, initiated zero post-load requests and had empty local storage, session storage and cookies after clearing.
- Native Safari in iPhone 17 / iOS 26.5 Simulator opened both typed paths and showed the privacy notice before inputs. The electricity date picker opened, the selected date persisted in the field, and switching categories confirmed clearing. The right edges of the date fields extended past the viewport, although their controls remained operable. Record this as a mobile layout issue; do not ask a participant to validate the affected form on that device until the issue is checked on hardware or corrected and reviewed.
- No physical phone was available online. Spoken VoiceOver, TalkBack and Android Chrome remain unverified. Browser automation and the simulator do not establish assistive-technology or participant comprehension coverage.

Follow the [exact-head supervised runbook](https://github.com/alwat83/ifyoumind/blob/b249ee122b19f3ee5500cec8873a17c97975c986/docs/product/BILL_DISCOVERY_PHASE_2A.md#limited-pilot-runbook). Start on a verified desktop loopback with the provided synthetic fixtures; use a fresh browser profile, no registrations or uploads, and log only anonymized task outcomes. Ask the participant to state one correct finding and one limitation without help, then verify clearing. No participants, observation records or conversion evidence yet. The rollback is to close the local tab and stop its emulator; production is unaffected. Wait for actual sessions before changing the product based on the pilot.
