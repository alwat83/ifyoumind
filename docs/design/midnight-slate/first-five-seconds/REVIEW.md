# First five seconds — selected A, immediate answer reveal

November 20, 2026 · OpenAI / Codex · PR #119 · development only.

The founder reviewed the actual A/B/C studies, selected **A's question-led direction**, and authorized implementation with **B's immediate, satisfying answer reveal**. This supersedes the earlier B recommendation. No merge, deployment or production authorization. Protected #118 remains separate and unchanged at `2f4975f94ac888547df8b1fbdf149a50741f6570`.

## Preserved comparison

[Mobile side by side](screenshots/mobile-comparison.jpg) · [Desktop side by side](screenshots/desktop-comparison.jpg) · [working study index](index.html). The studies are first-screen review artifacts, outside every app route/build/import graph. Their continuation links open the existing localhost product; they are not another application.

| Study | First impression and comprehension hypothesis | First interaction | Tradeoff |
| --- | --- | --- | --- |
| **A — question-led; selected** | A familiar bigger tax bill creates a specific reason to investigate. The question, serif typography and whitespace earn attention. Supporting copy must explain broader capability. | **Reveal what changed** shows the supported answer on the same page. | Tax could appear to be the whole product without the broader supporting sentence. |
| **B — answer-first reference** | “Understand your bills” plus the large $420 figure states value immediately. | **Show the evidence** opens the arithmetic. | Clearer immediate explanation, but less curiosity and emotional engagement than the founder wants. |
| **C — two-bill comparison** | Two annual amounts explain the mechanics transparently. | **Compare these bills** reveals the computed change, then evidence. | More procedural and asks the visitor to think about inputs before a conclusion. |

These are design hypotheses plus founder preference, not measured customer comprehension, engagement or conversion. No participant session occurred. All three use the same canonical synthetic amounts: 4,200 → 4,620 total; 2,400 → 2,640 school tax; +420 total, +240 school, 57.1% contribution. No tax rate, assessment, error, appeal eligibility, savings or causal explanation is invented.

## Baseline audit and selected implementation

The actual prior app at `19882ba22e5d0ba3ae28fbaf2f133a7e6180cf43` was audited at 1440 and 390 px. [Recorded observations](BASELINE_AUDIT.json). Its “Find the story. Make your move.” positioning was abstract; “Try a free example” scrolled to a finding already loaded. The $420 finding was already within both viewports. This proposal does **not** claim that the baseline required a click to compute it or that the redesign has measured faster understanding.

Implemented only after the founder's selection:

- One primary tax question: **“Your tax bill went up. Where did the extra $420 go?”** The made-up example label appears before it.
- Supporting copy: **“Understand your bills. Compare U.S. cities. See the numbers behind each finding.”** No arbitrary question box or live AI claim. Electricity and city examples remain secondary controls, with the same calculations and routes.
- One **Reveal what changed** button. It shows the existing $420 finding and $240 school contribution immediately in place, with no new page, loading screen, provider call or bill processing.
- A short 240 ms opacity/8 px entrance communicates that content has appeared. Reduced motion disables the animation and smooth scrolling. Focus moves to the result; a later keyboard choice cancels stale focus movement. Repeated reveal is idempotent.
- Evidence comes before own-information continuation in the reading order. Existing tables, source cells, arithmetic and limitations remain. The direct CSV link retains only the public category; recognized redacted CSVs stay browser-local. No typed-input/PDF experiment is introduced.
- Explicit category/#business deep links open their answer directly. The header's existing component offers a compact homepage variant; other surfaces retain their current navigation. Saved decisions remain one click on desktop and in the native mobile menu.
- The city sample and $79 report continuation remain separate from free household bill comparisons. Authentication, saved records, pricing, enrollment, entitlements, Checkout and generation code are untouched.

## Actual implementation screenshots

