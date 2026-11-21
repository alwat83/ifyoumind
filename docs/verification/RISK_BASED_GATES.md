# Risk-based development and release gates

Founder-authorized Phase 4, November 21, 2026. GitHub-hosted billing is not a universal development blocker. Use exact-source local evidence to continue authorized work. Local checks never impersonate hosted checks, waive configured protections, resolve an unrelated failure, or authorize release.

## Four levels

| Level / CLI value | Required evidence | What it permits |
|---|---|---|
| Prototype / `prototype` | Local and production builds, production privacy/isolation guards, fast targeted checks, public Hosting journeys with keyboard/axe/responsive checks, actual prototype captures and founder review | Local experiment and founder review only. No private backend certification. |
| Consumer frontend / `consumer` | Exact-source builds and privacy guards, existing standalone and Hosting tests, complete authenticated browser journeys (including identity/recovery/commerce presentation), visual evidence, accessibility and private-state boundaries | Reviewable frontend development. Actual executed failures still fail. Linux/device/human gaps remain explicit. |
| Sensitive backend / `backend` | Functions build/unit, fast checks, local app build, rules, organizations, full commerce/entitlement, fixture/access, authenticated journeys and strict transaction transport recovery | Reviewable backend/tooling development only. No skipped auth, billing, transaction, quota or security suite. |
| Production release / `release` (default) | Complete existing local plan, plus exact deployment source/artifact, required protections/reviews, fresh identity/configuration/rollback evidence, applicable live safety gates, post-deployment verification and explicit founder authorization | Preflight evidence only. The command cannot merge, deploy, activate enrollment, contact providers or grant authorization. |

Select by the **change**, not by which command turns green. For lower levels supply a distinct reviewed ancestor `--base-sha`. Functions, auth/services/guards/routes, rules, Firebase configuration, workflow or verification-runner changes require `backend` or `release`; the CLI refuses a lower level. Record the reviewed base in the impact matrix. A caller-supplied base is auditable evidence, not proof of independent founder/reviewer approval. A misleading base cannot reduce the required gate. Path detection is a conservative floor, not a complete security/data-flow classifier: reviewers must raise the level when a change affects sensitive behavior elsewhere.

```sh
npm run verify:local -- --expected-sha=FULL_CANDIDATE_SHA --base-sha=REVIEWED_BASE_SHA --level=prototype
npm run verify:local -- --expected-sha=FULL_CANDIDATE_SHA --base-sha=REVIEWED_BASE_SHA --level=consumer
npm run verify:local -- --expected-sha=FULL_CANDIDATE_SHA --level=backend
npm run verify:local -- --expected-sha=FULL_CANDIDATE_SHA --level=release
```

All commands require clean exact source, isolated copies, credential-free child environments and before/after hashes plus transient edit detection. No arbitrary test command, skip-failure switch, snapshot update or deployment exists. Original scripts, workflow definitions and assertions are retained. Default `release` executes the original full command plan unchanged. Docker receives the selected level through the isolated manifest.

## Interpret results honestly

Reports retain the existing overall PASS/FAIL/PARTIAL/INVALID status and exit behavior. A separate **selected-check development status** says whether the selected executed checks passed. Native renderer limitations can make the overall result PARTIAL even when selected checks pass. FAIL/BLOCKED/INVALID never become development PASS.

Omitted checks are listed **NOT_RUN**, never counted as passes or cleared failures. Known unresolved document/aggregate abort masking, city-save month-boundary failures and distinct historical dataset-cap failures appear at every level, with preserved evidence links. A later passing contention case cannot resolve them. Production readiness stays **NO-GO** in the automated report: manual release gates and authorization are separate evidence.

Frontend work can proceed while an unrelated sensitive suite remains unresolved, provided the change does not touch that sensitive behavior. This does not authorize releasing into an unresolved safety gate. Raising/lowering levels, closing defects and accepting platform gaps require explicit rationale and current evidence; do not edit historical records.

## Production controls remain mandatory

Before any authorized merge/deploy: re-read GitHub protections/rulesets and environment approvals, exact head/base/mergeability and required checks. Satisfy any configured required check through its legitimate mechanism; never synthesize a check, force merge/push, disable protection or substitute a local success status. If a configured requirement cannot run, release is blocked until the founder approves a separately reviewed policy change; development may continue.

The November 21 readback showed `master` **unprotected**, no repository rulesets and no production-environment protection rules. This is a technical-enforcement gap, not permission to release. Founder authorization remains mandatory. No settings were changed. Recommend reviewing protective settings before production, without making GitHub billing a dependency of local development.

A master push automatically deploys Hosting, rules, Storage and many Functions in one cancel-in-progress production workflow. A frontend source change does not imply a Hosting-only deployment. Review the actual deployment scope, preserve enrollment OFF, avoid overlapping production runs, and obtain exact founder authorization for every affected production surface. A direct/manual deployment is not an implied bypass; it requires separately approved scope, identity, artifacts, rollback and smoke checks.

## Review record

Use the PR template: level; reviewed base and exact source; affected surfaces; executed/failed/NOT_RUN checks; old versus new evidence; visuals/platform gaps; unresolved defects; deployment-specific gates and founder authorization. Update handoff and Notion. Human understanding, real purchase fulfillment and provider delivery remain separate from automated assertions.
