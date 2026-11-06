# First-use validation — PR76

Originally prepared November5,2026 · OpenAI / Codex. **Prepared, not conducted. Participant testing deferred by founder on November6 until the current design pass is complete.** PR76 is now deployed as e5d8f15; [production evidence](../../releases/first-seconds-production-20261106/LIVE_VERIFICATION.md). The [current results-design work](../discovery-results-20261106/REVIEW.md) remains a separate local/draft iteration. This protocol is retained for the later feedback round, not a participant-availability gate to continuing design. No new release or outreach authority inferred.

## One decision

Can a first-time visitor understand the available value in five seconds, start a free example without help, and check one finding? Keep the playful visual direction and two existing categories. Choose the next change from observed confusion rather than another broad redesign.

## What is ready

[Desktop](screenshots/desktop-fold.png), [mobile](screenshots/mobile-fold.png), [320px](screenshots/narrow-fold.png), [tax](screenshots/mobile-tax.png), and the [working design review](REVIEW.md) are immutable candidate evidence. For the five-second purpose check, show the matching first-screen image at its native size, without this document or the facilitator's answer key. Scaling an image to fit a different device is a limitation, not a native-device pass. Screenshots cannot validate taps, navigation or accessibility.

When participant testing resumes, choose and record the exact version under review. Current local design preview uses http://127.0.0.1:4326/discover/ when its checked server is running; developer setup is the lockfile and `npm run build`, then `DISCOVER_PORT=4326 npm run start:discover` if no existing server owns that port. This uses the production artifact and a loopback-only Hosting emulator. The live site remains released PR76/e5d8f15 and does not contain the new results design; do not mix its observations with a local candidate session.

## People and handling

Start with five willing first-time participants as a small qualitative round; aim for at least three on their usual mobile device. Record familiarity with bill analysis, not a demographic profile. Exclude agents, founder walkthroughs and people already briefed on this design from outside-user counts; retain those separately as internal checks. Recruitment/messages remain unsent while outbound is Pending Founder Setup. Use only already-permitted participants or a later specifically approved invitation.

Ask permission to take anonymous notes. No recording, personal bills, file imports, accounts, payment or contact details are needed. Stop if a participant prefers. Keep completed notes in ignored `tmp/first-use-validation/2026-11-05/` or another approved private location. Only the blank [session template](SESSION_TEMPLATE.md) belongs in GitHub; publish a sanitized aggregate only when evidence exists. Do not put participant quotes or identifiers in Notion/public records.

## Eight-minute facilitator script

1. **Introduction, before exposure:** “I’m checking whether a page is understandable. I’m testing the page, not you. Please use the made-up examples only. May I take anonymous notes?” Do not explain the product or point out the example button.
2. **Five seconds:** show the first screen for five seconds, then hide it. Ask: “What do you think this page helps you do?” and “What would you do next?” Write the actual answer before assigning a rating. Do not repeat exposure and label it a first impression.
3. **Unassisted start, up to one minute:** reopen the working page. “Explore this in whichever way makes sense to you.” Record the first action, whether a full example opens, elapsed time and any help. Clicking the top navigation can be a valid route; distinguish it from the direct example link.
4. **Meaning, up to two minutes:** “What is one thing these results tell you? What do they leave unanswered?” Let the person choose a finding. Do not correct them until their answer is recorded.
5. **Evidence, up to one minute:** “How would you check that finding?” Record whether they locate source values/calculation without coaching. If not, offer one neutral hint, record assisted completion separately, and stop the clock.
6. **Clear and switch, up to one minute:** “Finish with this example and explore the other type of bill.” Observe clearing/category switching and whether old results cause confusion. Do not ask for their real data.
7. **Value and expectation:** “What, if anything, was useful or unclear?” Then: “What kinds of files or analysis would you expect this to handle?” Record unsupported PDF/AI/arbitrary-file expectations before explaining today's two recognized CSV formats.
8. **Close:** explain that the examples are made up; calculations show differences, not why they happened. Thank them. No generic Business upsell or purchase request in a household session.

