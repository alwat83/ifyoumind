# Bill Discovery explanation value evaluation

**November 15, 2026 · OpenAI / Codex.** [Draft PR #101](https://github.com/alwat83/ifyoumind/pull/101) is stacked on the [approved #95 pilot](https://github.com/alwat83/ifyoumind/pull/95) at `b249ee122b19f3ee5500cec8873a17c97975c986`. The browser uses that commit's typed calculation engine for all five synthetic bills. The evaluator serves a standalone loopback page.

## Try it

From the draft checkout with the existing lockfile dependencies installed, run `node prototypes/bill-explanation/serve.mjs`. Select a synthetic bill and **Presentation** on the [loopback review](http://127.0.0.1:4318/). The participant links below open a single assigned view and hide the review controls. Each view starts at the same finding and evidence disclosure. B and C then show the explanation automatically with matching typography, labels and controls. The comparison omits the future consent interaction so it measures the explanation content. Explanation links open the shared arithmetic and figure list.

| View | A · Original | B · Fixed local | C · Structured selection |
| --- | --- | --- | --- |
| Phone, 390 px | [A](bill-explanation-review/mobile-a.png) | [B](bill-explanation-review/mobile-b.png) | [C](bill-explanation-review/mobile-c.png) |
| Desktop, 1280 px | [A](bill-explanation-review/desktop-a.png) | [B](bill-explanation-review/desktop-b.png) | [C](bill-explanation-review/desktop-c.png) |

The six captures show the same two-year tax fixture in the participant view. B uses an authored plan from the shared content library. C validates a simulated JSON selection of approved IDs. Both have the same two factual observations and mandatory limitation. C changes their order, selects another approved action, and emphasizes itemization in the two-year tax takeaway. The single tax and electricity fixtures each have one approved takeaway. The C selector follows a deterministic mock policy. Any observed difference would concern these presentations and would still need validation against an actual provider's choices.

## Scenario comparison and automated results

| Synthetic fixture | A, B and C share this result and evidence | B's suggested next step | C's suggested next step |
| --- | --- | --- | --- |
| One property-tax statement | $4,620.37 annual tax and a $385.03 monthly budget average. | Check due dates and installments. | Find the prior annual bill if comparing. |
| Two comparable annual statements | $4,200.00 → $4,620.37, up $420.37 (10% rounded). | Compare the itemized assessment, rate and exemption lines. | Find itemized statements if either gives only a total. |
| Electricity usage and charges | $145.20 for 660 kWh, about $0.2200/kWh across the bill. | Check itemized energy and fixed charges. | Find an earlier bill for the same service and use its meter-read dates. |
| Missing electricity usage | Local validation asks for billed kWh. | Explanation withheld. | Explanation withheld before selection. |
| Incompatible tax periods | Local validation asks for the immediately preceding tax year. | Explanation withheld. | Explanation withheld before selection. |

All 15 mode and scenario combinations passed in each of five browser configurations. The tests compare the original text, figures, arithmetic and error messages across modes. The contract suite validated approved observations and limitations and rejected ten malformed or unsupported responses, plus a thrown transport error. The five synthetic scenarios showed zero unsupported claims in the checked output. The mock made zero provider requests and cost $0. In the local Node benchmark, both B and C prepared the explanation in under 0.01 ms per fixture at p95. Reading time and human comprehension require participant sessions.

## Supervised participant protocol

Use the [existing local pilot boundaries](BILL_DISCOVERY_PHASE_2A.md#limited-pilot-runbook) with up to four consenting participants and supplied synthetic figures only. Use a fresh browser profile on a supervised device, one viewport and input method per participant, and keep the facilitator's score sheet out of view. Ask for consent before starting. Use anonymous sequence codes P01–P04 without linked identities. Do not collect personal information, recordings, actual bill details or verbatim responses. Keep the completed [observation sheet](BILL_EXPLANATION_OBSERVATION_TEMPLATE.md) private and report only aggregate results.

Open each assigned link in a fresh tab at the top of the page. For the first three participants, each mode and fixture occurs once in each position and each mode sees each fixture once. The fourth row reverses the first row and is a supplemental check.

| Sequence | First | Second | Third |
| --- | --- | --- | --- |
| P01 | [A · one tax bill](http://127.0.0.1:4318/?bill=tax-single&view=1) | [B · two tax bills](http://127.0.0.1:4318/?bill=tax-pair&view=2) | [C · electricity](http://127.0.0.1:4318/?bill=electricity&view=3) |
| P02 | [B · electricity](http://127.0.0.1:4318/?bill=electricity&view=2) | [C · one tax bill](http://127.0.0.1:4318/?bill=tax-single&view=3) | [A · two tax bills](http://127.0.0.1:4318/?bill=tax-pair&view=1) |
| P03 | [C · two tax bills](http://127.0.0.1:4318/?bill=tax-pair&view=3) | [A · electricity](http://127.0.0.1:4318/?bill=electricity&view=1) | [B · one tax bill](http://127.0.0.1:4318/?bill=tax-single&view=2) |
| P04 | [C · electricity](http://127.0.0.1:4318/?bill=electricity&view=3) | [B · two tax bills](http://127.0.0.1:4318/?bill=tax-pair&view=2) | [A · one tax bill](http://127.0.0.1:4318/?bill=tax-single&view=1) |

Say “This is a made-up bill. Review it however you like and tell me when you’re ready to describe it.” Start timing when the whole assigned view is ready. Stop when they say ready or at 120 seconds. Note time and whether help was requested, then ask these questions in the same order:

1. “In your own words, what is the most useful thing you learned?”
2. “What important thing can’t you tell from this?”
3. “What would you check or do next?”
4. “How much did this presentation help you understand the result?” Use a 1–5 scale from “not at all” to “very much” with a “not sure” option.

Use “Take another look if you’d like” for a request for help and record the request. Score independent answers before giving any assistance. Treat time-to-ready as a measure of understanding only when the answer is correct, and keep timeouts distinct. After the three trials ask “Which of the three presentations would you use again, if any?” Record the slot before translating it to A/B/C. Preference can reflect the bill topic, so treat it as supporting evidence. If time allows, open the [missing-usage](http://127.0.0.1:4318/?bill=missing-usage&view=2) and [incompatible-period](http://127.0.0.1:4318/?bill=incompatible-years&view=3) views, with no further prompting. Use the same first three questions and score recovery separately.

| Fixture | Correct takeaway | Valid limitation | Appropriate action |
| --- | --- | --- | --- |
| One tax bill | It shows the annual tax or a monthly amount for budgeting. | One year can't show a change or establish installment amounts. | Check payment terms or get last year's bill for comparison. |
| Two tax bills | The annual tax increased by about $420. | The totals can't establish the cause, correctness or grounds for appeal. | Compare or find itemized bills and check a relevant line. |
| Electricity | The bill shows charges and usage, or a whole-bill average. | The average isn't the tariff, and one period can't establish why charges or use changed. | Check itemized charges or find a comparable bill for the same service. |
| Missing usage | There is insufficient information to calculate the finding. | The billed usage is unknown. | Find the kWh figure. |
| Incompatible periods | The requested comparison cannot be calculated. | The supplied years aren't adjacent. | Find the immediately preceding statement. |

Accept equivalent wording and any next step that is relevant and supported. Mark unsupported conclusions separately, including claims about a tax error, a known cause or an official utility rate. Record whether a claim came from the page or the participant's interpretation. A materially unsupported statement in the page stops the evaluation. No participant sessions or outcomes are recorded as of this update.

## One integration and a separate consent boundary

[PR #96's validated design](https://github.com/alwat83/ifyoumind/blob/f36dcf1de386cc0d91c4dfed6d9957178a20fc14/docs/product/OPENAI_ACTIVATION_READINESS.md) is the integration to extend after review. It used the restricted staging Functions identity and key, one authenticated Responses request, strict JSON schema, validated IDs and token usage, capped response bytes and deadline, quota reservation, deterministic fallback, and a disabled-by-default staging guard. The existing callable accepts a fixed market fixture; it has no bill mode. This draft does not add a second provider client, callable, key, permission, flag, or backend implementation.

Proposed boundary:

1. The browser completes the result and evidence locally, with no sign-in, outbound call, or storage. A separate disclosure follows an explicit **Explain my findings** action. Continuing without agreeing leaves the local result intact.
2. For a future approved design, consent applies to one request and shows the exact kinds of fields being shared: a category and approved IDs of applicable findings. No amounts, dates, free text, addresses, assessment or tariff values, bill or account identifiers, optional-registration context, images, PDFs, or raw documents leave the browser. Treat the derived selections as user data. Show the provider and applicable retention, and verify account-level data controls before designing any real-data pilot. `store:false` does not eliminate standard abuse-monitoring retention. [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).
3. Start with an authenticated staging-only client that sends a fixed synthetic fixture ID. The server selects the packet and exact allowed IDs, uses the existing PR #96 bounded transport with [strict Responses Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), and validates exact fields, known IDs, distinct observations, and limits. Only trusted text and deterministic evidence render. Mandatory limitations cannot be dropped. Treat timeout, refusal, quota exhaustion, malformed response, and disabled state as no explanation; keep the existing result. A future account-free transport would require its own privacy, abuse and consent review. Do not change the Discovery `connect-src 'none'` boundary in this draft or expose a credential in the browser.

## Recommendation for a synthetic staging experiment

**NO-GO at present.** Complete the counterbalanced local sessions first. Compare unassisted takeaway, limitation and next step by fixture, with time and preference as secondary evidence. Consider a staging request only if C produces a concrete comprehension or action benefit across more than one observation, without a pattern of added errors, assistance or delays. A tie, a preference-only result or an ambiguous small sample favors fixed local wording. The small evaluation informs what to test, with limited ability to generalize.

If the benefit is clear, seek separate authorization for a staging-only `tax-pair` extension in PR #96 and exactly one generation. Review the exact code, schema byte size, credential scope from metadata, project gates, quota baseline and rollback. Keep the existing 1 RPM, byte, deadline and token limits. Use the fixed synthetic fixture with a single request and zero retries. A request outside the reviewed limits stops the test.

With authorization, verify flag-off before the test, then use the existing staging operator runbook for one gated request. Pass only if every selection is valid, grounded and useful, and the entire interaction stays within its five-second provider deadline with reported input ≤768 and output ≤128. Record latency, token counts, selected IDs, separately reconciled usage and quota, and any fallback; restore OFF immediately, reverify 100% traffic and deterministic behavior, and check no additional reservation or call. A failure means stop, restore OFF, and preserve evidence without retrying. Previous PR #96's single market test took 3.737 s; that is not a bill result. At the [official Luna Standard rates](https://developers.openai.com/api/docs/models/gpt-6-luna) of $0.10/$0.50 per million input/output tokens, the accepted envelope prices to about **$0.000141** in provider generation, excluding cloud infrastructure. This is a planning estimate, not an enforced spend limit or a bill.

## Verification and release boundaries

- `node --test prototypes/bill-explanation/*.test.mjs` passed six contract tests and five browser configurations. Tested desktop axe, keyboard and focus, reduced motion, 320/390/768/1280 px Chrome and iPhone-sized WebKit, no horizontal overflow, identical evidence and validation, zero post-load requests, and empty cookies and storage. Use `IFYOUMIND_EXPLANATION_CHROMIUM_CHANNEL=chrome` when running with the installed Chrome browser. Physical devices and spoken VoiceOver are awaiting verification.
- Strict TypeScript compilation, `git diff --check` and the existing Discovery isolation guard passed. The PR workflows target `master`, and this draft targets the pilot branch.
- Production files, Functions, auth, pricing/checkout, entitlements, report generation and commercial navigation are outside the diff. No analytics, document input or deployment. PR #95's pilot is unchanged. PR #96 remains off under its separate gate. No merge or provider activation is requested by this draft.
