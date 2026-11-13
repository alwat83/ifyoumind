# OpenAI explanation prototype and activation readiness

**November 13, 2026 · OpenAI / Codex · Internal synthetic-data review.** Separate from Bill Discovery [draft PR #95](https://github.com/alwat83/ifyoumind/pull/95) at `73b893c067ae54b4b55100dbe168191386e7b00e`. Base is production master `59a4b80a8e427a13e0d8bee0f753f8954ea8611f`. [Existing Firebase release](https://github.com/alwat83/ifyoumind/actions/runs/43392378321).

## Cross-surface impact

| Surface | Status | Verification |
| --- | --- | --- |
| Internal explanation callable and provider boundary | Change Required | Fixed synthetic packet, verified internal admin with active workspace owner/admin membership, strict output, quota and fallback. Exercise with Firebase emulators and a mocked Responses endpoint. |
| Public homepage, Discovery, reports, registration, Dashboard and Account | Not Affected | No frontend entry or data bridge. Existing deterministic reports, layouts and browser-local Discovery stay in place. |
| Pricing, Checkout, subscriptions and entitlements | Not Affected | No billing interface or commercial calls. The prototype accepts no report ID and never reads or grants report access. |
| Privacy, Firestore and operations | Verify Only | No production deployment entry. Inspect current secret metadata and bindings without touching values. Verify client access to quota records is denied by existing rules. |
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
| Provider billing | Account funding, project access, model enablement and effective spending limits are unverified. The authenticated billing console could not be verified through available access. The founder can confirm the selected organization and project in the [OpenAI billing console](https://platform.openai.com/settings/organization/billing/overview), then verify the project’s model and workload permissions and a separately approved synthetic request. No provider request, charge, or configuration change was made. |

## Internal prototype

The Firebase callable `explainSyntheticMarket` accepts only an organization ID. It requires Firebase Auth, verified email, the server-issued site admin claim, and active owner/admin membership in that workspace. The organization ID and user identity are used only for local authorization and quota. The provider sees a fixed synthetic packet with two verified facts, no names, account/organization IDs, report IDs, custom prompts, raw reports, files or bill data.

The model selects one of two evidence IDs as the lead. The server renders both facts, computes differences from the same fixture, and always displays the caveat. The provider cannot write prose, omit the second fact, or supply amounts, causes or confidence claims. The Responses request uses strict `text.format` JSON Schema, a fixed model and Standard service tier, reasoning disabled, no tools or conversation state and `store:false`. The server accepts only a completed assistant message with exactly one canonical selection, valid usage, and no extra keys or duplicate keys. Refusals, tool calls, partial responses, extra prose and unknown IDs fail closed. This tests whether ordering verified facts is useful before adding a richer explanation. [Responses migration](https://developers.openai.com/api/docs/guides/migrate-to-responses) · [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)

The count endpoint checks the same instructions, input, model and schema before generation. Generation permits at most 768 input and 128 output tokens. The two requests share a five-second abort deadline, accept at most 16 KiB per response, disallow redirects and make no automatic retries. Failed and uncertain attempts count toward the budget. A Firestore transaction reserves one attempt against 3 per verified user per UTC day, 20 globally per day and 200 globally per month. There is no refund after failure. Firebase limits the function to two instances with concurrency one and a 15-second invocation timeout. Quota documents contain a hashed UID in the user document ID and rolling counters. Clients cannot read or write them. Staging operators should clear the collection when closing the pilot. Raw prompts, raw results and provider errors are neither logged by the application nor persisted. The authorized caller receives a deterministic explanation if the flag, key, budget or provider is unavailable.

The flag is enabled only by the exact string `true`. It also requires a known non-production, non-demo Firebase project. The production workflow excludes this function. The separate legacy synthesis functions remain outside the deployment path. `store:false` disables Responses application-state storage. OpenAI's standard abuse monitoring may still retain content, generally up to 30 days, subject to stated exceptions. Account-specific data sharing and any modified retention controls remain to be confirmed before a future real-data pilot. [Token counting](https://developers.openai.com/api/docs/guides/token-counting) · [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data)

## Synthetic demonstration and cost

With the mock selecting `income`, the response leads with Market A median household income **$62,000** and Market B **$68,000**, a **$6,000** difference. The second fact reports **12,000** versus **9,000** households. The caveat says these figures establish neither demand, profitability, nor causation. The deterministic path leads with households and presents both facts. Run `npm --prefix functions run build && node --test functions/test/openai-explanation.test.cjs` to reproduce the demonstration. Firebase emulator tests cover the actual disabled callable and transactional quota. No real provider inference or production data was used.

| Scenario | Assumption | Estimated OpenAI generation cost |
| --- | --- | ---: |
| Representative request | 250 input, 16 output tokens at standard rates | $0.000033 |
| Maximum modeled request | 768 input at the $0.125/M cache-write price as a conservative input rate, 128 output at $0.50/M | $0.000160 |
| 50 attempts/month | Maximum modeled request each time | $0.008 |
| 200 attempts/month | Maximum configured monthly attempts | $0.032 |
| 1,000 attempts/month | Future sizing only, above the enforced cap | $0.160 |

This estimate uses the published model rates and excludes Firebase invocations, Firestore, networking and any applicable tax. Confirm the count endpoint's billing treatment, delivered service tier, token usage and actual latency in the authorized synthetic staging run. Prices can change. Application quota bounds request volume even when the provider times out. Configure the provider project’s hard spend limit and alerts as a separate control. [Model rates](https://developers.openai.com/api/docs/models/gpt-6-luna) · [OpenAI spend limits](https://developers.openai.com/api/docs/guides/spend-limits)

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

1. Confirm the correct OpenAI organization and non-production project, funded API billing, the model allowlist, service-account key permissions for Responses and token count, and data-sharing settings. Confirm a project hard cap with spend alerts. Review the effective Firebase identity and bind only the approved staging key to the prototype. Do not copy or expose credentials.
2. Separately authorize the exact staging deployment and one bounded synthetic request. Verify strict response compatibility, real token counts, actual usage/cost, latency, audit metadata without payloads, and flag-off fallback. Disable the flag when the trial ends. Production is outside this gate.
3. Review the minimum Decision Report data projection, authorization/entitlement gates, provider retention and user-facing disclosure before a small approved pilot. Verify that the original report is usable when the feature is off. Approve any later production deployment and activation separately. Keep Stripe and report entitlement mechanics independent.

Verification and exact-head status are recorded on the draft PR.
