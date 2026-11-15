# Bill Discovery explanation: founder review

**November 15, 2026 · OpenAI / Codex · Offline mock.** This stacked draft targets `codex/bill-discovery-first-result` at approved pilot commit `b249ee122b19f3ee5500cec8873a17c97975c986`, so it can compare the actual typed-result calculation without altering PR #95. It does not include [PR #96](https://github.com/alwat83/ifyoumind/pull/96), add a product route, or enter a deployable bundle. There are no AI API calls and no new dependencies.

## Try it

From this draft checkout with the existing lockfile dependencies installed, run `node prototypes/bill-explanation/serve.mjs` and open [the loopback review](http://127.0.0.1:4318/). It binds only to `127.0.0.1`; there is no preview deployment. Pick a built-in synthetic bill, read the original finding and evidence, then select **Explain my findings**. The preview shows exactly what kinds of data a future optional explanation would send. Select **Keep the local result** to decline or **Try the mock explanation** to continue. Explanation references open the same arithmetic and figure list. Switching fixtures or hiding the explanation clears the preview state; there is no input field for real bill data.

| View | Deterministic result before explanation | Explanation open |
| --- | --- | --- |
| Phone, 390 px | [Local finding](bill-explanation-review/mobile-local.png) | [Mock explanation](bill-explanation-review/mobile-explained.png) |
| Desktop, 1280 px | [Local finding](bill-explanation-review/desktop-local.png) | [Mock explanation](bill-explanation-review/desktop-explained.png) |

The local result and arithmetic are the original #95 engine's output shown in the review harness. The captures are a matched interaction sequence within the prototype, not a production redesign or an update to production screenshot baselines.

## Evaluation

| Synthetic fixture | Existing result | What the mock adds or protects |
| --- | --- | --- |
| One property-tax statement | $4,620.37 annual tax; $385.03 monthly budget average. | Distinguishes planning from a payment schedule. Check due dates and installment amounts; a single statement cannot show the prior year. |
| Two comparable annual statements | $4,200.00 → $4,620.37. Up $420.37 (10% rounded). | Explains why the two annual totals are useful for budgeting and suggests comparing assessed value, rate and exemptions on itemized statements. Makes no claim about cause, correctness or an appeal. |
| Electricity usage and charges | $145.20 and 660 kWh, about $0.2200/kWh across the bill. | Points to itemized energy and fixed charges; the all-in average does not establish a utility tariff or a change from another period. |
| Missing electricity usage | Specific local validation message; no result. | No explanation or inferred usage; no mock transport. |
| Incompatible tax periods | Local validation requires adjacent annual periods for this comparison. | No explanation or guessed comparison; no mock transport. |

The three valid fixtures passed exact arithmetic and evidence assertions. The two invalid fixtures withheld explanation. Targeted tests rejected foreign IDs, invented data and instructions, duplicate keys or observations, extra fields, refusal, incomplete outputs, invalid JSON and a thrown transport error. These are contract tests and hand-reviewed copy, not samples from a model. The mock made **zero** provider requests, used **zero** provider tokens, and cost **$0**. Local selection and calculation took about **0.1–0.2 ms per fixture** in the 100-batch Node benchmark; it excludes rendering, network and model latency.

For usability, test three versions in rotated order on synthetic fixtures: **A**, today's finding and evidence; **B**, the same evidence with a fixed local explanation; **C**, the same content library with the structured selector choosing order and next step. Ask people to state one correct takeaway, one limitation, and what they would check next without coaching. Log only anonymized task outcomes, time to evidence, whether the sharing boundary was understood, and whether the next step fit the task. Keep factual accuracy and unsupported claims separate from preference. Require every observed amount and claim to trace to evidence, zero unsupported claims, and no explanation on incompatible inputs. This phase has no measured participant usefulness, conversion or revenue impact. If B matches C, prefer the local explanation.

## One integration and a separate consent boundary

[PR #96's validated design](https://github.com/alwat83/ifyoumind/blob/f36dcf1de386cc0d91c4dfed6d9957178a20fc14/docs/product/OPENAI_ACTIVATION_READINESS.md) is the integration to extend after review. It used the restricted staging Functions identity and key, one authenticated Responses request, strict JSON schema, validated IDs and token usage, capped response bytes and deadline, quota reservation, deterministic fallback, and a disabled-by-default staging guard. The existing callable accepts a fixed market fixture; it has no bill mode. This draft does not add a second provider client, callable, key, permission, flag, or backend implementation.

Proposed boundary:

1. The browser completes the result and evidence locally, with no sign-in, outbound call, or storage. A separate disclosure follows an explicit **Explain my findings** action. Continuing without agreeing leaves the local result intact.
2. For a future approved design, consent applies to one request and shows the exact kinds of fields being shared: a category and approved IDs of applicable findings. No amounts, dates, free text, addresses, assessment or tariff values, bill or account identifiers, optional-registration context, images, PDFs, or raw documents leave the browser. Treat the derived selections as user data. Show the provider and applicable retention, and verify account-level data controls before designing any real-data pilot. `store:false` does not eliminate standard abuse-monitoring retention. [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).
3. Start with an authenticated staging-only client that sends a fixed synthetic fixture ID. The server selects the packet and exact allowed IDs, uses the existing PR #96 bounded transport with [strict Responses Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), and validates exact fields, known IDs, distinct observations, and limits. Only trusted text and deterministic evidence render. Mandatory limitations cannot be dropped. Treat timeout, refusal, quota exhaustion, malformed response, and disabled state as no explanation; keep the existing result. A future account-free transport would require its own privacy, abuse and consent review. Do not change the Discovery `connect-src 'none'` boundary in this draft or expose a credential in the browser.

## Recommendation: local review first, one synthetic staging call only if justified

The mock demonstrates useful editorial framing; it does not establish that a model adds value. First review the local mock and run the fixed-copy comparison. If the selection adds something clear, obtain separate authorization for a staging-only `tax-pair` fixture extension in PR #96 and exactly **one** generation. Review the exact code, schema byte size, credentials scope (metadata only), project gates, quota baseline and rollback ahead of time. Keep the existing 1 RPM and existing byte/deadline/token limits; do not introduce a token-count call or retry. If the fixture cannot fit the reviewed limits, stop rather than raise them. No real bills, customer data, production deployments or new provider settings.

With authorization, verify flag-off before the test, then use the existing staging operator runbook for one gated request. Pass only if every selection is valid, grounded and useful, and the entire interaction stays within its five-second provider deadline with reported input ≤768 and output ≤128. Record latency, token counts, selected IDs, separately reconciled usage and quota, and any fallback; restore OFF immediately, reverify 100% traffic and deterministic behavior, and check no additional reservation or call. A failure means stop, restore OFF, and preserve evidence without retrying. Previous PR #96's single market test took 3.737 s; that is not a bill result. At the [official Luna Standard rates](https://developers.openai.com/api/docs/models/gpt-6-luna) of $0.10/$0.50 per million input/output tokens, the accepted envelope prices to about **$0.000141** in provider generation, excluding cloud infrastructure. This is a planning estimate, not an enforced spend limit or a bill.

## Verification and release boundaries

- `node --test prototypes/bill-explanation/experience.test.mjs`: contract, deterministic fixtures, fallback and local perf.
- `node --test prototypes/bill-explanation/browser.test.mjs`: 320, 390, 768 and 1280 px Chromium, plus iPhone-sized WebKit, keyboard/focus, reduced motion, desktop axe, no overflow, offline after load, zero post-load requests and empty cookies/local/session storage. On macOS without the locked headless Chromium binary, use `IFYOUMIND_EXPLANATION_CHROMIUM_CHANNEL=chrome`. Automated WebKit is not Safari hardware coverage or spoken VoiceOver.
- Strict TypeScript compilation and the existing Discovery isolation guard passed. A fresh Discovery build to a temporary directory excluded the mock; the two existing Sass budget warnings in tax and unified Discovery remain. Reviewed images are illustrative, not protected-route baseline replacements. The standard PR workflows target `master`; historical #95 CI is baseline evidence, not CI on this stacked head.
- Production files, Functions, auth, pricing/checkout, entitlements, report generation and commercial navigation are outside the diff. No analytics, document input or deployment. PR #95's pilot is unchanged. PR #96 remains off under its separate gate. No merge or provider activation is requested by this draft.
