# Consolidated consumer launch — founder approval package

**GO for founder release approval when this PR's final head has both launch build and emulator QA SUCCESS; NO-GO for execution until explicit founder authorization.** [Release PR #66](https://github.com/alwat83/ifyoumind/pull/66). Application/evidence snapshot `37a2b868df1681ced190b4363430801953d4416d`; the follow-up changes records only. The final exact head and both immutable run links are pinned in the release PR description and Notion after CI. Do not substitute source-PR checks or local results for final-head CI. Any candidate/base change requires renewed integration checks and approval of its resulting exact head.

Production base: `bb6744b330378e63506cb90334098e6dfe2b86ff`. Branch `codex/consolidated-consumer-release` targets master directly. [Pinned source heads / selected paths and SHA256s](inclusion-manifest.json), [verification](verification.json), [all browser cases](browser-case-results.json), [baseline comparison](baseline-comparison.json), [SEO](seo-audit.json), [15 fresh captures](screenshots.json). Source PRs #60/#62/#63/#64/#65 remain unchanged. No requirement to merge those staged PRs first or replay their commits: this branch consolidates their selected final production-ready tree once. PR #63 research, generic outreach drafts and old screenshot binaries are excluded. Preserve original histories.

## Review the actual consumer experience

[Desktop first screen](screenshots/after-desktop-fold.png), [desktop full](screenshots/after-desktop-full.png), [mobile first screen](screenshots/after-mobile-fold.png), [mobile full](screenshots/after-mobile-full.png), [320px full](screenshots/after-narrow-full.png). Four-choice discovery routes to working educational guides or Business registration; public sample demonstrates cited evidence before paid offers. Personal calculators/uploads/automated comparisons are explicitly in development. No arbitrary AI chat or experimental Life route. Sources/limitations/privacy and $79 report / $39 monthly Pro with five included reports remain visible. No dependency/backend/rules/Stripe/workflow/lockfile changes.

This release includes mobile report improvements, public sample print, metadata/structured-data/sitemap/real404 fixes and four source-cited guides, permanent reporting/revenue mandate and founder's zero-to-one reset, plus previously approved aggregate reporting. No prospect identities, contact routes, personalized messages or raw commercial records included. [Concise launch scoreboard](../../growth/REVENUE_GROWTH_PLAN.md), [seven-day sequence](../../growth/LAUNCH_PLAN.md). Broad decision-platform vision is preserved; Business Reports are the initial monetization offer, not the entire company identity.

## Combined verification and risks

Fresh production/local builds and production bundle guard PASS; fast87, Functions72, rules7, organizations5, commerce29 PASS. Fixture/access24 PASS +1 existing intentional SKIP. All98 desktop/mobile browser cases PASS, zero failures/skips. Includes actual demo registration/verification/brief/report journeys, tenant/limit/entitlement boundaries, intercepted checkout/return contracts, public sample source/print/copy, guides/discovery/pricing. No real purchase or native PDF export. Axe WCAG2/2.1 A/AA zero automatic violations; explicit minimum heading contrast5.40:1, visible controls≥44px, no overflow at320/390/1280. Fresh15 screenshots inspected.

Actual local production Hosting audit:56 observations/9 unique sitemap URLs PASS, JS-on/off metadata, canonical/share/robots/JSON-LD, guides, redirects/private noindex and HTTP404 for missing pages/Life. First audit pointed the temporary config at the wrong path and served no build; not counted as a product result; corrected final audit passed.

**Not waived:** full lint still FAILS with91 unchanged production-baseline error signatures; Angular tests FAIL before execution with11 unchanged TS diagnostics and related bundler/Karma reports. Zero new signatures. Founder must explicitly accept this baseline debt or request its repair before release. Bundle/style warning budgets remain exceeded, hard limits pass. Physical iOS/Safari, manual screen reader, field CWV, native PDF, real payment and post-deploy behavior unverified. Homepage body remains client-rendered; generated metadata/static guides verified. No user study or conversion-lift claim. Analytics/cost unknowns do not block launch; no profitability claim.

## One approval, one production release

Approve the exact final green PR head and its automatic master-push deployment consequence. The unchanged production workflow deploys Hosting, Firestore rules/indexes, Storage rules and listed Functions, although backend/rules source is unchanged. Source-PR merge order is superseded by this single consolidated candidate. Do not merge the originals again. Recheck master/base, final head, CI and live rollback target immediately before execution; if anything changed, stop for revalidation. After an authorized release, verify live homepage/discovery/guides/sample/prices/registration/404 and record deploy run/revision. Do not initiate a real payment. Outreach approval is separate.

## Rollback readiness — prepared, not executed

Fresh read-only observation October23 00:42:43 UTC (October22 7:42p.m. CDT): Hosting version `f91311de8f35458e`, release `1792026155391000`, released October15,33 files; both domains DOMAIN_ACTIVE. [Metadata](hosting-rollback.json). Hosting carries no Git SHA label; production workflow correlation is not an embedded source assertion. Refresh immediately before release. No rollback/data migration/payment-setting change performed.

If separately authorized, restore the existing Hosting files/config atomically:

```sh
npx firebase-tools@13.35.1 hosting:clone ifyoumind-473fe@f91311de8f35458e ifyoumind-473fe:live --project ifyoumind-473fe --non-interactive
```

Then verify live pages and record the new release ID. Hosting rollback does not undo Functions/rules. There are no backend/rule/Stripe/schema changes in this candidate; review any broader deployment failure separately. Prepare a reviewed source revert of the consolidated release so later master pushes do not republish rejected code; preserve subsequent unrelated work, no reset/force-push. Any rollback deployment/revert merge needs authorization. Actual production restoration has not been exercised.

## Exact founder decisions

1. Approve or decline the final SHA pinned in this PR's current description, accepting disclosed baseline debt/limits and the automatic deployment scope. Do not approve a stale source head.
2. Optionally authorize the narrowly scoped Hosting rollback above if the approved release fails live checks; otherwise obtain separate rollback approval when needed.
3. Separately approve private launch copy, sender/channels, appropriate transparent routing and five invitations plus at most one permissioned follow-up. No communication, spend, pricing change, real purchase or experimental Life output is included in release approval.

Fastest route after launch: an approved introduction to someone with a current compatible decision, a useful sample/free-brief experience and an independently chosen $79 report. First-sale evidence and user feedback outrank analytics infrastructure. No sales forecast or fabricated traction.
