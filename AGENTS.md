# ifYouMind — Agent Instructions

## Scope and identity
This file applies ONLY to the **ifYouMind** repository `alwat83/ifyoumind` and website `ifyoumind.com`.
**Never confuse ifYouMind with Dose Ninja.** They have separate codebases, product plans, credentials, Notion spaces, release histories and agent attribution.

**Authoritative historical attribution (founder confirmation, 2026-10-10): ALL ifYouMind development to date has used OpenAI tools and agents (ChatGPT/Codex). Claude, Gemini and other providers have made NO contributions to ifYouMind to date.** Do not invent or infer past contributions from other providers. Future agent contributions must be recorded when they actually occur. A GitHub account or branch name does not prove a specific OpenAI model authored a commit.

## Standing consumer-first product and engineering directive — November 17, 2026

**AI for everyone. AI made for you.** ifYouMind helps everyday people understand information, answer meaningful questions, and make better decisions. Our defining standard is that a grandmother can visit on her phone, ask a question in her own words, and receive a simple, thorough answer she can understand and trust. Apply this standard to every major product decision and use it to resolve conflicts with older priorities in this file. Read the [product experience blueprint](docs/product/PRODUCT_EXPERIENCE_BLUEPRINT.md) for supporting product context. The roadmap and this directive confer no release, paid AI, billing, or expanded-data authorization.

**Question first.** Preserve Ask → Understand → Analyze → Explain → Decide. Accept ordinary language and forgiving inputs. Start with the question the visitor actually asked. When a missing input changes the answer, ask one clear question at a time and explain why it matters. Remove complex category selection, data setup, and unnecessary steps before the question. Property tax leads consumer Discovery and electricity follows. These are the first examples of a broader evidence-aware experience. Describe only capabilities supported by verified data, accuracy checks, and a working journey. Treat examples about other bills, letters, places, and deals as vision until supported.

**Answer first, evidence on demand.** Lead with the strongest supported conclusion in plain language, explain what it means, and use progressive disclosure for numbers, reproducible calculations, sources, and limitations. Explain percentages and unfamiliar terms in context. Offer one practical next action or follow-up question when useful. Keep examples, user-entered figures, source facts, calculations, and AI interpretations distinguishable. When the evidence is insufficient, state what is missing and offer the next useful step. Keep private data and paid AI within separately authorized boundaries.

**Design across generations.** Start on mobile and assume the visitor has no experience with AI or spreadsheets. Use readable type, strong contrast, comfortable touch targets, familiar button labels, simple navigation, keyboard and screen-reader access, and plain-language errors with a clear recovery. If a visitor needs instructions to use the interface, simplify it. **When in doubt, remove rather than add. Every element must earn its place on the screen.**

**Build trust before monetization.** Deliver a meaningful, evidence-backed free consumer finding before asking for an account or payment. Measure first-answer completion, understanding, confidence, and reasons to return before optimizing revenue. Keep the existing $79 Decision Report and Business infrastructure operational. Deprioritize additional $79 funnel work and keep upsells from dominating consumer journeys. Preserve Starter ($4.99/month), Plus ($9.99/month), and grandfathered subscriptions including legacy $39/month Pro. Changing prices or enabling enrollment requires founder authorization.

### The Grandmother Test

For every significant consumer-facing feature, record the answers and supporting evidence in the [PR template](.github/pull_request_template.md).

1. Can someone unfamiliar with AI understand the page's purpose within five seconds?
2. Can they ask their question without instructions?
3. Can they understand the main answer without technical terminology?
4. Can they find where the answer came from?
5. Can they tell what to do next?
6. Can they recover when something goes wrong?
7. Would they feel comfortable using it again?

Simplify before expanding functionality when the review exposes a gap. Use realistic first-use journeys, desktop and mobile checks including 320 px, automated accessibility checks, and keyboard and screen-reader verification as applicable. Validate comprehension, confidence, and return intent with representative users when possible. Record user observations separately from engineering checks and identify any untested coverage.

### Current execution sequence