If a participant requests an unavailable feature, record a request rather than promising implementation. A person who encounters a reproducible defect may stop; their partial attempt remains a valid observation, not a completed experience.

## Facilitator answer key — do not show before tasks

Purpose: compare two supported bills, see what changed and check the inputs; an equivalent plain-language explanation is sufficient. Broad “AI can analyze anything” is an expectation mismatch. Next action need not match one exact button.

Electricity: total $120 → $145.20, +21%; use 600 → 660 kWh, +10%; whole-bill average $0.20 → $0.22/kWh includes all charges and does not establish a tariff or cause. Tax: total $4,200 → $4,620, +$420; school charges $2,400 → $2,640, +$240, 57.1% of the increase. Neither example explains why rates changed, proves savings or validates an appeal.

## Record and decide

Use counts with denominators, first versus repeat exposure, actual device/browser, assisted versus unassisted completion, and missing data. Do not count a click alone as a meaningful experience: the person must inspect findings and explain one useful result or concrete limitation. A prepared session, internal QA or a suggested participant is not an acquired user.

Working decision rules, chosen for this small review round, not statistical benchmarks:

| Observation | Next action |
|---|---|
| Any reproducible failure to start, wrong evidence, privacy leak, or inability to clear | Reproduce safely, fix the smallest defect on a feature branch, run relevant regression and seek separate release approval |
| Two or more of five cannot describe the purpose or find a path to a full example without help | Identify the repeated wording/navigation obstacle and make one focused revision |
| Two or more expect arbitrary files, PDFs, AI interpretation or causal answers | Correct the specific misleading entry point before expanding distribution |
| At least four of five describe purpose and reach findings unassisted, with no repeated material misunderstanding | Recommend an exact-head release review; do not claim conversion or general-population validation |
| Mixed, incomplete or fewer than five sessions | Report the exact observations and uncertainty; do not manufacture a pass or redesign from one preference |

No UI change is justified by this packet alone. A successful five-second check is not retention, willingness to pay or revenue evidence.

## Review performed November 5

Source/read-only review of the landing template, category destination getter, mobile screenshots and browser coverage found no new confirmed defect. Mobile390×844 and narrow320×568 recorded images include the finding, exact values, evidence control and main example action. These are inspected November4 candidate captures, not newly executed browser runs or physical-device observations.

Fresh GitHub query confirms exact-head [build41969293482](https://github.com/alwat83/ifyoumind/actions/runs/41969293482) and [QA41969293743](https://github.com/alwat83/ifyoumind/actions/runs/41969293743) SUCCESS, including completed browser/isolation/commerce/authenticated QA steps. [Machine-readable observation](CI_OBSERVATION_2026-11-05.json) records the steps, not invented suite totals. Prior local137fast/66browser results remain dated historical evidence. Existing lint91/Angular11 debt, one known fixture skip, build warnings and device/Safari/spoken-screen-reader/real-payment limitations remain disclosed. No full application checks rerun for this documentation-only packet.

## Commercial priority

| Opportunity | Evidence and likely time to learning | Effort / cost / risk |
|---|---|---|
| First-use sessions on the existing candidate — recommended next assignment | Direct evidence of comprehension/usefulness; one short round after participant permission; no measured outcome yet | Low effort, no purchased service; participation/outbound gates apply |
| One qualified Business sample conversation after outbound reopens | Existing paid product and prepared private route; current need and willingness to pay unconfirmed | Low technical effort; audience/sender/channel/content approval required; earliest direct sale opportunity |
| Further design/features or paid acquisition | No first-use evidence supporting expansion | Higher effort or expense; defer pending observed needs and applicable approval |

Free bill discovery and optional Business purchases stay separate. No financial refresh, traffic/customer total, conversion lift or sale is claimed. Production is released PR76/e5d8f15; the current results-design iteration requires its own explicit release approval. Participant testing is deferred until the end of the design pass.