| State | Desktop | Mobile |
| --- | --- | --- |
| Before, verified 19882ba | [1440 first viewport](screenshots/baseline-1440.jpg) | [390 first viewport](screenshots/baseline-390.jpg) |
| A opening | [1440](implementation/after-home-1440.jpg) · [full page](implementation/after-home-1440-full.jpg) | [390](implementation/after-home-390.jpg) · [full page](implementation/after-home-390-full.jpg) |
| Immediate answer | [1440](implementation/after-reveal-1440.jpg) · [full journey](implementation/after-reveal-1440-full.jpg) | [390](implementation/after-reveal-390.jpg) · [full journey](implementation/after-reveal-390-full.jpg) |
| Evidence | [1440 full page](implementation/after-evidence-1440-full.jpg) | [390 full page](implementation/after-evidence-390-full.jpg) |

[320/820 and capture metrics](implementation/CAPTURE.json) verify the first action within all four viewports and zero horizontal overflow. These are actual Angular screenshots with synthetic examples, not generated mockups or accepted Linux baselines. The render hides only the existing emulator warning overlay. Full-page captures show the entire homepage and continuation.

## Five-task first-time visitor walkthrough

Use a consenting participant, synthetic information only and the localhost build. Explain that the figures are fictional and this is a prototype, then give no product tour. Do not coach answers or contact/invite participants autonomously. Stop if real personal information, a real bill or payment details appear.

| Task / neutral prompt | Observe without help | Important distinction |
| --- | --- | --- |
| 1. Show the opening for five seconds, then ask “What do you think this site helps you do?” | Can they describe comparing/understanding bills and evidence, with broader city exploration discoverable? | Record their own words; do not claim measured clarity from browser checks. |
| 2. “Show me something you can learn here.” | Can they activate the reveal and explain the $420 increase and $240 contribution? | This is a made-up example, not their taxes or proof of overpayment. |
| 3. “How would you check that?” | Can they open evidence and identify a source value, calculation and limitation? | Arithmetic shows decomposition, not causation, correctness or appealability. |
| 4. “Where would you go to use your own information?” | Can they identify the direct tax CSV intake, two-statement format, local privacy and unsupported PDFs? | Use only the supplied synthetic CSV if demonstrating input. No account or external processing. |
| 5. “What else can you do, and what would payment add?” | Can they find electricity/cities and the existing city/Business report sample? | Bills remain free/local; the one-time paid report is a separate city/Business offering. Do not enter Checkout. |

Record coded participant/order, unassisted success, misconception, help request, elapsed time and preference in the existing anonymous observation protocol. Rotate the original A/B/C order only if comparing studies; record the actual order and do not claim a four-person pilot is balanced or conclusive. Founder visual preference for A is recorded separately from first-time user comprehension. Current human outcomes: **none**.

## Impact and verification

| Surface | Impact | Evidence / boundary |
| --- | --- | --- |
| Homepage, compact navigation and reveal | Change Required | New question/reveal composition and accessible in-page focus; native menu and existing destinations. |
| Bill Discovery and city comparisons | Verify Only | Existing engines, source evidence, direct category/CSV paths, clearing and privacy retained. |
| Authentication, commerce, reports, saved data | Verify Only | No business-logic change; existing regression journeys and guards remain. |
| Other account/data/admin surfaces | Not Affected | Default navigation behavior, data models, provider settings and permissions unchanged. |
| Review artifacts and verification | Change Required | Three preserved studies, actual before/after captures, fixture guards and a 12-case concept step in the local-first runner. No production imports. |

Local production/local builds passed. The original studies passed 12 viewport/evidence/keyboard/axe/privacy cases after fixing 320 px placement and applying an accessible scroll margin. Eleven focused fixture/runner tests passed. First actual-app targeted run: 17 pass / three fail, exposing duplicate electricity headings and a focus race. The corrected rerun passed all **20** affected desktop/mobile cases without weakening evidence, auth, payment, privacy or visibility assertions. A separate Hosting checkpoint stalled after seven passing cases and was stopped; it is not a pass. Its stale pricing-link/secondary-group selectors were corrected while retaining payment/privacy assertions. A source-watch unit invocation in the restricted sandbox also failed; native execution passed. Full Hosting/exact-head local-first results are recorded on PR #119; pending checks are not passes. A stale selector in the read-only baseline audit was corrected against the actual existing city title.

