# ifYouMind — Current development status

Observed 2026-10-22, OpenAI / Codex. Repository/GitHub are authoritative; Notion hub `3eb02474659c81ecba55cc4eed184a71` is accessible. Read `AGENTS.md` and recent append-only [development log](DEVELOPMENT_LOG.md).

## Direct founder correction — purchases

The founder explicitly states they have **never confirmed purchases**. Earlier agent/repository attribution was incorrect and is retracted. Historical log, PR-package and Notion wording is not purchase evidence. Standing instructions/master/growth records and descriptions of #60/#62/#63 are corrected; those PR heads are preserved. Source/CI can demonstrate implementation, not paying customers.

## Active candidate — consumer-first homepage, development only

Branch `codex/consumer-homepage-redesign`, baseline #62 `91b5fb71e093f38ca9c7cb6e05b773c6446b866a` (descends from integrated #60). Local implementation and review complete; separate draft PR/remote exact-head QA being prepared. [Founder visual review](../ux/consumer-homepage-redesign/REVIEW.md), [all 15 final captures](../ux/consumer-homepage-redesign/visual-review.json), [desktop full](../ux/consumer-homepage-redesign/screenshots/after-desktop-full.png), [mobile full](../ux/consumer-homepage-redesign/screenshots/after-mobile-full.png). Before images reuse #60 captures; its homepage source is identical at this baseline.

Consumer headline, four-choice keyboard-accessible discovery, existing free guide/Business paths, public sample before pricing, sources/limits/privacy, responsive editorial styling, reduced motion and matching initial/rendered metadata. Clear in-development labels for personal calculators/uploads; no arbitrary AI chat or Life calculation route. $79/report, $39/month Pro with five reports, registration intent and existing Business funnel preserved. No dependency/lockfile/backend/rules/Stripe/workflow changes.

Fresh final local verification:

- Production and emulator builds, bundle guard, changed TS/HTML lint: PASS. Fast tests 87/87; Functions unit 72/72 PASS.
- Complete desktop/mobile emulator browser suite **98/98 PASS**, exit 0, 2.0m, 0 failures/errors/skips. [Per-case evidence](../ux/consumer-homepage-redesign/browser-case-results.json). Includes four discovery states/keyboard/reduced motion/reload, actual local registration/brief/report flows, tenant/limit/verification boundaries, sample print, paid-rendering/copy/print and intercepted checkout contracts. No real transaction or native PDF export.
- Axe WCAG A/AA and 2.1 A/AA: zero violations across discovery states and integrated public checks. Direct eight-heading contrast minimum 5.40:1; visible controls at least 44px high; no document overflow at 320/390/1280. Selected-card number contrast defect (4.17:1) fixed with `#3d5742`. [Visual observations](../ux/consumer-homepage-redesign/visual-observations.json).
- Actual production-build Hosting SEO: **56 observations PASS**, 9 sitemap URLs, raw/rendered metadata/share/schema/robots/canonicals, redirects/private noindex, missing/Life HTTP 404. [Audit](../ux/consumer-homepage-redesign/seo-audit.json).
- Full lint **FAIL: 91 existing errors**; Angular test command **FAIL before execution: 11 existing TS diagnostics**, plus corresponding missing-module bundler/Karma reports. [Clean-master signature comparison](../ux/consumer-homepage-redesign/baseline-comparison.json): identical, zero new. Not waived or reported as passing. Initial bundle 653.54kB versus 500kB warning; homepage style 7.19kB versus 4kB warning, below 8kB error limit.
- Early runs: first draft 90 pass / 8 failures exposed the contrast defect; later 49-desktop-case run stalled and was stopped (incomplete); reused-port attempt executed no tests. A concurrent build hit shared generated-guide output; sequential rebuild passed. Final fresh-port one-worker run completed all 98. No incomplete run counted as a full pass.

Not verified: physical iOS/Safari, manual screen reader, field Core Web Vitals, user comprehension/conversion lift, native PDF export, live payment or post-deploy behavior. Homepage body remains client-rendered; initial metadata and static guides are generated as in #60.

## Preserved release/GitHub gates

