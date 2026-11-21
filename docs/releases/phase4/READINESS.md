# Phase 4 — development velocity and consumer launch readiness

November 21, 2026 Pacific · OpenAI / Codex. Preparation only: no production merge/deployment, provider mutation, customer record change, enrollment activation or software installation. [Fresh redacted readback](LIVE_CONFIGURATION.json). Repository/GitHub are authoritative; Notion is the coordination copy.

## Completed preparation

The existing runner now offers [four risk-based levels](../../verification/RISK_BASED_GATES.md), preserves the original complete default plan and every assertion, reports omitted checks as NOT_RUN, carries known unresolved failures at every level, and distinguishes selected-check development success from environmental coverage and production authorization. Lower levels require a reviewed ancestor base; backend/auth/rules/routing/workflow/runner changes refuse a lower level. Docker carries the same selection. No hosted check is synthesized and no protection is waived.

Prototype and consumer work can continue locally while Actions billing is deferred. No Linux baseline is accepted, and an executed failure stays a failure. This tooling changes a safety gate, so its own verification uses the sensitive-backend level. Existing consumer-source evidence remains separate: [exact 76b4ca2 full run](../../design/consumer-pricing/VERIFIED_76b4ca2.md),738 pass/three transaction failures/15 skip, valid source integrity, all 214 authenticated and 84 Hosting cases pass. This is historical evidence, not a new run on Phase 4.

Fresh GitHub readback: master `6dcffca4eb186c6e0da7431523d7137652e14990`, unprotected; classic protection 404, no rulesets; production environment has no protection rules or deployment-branch policy. These are **enforcement gaps**, not waivers. Explicit founder authorization remains mandatory. No GitHub settings changed. Workflows remain intact: Launch Node 20; Authenticated QA Ubuntu24.04/Node 20/Java 21; production Node 22, automatic master-push deployment, cancel-in-progress, forced-empty enrollment. Native Node 22/Java 17 differs and is reported.

## Local Linux on this Apple Silicon Mac

Fresh inventory: arm64; no Docker, Colima, Lima, Podman or QEMU executable found, and no Docker/OrbStack/UTM app found. Homebrew exists. There is no currently usable local Linux executor. This blocks Linux pixel approval, not ordinary native development.

Smallest reuse path: keep the existing digest-pinned Playwright 1.56.0/Noble `linux/amd64` image and runner. No new CI provider, recurring service or rewrite. For a no-recurring-service local runtime, recommend an explicitly approved Colima + Docker CLI + QEMU installation; Docker Desktop is an alternative only after founder acceptance of its applicable licensing. No installation, Rosetta/security change, privileged container or service activation was performed.

**Proposed commands only — require founder authorization for host installation/VM creation first.** They are not claimed tested on this host:

```sh
brew install colima docker docker-buildx qemu
brew list --versions colima docker docker-buildx qemu
# Follow the installed docker-buildx formula's CLI-plugin instructions, then verify:
docker buildx version
colima start ifyoumind-qa --arch x86_64 --vm-type qemu --runtime docker --cpus 4 --memory 8 --disk 40 --activate=false --ssh-config=false
DOCKER_CONTEXT=colima-ifyoumind-qa docker context inspect
DOCKER_CONTEXT=colima-ifyoumind-qa docker info
DOCKER_CONTEXT=colima-ifyoumind-qa npm run verify:local -- --expected-sha=FULL_CANDIDATE_SHA --level=release --docker
colima stop ifyoumind-qa
```

Check installed `colima start --help` before first launch. x86_64/QEMU avoids assuming Rosetta is installed and matches the reviewed renderer architecture, but can be slow on Apple Silicon; memory/disk are proposed caps, not measured needs. Do not enable privileged binfmt installers or change host security to make it work. If this host cannot support it, retain native fallback and report Linux NOT_RUN. Inspect actual, expected and diff images individually; no automatic baseline update. The image pins the browser/OS base; apt packages, emulation, host OS and fonts still need version evidence. No claim of hermeticity or Safari/VoiceOver coverage.

