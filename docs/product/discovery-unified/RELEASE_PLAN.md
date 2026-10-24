# Unified discovery — production integration and release proposal

October23,2026 CDT. **Proposal only. This branch implements a local experience, not a production route. No merge or deployment approved.**

## Verified source ancestry and review order

| Candidate | Exact head | Base/current GitHub state at inspection | Scope |
|---|---|---|---|
| PR70 |169128cba5464bf9d1a89574ca2399aaaae18c4b|master74a91fb;OPEN/DRAFT/MERGEABLE;build40009760159/QA40009760130SUCCESS|62changed files relative to master,4commits; tax local entry, tests/evidence/public handoffs; shared69documentation already included.|
| PR71 |b26b5bd4e840b0fc5d59bd60b2d40412a1815a24|same master;OPEN/DRAFT/MERGEABLE;build40043615079/QA40043615003SUCCESS|100changed files total,5commits; **one additional commit/53changed files** over70, shared core/evidence/rendering and electricity adapter/local entry.|
| Unified candidate |Exact final SHA pinned in its draft PR after commit|codex/unified-local-discovery from exact71head|One chooser/shell, reuses existing host/engine/cards; local entry/build/QA/documentation only.|

`git merge-base 70head 71head` equals70head. No divergent merge or cherry-pick was needed. The sequence is **70 → 71 → unified**; keep those original heads/history intact. No Functions, rules, auth implementation, production deployment workflow, Firebase config or dependency-lock changes in70/71; Business source/prices unchanged. Changed package scripts/build/QA configurations are development tooling, not new dependencies. No private buyer research is imported.

**Code review order is not permission for three production pushes.** Current master-push workflow deploys automatically. Prefer one explicitly approved integrated release after public integration is implemented and checked. Do not merge overlapping source PRs afterwards or replay their commits. If sequential source merges are explicitly requested instead, independently authorize each exact head and automatic deployment, use ancestry-preserving merges, and revalidate each dependent diff/base/CI. A squash/rebase changes ancestry and requires deliberate reconciliation and new checks; never blindly repeat source commits.

## Proposed minimal public integration

**Recommended path: `/discover/`, as a separately built static Angular entry.** Keep the current consumer homepage and Business app. Add only a small, truthful navigation/CTA to discovery in the existing page once approved; no homepage overhaul, new category or pricing.

This preserves the tested privacy boundary. Do not simply add the component to `app.routes.ts`: the production app configuration initializes providers that this local slice intentionally excludes. The public discovery island must retain its own bootstrap without Firebase/auth/analytics or backend connections.

A future, separately reviewed integration branch should:

1. Add a production discovery build with explicit **baseHref/deployUrl `/discover/`**, correct `app-unified-discovery` HTML root, actual public metadata and no local-server dependency. Copy only its public assets into `dist/ifyoumind-deploy/browser/discover/`; keep existing production root/app-shell/guides/sample assets intact. Never copy `tmp/`, private drafts, test records or local upload contents. Do not weaken the existing production-exclusion guard silently: retain legacy-preview exclusions and add an explicit allowlist/positive guard for only the approved public island at its expected path.
2. Keep document `connect-src 'none'`, no external scripts/fonts/frames/forms, no provider initialization, and no identifying data in URLs, logs, events, browser storage or generated HTML. Revalidate server and meta CSP intersection, content types and asset paths on Hosting. The current CSV schemas, units, compatibility checks, redaction guidance, exact source/calculations, caveats and clear-on-switch/exit stay unchanged.
3. Serve `GET /discover/` as200, permanently redirect `/discover` to `/discover/`, and preserve genuine404 for `/discover/not-real` and other unsupported paths. No broad SPA catch-all. Reload resets the session to the chooser. No private query/hash state or cross-category history. Existing register/login/app/guide redirects and404 remain as before.
4. Replace “Local preview/founder review” presentation with accurate public copy for the two supported CSV experiences. Preserve explicit example labels and “calculated” findings; do not advertise arbitrary uploads, AI, PDFs, external comparisons, tax correctness, supplier tariffs or savings. Keep Business offers separate; a personal bill analysis is not the existing paid Business Report SKU.
5. Start with **noindex** for an approved controlled pilot unless the founder separately approves public indexing. Do not add sitemap/schema claims or a generic AI-file landing page by default. Metadata/canonical/robots for the actual public URL must match that decision. Scope privacy-policy wording to browser-local discovery, without contradicting the existing persistent registered Business functionality.