| Work | Exact latest observed head | Verified status |
|---|---|---|
| `origin/master` | `bb6744b330378e63506cb90334098e6dfe2b86ff` | No merge/push/deploy performed |
| Draft #60 | `2eb17081f2feaa40163255a6c7de5a57f67f76b7` | OPEN/DRAFT/MERGEABLE; [build](https://github.com/alwat83/ifyoumind/actions/runs/39834974901) and [QA](https://github.com/alwat83/ifyoumind/actions/runs/39834974902) SUCCESS at exact head |
| Draft #62 | `91b5fb71e093f38ca9c7cb6e05b773c6446b866a` | OPEN/DRAFT/MERGEABLE; [exact-head manual QA](https://github.com/alwat83/ifyoumind/actions/runs/39840028543) SUCCESS, 94 browser cases plus backend suites; print/mandate remains separate |
| Draft #63 | `56e0b82d822fd73177a12c7a7c46503d5c282996` | OPEN/DRAFT/MERGEABLE; research/docs only, separate buyer package; no product test rerun claimed |

#60 already integrates #49/#54/#57/#58/#59 once; integration proof and 22 original images remain in its [decision package](../releases/2026-10-22/integrated/FINAL_DECISION.md). No #55 unique prototype commits/routes. **#60: GO for founder approval only; no execution approval.** Its green checks do not apply to the new homepage. New stacked PR requires manual QA because automatic workflows target master. Never merge source PRs a second time. Candidate order if individually approved: #60 → #62 → redesign; retarget/rebase and rerun integration checks after upstream changes. #63 documentation overlaps require preserving both log entries and current factual corrections when reconciled.

Live Hosting independently refreshed **2026-10-22 22:47 UTC**, unchanged version `f91311de8f35458e`, release `1792026155391000`, released October 15; both domains DOMAIN_ACTIVE. [Fresh rollback target](../ux/consumer-homepage-redesign/hosting-rollback.json). Master push automatically deploys Hosting, Firestore rules/indexes, Storage rules and listed Functions; no extra environment gate. Existing approval-gated rollback command is in #60's package. No rollback executed; refresh and obtain approval first.

## Commercial baseline and next buyer sprint

[Revenue plan](../growth/REVENUE_GROWTH_PLAN.md), [access/method record](../growth/STRIPE_BASELINE_2026-10-22.json): authorized read-only live Stripe access was restored and commercial records privately verified. Public live catalog matches $79/report and $39/month Pro. Actual payment/refund/subscription/fee and current recurring-revenue figures are preserved under ignored local `tmp/revenue-private/2026-10-22/`, withheld from GitHub pending specific founder publication approval required by automatic approval review. Withheld is not unknown or zero. No test-mode activity, founder funding or independent-customer classification invented; no mutations. Costs/qualified traffic/usable free completions/contribution margin remain unknown. Sigma needs a paid plan; no upgrade; GET fallback succeeded.

Earlier first-party activity evidence is retained in #63. Raw events and historical webhook markers do not establish independent paying customers; account/mode and explicit QA exclusions require evidence. No production writes or secrets retrieved.

[Founder Revenue Action Brief](https://github.com/alwat83/ifyoumind/blob/codex/revenue-execution-sprint/docs/growth/sprint-2026-10-22/FOUNDER_REVENUE_ACTION_BRIEF.md) retains 20 researched buying groups, five personalized unsent invitations/demo agendas, transparent routing requests, tracker, offer-fit review and proposed October 23–29 schedule. Its older Stripe-access and purchase-attribution statements are superseded here. Top five: Willsons/Skiptown; Viren Patel/Flying Biscuit; McDowell/Press/Twitty; Nadeems/Slim Chickens; DeStefano/Diskin. Public expansion signals establish relevance, not consent/current need/willingness to pay. No outreach, demos, purchases or spend executed.

## Preserved local work and next priorities

Original FRED worktree `codex/fred-economic-indicators` at `1a7c78c` retains its sitemap edit. `/private/tmp/ifyoumind-home-review` at #54 retains existing modified fixture/report/sitemap and untracked mobile-review work. Life review at #55 remains clean. Root dependency symlink preserved; only this session's emulator dummy secrets/symlink/config and localhost servers are cleaned up. No reset/stash/worktree removal.

1. Complete exact-head remote QA and founder visual/release review of this separate candidate; no merge/deploy without approval. Existing global test debt and native-device limits remain explicit.
2. **Recommended commercial assignment:** approve four transparent routing requests and five prepared invitations, sender/channel and at most one follow-up; prioritize P01/P02 permissioned conversations, then the remaining demos. Nothing sends automatically.
3. Select the correct analytics property, obtain attributable Cloud/AI cost evidence, and resolve historical webhook account/mode from authorized evidence; then reconcile weekly receipts and margin. No assumed traction or new paid services.
