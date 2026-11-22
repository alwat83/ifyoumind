# Production activation — implementation and gates

November 21, 2026 · OpenAI / Codex. Build from the consumer source already serving production; preserve the approved Midnight Slate layout. This candidate is not a declaration that AI or new subscriptions are live.

## Working implementation

- Reuse PR96's bounded Responses transport and validated Luna model. Its fixed synthetic callable remains staging-only/default OFF; it is not exported by the production bootstrap.
- New `explainDecisionReport` requires authentication, verified email, active owner/admin membership, an unlocked generated full report and explicit `public-census-explanation-v1` consent. No account/decision identifiers, questions, concepts, city names, raw documents or bills go to OpenAI.
- Project only saved public Census population, household income and home-value estimates with validated source URLs/units/positive values. Reject missing/invalid primary evidence rather than producing a comparison-only answer. The provider generates a structured selection of takeaway/observations/next check. The server renders facts, wording, sources and limitations. **AI-selected evidence, not unconstrained model-written prose or verified causation.**
- Strict JSON-schema output, evidence-ID validation, unique selections, usage/service-tier bounds; one no-redirect/no-retry request with five-second deadline and bounded response. `store:false` does not eliminate standard provider abuse-monitoring retention. Disclosure and affirmative consent precede processing; private bill Discovery remains isolated/no-network.
- Atomic per-report/evidence reservation + cache prevents duplicate concurrent/lost-response requests. Failed/uncertain attempts remain spent and latched. The transaction rechecks membership, paid access and evidence digest. Client quota/job read/list/write is denied by existing rules.
- Caps: three attempts/user/day,20 globally/day,200 globally/month; reserve5,000microUSD/attempt = a conservative modeled$1 monthly provider budget. Fixed Luna Standard model, request body<=12,288bytes, output<=512tokens; accepted usage<=16,384input/512output tokens. At published rates, the accepted envelope is below the per-attempt reserve. Attempt caps are enforced before transport; usage estimates are not provider-reported billed charges or a provider-side hard cap. Firebase/payment/support costs are separate.
- New report action appears only when the server declares availability and an entitled report exists. Fallback explicitly says local summary/AI unavailable. No automatic provider request on view, refresh, purchase or report generation. Preserve deterministic report access regardless of AI availability.
- The private-dataset AI button currently targets an undeployed legacy function. Replace that dead action with an honest availability disclosure, retaining deterministic analysis/evidence. No private-dataset transfer is activated.

