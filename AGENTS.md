# ifYouMind — Agent Instructions

## Scope and identity
This file applies ONLY to the **ifYouMind** repository `alwat83/ifyoumind` and website `ifyoumind.com`.
**Never confuse ifYouMind with Dose Ninja.** They have separate codebases, product plans, credentials, Notion spaces, release histories and agent attribution.

**Authoritative historical attribution (founder confirmation, 2026-10-10): ALL ifYouMind development to date has used OpenAI tools and agents (ChatGPT/Codex). Claude, Gemini and other providers have made NO contributions to ifYouMind to date.** Do not invent or infer past contributions from other providers. Future agent contributions must be recorded when they actually occur. A GitHub account or branch name does not prove a specific OpenAI model authored a commit.

## Product direction
Build a consumer-friendly, general-purpose, evidence-backed AI data intelligence platform. Users should be able to explore public and, later, permissioned private datasets, compare locations and other entities, generate clear Decision Reports, and understand data sources, limitations, and freshness. Business intelligence is one vertical, not the whole product. Prioritize mobile UX, trustworthy outputs, reliable production releases, monetization, and acquisition. Avoid geographically narrow demo examples.

## Source of truth — mandatory order
**Notion is the central project coordination source of truth** for current priorities, completed work, roadmap, statuses, decisions, and cross-agent handoffs:
https://app.notion.com/p/3eb02474659c81ecba55cc4eed184a71

1. **Read the latest Notion operating directive and updates first.** Newer founder corrections supersede historical task lists.
2. **GitHub master, PRs, CI and Firebase** are authoritative evidence for what is committed, merged, built, deployed and production-verified; never infer production status from a commit.
3. **[IFYOUMIND_MASTER_PROJECT.md](IFYOUMIND_MASTER_PROJECT.md)** preserves durable architecture, history, current handoff and roadmap; keep it synchronized with Notion.
4. Other agent notes and conversations are supporting context, not a competing roadmap.

**Current founder-confirmed working capabilities (2026-10-10):** Decision Reports, PDF generation and successful paid purchases. Do NOT reopen these as outstanding without new evidence of a regression. Stripe checkout, billing portal, webhook and report entitlement logic are implemented in master. **Next business priority: customer acquisition and revenue growth, after minimal release polish.**

**Active work:** Draft PR #3 (`codex/checkout-report-confirmation`, commit `7a78d090`) corrects checkout-return messaging so the UI checks actual report/Pro entitlement before claiming access. GitHub launch build PASS; PR is **not merged or deployed** as of last check. This is polish, not evidence that purchases are broken. Draft FRED PR #2 is separate, nonessential to launch and should not distract from revenue. Historical B2B-first plans and older status tables are superseded by consumer-first launch priorities.

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