Primary references: [Colima supported platforms/install/runtime](https://github.com/abiosoft/colima), [documented flags](https://raw.githubusercontent.com/abiosoft/colima/main/cmd/start.go), [Buildx setup](https://github.com/abiosoft/colima/blob/main/docs/FAQ.md#docker-buildx-plugin-is-missing), [Playwright version matching](https://playwright.dev/docs/docker), [Docker emulation limitations](https://docs.docker.com/build/building/multi-platform/). The existing [pinned runner procedure](../../verification/local-first/README.md) remains canonical.

## One intended consumer candidate — no merge performed

| PR | Verified head / base | Integration result | Evidence / remaining gate |
|---|---|---|---|
| #118 foundation | `2f4975f94ac888547df8b1fbdf149a50741f6570` / current master | GitHub MERGEABLE; ancestor of #119 | Existing exact hosted evidence; fresh release-source/rollback and #111 disposition still required |
| #119 Concept A | `172dbaa93231e88fd2256b3ca7c2726d81a7c6e0` / #118 | MERGEABLE; ancestor of #121 | Actual first-screen/reveal/evidence/CSV/city/saved/report captures; strict reliability NO-GO preserved |
| #121 pricing | `76ece8d911f7cec1dd269da732478b66199c2f12` / #119 | MERGEABLE; already contains the full intended stack | Public four-offer presentation, native four-width and state coverage; UI founder-review GO, not production |
| #120 reliability | `f856c3b462903422a8cad4aaa6bdaed41268fe3b` / #119 | **Not an ancestor of consumer candidate; keep separate** | No qualified correction; no rejected dependency matrix repeated |

No current conflicts found in the actual dependency chain. Do not cherry-pick overlapping PRs or duplicate implementation. After any master/base change recheck mergeability and exact source; a current MERGEABLE value is not future proof. Phase 4 is a separate tooling/docs branch from #121; existing heads stay unchanged.

The cumulative consumer diff changes **no Functions source, Firestore rules or Storage rules** relative to current master; it does change Hosting configuration and verification workflows. The production workflow nevertheless redeploys all listed Functions/rules/Storage along with Hosting. This difference between source scope and deployment scope is material. Before merge, choose one reviewed authorized release path, avoid overlapping runs, and retain separate #118 foundation verification before reconciled #119/#121. A proposed Hosting-only execution could reduce unrelated deployment risk, but needs its own reviewed workflow/process, fresh rollback checks and explicit founder decision on the unwaived #111/reliability gate. It is not authorized here.

### Consumer-facing consistency and visual gaps

No new consumer defect beyond the recorded failure/recovery/support limitations was established by this preparation. #121 correctly exposes unavailable monthly prices, keeps a working free action, preserves $79 and legacy plans, and does not promise paid household-bill analysis. The available homepage/sample $79 framing is coherent while monthly enrollment remains closed; review that framing when enrollment is actually opened. Existing source/static pricing metadata says free examples, $79 and monthly plan details; it does not advertise legacy $39 as a new plan.

The pricing visibility assertions were already updated in #121; fast and browser suites pass there. Linux public/eligible pricing baselines still need deliberate comparison, not automatic acceptance. Both `homepage-revealed` Linux baselines are absent. Existing homepage images may also differ materially from Concept A. Native320/390/820/1440 evidence is available; physical iPhone/Safari, spoken VoiceOver and unassisted comprehension remain untested. No fresh visual claim is needed for Phase 4's non-product changes; the preserved screenshots remain byte-matched to the unchanged consumer components.

## Subscription readiness — configuration is not live fulfillment

Fresh GET-only Stripe/catalog and Firebase metadata agree: active live USD Starter 499 and Plus 999 cents, licensed monthly/no trial, active legacy 3900 and one-time 7900 cents. All five inspected Functions are ACTIVE Node 22, point to the verified live catalog and have enrollment empty. Bound Stripe key version 5 and dedicated subscription-signing version 1 are ENABLED; no payload accessed. Three effective production-environment catalog variables match the active runtime; no repository-level override exists. The dedicated endpoint is enabled for paid invoices, subscription updates/deletions and refund/dispute events using 2025-02-24.acacia, matching the existing integration pin. No API migration performed.

Default live portal: invoice history and payment-method updates enabled, period-end cancellation, no proration, plan switching disabled. Its `/app/account` return is a retained compatibility path; owner-authorized actual live session/return remains unverified. Connector read access does **not** prove the deployed restricted key's current permissions or signing-secret match. No live Checkout/portal session, invoice, test card, payment, subscription or customer was created/read/changed in this audit.

### Implementation audit and local evidence

| Contract | Source / existing tests | Readiness limit |
|---|---|---|
| Authentication and billing authority | Verified owner/admin and tenant membership; role denial; legacy Pro checkout rejected | Existing local tests; no real-owner portal test in scope |
| Verified-paid invoice grants | Canonical invoice/subscription/payment/charge, signature/mode/account/price/exact amount, quantity/period/proration checks | Real signed live subscription delivery and deployed-key permissions unverified |
| Invoice-aligned allowance | Period key subscription+start, positive successful paid invoice only,1/3 allowance, exact period ends; failed invoice does not reset | Historical sandbox evidence is distinct from fresh live verification |
| Duplicate/concurrent work | Invoice/charge/period ownership, transaction-created grant, checkout attempt idempotency; one report reservation before Census generation; token/attempt/lease bounds | Existing city/dataset transaction failures remain unresolved; don't infer all transaction paths share a cause |
| Renewal/cancellation/expiry | New paid cycle creates new window; failed renewal grants nothing; canonical subscription dates; credits expire, unlocked reports remain | Subscription updated/deleted drives state; failed-invoice notification has no explicit recovery workflow |
| Legacy and prior access | $39 Pro UTC-month five-report behavior, prior purchases/report markers bypass new spending | No silent migration, price change or entitlement change |
| Risk/recovery | Refund/dispute events reconcile canonical charge and hold unused credits; HTTP503 leaves unverifiable events retryable; generic support-attempt cap | No early-fraud-warning handling, actionable deferred-event queue, or documented operator reconciliation SLA; report/account error paths lack a direct support contact |

Fresh exact-source backend-level [summary](VERIFIED_d792381.md) / [JSON](VERIFIED_d792381.json) records 538 pass/two strict recovery failures/15 skip with VALID source integrity and zero source events; all 48 commerce and 214 authenticated cases pass. Fourteen full-plan checks are explicitly NOT_RUN at this level. New/original runner unit tests 14 pass; the lower-level CLI claim is correctly refused before any test executes. This evidence-only follow-up changes no executable file. Original successful/failing artifacts remain. Historical genuine hosted Stripe sandbox tests covered Checkout, paid-invoice replay, portal, Test Clock renewal and cancellation. They do not establish current production signed delivery, independent customers or revenue.

### Launch-blocker matrix — resolution order

| Order | Blocker / classification | Required resolution before activation |
|---|---|---|
| P0.1 | Application reliability and unwaived #111 live retry | Supported fix/qualified evidence or explicit narrowly reviewed gate disposition; no production writes under this assignment. Preserve #120 and distinct natural/controlled evidence. |
| P0.2 | Consumer release scope and technical review enforcement | Founder UI review; reconcile stack; review/propose branch/environment safeguards; choose deployment scope and fresh rollback/smoke procedure; exact authorization. No protection settings changed. |
| P0.3 | Tax/collected-amount contract | Tax settings active but **zero active registrations**, both monthly prices tax behavior unspecified, Checkout does not enable automatic tax. This is not a conclusion about legal registration obligations. Founder/advisor approves treatment; added tax/adjustments currently fail exact-amount validation, so any change needs reviewed sandbox invoice tests first. |
| P0.4 | Deployed provider permissions, signed delivery and owner portal | Metadata/configuration pass; actual key effective permissions/merchant payment eligibility, genuine signed live subscription processing and authorized owner portal round-trip need separately authorized bounded verification. Do not create a fake customer link. |
| P0.5 | Explicit enrollment/release control | Workflow forcibly empties enrollment. A reviewed future change must authorize one genuine consenting workspace, retain the ten-workspace lifetime cap, verify purchase→grant→generation→fresh-session access, and keep webhook/portal servicing paid customers on rollback. A public all-new-customer launch requires a separate decision beyond the allowlist architecture. |
| P1 | Checkout tier clarity | Both prices share the generic product name “ifYouMind Decision Reports”; no plan/allowance custom Checkout text. Verify tier identity on hosted Checkout/invoice in sandbox; smallest correction can be explicit handoff text, without silently recreating live Prices. Provider/catalog changes require approval. |
| P1 | Recovery/support/fraud operations | Define owner, contact route, webhook retry/reconciliation procedure, payment-failure notices and early-risk handling before enrollment/expansion. Existing `invoice.payment_failed` is acknowledged without grants; no operator workflow is implemented for it. |
| P1 | Actual delivery economics | Retain bounded work/reservation limits and conservative reserve; existing local ACS workload estimates are not attributable cloud/payment/support cost evidence. Establish measured spend/support reporting for the first approved cohort; do not claim profitability. |

Tax references: [Stripe recurring tax](https://docs.stripe.com/billing/taxes/collect-taxes), [registrations](https://docs.stripe.com/tax/registering). No tax, Price or event setting was changed.

## Release / rollback preparation

Do not merge/deploy now. At authorization: re-read exact heads/protections/required checks and current Hosting/Functions; verify finalized restorable Hosting and serving Functions rollback artifacts, traffic, identity and enrollment OFF. Snapshot only necessary redacted metadata. Execute only the approved deployment scope, verify actual serving versions (not merely GitHub merge), then question→finding→evidence→private CSV boundary, city/save/reopen and pricing/auth/report navigation. No Checkout or payment without its separate authorization.

Rollback is not blanket approval: a future Hosting-only rollback must use the freshly recorded pre-release version; a combined Functions rollback requires reviewed prior revisions/configuration and reconciliation of any open/paid billing work. After paid enrollment, closing new enrollment must not disable existing webhook/portal/report access. Current production baseline is unchanged and not redeployed here.

## Readiness decision

**Local development: GO at the appropriate level. Consumer founder review: GO. Production consumer release: NO-GO under the existing unwaived gates. Subscription activation: NO-GO.** GitHub billing and absent Linux software are infrastructure/platform limitations; they do not stop unrelated development. Transaction failures and missing operational/provider proof are not cured by new tooling. No independent customer, conversion, revenue or human comprehension outcome was observed.
