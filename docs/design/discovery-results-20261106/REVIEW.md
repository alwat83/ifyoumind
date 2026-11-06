# Discovery results — less friction after the first click

November6,2026 · OpenAI / Codex. **Implemented locally; not merged or deployed.** Branch `codex/discovery-results-design-20261106`, from production handofffb2fc76 / released applicatione5d8f15. Exact new commit/PR/CI are recorded in GitHub after push, never inherited from the released base.

**Committed review candidate:** [draft PR77](https://github.com/alwat83/ifyoumind/pull/77), exact `021f8e3130fc497067f994fcae252d6035557cf0`. New-head [build42278181407 SUCCESS](https://github.com/alwat83/ifyoumind/actions/runs/42278181407); [fullQA42278181425 running](https://github.com/alwat83/ifyoumind/actions/runs/42278181425) at the [recorded observation](CI_OBSERVATION.json). Local passes below are not a full CI pass or release authority.

## Founder direction

Keep designing; participant testing belongs at the end of this design pass. Emphasize less friction for users. This supersedes participant recruitment/availability as the next gate. It does not expand the two supported CSV categories, calculations, privacy boundary, pricing or production/outbound authority.

## Working experience

Open **http://127.0.0.1:4326/discover/?example=electricity** or **http://127.0.0.1:4326/discover/?example=tax** while the checked local server is running. Developer setup: existing lockfile, `npm run build`, then `DISCOVER_PORT=4326 npm run start:discover` if that port has no existing server. The live site remains releasedPR76; the new results presentation is local/draft only.

- **A clear main finding.** One lavender lead card pairs the total-change story with the two actual bill amounts; supporting findings have quieter cards. Desktop uses the available width; mobile keeps the main title within the first screen at390 and320px.
- **Less repeated reading.** One “Made-up example” label replaces the longer repeated introduction. The live status remains available to assistive technology, without repeating the same ready message visually. “Your findings” is a compact section label, with corrections and the existing comparison dates nearby.
- **Evidence stays one action away.** Native disclosure opens the exact source cells, raw values, calculation and limitations inside a distinct readable panel. The source control fits the default390px/desktop first screen. At320px, vertical scrolling remains valid; nothing is hidden or truncated to force a fit.
- **Corrections take users to the editor.** The former button opened a distant editor without moving the viewport. It now focuses the editor heading. “Back to findings” returns focus to the original action while the findings are still valid; as soon as a value is edited, that return action disappears with the stale findings. Existing rerun/refusal/recovery semantics remain.
- **Existing follow-ups are easier to scan.** Clear disclosure symbols and consistent spacing distinguish the existing suggested checks. No chatbot, new analysis or additional recommendation engine.

No calculation, validation, money formatting, dataset adapter, file/clearing lifecycle or persistence behavior changes. The controller additions only move focus/open/close the existing editor; they do not restore edited data or invent a result. Business/authentication/homepage/Stripe/prices/dependencies/Firebase/deployment workflow remain unchanged.

## Concrete review

| View | Working local design |
|---|---|
| Mobile electricity | [First screen](screenshots/mobile-electricity-fold.png) · [Full](screenshots/mobile-electricity-full.png) |
| Mobile property tax | [First screen](screenshots/mobile-tax-fold.png) · [Full](screenshots/mobile-tax-full.png) |
| Desktop electricity | [First screen](screenshots/desktop-electricity-fold.png) · [Full](screenshots/desktop-electricity-full.png) |
| Narrow320px | [Electricity](screenshots/narrow-electricity-fold.png) · [Tax](screenshots/narrow-tax-fold.png) |
| Evidence and recovery | [Electricity evidence](screenshots/mobile-electricity-evidence.png) · [Tax evidence](screenshots/mobile-tax-evidence.png) · [Editor](screenshots/mobile-editor.png) · [Invalid values](screenshots/mobile-invalid.png) · [Cleared](screenshots/mobile-cleared.png) |

[Live baseline electricity](screenshots/live-before-electricity.png) · [live baseline tax](screenshots/live-before-tax.png). Baseline images are internal read-only synthetic captures from releasedPR76, not examples of customers using the product. Local images are the new design. [Layout observation](layout-observation.json) · [image manifest](asset-manifest.json).

## Engineering checks at the end of the pass

Participant tests are deferred, not simulated by automated checks. Final local production/tax/electricity/unified builds PASS;137fast PASS;48tax/27electricity/36unified/78integrated Hosting browser checks PASS (**189browser,0FAIL/0SKIP**); targeted HTML/controller lint, production36file guard,21JS/3asset privacy isolation and diff/syntax checks PASS. The final78 includes two new direct-evidence/editor-return cases across three viewport projects. Initial presentation-only186PASS is an earlier iteration, not an additional189 or substitute for the final result. New exact-head CI is recorded separately in the PR after push.

Checks cover both examples/recognized CSVs, source tables, validation/refusal, corrections/rerun, clear/category switching, delayed-read privacy, offline-after-load, reload, keyboard focus and checked automated accessibility/overflow. New direct-evidence and correction-return checks run across desktop/mobile/narrow. None of these proves human understanding, engagement, willingness to pay or retention.

Production/main-app styles retain their prior warnings. The shared findings stylesheet4.32kB and mobile overrides4.28kB exceed4kB warning thresholds but remain below8kB errors; no budget was relaxed. The public island is243.32kB raw/67.37kB estimated transfer; no new paid service introduced. Historical global91lint/11Angular test-compiler diagnostics and one known fixture skip remain disclosed; not claimed fixed. Native devices/Safari/spoken screen reader, participant comprehension and real signup/payment remain unverified.

## Release and next design work

Live production remains PR76/e5d8f15, Hostingf76d7036fa558cf7, per the [separate release evidence](../../releases/first-seconds-production-20261106/LIVE_VERIFICATION.md). No production release, rollback, spend or external message is authorized by this design continuation. Revise this feature branch for design feedback; any future merge/deployment requires separate exact-head approval.

Next: review the working visual/interaction flow; refine concrete remaining friction within the same supported journeys; complete the deferred end-of-design participant walkthrough when the founder resumes it. Preserve the broader platform direction, free discovery and optional existing Business79/39 offer. No acquisition, revenue or conversion improvement claimed. Outbound **Pending Founder Setup**; no sender/recruitment questions or communications.