After [PR #111](https://github.com/alwat83/ifyoumind/pull/111) passes its separately authorized production deployment and release gates, start [Issue #113](https://github.com/alwat83/ifyoumind/issues/113). Audit the live homepage and Discovery as a first-time nontechnical visitor. Ship the smallest high-impact improvement to the free first answer, starting with property taxes and keeping electricity secondary. Verify a useful no-signup result and progressive evidence disclosure at desktop, mobile, and narrow widths. Include automated accessibility and realistic recovery checks, privacy-safe signals for first-answer completion, evidence engagement, and return use, before-and-after screenshots, exact-head CI, and a release recommendation. Reuse existing analytics conventions and keep questions, bill inputs, and personal information out of event payloads. Deliver working, tested changes in focused PRs. Founder authorization still governs merge and deployment.

## Founder product vision — automatic discovery, October23,2026

**Mission:** make AI-driven data discovery accessible to everyday people, including people who have no AI or prompting experience. **Core promise: “You bring the data. We’ll find the story.”** The defining future experience is user-provided information followed by automatic, useful, evidence-backed findings before the user knows what to ask. This is product direction, not a claim of live arbitrary uploads or AI analysis.

Prefer interaction-first, relatable, mobile-friendly entry points with minimal narrative; useful evidence should appear after a small first action, not require prompt writing or funnel every choice into a guide. The three homepage concepts are exploratory founder-review prototypes, not an approved redesign. The newer automatic-discovery direction governs architecture and any future implementation.

Before major work, review the [automatic-discovery proposal](docs/product/AUTOMATIC_DISCOVERY_PROPOSAL.md): reuse existing ingestion/auth/data/reporting safely, build one narrow vertical slice, distinguish deterministic calculations/AI interpretations/external comparisons, require provenance/uncertainty, protect private files, bound retention/cost and reject unsupported conclusions. Two annual statements do not establish a trend, correlation or cause. No large rewrite, paid model activation, public file capability, new pricing, Life calculator, merge/deploy or outreach without the applicable founder approval. Preserve current Business79report/39monthlyPro and production. Outbound remains Pending Founder Setup; no sender questions.

## Phase 1 authorization — local only, October23,2026

Founder approved local implementation/testing of automatic-discovery Phase1 from #69exactee7d05be4a301a21918fbf20a2eb54ab4093304b. Working experience: no-prompt two-year property-tax example/recognized redactedCSV, traceable deterministic findings/corrections/clear and mobile/a11y tests. [Working review](docs/product/discovery-phase1/REVIEW.md). Keep its separate Angular entry/build outside the production app import/route/assets graph; no backend upload, persistence, AI/provider/API calls, new pricing or Business changes. This approval does not authorize merging/deployment or later PDF/AI/storage phases. Next design decisions follow interaction with this experience, not more homepage mockups. Outbound remains Pending Founder Setup.

**Founder review follow-up, October23:** Phase1 confirms the correct product direction; automatic discovery remains the foundation. Focus PR70 on conversational findings, mobile first-use validation, truthful failure/insufficient/correction/clear states and preserved evidence. [Follow-up review and narrowly scoped Phase2 recommendation](docs/product/discovery-phase1/FOUNDER_FOLLOWUP.md). Evaluate a second explicit dataset adapter before generalizing parsing; its implementation is not authorized by a recommendation. AI, PDF, external comparisons, server storage and production integration remain separate gates.

## Electricity prototype authorization — local only, October23,2026

Founder approved detailed design/local prototype for one recognized household-electricity CSV after Phase1 readiness. Preserve PR70 at169128cba5464bf9d1a89574ca2399aaaae18c4b; use a separate feature branch/draft PR. Reuse the shared discovery contracts, evidence, validation/calculation helpers and presentation; do not create an independent analysis engine or universal parser. Distinguish consumption, total billed, whole-bill effective unit cost and source-identified fixed/variable charges; require compatible periods/units, refuse unsupported splits/causes, keep household input local. [Prototype scope/review](docs/product/discovery-electricity/REVIEW.md), [Phase1 final decision](docs/product/discovery-phase1/FINAL_READINESS.md). This supersedes earlier “Phase2notapproved” planning notes only for this local CSVprototype. No merge/deploy/PDF/AI/externalcomparison/backendstorage/Stripe/outreach; Pending Founder Setup remains.

## Unified discovery authorization — local only, October 23, 2026

Founder approved one coherent local entry for the existing property-tax and electricity CSV experiences. Preserve PR70 at `169128cba5464bf9d1a89574ca2399aaaae18c4b` and PR71 at `b26b5bd4e840b0fc5d59bd60b2d40412a1815a24`; PR71 includes PR70 ancestry. Reuse the shared engine, evidence, correction/recovery and clearing lifecycle. No new homepage overhaul, universal parsing framework or dataset category. [Unified founder walkthrough](docs/product/discovery-unified/REVIEW.md) and [production integration/release proposal](docs/product/discovery-unified/RELEASE_PLAN.md) distinguish working local scope from proposed public integration. A production `/discover/` island is a proposal, not implemented or authorized by this local assignment. Do not merge overlapping source branches or trigger automatic production deployments without exact release authorization. Existing privacy, Business, pricing, AI/PDF/comparison/storage and Pending Founder Setup gates remain unchanged.

## Founder decision — October 24, 2026: direction accepted, development paused

The founder reviewed PR72 at `73fc727486b0269a1a4d2680454ab4760299a71d`: the unified discovery concept is closer to the original ifYouMind vision and its **product direction is approved; the visual aesthetic is not final**. Planning and implementation of the narrow `/discover/` integration are approved **on a separate feature branch when development resumes**. Preserve the existing production homepage, Business functionality, $79 Decision Report/$39 monthly Pro pricing, browser-local processing and all existing privacy/capability restrictions. No merge or deployment is authorized; each requires separate explicit release approval. No additional redesign or feature expansion is authorized today.

**After recording this direction, pause all further development until the next founder session.** Do not begin integration planning/implementation, create its feature branch, rerun engineering QA or expand scope today. Preserve PR70/71/72 and all existing worktrees/drafts. Outbound remains **Pending Founder Setup**. This newer decision supersedes older notes that public integration implementation still awaits scope approval; it does not supersede merge/deployment, AI/PDF/comparison/server-storage, pricing or outreach gates.

## Founder resume — October 24, 2026: execute discovery integration

Founder explicitly resumed development and authorized narrow `/discover/` implementation on a separate feature branch using reviewed PR72, superseding the prior pause. Do not restart architecture/planning or redesign. Integrate the existing two-category Angular experience while retaining its isolated browser-local bootstrap/privacy boundary; preserve production homepage except a sensible navigation link, Business/authentication79/39 and Stripe behavior. Verify examples, recognized CSVs, evidence/correction/retry/switch/clear, Hosting paths/headers, desktop/mobile/accessibility and baseline failures. Commit/push a draft integration PR and exact-head founder release package. **No merge/deploy without separate explicit approval**; no new AI/PDF/server uploads/comparisons/categories/pricing. Outbound Pending Founder Setup. Visual aesthetic remains unfinished, not a new redesign authorization.

## Founder visual redesign direction — November 4, 2026

Founder explicitly requests a modern, clean, simple, imagery-led and playful design with less text and less friction understanding ifYouMind, trying it and eventually choosing a paid offering. A focused homepage/discovery redesign on a separate feature branch is authorized; this supersedes earlier no-redesign scope limits for this assignment. Preserve truthful current capabilities, browser-local privacy, evidence, mobile/accessibility and the existing free/paid Business paths. No pricing/Stripe changes, speculative capabilities, master merge, production deployment or outbound communication are authorized. [Art direction and working-review evidence](docs/design/visual-first/REVIEW.md). Design approval, release approval and measured conversion are separate.

**November 4 release completed:** reviewed PR75 is now merged/deployed and read-only production verified. [Exact release/CI/live evidence](docs/releases/visual-discovery-20261104/LIVE_VERIFICATION.md). This approval is fulfilled; future releases still need their applicable approval. Outbound remains Pending Founder Setup.

## Founder engagement follow-up — November 4, 2026

Founder loves the deployed visual direction and requests another modern-design iteration that maintains engagement: earn attention in the first few seconds. Continue focused feature-branch homepage work, emphasizing immediate useful output, small interactions and evidence. [Working iteration](docs/design/first-seconds/REVIEW.md). Preserve current capability/privacy/Business boundaries. This does not authorize a new release or claim measured engagement improvement; validate with real first-use observations separately.

## Source of truth — mandatory order
**Founder correction, 2026-10-22: GitHub and repository documentation are the source of truth for development.** The accessible Notion coordination hub, confirmed by the founder, is:
https://app.notion.com/p/3eb02474659c81ecba55cc4eed184a71

1. **Read this file, `docs/agent-handoff/CURRENT_STATUS.md`, recent `DEVELOPMENT_LOG.md` entries and current founder directives.** Newer founder corrections supersede historical task lists.
2. **GitHub master, PRs, CI and Firebase** are authoritative evidence for what is committed, merged, built, deployed and production-verified; never infer production status from a commit.
3. **[IFYOUMIND_MASTER_PROJECT.md](IFYOUMIND_MASTER_PROJECT.md)** preserves durable architecture, history, current handoff and roadmap; keep it synchronized with Notion.
4. Other agent notes and conversations are supporting context, not a competing roadmap.

Notion remains a synchronized coordination record. If unavailable, record the blocker and continue independent work; never create a duplicate hub or overwrite an unverified destination. The previous `3f5c9bc5d8fd805ebaa6eae586db23bf` hub ID returned NOT_FOUND. Historical Notion-first wording is superseded by this founder correction.

**Direct founder correction, 2026-10-22:** The founder has never stated that purchases were confirmed. Earlier repository and agent statements attributing successful paid purchases to the founder were incorrect and must not be repeated as evidence. Stripe checkout, billing portal, webhook and report entitlement logic are implemented in master; implementation and emulator checks do not prove a real purchase. Live commercial records must be assessed separately from implementation; publish sensitive financial figures only with explicit authorization. Scope financial statements to verified records; preserve working report/print flows without inferring that zero receipts means payment code is broken. Track independently verified paid outcomes under the standing consumer-first priorities above.

**Historical active work (2026-10-10; current snapshot supersedes):** Draft PR #3 (`codex/checkout-report-confirmation`, commit `7a78d090`) corrects checkout-return messaging so the UI checks actual report/Pro entitlement before claiming access. GitHub launch build PASS; PR is **not merged or deployed** as of last check. This is polish, not evidence that purchases are broken. Draft FRED PR #2 is separate, nonessential to launch and should not distract from revenue. Historical B2B-first plans and older status tables are superseded by consumer-first launch priorities.

**Agent protocol:** (a) read Notion + this file + master MD; (b) inspect relevant code and current PR/CI; (c) work on one scoped item aligned with the standing consumer-first directive without duplicating other agents; (d) update Notion after meaningful changes and synchronize master MD; (e) hand off with branch/commit/PR, test outcome, deploy evidence, exact next action. No agent should claim a change is merged, deployed or live without evidence.

## Before making changes
- Read this guide and the master project document; inspect actual repository state, recent commits, branches, workflows and relevant tests.
- State scope, assumptions, branch and acceptance criteria. Check for concurrent agent work before touching shared files.
- Do not silently rewrite unrelated code or mix Dose Ninja assets into this repository.
- Never expose secrets or API keys in code, commits, logs or documentation. Keep API secrets server-side.

## Cross-surface engineering standard

For every meaningful change, assess the full impact before implementation. Use the [PR template](.github/pull_request_template.md) to record an impact matrix with **Change Required**, **Verify Only**, or **Not Affected**. Give a rationale for each row and add evidence as work progresses. Cover relevant public, authenticated, commercial, responsive, application-state, and operational surfaces. Include intentionally unchanged areas and explain their status.

Inspect the shared design and interaction patterns before introducing new ones. Reuse suitable components, tokens, and accessible semantics. Treat a broader redesign as a separate scoped change when the existing surface serves a different task. Preserve security, authentication, pricing, entitlements, and data boundaries unless the founder has authorized a specific change.

Verify complete affected journeys, including relevant keyboard, touch, viewport, reduced-motion, loading, error, retry, and authorization states. Record exact commands, commit and CI results, visuals when relevant, and any skipped, untested, or pre-existing failures. Keep the PR, repository handoff, and Notion hub aligned with the evidence. Founder authorization is required for merge and production deployment under the release and safety rules below.

Use one visual identity across every customer and administrative journey. Start with the [design system](docs/design/DESIGN_SYSTEM.md) and inspect the actual rendered routes, return paths and feedback states before proposing a new pattern. Apply the same typography roles, palette, controls, navigation conventions and interaction states where the task permits. Record intentional differences, provider-owned exceptions and material discontinuities in the PR. Include before-and-after mobile and desktop evidence, responsive and accessibility checks, and review the sequence of screens as a journey.

Run affected visual comparisons against reviewed, committed baselines. Missing baselines and material unexplained differences block release. Do not regenerate baselines in CI or accept them in bulk. Document the intended change, inspect the actual and diff images, and update only the reviewed images using the [baseline procedure](docs/design/DESIGN_SYSTEM.md#visual-regression-baselines). A green run and a baseline update do not authorize a release.

## Development and release
- Use the repository's actual package scripts and lockfiles; inspect before running commands. The historical stack includes Angular, TypeScript, Firebase/Firestore/Functions and Stripe.
- Prefer targeted tests plus build and regression checks. Verify tenant isolation, authentication, billing entitlement boundaries, data source attribution, rate limits and graceful API failure handling.
- For external APIs, document source, endpoint, cost/quota, license, freshness, fallback and provenance.
- For changes involving Firebase/Stripe/production, distinguish local build, CI pass, deployed revision and verified live behavior. Do not claim green production without evidence.
- Prefer focused commits/PRs with an explicit test and rollback note. Avoid blind merges of older `codex/*` branches.

## Handoff record (for every significant workstream)
Record: date, provider/agent (OpenAI historically; others only if newly involved), branch, commit/PR, files changed, feature/decision, tests and results, deployment evidence, blockers, follow-ups, and Notion/master-doc updates. Unknown specific agent session should be marked **unknown**, not guessed.

## Documentation rules
Update `IFYOUMIND_MASTER_PROJECT.md` and the ifYouMind Notion project hub when milestones change. Use status labels: **planned**, **in progress**, **committed**, **merged**, **deployed**, **production verified**. Preserve historical decisions and open risks. Keep Dose Ninja documentation separate.

## Permanent development reporting and handoff protocol — 2026-10-22

This is a persistent project-level instruction for every Codex agent and all other authorized agents working in `alwat83/ifyoumind`. Follow it automatically at the end of every meaningful development session or completed assignment, without requiring the founder to repeat it. It is a session workflow, not a scheduled automation or permission to send messages externally.

### Start of each assignment

- Read root `AGENTS.md`, review `docs/agent-handoff/CURRENT_STATUS.md`, and consult recent entries in `docs/agent-handoff/DEVELOPMENT_LOG.md`.
- Inspect actual branch, commit, uncommitted/unpushed changes, worktrees and relevant PR/CI status before changing files. Check for concurrent work; preserve it.
- Consult the master project record for architecture/history and the current roadmap. Reconcile older notes against current founder directions and GitHub evidence.

### End of each meaningful assignment

- Append a dated entry to `docs/agent-handoff/DEVELOPMENT_LOG.md`; never erase or replace prior entries. Include work performed, provider/agent, files/components, verification commands/results, branch/commits/PRs/issues, release/deployment evidence, blockers and next steps. Mark unknown attribution as unknown.
- Refresh `docs/agent-handoff/CURRENT_STATUS.md` as the concise current snapshot: latest verified GitHub status with exact heads and check links, release readiness, active priorities, unresolved blockers and local/unpushed work. Include the observation date and distinguish planned, in progress, committed, merged, deployed and production verified.
- Keep `IFYOUMIND_MASTER_PROJECT.md` for durable product history, architecture and roadmap. Link detailed evidence rather than copying multiple competing status tables. Synchronize meaningful milestones to the verified Notion hub; document unavailable integrations and continue independent work.
- Provide a comprehensive but readable report in the Codex conversation using all six sections below. Reference evidence and limitations; another agent must be able to continue without founder repetition. For interrupted or incomplete work, report the actual stopping point and do not label the assignment completed.

### Required conversation report (A–F)

**A. Executive Summary:** what was accomplished, why it matters, and which product goals it advances.

**B. Development Changes:** features implemented, bugs fixed, files/components modified, and any architecture or dependency changes. Say explicitly when there were none.

**C. Verification:** tests and results, build/lint results, GitHub Actions/CI status on exact commits, and what remains untested or unverified. Separate newly executed checks from historical evidence; skipped checks are not passes.

**D. GitHub Activity:** current branch, commit hashes, PRs created/updated, issues created/resolved or still open, and uncommitted/unpushed changes. Report preserved work in other relevant worktrees as needed. Do not guess CI or commit states.

**E. Deployment Status:** ready-for-release work, current live evidence versus development-only features, outstanding blockers, and required founder approvals. A green build or commit is not deployment proof.

**F. Next Steps:** exactly three highest-priority actionable tasks, their dependencies/risks, and the recommended next assignment. Separate implemented/tested capabilities from verified customer outcomes; never invent founder confirmations.

### Release and safety rules

Never merge into `master`, deploy production, alter Stripe configuration, or publish experimental financial calculations without explicit founder approval. Successful checks do not grant approval. Master-push workflows may deploy production; account for that consequence before any authorized merge.

Preserve local changes and avoid overwriting another agent's work. Never invent test results, deployment confirmations, customer metrics, GitHub statuses or attribution. Clearly distinguish verified problems from recommendations. If an integration is unavailable, document the blocker and continue independent work.

## Permanent revenue and profitability mandate — 2026-10-22

Operate with commercial accountability under the standing consumer-first directive. Prioritize useful first answers, understanding, trust, and return use ahead of conversion optimization. Preserve the existing Business funnel and keep commercial records accurate. Prioritize checkout maintenance when a verified defect threatens access, security, payment integrity, or existing customers.

Read and maintain [the Revenue Growth Command Center](docs/growth/REVENUE_GROWTH_PLAN.md). Rank work using observed first-use friction, likely impact on consumer understanding and return use, effort, time to evidence, and operational risk. Recommend representative user validation when it can answer the next product question more directly than additional code.

Maintain the weekly revenue scoreboard in that plan with source, observation date, scope and exclusions. Track qualified visitors, completed free decisions, checkout initiations, successful paid purchases, active paying subscribers, gross revenue, refunds, payment fees, infrastructure/AI costs and estimated contribution margin. Unknown is not zero. Exclude test, founder/QA and duplicate payments before claiming independently paying customers; reconcile renewals/refunds/fees against the correctly scoped Stripe account. A checkout return, signup, test pass or a working purchase-flow demonstration does not establish revenue, customer count or willingness to pay. Separate shipped functionality, verified business outcomes and projected opportunities.

Authorized independent work includes market/customer-journey research, analysis of accessible performance data, feature-branch improvements and tests, draft landing pages/content/experiments, draft PRs, and GitHub/repository coordination. Draft customer/partner communications may be prepared but must not be sent without explicit founder approval. No new spending, paid services, real transactions, price/Stripe configuration changes, major business-model changes, production deployment or master merge without explicit founder approval. Experimental Life calculations remain subject to methodology approval. Do not bypass another release branch's approval gate.

Extend the required A–F conversation report with **G. Business Impact:** revenue opportunity addressed; customer problem; expected commercial benefit; supporting evidence; metrics affected; actual results versus assumptions; next revenue-focused action. Append these distinctions to the development log and keep the current snapshot/master record synchronized. This mandate is permanent project guidance, not authorization for unattended scheduled work, external messages or spending.

## Public release privacy — founder consolidation directive, 2026-10-22

Keep prospect identities, contact/routing details, personalized outreach and sensitive buyer research outside public release branches, build artifacts and Notion/public coordination updates. Recover such work into ignored local private storage or a founder-approved private system. Preserve original PR histories; do not import the acquisition-research branch into a production candidate. Public records may summarize readiness/counts without identifying prospects. The founder-approved October 22 aggregate Stripe snapshot remains allowed in GitHub growth/handoff documentation; this is not a blanket financial-data disclosure approval.

## Founder strategic reset — zero-to-one market entry, 2026-10-22

**ifYouMind is a clean-slate product entering the market, not an established business undergoing performance optimization.** Substantial implemented technology does not establish a customer base, validated demand or meaningful commercial history. This newer founder direction supersedes analysis-first priorities and historical language implying existing cohorts or traction; preserve financial evidence and safety/privacy/reporting rules.

Act execution-first: (1) launch the consumer-first experience after explicit approval; (2) make it understandable and immediately useful; (3) get real people to try it; (4) earn the first independent sale; (5) learn directly from initial users; (6) improve demonstrated needs. Business Reports are the initial monetization path, not the whole platform identity. Broad vision: a general-purpose evidence-driven decision platform for consumers and businesses; accurately label unfinished tools. No speculative features to appear complete.

Market-entry milestones, sequential learning goals and not forecasts: public consumer homepage launched → first 100 genuine visitors → first 10 meaningful experiences → first five qualified buyer conversations → first independent paying customer → first five independent paying customers. Do not wait for historical traffic, sophisticated dashboards, cost reconstruction or nonexistent customer cohorts to launch or prepare distribution. Unknown costs block profitability claims, not progress. Use lightweight manual/available consented measurement as real activity begins; do not construct elaborate systems.

Maintain the concise launch scoreboard in the growth plan: real visitors; meaningful product experiences; qualified buyer conversations; paying customers; revenue; most important user feedback; next launch action. Unknown stays unknown, and sourced zero stays scoped. Retain the approved October 22 Stripe baseline and privacy controls. Keep the permanent A–G handoff readable and brief, with actual tests/Git/release evidence and three concrete next actions; distinguish shipped capabilities, learning milestones and hypotheses.

Distribution is core work: prepare authentic founder demonstrations, organic launch posts, relevant community contributions, useful search guides, referrals and direct buyer conversations. Prioritize people with a real decision; no manufactured testimonials, engagement, reviews or success stories. Prepare actual launch materials and private personalized messages, not only strategy. External communication still requires separate founder authorization; production merge/deployment, spending and Stripe/pricing changes remain gated. Every assignment should identify how it helps real people get, understand, or return to a useful answer.


## First users and first customers — founder directive, October23,2026

The consumer launch established the need for real outside-user experiences. Use the standing consumer-first directive to prioritize verified first-use friction and useful answers. Before any external message or announcement, obtain founder approval of the **specific audience, sender identity/account, channel and exact content**; follow-ups require their own included scope. An accessible unrelated mailbox is not an ifYouMind sender. Prepare authentic private buyer notes, demo and launch materials; verify public business routes without guessing contact details, misusing customer/franchise-application forms, spending on enrichment or inventing consent. Keep private prospect details and messages out of public GitHub/Notion records. Track actual responses, useful experiences, feedback and independently verified purchases with lightweight records; internal visits, tests and transactions are not traction.


## Current founder decision — Pending Founder Setup

October23,2026 CDT. LinkedIn publishing profile, official ifYouMind sending email and outreach channels will be configured and approved later. **Defer all external publishing and outreach.** Do not use Dose Ninja email or substitute any connected mailbox. Preserve every announcement, personalized note and launch asset as an unsent draft. Account setup is **Pending Founder Setup**, not a development blocker; do not repeatedly request sender details or distribution approval while this direction stands. Resume only after account setup and specific founder approval of audience, sender, channel and content. Continue safe product readiness, tests, launch preparation, documentation and organic planning; no merge/deploy/spend/Stripe change or speculative features.
