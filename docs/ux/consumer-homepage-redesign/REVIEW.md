# Consumer homepage — founder review candidate

**Development-only; no merge or deployment authorized.** Separate `codex/consumer-homepage-redesign`, based on #62 at `91b5fb71e093f38ca9c7cb6e05b773c6446b866a`, a descendant of integrated #60. PR #54's consumer positioning, #49's sample/Business contract, #58/#59 metadata/guides and #62's print control are preserved and extended. No #55 calculator commits/routes added. PRs #60, #62 and #63 retain their existing heads and approval scopes. Exact new commit/CI references are recorded in the PR and current handoff.

## Before and after

Before captures are the previously reviewed #60 images: homepage source is identical at the #62 baseline. Reuse the original files rather than adding duplicate binaries. After captures use the current local emulator bundle, installed headless Chrome, blocked external fonts/network, CSS pixels. Full page: 1280×4495 desktop, 390×6909 mobile; also reviewed 320×7578. These are browser emulations, not physical-device certification.

| View | Before | After |
|---|---|---|
| Desktop first screen | [Before](../../releases/2026-10-22/integrated/screenshots/desktop-homepage-fold.png) | [After](screenshots/after-desktop-fold.png) |
| Desktop full page | [Before](../../releases/2026-10-22/integrated/screenshots/desktop-homepage-full.png) | [After](screenshots/after-desktop-full.png) |
| Mobile first screen | [Before](../../releases/2026-10-22/integrated/screenshots/mobile-homepage-fold.png) | [After](screenshots/after-mobile-fold.png) |
| Mobile full page | [Before](../../releases/2026-10-22/integrated/screenshots/mobile-homepage-full.png) | [After](screenshots/after-mobile-full.png) |
| Narrow 320px | — | [Full page](screenshots/after-narrow-full.png) |
| Interactive examples | — | [Desktop job offers](screenshots/after-desktop-discovery-career.png), [mobile Business](screenshots/after-mobile-discovery-business.png), [320px comparison](screenshots/after-narrow-discovery-compare.png) |

[All 15 after-image checksums/review observations](visual-review.json), [measured headings, bounds and dimensions](visual-observations.json).

## Consumer journey and available functionality

“Big decisions deserve better answers.” introduces a broader decision platform in plain language. The primary CTA jumps to a real, keyboard-operable four-choice discovery section, without requesting registration first. A separate visible hero link opens the existing public sample.

| Decision | Working path today | Explicit limitation |
|---|---|---|
| Move somewhere new | Free relocation/job-offer guide, no account | Personal relocation calculations are in development; compare manually |
| Choose between job offers | Free job-offer guide/checklist | No automated offer comparison or financial result |
| Explore a business opportunity | Existing free Business brief registration | Account required, no credit card; Census city context does not establish demand/rent/competition/foot traffic |
| Make sense of other options | Free comparison framework | Uploads and flexible automated analysis are in development; no arbitrary question-answering or file analysis |

Native buttons expose pressed state, retain keyboard focus and announce the updated panel politely. Selection stays in component memory and resets on reload; no new event or storage write. There is no chat box, financial input or hidden calculator. Guides open static real pages, not pretend generated answers. Available free value is educational guidance plus the existing Business brief, not a new consumer calculation engine.

The public report then demonstrates real Census-cited Austin/Nashville/Charlotte income figures, with data period and limits. Trust explains provenance, uncertainty and privacy. The secondary Business section retains free registration, a **$79/report** CTA carrying `intent=report`, and **$39/month Pro with five reports/month**. Existing authentication, checkout, entitlements, report output and print behavior are untouched. Contact, privacy, terms and guides remain reachable.

Design: warm ivory, forest/sage accents, editorial serif headlines, spacious cards, CSS illustration, responsive grids and restrained hover feedback with reduced-motion handling. Uses Angular/CommonModule/RouterLink and existing fonts; no dependency or asset service introduced.

## Verification and measured findings