The local-first runner executes the applicable Launch/QA checks and this review step against a clean exact candidate. GitHub billing stays deferred. Docker is absent on this machine; native Chrome is useful functional evidence, not Linux pixel parity. No automatic baseline update or failed-test retry. Physical iPhone/Safari, spoken VoiceOver and unassisted understanding remain untested.

## Separate save-reliability investigation

The earlier native full run reproduced two concurrent city-save failures, while the next exact-head run passed all 48 commerce and 182 authenticated cases. Read-only tracing locates the error in `createMarketIntelligenceProject`'s transactional aggregate count after the shared usage-lock read; the stack contains Firestore AggregateQuery/Transaction and `INVALID_ARGUMENT: Transaction is invalid or closed`. Installed SDK observed: @google-cloud/firestore 7.11.6. The last-slot replay browser case also received one failed response. This identifies a path to isolate, not a verified root cause or a proven production failure. No duplicate/overspend guarantee is waived by a subsequent pass.

Keep canonical Linux/Java21 reproduction and the #111 live retry in their existing reliability workstream. This design changes no transaction, quota, retry, backend, authorization or allowance assertion. No production write or live attempt was performed.

**Recommendation:** review the implemented A opening and immediate payoff. Production remains NO-GO until required technical/visual/human gates, separately reconciled #118 and explicit release authorization. Do not merge or deploy.

Final build checkpoint: 694.62 kB initial raw / 185.29 kB estimated transfer; public Discovery 248.14 / 68.38 kB. These are build estimates, not measured mobile latency or engagement. The decorative hero image is no longer requested by this opening; assets used elsewhere are preserved.


### Preserved full-run checkpoint and follow-up

[Exact 89ed72d result](../../../verification/local-first/VERIFIED_89ed72d.md) / [JSON](../../../verification/local-first/VERIFIED_89ed72d.json): 695 pass / 12 fail / 15 skip, source integrity valid. Failures were the old promise assertion, six keyboard readiness/modality checks, four compact-nav/reveal interaction expectations and one independent parallel dataset-cap failure. Production focus now waits for Angular's `afterNextRender` write phase and is destroyed on navigation. Updated steps retain strict evidence, focus, forced-color, auth, saved-return, privacy and quota assertions. All six affected Hosting keyboard cases and all 157 fast checks passed afterwards; scoped lint passed. The final exact-head gate belongs to the resulting PR head and is recorded there, not inferred from these checkpoints.

The dataset-cap failure is in `writeWithinCap`/`universal-limits`, not the city-save callable. It remains a separate backend investigation; shared error text does not prove a common cause. No cap, retry, error-classification or concurrency assertion was changed. Earlier city-save and #111 live gates remain explicit.


### Category-switch focus verification

[Exact 2cc49b5 result](../../../verification/local-first/VERIFIED_2cc49b5.md): 706 pass / one fail / 15 skip; source integrity valid. All 186 authenticated, 48 commerce and 24 fixture/access tests passed. One narrow Hosting keyboard case caught a real interaction regression: replacing an already-visible answer moved focus away from the selected electricity button. The correction preserves selected-control focus for category replacement and cancels pending movement; initial reveal still focuses its newly visible result. The strict focus assertion remains and is also checked after the new answer paints, preventing an early assertion from hiding delayed movement. Screenshots/composition and all calculations are unchanged. The resulting exact head receives a separate full local-first run; historical failures are not erased.

Follow-up checkpoint: all three affected desktop/mobile/narrow Hosting cases passed with the additional post-paint focus assertion; production build and scoped TS/HTML lint passed. The final exact-head full result is recorded on #119.
