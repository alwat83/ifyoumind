# ifYouMind — Agent Instructions

## Scope and identity
This file applies ONLY to the **ifYouMind** repository `alwat83/ifyoumind` and website `ifyoumind.com`.
**Never confuse ifYouMind with Dose Ninja.** They have separate codebases, product plans, credentials, Notion spaces, release histories and agent attribution.

**Authoritative historical attribution (founder confirmation, 2026-10-10): ALL ifYouMind development to date has used OpenAI tools and agents (ChatGPT/Codex). Claude, Gemini and other providers have made NO contributions to ifYouMind to date.** Do not invent or infer past contributions from other providers. Future agent contributions must be recorded when they actually occur. A GitHub account or branch name does not prove a specific OpenAI model authored a commit.

## Product direction
Build a consumer-friendly, general-purpose, evidence-backed AI data intelligence platform. Users should be able to explore public and, later, permissioned private datasets, compare locations and other entities, generate clear Decision Reports, and understand data sources, limitations, and freshness. Business intelligence is one vertical, not the whole product. Prioritize mobile UX, trustworthy outputs, reliable production releases, monetization, and acquisition. Avoid geographically narrow demo examples.

## Source of truth
1. Current `master` code, relevant branches and open PRs (implementation evidence).
2. CI status, Firebase deployments and real smoke tests (release/production evidence).
3. `IFYOUMIND_MASTER_PROJECT.md` (product history, roadmap, status labels and references).
4. ifYouMind Notion hub: https://app.notion.com/p/3eb02474659c81ecba55cc4eed184a71
5. Agent handoff notes and discussion context (not independently verified production evidence).

Historical Notion plans may be superseded by the consumer rebuild merged in PR #1 on 2026-10-03. Never assume committed = deployed = tested in production.

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
