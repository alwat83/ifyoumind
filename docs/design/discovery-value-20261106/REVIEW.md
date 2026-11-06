# See the change. Check it.

November 6, 2026 · OpenAI / Codex; specific model/session unknown. **Working design draft; not merged or deployed.** Continues [draft PR77](https://github.com/alwat83/ifyoumind/pull/77), preserving its initial021f8e3 and subsequent8c6fa67 records. Local branch `codex/discovery-value-playful-20261106`; normal fast-forward update to the existing PR source branch after verification.

**Committed/pushed review head:** `9b0b2787cefd4c3953796be6b18e3fdad8060b4c`, [draft PR77](https://github.com/alwat83/ifyoumind/pull/77), normal fast-forward update preserving021f8e3/8c6fa67. Fresh [build42297006341](https://github.com/alwat83/ifyoumind/actions/runs/42297006341) and [fullQA42297006429](https://github.com/alwat83/ifyoumind/actions/runs/42297006429) **in progress**, not full CI passes at this observation. [Point-in-time record](CI_OBSERVATION.json). Separate `codex/discovery-value-handoff-20261106` records status without moving the reviewed design head. No release authorization inferred.

## Founder direction and acceptance

Make the value clearer and the interaction fun; find a “wow” factor that earns attention. Continue designing with less friction, with participant testing deferred to the end of this pass. Acceptance is a truthful comparison visible immediately on desktop1280×900, mobile390×844 and narrow320×568, one-action evidence, keyboard return, unchanged correction/clear/privacy behavior and guarded ambiguous/zero cases. Engineering checks establish behavior, not human comprehension or commercial success.

## The attention hook

The made-up electricity example pairs **Bill change +21%** with **Energy used +10%**, including actual $120.00→$145.20 and600→660kWh inputs. Tap the green energy card to open the exact consumption calculation and CSV source cells; “Back to the big picture” returns focus. This makes a useful difference visible without inventing why it occurred or claiming a supplier tariff changed.

The made-up tax example pairs **Bill change +$420.00** with **School +$240.00**, with4200→4620 and2400→2640 dollar contexts. Ties, offsetting charges and unchanged charges retain the original comparison instead of selecting a sole contributor. The shared metadata is optional presentation of existing calculated facts, not a second engine.

“Your bills, made clearer.” and “See the change. Check it.” set the purpose. Short finding labels, quiet icons, a green usage card, “Show me the numbers” native disclosures and optional “Follow your curiosity” buttons make the existing findings easier to explore. Exact math appears before the technical source-grid explanation. The first finding and both comparison values precede optional exploration; users do not answer questions or complete a new step to see a result.

The small arrival movement never delays or changes values; reduced-motion disables it, as does the narrowest viewport. Keyboard exploration focuses the existing finding heading and can return to the lead. Clear/category/report changes remove or reset exploration state through the existing lifecycle.

## Working review

Local preview: http://127.0.0.1:4326/discover/?example=electricity and ?example=tax while the checked server runs. Rebuild using the existing lockfile and `npm run build`; start with `DISCOVER_PORT=4326 npm run start:discover` only if no server already uses that port.

| View | Electricity | Property tax |
|---|---|---|
| Mobile first screen | [390px](screenshots/mobile-electricity-fold.png) | [390px](screenshots/mobile-tax-fold.png) |
| Narrow first screen | [320px](screenshots/narrow-electricity-fold.png) | [320px](screenshots/narrow-tax-fold.png) |
| Desktop first screen | [1280px](screenshots/desktop-electricity-fold.png) | [1280px](screenshots/desktop-tax-fold.png) |
| Open spotlight evidence | [Exact usage inputs](screenshots/mobile-electricity-spotlight-proof.png) | [Exact charge inputs](screenshots/mobile-tax-spotlight-proof.png) |

Full-page equivalents, [layout observation](layout-observation.json) and [14-image manifest](asset-manifest.json) accompany these internal synthetic captures. Initial PR77 images remain preserved in [the previous review](../discovery-results-20261106/REVIEW.md); they are not the final comparison design or a fresh live release. At320px, detailed explanation/evidence remains available by normal vertical scrolling; no content is truncated to force a fit.

## Changes and limits

Shared findings HTML/controller/base styles plus a separate spotlight style, tax ready-state HTML/mobile styles, optional `DiscoveryHighlight` contract/metadata in the existing property-tax/electricity factories, two meaningful fast guards and two new browser cases across three viewports. Existing copy assertion updated. Metadata reuses validated integer-cent/usage deltas and the original formatting helpers: zero usage never produces an invented percentage; decreases retain their sign; tied/offset/unchanged property-tax charges never imply a sole contributor. Underlying validation/calculation algorithms, recognized schemas and source evidence are retained.

No new dataset, parser, AI, PDF, backend/private upload/storage/provider, dependency, price, Stripe, authentication, Business, homepage or deployment-workflow change. Household CSV remains in browser memory. This design introduces no paid API or service. Public discovery bundle255.06kB raw/69.32kB estimated transfer; shared findings6.41kB/mobile4.33kB warning budgets remain below8kB errors, with no budget relaxed. Other existing build warnings persist.

## Verification

Final production, property-tax, electricity and unified builds completed successfully. Fast139PASS; targeted HTML/controller lint,36file production-bundle guard,21rootJS/3allowlisted-asset privacy isolation and whitespace checks PASS. Final fresh browser checks:48tax/27electricity/36unified/84public **195PASS,0FAIL/0SKIP**. Fourteen final synthetic screenshots/hashes and layout observations captured. Both bold values fit every checked first viewport (narrow electricity lower value bottom539.47px within568px); horizontal overflow0. Standard390px first evidence control ends771.36px within844px;320px evidence remains scrollable. [Machine-readable local results](LOCAL_VERIFICATION.json).

The first post-polish tax run had46PASS/2accessibility-scan timeouts, including `browserContext.newPage`; no failed attempt is counted as a pass. A complete fresh tax rerun uses one worker without raising timeouts. The prior195-browser pass preceded the last narrow-screen refinement and is not substituted for final checks.

Initial PR77 exact021f8e3 now has [build42278181407 SUCCESS](https://github.com/alwat83/ifyoumind/actions/runs/42278181407) and [fullQA42278181425 SUCCESS](https://github.com/alwat83/ifyoumind/actions/runs/42278181425), freshly observed. Those checks do not cover the revised head; new-head CI follows its push. Historical91global-lint/11Angular test-compiler diagnostics, the known fixture skip and budget warnings are not fixed or rerun as full checks. Physical devices/Safari/spoken screen reader, participant comprehension/fun/usefulness, retention and real signup/payment remain unverified. Participant sessions are deferred as directed.

## Product and release state

Live remains the previously verified PR76 productione5d8f15/Hostingf76d7036fa558cf7; [release evidence](../../releases/first-seconds-production-20261106/LIVE_VERIFICATION.md). No new live suite or release performed here. This draft needs its own exact-head release approval before any future merge/deployment. Outbound remains **Pending Founder Setup**; no sender reminders, recruitment, messages, publishing or spending.

Commercial hypothesis: a visible, understandable difference earns curiosity and helps users reach trustworthy evidence with less reading. No outside-user, acquisition, conversion, retention, revenue or profitability result measured; financial scoreboard unchanged. Opportunity ranking: finish this concrete existing-flow design now (low operating cost, immediate reviewability); deferred end-of-design human observation next (stronger demand evidence); relevant Business demonstration after outbound specifically reopens (direct-sale opportunity). Recommended next assignment: review the working comparison and refine only concrete remaining comprehension friction inside these supported flows.
