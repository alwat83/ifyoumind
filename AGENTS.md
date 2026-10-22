# ifYouMind — Agent Instructions

## Scope and identity
This file applies ONLY to the **ifYouMind** repository `alwat83/ifyoumind` and website `ifyoumind.com`.
**Never confuse ifYouMind with Dose Ninja.** They have separate codebases, product plans, credentials, Notion spaces, release histories and agent attribution.

**Authoritative historical attribution (founder confirmation, 2026-10-10): ALL ifYouMind development to date has used OpenAI tools and agents (ChatGPT/Codex). Claude, Gemini and other providers have made NO contributions to ifYouMind to date.** Do not invent or infer past contributions from other providers. Future agent contributions must be recorded when they actually occur. A GitHub account or branch name does not prove a specific OpenAI model authored a commit.

## Product direction
Build a consumer-friendly, general-purpose, evidence-backed AI data intelligence platform. Users should be able to explore public and, later, permissioned private datasets, compare locations and other entities, generate clear Decision Reports, and understand data sources, limitations, and freshness. Business intelligence is one vertical, not the whole product. Prioritize mobile UX, trustworthy outputs, reliable production releases, monetization, and acquisition. Avoid geographically narrow demo examples.

## Source of truth — mandatory order
**Founder correction, 2026-10-22: GitHub and repository documentation are the source of truth for development.** The accessible Notion coordination hub, confirmed by the founder, is:
https://app.notion.com/p/3eb02474659c81ecba55cc4eed184a71

1. **Read this file, `docs/agent-handoff/CURRENT_STATUS.md`, recent `DEVELOPMENT_LOG.md` entries and current founder directives.** Newer founder corrections supersede historical task lists.
2. **GitHub master, PRs, CI and Firebase** are authoritative evidence for what is committed, merged, built, deployed and production-verified; never infer production status from a commit.
3. **[IFYOUMIND_MASTER_PROJECT.md](IFYOUMIND_MASTER_PROJECT.md)** preserves durable architecture, history, current handoff and roadmap; keep it synchronized with Notion.
4. Other agent notes and conversations are supporting context, not a competing roadmap.

Notion remains a synchronized coordination record. If unavailable, record the blocker and continue independent work; never create a duplicate hub or overwrite an unverified destination. The previous `3f5c9bc5d8fd805ebaa6eae586db23bf` hub ID returned NOT_FOUND. Historical Notion-first wording is superseded by this founder correction.

**Current founder-confirmed working capabilities (2026-10-10):** Decision Reports, PDF generation and successful paid purchases. Do NOT reopen these as outstanding without new evidence of a regression. Stripe checkout, billing portal, webhook and report entitlement logic are implemented in master. **Next business priority: customer acquisition and revenue growth, after minimal release polish.**

**Historical active work (2026-10-10; current snapshot supersedes):** Draft PR #3 (`codex/checkout-report-confirmation`, commit `7a78d090`) corrects checkout-return messaging so the UI checks actual report/Pro entitlement before claiming access. GitHub launch build PASS; PR is **not merged or deployed** as of last check. This is polish, not evidence that purchases are broken. Draft FRED PR #2 is separate, nonessential to launch and should not distract from revenue. Historical B2B-first plans and older status tables are superseded by consumer-first launch priorities.

**Agent protocol:** (a) read Notion + this file + master MD; (b) inspect relevant code and current PR/CI; (c) work on one revenue-relevant item without duplicating other agents; (d) update Notion after meaningful changes and synchronize master MD; (e) hand off with branch/commit/PR, test outcome, deploy evidence, exact next action. No agent should claim a change is merged, deployed or live without evidence.

## Before making changes
- Read this guide and the master project document; inspect actual repository state, recent commits, branches, workflows and relevant tests.
- State scope, assumptions, branch and acceptance criteria. Check for concurrent agent work before touching shared files.
- Do not silently rewrite unrelated code or mix Dose Ninja assets into this repository.
- Never expose secrets or API keys in code, commits, logs or documentation. Keep API secrets server-side.

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

**F. Next Steps:** exactly three highest-priority actionable tasks, their dependencies/risks, and the recommended next assignment. Avoid reopening founder-confirmed completed capabilities without new regression evidence.

### Release and safety rules

Never merge into `master`, deploy production, alter Stripe configuration, or publish experimental financial calculations without explicit founder approval. Successful checks do not grant approval. Master-push workflows may deploy production; account for that consequence before any authorized merge.

Preserve local changes and avoid overwriting another agent's work. Never invent test results, deployment confirmations, customer metrics, GitHub statuses or attribution. Clearly distinguish verified problems from recommendations. If an integration is unavailable, document the blocker and continue independent work.

## Permanent revenue and profitability mandate — 2026-10-22

Operate with commercial accountability. In priority order: (1) generate verified independently paying customers; (2) increase revenue and conversion; (3) reduce friction from discovery to value; (4) retain paying customers and encourage repeat purchases; (5) minimize unnecessary infrastructure and operational expenses; (6) build functionality when it directly advances these objectives. Preserve the broader decision-platform vision and the existing Business funnel; do not default to speculative engineering.

Read and maintain [the Revenue Growth Command Center](docs/growth/REVENUE_GROWTH_PLAN.md). At each assignment, inspect the actual funnel and available evidence. At completion, rank the next revenue opportunities by expected near-term impact, evidence of demand, effort, time to measurable results, and cost/operational risk. Recommend the highest-value assignment, including research or customer validation when it outranks more code.

Maintain the weekly revenue scoreboard in that plan with source, observation date, scope and exclusions. Track qualified visitors, completed free decisions, checkout initiations, successful paid purchases, active paying subscribers, gross revenue, refunds, payment fees, infrastructure/AI costs and estimated contribution margin. Unknown is not zero. Exclude test, founder/QA and duplicate payments before claiming independently paying customers; reconcile renewals/refunds/fees against the correctly scoped Stripe account. A checkout return, signup, test pass or founder-confirmed working purchase flow does not establish revenue, customer count or willingness to pay. Separate shipped functionality, verified business outcomes and projected opportunities.

Authorized independent work includes market/customer-journey research, analysis of accessible performance data, feature-branch improvements and tests, draft landing pages/content/experiments, draft PRs, and GitHub/repository coordination. Draft customer/partner communications may be prepared but must not be sent without explicit founder approval. No new spending, paid services, real transactions, price/Stripe configuration changes, major business-model changes, production deployment or master merge without explicit founder approval. Experimental Life calculations remain subject to methodology approval. Do not bypass another release branch's approval gate.

Extend the required A–F conversation report with **G. Business Impact:** revenue opportunity addressed; customer problem; expected commercial benefit; supporting evidence; metrics affected; actual results versus assumptions; next revenue-focused action. Append these distinctions to the development log and keep the current snapshot/master record synchronized. This mandate is permanent project guidance, not authorization for unattended scheduled work, external messages or spending.
