# OpenAI explanation prototype and activation readiness

**November 13, 2026 · OpenAI / Codex · Internal synthetic-data review.** Separate from Bill Discovery [draft PR #95](https://github.com/alwat83/ifyoumind/pull/95) at `73b893c067ae54b4b55100dbe168191386e7b00e`. Base is production master `59a4b80a8e427a13e0d8bee0f753f8954ea8611f`. [Existing Firebase release](https://github.com/alwat83/ifyoumind/actions/runs/43392378321).

## Controlled staging readiness

**Prepared for review.** Staging project selection, setup, deployment and live provider validation are pending. The Firebase CLI listed nine projects visible to the current identity. Only production `ifyoumind-473fe` matched ifYouMind by project ID or display name. GitHub exposes only its `production` environment and has no verified staging mapping. The signed-in OpenAI settings exposed only a separate business organization, with no ifYouMind organization to select. A staging project in a different account or under an unrelated name remains possible. The ifYouMind API organization's billing, key permissions and limits could not be verified.

The callable requires an explicit Firebase staging project match, and staging source discovery selects the dedicated runtime service account derived from that project ID. The authorized reviewer gets only verified fixture evidence and, on provider success, validated generation token counts and the observed Standard service tier. The runner checks the full synthetic fixture, measures request-to-response latency, and checks deterministic flag-off behavior before and after the one allowed staging invocation. Its automated tests substitute both transports. [Founder setup, operator commands and rollback](../../AI_SYNTHESIS_SETUP.md).

## Cross-surface impact

| Surface | Status | Verification |
| --- | --- | --- |
| Internal explanation callable and provider boundary | Change Required | Fixed synthetic packet, verified internal admin with active workspace owner/admin membership, strict output, quota and fallback. Explicit staging project and runtime identity, verified usage counters and a mock-tested staging runner. |
| Public homepage, Discovery, reports, registration, Dashboard and Account | Not Affected | No frontend entry or data bridge. Existing deterministic reports, layouts and browser-local Discovery stay in place. |
| Pricing, Checkout, subscriptions and entitlements | Not Affected | No billing interface or commercial calls. The prototype accepts no report ID and never reads or grants report access. |
| Privacy, Firestore and production | Verify Only | Inspect the production deployment allowlist and project metadata. Verify client access to quota records is denied by existing rules. Keep identifiers, credentials and payloads out of smoke evidence. |
| Responsive, accessibility and visual identity | Not Affected | No user interface changes. Existing browser and visual suites cover regression. |
| Handoff | Change Required | Record audit, supported model, costs, demonstration, tests and exact activation gates. |

## Verified current integration

| Area | Finding |
| --- | --- |
| Production Firebase | `firebase functions:secrets:get OPENAI_API_KEY --project ifyoumind-473fe --non-interactive --json` returned Secret Manager HTTP 404 for the named secret. No enabled version exists under that name in this project. The value was never requested. `firebase functions:list --project ifyoumind-473fe --non-interactive --json` returned 33 functions, with no OpenAI secret binding or same-name plain environment variable. |
| Existing implementations | [Market AI](../../functions/src/intelligence/market-ai.ts) and [universal synthesis](../../functions/src/intelligence/ai-synthesis.ts) already target Responses and use server-side Bearer auth, `store:false`, evidence packets and organization membership. Neither is exported by [Functions index](../../functions/src/index.ts) or listed in the live inventory or deployment allowlist. The Angular Universal Data service still defines a callable reference. A frontend reference does not establish availability. |
| Paid reports | `generatePaidDecisionReport` authorizes owner/admin, reserves existing entitlement, uses deterministic Census data and report rules, then saves the result and consumes the credit atomically. Runtime bindings are Census and Stripe. No OpenAI involvement. |
| Gaps | The old endpoints accept unrestricted workspace-derived text, default to viewer-inclusive membership, use prompt-only JSON and causal constraints, validate numbers against a pooled allowlist, and persist prose. An allowed number can still be attributed to the wrong city. Unsupported causal language can contain no numbers at all. Both lack a per-request transport deadline, an atomic provider spending cap and a fail-soft result. Validation exceptions can carry model-derived text. Old setup instructions described implementation fragments as operational. |
| Model | The [official GPT-6 Luna catalog](https://developers.openai.com/api/docs/models/gpt-6-luna) independently confirms the historical slug `gpt-6-luna`, support for Responses, Structured Outputs and reasoning effort `none`, and standard rates of $0.10 per million input and $0.50 per million output tokens. The prototype explicitly allowlists this model. Model availability for the founder’s project requires separate verification. |
| Provider billing | Account funding, project access, model enablement and effective spending limits for ifYouMind are unverified. The current OpenAI session did not expose the ifYouMind organization. The founder can confirm the selected organization and project in the [OpenAI billing console](https://platform.openai.com/settings/organization/billing/overview) and verify project settings before a separately approved synthetic request. |

## Internal prototype

The Firebase callable `explainSyntheticMarket` accepts an organization ID and an optional literal `useProvider: true`. It requires Firebase Auth, verified email, the server-issued site admin claim, and active owner/admin membership in that workspace. Provider access additionally requires a synthetic workspace and explicit request opt-in. Flag-off smoke phases omit that opt-in, so they fail safely if the staging flag is unexpectedly on. The organization ID and user identity are used only for local authorization and quota. The provider sees a fixed synthetic packet with two verified facts, no names, account/organization IDs, report IDs, custom prompts, raw reports, files or bill data.

The model selects one of two evidence IDs as the lead. The server renders both facts, computes differences from the same fixture, and always displays the caveat. The provider cannot write prose, omit the second fact, or supply amounts, causes or confidence claims. The Responses request uses strict `text.format` JSON Schema, a fixed model and Standard service tier, reasoning disabled, no tools or conversation state and `store:false`. The server accepts only a completed assistant message with exactly one canonical selection, valid usage, and no extra keys or duplicate keys. Refusals, tool calls, partial responses, extra prose and unknown IDs fail closed. This tests whether ordering verified facts is useful before adding a richer explanation. [Responses migration](https://developers.openai.com/api/docs/guides/migrate-to-responses) · [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)

The count endpoint checks the same instructions, input, model and schema before generation. Generation permits at most 768 input and 128 output tokens. The two requests share a five-second abort deadline, accept at most 16 KiB per response, disallow redirects and make no automatic retries. Failed and uncertain attempts count toward the budget. A Firestore transaction reserves one attempt against 3 per verified user per UTC day, 20 globally per day and 200 globally per month. There is no refund after failure. Firebase limits the function to two instances with concurrency one and a 15-second invocation timeout. Quota documents contain a hashed UID in the user document ID and rolling counters. Clients cannot read or write them. Staging operators should clear the collection when closing the pilot. Raw prompts, raw results and provider errors are neither logged by the application nor persisted. The authorized caller receives a deterministic explanation if the flag, key, budget or provider is unavailable.

The flag is enabled only by the exact string `true`. The runtime project must match `SYNTHETIC_OPENAI_STAGING_PROJECT`, and production, demo projects and the Functions emulator fail closed. The production workflow excludes this function. The separate legacy synthesis functions remain outside the deployment path. `store:false` disables Responses application-state storage. OpenAI's standard abuse monitoring may still retain content, generally up to 30 days, subject to stated exceptions. Account-specific data sharing and any modified retention controls remain to be confirmed before a future real-data pilot. [Token counting](https://developers.openai.com/api/docs/guides/token-counting) · [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data)

## Synthetic demonstration and cost

With the mock selecting `income`, the response leads with Market A median household income **$62,000** and Market B **$68,000**, a **$6,000** difference. The second fact reports **12,000** versus **9,000** households. The caveat says these figures establish neither demand, profitability, nor causation. The deterministic path leads with households and presents both facts. Run `npm --prefix functions run build && node --test functions/test/openai-explanation.test.cjs` to reproduce the demonstration. Firebase emulator tests cover the actual disabled callable and transactional quota. No real provider inference or production data was used.

| Scenario | Assumption | Estimated OpenAI generation cost |
| --- | --- | ---: |
| Representative request | 250 input and 16 output tokens for the two facts and a single enum response | $0.000033 |
| Maximum modeled request | 768 input at $0.10/M and 128 output at $0.50/M | $0.0001408 |
| 50 attempts/month | Maximum modeled request each time | $0.00704 |
| 200 attempts/month | Maximum configured monthly attempts | $0.02816 |
| 1,000 attempts/month | Future sizing only, above the enforced cap | $0.1408 |

The representative token counts are estimates. The mock returns fixture counts. The generation estimate uses Standard rates and assumes uncached input because the 768-token cap is below Luna's documented 1,024-token minimum cacheable prefix. It excludes Firebase, Firestore, network transfer and tax. Confirm actual usage, the count endpoint's billing treatment, delivered service tier and latency in the authorized synthetic staging run. [Model rates](https://developers.openai.com/api/docs/models/gpt-6-luna) · [Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)

OpenAI lists 5,000 requests and 2,000,000 tokens per minute at Luna's Build tier. The Free tier is unsupported. Actual staging limits and model access depend on project settings and remain unverified. The prototype caps attempts at 3 per reviewer per UTC day, 20 global per UTC day and 200 global per UTC month. An attempt can make up to two provider requests, count and generation. The Firestore cap applies even when a request times out. The approved provider hard spend limit and alerts protect the separate staging project. [OpenAI rate limits](https://developers.openai.com/api/docs/guides/rate-limits) · [OpenAI spend limits](https://developers.openai.com/api/docs/guides/spend-limits)

## Product recommendation

| Dimension | Decision Report explanation | Optional Bill Discovery explanation |
| --- | --- | --- |
| Usefulness | Helps a buyer understand a verified tradeoff, evidence quality and what to check before acting. | Local arithmetic already answers what changed. Extra explanation needs a measured comprehension gap. |
| Privacy | Start with public Census facts from an already authorized report, after a separately reviewed minimum fact projection. Exclude user-supplied concepts, private context and identifiers. | Even derived amounts can reveal household circumstances. Requires a separate affirmative choice and exact transfer disclosure, with local analysis still fully available. |
| Effort | Existing tenant checks, saved report, source metadata and rendering are reusable. Add an opt-in read-only view after entitlement, separate from generation. | Requires a deliberate bridge out of the current no-network island, a consent and redaction journey, retention review, and anonymous abuse controls if account-free. |
| Latency and cost | Optional asynchronous explanation, with deterministic report ready immediately. Low modeled inference cost and reuse opportunities. | Similar inference cost per call, but free anonymous usage increases operational exposure. Privacy and round-trip friction fall inside the first-use journey. |
| Revenue | Directly tied to a paid report's utility and buyer trust. Measure it against an unchanged deterministic report before expanding. | Acquisition benefit is unproven. First measure the account-free local result. |

**Recommendation:** Ship the Decision Report explanation first, after a synthetic staging validation and a small authorized usefulness trial. Keep deterministic evidence, availability and paid access independent of the optional explanation. Measure time to a correct takeaway, evidence use, fallback rate, p95 latency and observed cost. The prototype does not justify a revenue claim. Keep Bill Discovery local by default and revisit a consented optional feature only after demonstrated need.

## Founder activation checklist

1. Confirm funded API billing, the model allowlist, effective key permissions and retention in the approved staging project. Follow the [secure setup steps](../../AI_SYNTHESIS_SETUP.md#founder-setup-for-an-authorized-staging-test) after authorization.
2. Separately authorize the exact staging deployment and one bounded synthetic invocation, with at most one count and one generation request. Verify strict response compatibility, real token counts, actual usage and cost, latency, redacted evidence and the flag-off fallback before and after the provider call.
3. Review the minimum Decision Report data projection, authorization/entitlement gates, provider retention and user-facing disclosure before a small approved pilot. Verify that the original report is usable when the feature is off. Approve any later production deployment and activation separately. Keep Stripe and report entitlement mechanics independent.

## Verification handoff

The November 13 metadata recheck again found no `OPENAI_API_KEY` or enabled version in `ifyoumind-473fe`, zero bindings across 33 deployed functions and no deployed prototype. Existing paid reports still bind Census and Stripe only. No credential value was requested.

The interrupted QA retry completed successfully on the original implementation commit `8931eae166df4a0863d762c817b027ceace95a98`. It followed a single existing desktop Ask/Advanced navigation failure involving a local emulator `403` from `listUniversalDatasets`. The unchanged retry passed 132 authenticated browser cases, 183 Discovery browser cases, 138 web, 80 Functions, 38 commerce, nine Firestore rules, five organization and 26 fixture cases. One existing fixture was skipped. The final documentation head and its fresh exact-head checks are tracked in [draft PR #96](https://github.com/alwat83/ifyoumind/pull/96/checks). [Original launch build](https://github.com/alwat83/ifyoumind/actions/runs/43461963488) · [Passing original QA retry](https://github.com/alwat83/ifyoumind/actions/runs/43461963589/attempts/2)
