# Discovery integration — founder release review

October 24, 2026 CDT · OpenAI / Codex · `codex/discovery-integration`. **Implemented and tested locally; not merged or deployed.** Final full SHA, draft PR and exact-head Actions results are pinned in the integration PR after push. Product direction accepted; aesthetic remains unfinished.

## Working experience and scope

Local Hosting demonstration: **http://127.0.0.1:4317/discover/** (`DISCOVER_PORT=4317 npm run start:discover`, after `npm run build`). Homepage navigation → Try discovery → either example → findings → source cells/calculations → correction/rerun → clear/switch. No signup or prompting. Two explicit redacted CSV formats only, same existing adapters/engine/shared components. Repeated read failures, wrong category, missing/zero/unknown values, delayed read cancellation, offline examples and exit/reload clearing retain their tested behavior.

The existing Angular discovery is built with its own privacy-preserving bootstrap and `/discover/` base/asset prefix, installed into the production application artifact through a three-file allowlist. It deliberately does not import the production Firebase/auth/analytics providers. Existing Business app routes/providers remain intact. Homepage change is one navigation entry with responsive wrapping; no hero/discovery-card redesign. Public copy replaces the local-review labels; home/sample/privacy links permit return navigation. Privacy policy adds a scoped local-processing explanation without changing registered Business processing.

Hosting adds `/discover`→`/discover/`301, real404 for unknown children, connect-src none, frame-ancestors none, no-referrer, no-store and noindex headers. Pilot metadata has canonical/description/OG and **noindex,nofollow**, and stays out of the sitemap as in the approved integration plan. No arbitrary file, AI, tariff/savings/causal claim. No new prices, dependency/lockfile, backend/rules/auth/Stripe implementation or production deploy-workflow change.

## Source ancestry

Preserved #70 `169128cba5464bf9d1a89574ca2399aaaae18c4b` → #71 `b26b5bd4e840b0fc5d59bd60b2d40412a1815a24` → #72 `73fc727486b0269a1a4d2680454ab4760299a71d` → founder decision docs `8ebff3cf54c0720b1c70bc4f83c1439d28a75a5c` → integration. Merge-base checks confirm each source implementation is included once. All source PRs are open/draft/mergeable with their unchanged exact-head build/QA SUCCESS at inspection. Master freshly fetched at `74a91fb15d408893448f925cedcec4e47868dec0`. No source PR merged or rewritten, no private research imported; original worktrees/drafts retained.

## Verification and limits

- **137 fast tests PASS**, including existing24 tax/16 electricity unit tests and two public-boundary regressions.
- **48 integrated Hosting/browser checks PASS**,0FAIL/0SKIP,1280×900/390×844/320×568, using actual Firebase Hosting emulator and production files. Covers36 existing unified scenarios plus12 Hosting/navigation/offline/registration/privacy cases. Automated checked WCAG violations, unexpected page errors, discovery external requests/writes/storage:0. Keyboard focus, evidence, correction/read recovery, category isolation and clearing checked.
- Production and emulator application builds PASS, identical three public-island assets in both artifacts. Preflight39styles/production36file guard/21rootJS isolation plus explicit public-island allowlist and metadata/provider checks PASS. Targeted lint PASS. Public island228.58kB/65.25kB estimated transfer; main app659.83kB/178.13kB. Existing initial/style warnings remain, shared discovery style5.06kB above4warning/below8error; no budget relaxed.
- **Global91lint errors and11Angular compiler diagnostics remain FAIL**, identical established signatures,0new/removed; legacy Angular test suite does not execute. One previously documented integration skip remains a skip. Green focused checks do not waive this debt.
- Connected Chrome extension is now available. Direct desktop interaction confirmed tax findings/source A2/E2/A3/E3, evidence values, clear with no source tables, electricity whole-bill average0.2200/kWh and reset. Initial keyboard tool timeout was followed by inspection confirming successful activation and focused heading, not blindly repeated. Physical devices, native Safari/iOS, spoken screen-reader and novice comprehension remain unverified.
- Broad local Business run: initial missing locked Functions dependencies installed without manifest changes; subsequent56 desktop scenarios passed, then a local worker transition stalled and was interrupted/cleaned up. CI-style two-worker retry and final exact-head CI results are recorded in the draft PR; do not call the interrupted run112PASS. Existing CI full authenticated suite remains a release gate.
- Initial build sandbox abort resolved with local build permission; first Hosting readiness timed out because emulator public path was relative to its generated config, fixed. Bundled local Chromium unavailable; installed Chrome used. Initial fast136PASS/1FAIL exposed an existing first-redirect-order assumption; original order restored, final137PASS. Unsupported Karma port flag removed before actual compiler comparison. These setup attempts are not product passes.

[12 unedited synthetic screenshots and hashes](screenshots.json): [desktop entry](screenshots/desktop-entry.png), [mobile entry](screenshots/mobile-entry.png), [mobile homepage navigation](screenshots/mobile-home-navigation.png), [tax evidence](screenshots/desktop-tax-evidence.png), [electricity evidence](screenshots/mobile-electricity-evidence.png), [correction](screenshots/mobile-corrected.png), [wrong file category](screenshots/mobile-wrong-category.png), [incomplete data](screenshots/mobile-insufficient.png).

## Production baseline and rollback

[Fresh read-only evidence](production-baseline.json): live Hosting **a4b9fd4f6533ce8b**, release **1792769133782000**, released2026-10-23T15:25:33.782Z. Verified2026-10-24T21:54:41Z: current version FINALIZED,41files,not deleted; immediate frontend rollback target. Prior e0c9142f16a5e741 also retained/FINALIZED. Custom-domain ownership/hosting/certificates ACTIVE. Existing production homepage/sample/register/guides return200; `/discover/`404 expected before this release; unknown URL404. No live callable requests, accounts or transactions initiated. Production source association remains the earlier verified deployment39977778362 at74a91fb; no Git SHA is fabricated from Hosting metadata.

Before authorized merge, recheck exact approved SHA, mergeability/checks, scope and **then-current** retained live version. If materially changed, request renewed approval. After explicit authorization, merge **only the new integration release PR**. Do not separately merge overlapping70/71/72. Current unchanged master-push workflow automatically deploys **Hosting, Firestore rules/indexes, Storage rules and its listed Functions**, even though backend source is unchanged. Approval must cover that actual scope, not describe it as Hosting-only.

Monitor automatic deployment and record resulting production commit/Hosting version. Read-only smoke: homepage link, both examples, evidence, correction/recovery, clear/switch, mobile/keyboard, headers/no-egress, register/sample/guides/prices, canonical/robots, redirect and404. No real signup/email, purchases, Stripe updates or outreach.

If a release needs rollback, use the [existing guarded Hosting release procedure](../../releases/consumer-recovery/production/LIVE_VERIFICATION.md) with explicit applicable founder authorization to restore the freshly verified retained version, then re-smoke. Hosting rollback restores files only, not Functions/rules/Git. Prepare a separately approved revert PR so the next master build cannot republish withdrawn integration. No rollback performed here.

## Founder decision requested

**GO for release review when final exact-head build/full emulator QA are green, with the documented debt/manual gaps explicitly acknowledged.** No merge or deployment authorized. Exact PR/SHA authorization wording is pinned in GitHub after final checks. Visual aesthetic is not final; pilot is intentionally noindex. No design expansion, new category, AI/PDF/comparison/storage, spending/pricing change or outreach. Outbound **Pending Founder Setup**.

Next highest-value assignment after an authorized release is a short observed first-time discovery session with real feedback, without claiming internal QA as traction. No new customer/revenue evidence from this sprint.