- Production build, emulator build and production bundle guard: **PASS**. Run builds sequentially: both regenerate the same ignored `public/guides` output. One concurrent attempt failed on a transient missing generated guide; a fresh sequential build passed.
- Fast unit/SEO/safety tests **87/87 PASS**; Functions unit **72/72 PASS**. Changed TS/HTML lint **PASS**.
- Final complete local browser run **98/98 PASS, 0 failures/errors/skips, exit 0, 2.0m**, one worker. [Every case](browser-case-results.json). Desktop 1280×800 / mobile 390×844 plus 320px checks. Includes all four discovery states, keyboard operation, pressed/live semantics, non-persistence, reduced motion, guide/sample navigation, $79/$39/Pro allowance, paid registration intent, real emulator account/brief flows, saved reports, tenant/limit/verification boundaries, intercepted checkout destinations, paid rendering/copy/print contracts and public sample print.
- Axe WCAG 2 A/AA + 2.1 A/AA: **zero violations in each discovery state** and the integrated public-surface checks. Direct actual-background heading contrast: minimum **5.40:1** across eight heading targets; all visible homepage links/buttons at least **44px high**, no overflow at 320/390/1280px. These checks complement, not replace, manual assistive-technology testing.
- First complete draft run found selected-card number contrast **4.17:1** (eight failing homepage/a11y cases; 90 other cases passed). Darkened `#5b735f` → `#3d5742`; the final complete run is green. One later two-worker run completed 49 desktop cases then stalled between projects and was stopped: **incomplete**, not a full pass. A subsequent reused-port attempt executed no tests; final fresh-port one-worker run completed all 98. Earlier incomplete/failed runs are not hidden or counted as successes.
- Actual Firebase Hosting production-build SEO audit **56/56 observations PASS**, JavaScript on/off at mobile/desktop widths; **9 unique sitemap URLs**, initial/rendered title/description/canonicals/share tags, WebApplication/guide schema, robots, redirects, private noindex and genuine HTTP 404 for missing routes and `/life/quick-compare`. [Audit](seo-audit.json). Homepage title is “ifYouMind — Big decisions deserve better answers”. No fictional consumer offer schema added. Report body needs Firebase; complete sample rendering is covered by the emulator suite, not the offline SEO audit.
- Global lint **FAIL: 91 errors**; full Angular test command **FAIL before execution: 11 TS compiler diagnostics** (plus corresponding missing-module bundler/Karma load messages). Fresh normalized comparison against clean master `bb6744b330378e63506cb90334098e6dfe2b86ff`: **identical signatures, zero new errors**. [Exact comparison](baseline-comparison.json). These are disclosed debt, not silently waived or represented as passing unit tests.
- Build warnings remain: initial bundle ~653.54kB against 500kB warning; homepage component style ~7.19kB against 4kB warning, below 8kB hard limit. Other existing component style warnings persist. [Local build checksums](production-manifest.json). No measured field performance/lift claim.

Existing global test debt, native PDF export, physical iOS/Safari, manual screen reader, field Core Web Vitals and live post-deployment behavior remain unverified. Homepage body remains client-rendered as in the integrated baseline; initial metadata and static guides are generated. No search-ranking/indexing guarantee or newly discovered SSR regression claimed.

## Commercial hypotheses and founder decisions

Clearer purpose and a no-account starting point may improve relevant exploration; visible sample quality/limits may improve qualified Business conversions. These are **hypotheses**, not measured conversion improvements. The five-second comprehension goal has not been user-tested. Measure useful guide/sample/brief engagement and independent payments after an approved release; button clicks are not completed decisions or revenue.

[Revenue plan](../../growth/REVENUE_GROWTH_PLAN.md) and [restored Stripe access/method record](../../growth/STRIPE_BASELINE_2026-10-22.json) distinguish actual records from projections. The founder explicitly denied ever confirming purchases; older attribution is retracted in instructions, handoff, Notion and PR descriptions. This redesign does not establish a customer outcome. Actual financial figures are retained locally and withheld from GitHub pending explicit publication approval required by automatic approval review. [#63 buyer package](https://github.com/alwat83/ifyoumind/pull/63) remains separate, with twenty researched groups, five unsent personalized drafts/demo agendas and tracker. Next commercial assignment is approved introductions and the first buyer conversations.

**Review gate:** inspect this design and its own exact final-head CI before approving. #60's earlier green checks cannot approve this changed homepage. Candidate dependency order is #60 → #62 → redesign, with fresh retarget/rebase/integration checks at each step; #63 is separate documentation/research. Their shared handoff/growth edits may need a documentation-only reconciliation, preserving both histories and this correction. Do not blindly merge every source PR again: #60 already integrates #49/#54/#57/#58/#59 once.

Founder must explicitly approve each release scope and automatic master-push deployment of Hosting, Firestore rules/indexes, Storage rules and listed Functions. No approval received. Stripe, pricing, secrets, rules, backend, workflow and lockfiles unchanged. No real transactions/outreach/spend/production writes.

## Rollback readiness

Current live baseline was independently read as Hosting version `f91311de8f35458e`, release `1792026155391000` (October 15); refresh before any release. The integrated [decision/rollback brief](../../releases/2026-10-22/integrated/FINAL_DECISION.md) records the approval-gated Hosting clone and wider deployment considerations. New homepage changes are isolated to its source/test/metadata/documentation commit(s), so prepare a reviewed source revert and retest before any later authorized master push. A Hosting rollback does not roll back Functions/rules. No rollback command executed; it requires separate founder authorization.