These edits are **planned, not present**. This assignment does not authorize implementing or deploying them automatically.

## Release gates and validation

Before a production decision, inspect latest master and build a dedicated release branch that incorporates only the reviewed source histories once plus the public integration commit. Pin its full SHA/tree/file manifest; no prototype branch may bypass70/71approval. Preserve all existing worktrees and private documents.

Required evidence at that exact release head:

- Production and public-island builds; preflight/bundle guards; asset-prefix/CSP/no-provider tests; full existing fast/Functions/rules/organizations/commerce/fixture/app-browser suites, plus standalone and unified discovery regressions. Test wrong-schema refusal, missing/zero/inconsistent/unknown data, evidence, correction/clear, reload/exit and pending-read category switching. Tests must use synthetic fixtures/emulators, never real purchases.
- Desktop/mobile/320px browser screenshots, keyboard/focus, automated accessibility, available native-browser/device/manual screen-reader verification, and an explicit list of unavailable checks. Current nativeSafari/Simulator/Chrome-extension/spokenSR gaps are not closed by this local assignment. Do not claim field performance, novice comprehension or conversion from QA.
- Live staging or approved preview of the **public integration**: `/discover/` status/assets/reload/privacy and existing homepage/discovery/guides/sample/register/pricing/source/404 paths. Avoid creating public preview deployments before approval. Registration presentation/read-only validation only; real email/signup/payment verification requires applicable approval. Preserve79USDreport/39USDmonthlyPro.
- Global lint91errors and Angular11compiler diagnostics are currently known debt. Recompare exact signatures; new failures block release. Disclose the pre-existing integration skip and any new warning/harness issue. Green workflows do not waive these limits or substitute another commit's results.

## Founder authorization and deployment order

**Next authorization sought is for the proposed public integration scope and its implementation/testing on a feature branch—not a merge/deployment of this local candidate.** Resolve any preferred path/indexing/privacy decisions in that scope. No paid infrastructure or model service is needed.

After integration is concrete, request explicit authorization for the **one release PR/fullSHA and its actual automatic deployment targets**. Current `.github/workflows/firebase-production.yml` triggers on master push and deploys Hosting, Firestore rules/indexes, Storage rules and its listed Functions. Even if those backend sources are unchanged, do not describe that workflow as Hosting-only. A Hosting-only rollout would require a separately reviewed workflow/scope change before approval; do not silently switch procedures.

Authorized execution order only:

1. Revalidate approvedSHA, checks, mergeability, source/privacy/price scope and retained rollback target. Stop for renewed approval if materially changed.
2. Merge only the specifically authorized release candidate; monitor the resulting master deployment and Hosting release association. Do not merge70/71again after their source history is already included. Keep source PR histories for review; any superseded disposition follows founder direction.
3. Run read-only production smoke: unified chooser→both examples→evidence→correction/error/recovery→clear/switch; mobile/keyboard; CSS/JS/CSP/no data egress; homepage/sample/guides/registration presentation/prices/SEO/redirects/404. Do not upload private household data, create accounts, initiate a payment, change Stripe or send outreach. Record exact master/deployment/Hosting revision and remaining limits.

## Rollback readiness

No rollback executed or promised from an unverified old version. Last previously verified production source74a91fb15d408893448f925cedcec4e47868dec0/Hostinga4b9fd4f6533ce8b is historical evidence, not a fresh retention check.

Immediately before an authorized deployment, record the current **FINALIZED retained Hosting version, release ID/time, production commit and working smoke baseline** using existing read-only access. Confirm it can be released again without deleting assets. Include that exact target and founder rollback authorization in the package.

For a failed authorized release: stop further rollout, obtain/confirm the applicable rollback approval, release the retained known-working Hosting version using the [existing guarded Hosting release procedure](../../releases/consumer-recovery/production/LIVE_VERIFICATION.md), and recheck both domains and Business paths. Hosting rollback restores frontend files only; it does **not** restore Functions/rules/indexes, Stripe or Git history. Because this scope adds no backend logic, a backend change would be a material scope difference requiring renewed review. Prepare a separate approved revert PR for the integration commit so the next master build does not republish a withdrawn route. Preserve the original source histories and uploaded-data prohibition.

## Launch learning

After a separately approved pilot, observe whether first-time people can choose a dataset, understand one finding, verify its source and clear their data. Use lightweight actual feedback; internal tests are not real visitors, customers or revenue. Outbound stays **Pending Founder Setup**. No additional analytics infrastructure, categories or model activation is needed to learn from this experience.