[Current model/support/pricing](https://developers.openai.com/api/docs/models/gpt-6-luna):$0.10/Minput,$0.50/Moutput Standard, checked November21. [Provider data controls](https://developers.openai.com/api/docs/guides/your-data). No tools, conversations or arbitrary retrieval are enabled.

## City-save correction and evidence limits

The original applicable emulator run reproduced the known UTC-month-boundary contention failure: aggregate read path returned `Transaction is invalid or closed`;63/64tests passed. Preserve that log; the initial wire-level abort is not newly proved by the terminal stack.

Replace only the bounded usage aggregate with an ordinary ID-only QuerySnapshot. Both precheck and authoritative transaction retain the existing3/12 caps, shared lock, owner checks, saved request-ID fingerprint and atomic project/usage writes. At most3or12IDs are read; no dependency upgrade, private SDK patch, application retry or cap bypass. Existing tests are preserved and the same month-boundary case runs across three fresh fixture workspaces.

The corrected66-test security/commerce/rules/AI-reservation run passed, including all three month-boundary contention cases. This qualifies the changed application path; it does **not** repair or certify generic Firestore SDK read-abort recovery, dataset aggregation or untested production contention. PR120's original failures remain distinct and preserved.

## Verification

Observed native implementation checks:95Functions tests PASS;66applicable emulator tests PASS after correction;6mocked desktop/mobile consent/availability/fallback browser tests PASS; production/local builds PASS with existing style-budget warnings; Discovery production-isolation and bundle guards PASS. Full fast-web attempt initially had an obsolete no-AI-copy assertion plus a sandbox file-watcher failure. The assertion now enforces gated/consented/honestly labeled AI; targeted12copy and8native verifier tests pass. Initial sandbox Angular build aborted; one-worker native builds pass. Initial isolated emulator port/path setup failures are retained as harness failures, not product passes. No baselines updated.

Use `npm --prefix functions test`, `npm run test:commerce`, `npm run test:rules`, `npm run test:seo`, and the existing local browser runner. The new spec works on standard demo ports; isolated port5008runs proxy only localhost traffic to preserve an existing preview. Exact-head evidence is recorded after committing the candidate; do not transfer earlier CI results. No paid GitHub dependency or workflow/protection change.

## Release sequence and hard gates

1. Verify production secret metadata/version and existing runtime identity. Never access a key payload. Review isolated bootstrap exports/secret declarations. Prepare package from a clean exact source and compiled hashes; include only selected Functions, never root/broad deployment. The PR96-derived bootstrap initializes Admin idempotently.
2. Run exact-source applicable local gates. Inspect production revision/traffic and existing rollback targets. Deploy independently qualified Functions with `ENABLE_REPORT_OPENAI_EXPLANATION=false`. Firebase CLI may grant **only secret-level accessor** for this key to the verified runtime; no new broad IAM grant is required. Read back ACTIVE/Ready/100%, identity, version1binding, OFF flag and unchanged commercial settings. No provider request during this step.
3. Supervised live billing review: one Starter499cent purchase, one Plus999cent purchase and one one-time7900cent purchase, max9,398cents before tax. Buyer enters/submits payment details. Stop on unexpected tax/total, uncertainty, duplicate attempt or renewal. Preserve existing customer/founder accounts. Use dedicated reviewer ownership; one subscription history per workspace is an existing limitation, so the two monthly tests need separate reviewer workspaces. The one-time test can use a different decision in the Starter workspace. Public enrollment stays closed; only explicitly identified internal review workspaces may enter the bounded test.
4. Independently reconcile provider session/payment/invoice/charge and genuine signed webhook, exactly-once credits/entitlement, generation and saved reopening. Browser redirects are not payment evidence. Verify corresponding refunds and cancellations/portal; no extra payment or renewal. Existing successful sandbox/test-clock evidence is distinct from live verification. Tax treatment remains unverified for a broad rollout: prices currently unspecified, no active Stripe tax registrations, and the amount validator requires exact agreed totals. No tax configuration change is implicit.
5. Only after non-provider gates pass, exercise one bounded real explanation on a verified paid reviewer report with explicit consent; record validity, tokens, latency and attributable estimated cost without raw input/output/credentials. Keep AI unavailable to customers until its gates pass. Stop further requests on invalid/uncertain output and retain the reservation. Model error must never consume a second report credit or block access to the paid report.
6. Open public enrollment/AI only after the required live proof and customer-facing availability checks. Preserve legacy$39Pro and purchased reports. No silent migrations, catalog changes or simulated success. Use a controlled initial enrollment capacity and the existing transaction-enforced seat cap, rather than unbounded launch exposure. Exact public-launch configuration still depends on the completed review evidence.

## Current external/session prerequisites

The founder has provisioned a production-only restricted Responses Write secret; metadata confirms enabled version1. Runtime secret access/binding must be verified after the flag-OFF deployment, not inferred from secret existence. Staging remains OFF. Founder has authorized the bounded$93.98live review and corresponding test refunds/cancellations and is available; private QA sign-in is requested. No payment details, tokens or keys may be shared in chat. No payment/provider request has occurred in this implementation phase.

Detailed operational/provider identities and raw test/release logs remain ignored/local. Publish source, tests and sanitized status only. Existing RC1 Hosting/artifact and private evidence history remain separate. Future milestone notes must distinguish implementation, deployment, genuine provider validation, internal paid tests and independently paying customers.

## Cross-surface impact

| Surface | Status | Evidence / boundary |
|---|---|---|
| Homepage/navigation/brand | Verify Only | Approved copy, tokens and layouts untouched; production build/bundle checks |
| Public/local Discovery | Verify Only | No provider bridge, persistence or new formats; isolation guard passes |
| Paid city/business reports | Change Required | Server availability + explicit consent + structured summary; mocked desktop/mobile verification |
| Registration/login/tenant access | Verify Only | Existing flow retained; new endpoint rejects anonymous/unverified/foreign/viewer callers |
| Pricing/Checkout/subscriptions/legacy Pro | Verify Only | Catalog/prices/enrollment code unchanged; critical commerce/credit/cancel/refund tests; live review still required |
| Account/saved reports | Verify Only | Existing access/report generation unchanged; AI failures do not revoke or spend report credit |
| Private datasets | Change Required | Nonfunctional undeployed AI action replaced by explicit limitation; calculations/evidence retained |
| Mobile/accessibility/loading/recovery | Change Required | Existing controls/classes, disabled-in-flight button, source labels, fallback; new browser cases and axe |
| Backend quota/security/operations | Change Required | Atomic job/cost reservation, bounded city query, isolated bootstrap; existing rules deny quota clients |
| Privacy/legal | Change Required | Accurate minimized OpenAI consent/retention disclosure; local bill boundary intact |
| Analytics/SEO | Not Affected | No new events, sensitive payloads, tracking or routing change |
| Handoff/Notion | Change Required | Sanitized milestones; actual deployment/payment/provider evidence separate from implementation |
