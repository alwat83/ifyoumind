# B+ "Check the claim": implementation candidate evidence

Draft only. Not merged and not deployed. Production is Hosting `f0250d10c22751a7` (release `1795757265775000`, source `abb82dd0`), which this branch is based on.

## What changed

- `home-discovery-examples.ts`: each example has three preset statements. Every verdict is **computed** from the example's own values. The tax checks use the source cells B2–D3 in `home-bill-examples.json`, electricity uses J2/J3 and E2/E3, and cities use the public sample estimates already on the page. "Can't tell" statements reuse the examples' existing limit text. `home-bill-examples.json` is untouched.
- `public-landing.component.*`: the hero is now the product promise plus one example card. Picking a statement opens its source cells, its calculation and then its verdict: **Supported / Not supported / Can't tell from these numbers**. The existing evidence disclosure, "Compare my … CSV", the full-example link, deep links, the Data Sources link and the rest of the page are unchanged.
- No new events, storage, cookies, consent changes, Functions, auth, billing or Instagram changes.

## Copy rules applied

- Statements are quoted, preset and labelled "These statements are preset for this example." There are no text fields. Verdicts say "…by these numbers", so they describe this example's data, not the world.
- No causal wording ("It's mostly school charges", not "caused"), per AGENTS.md: "Two annual statements do not establish a trend, correlation or cause."
- City statements say "estimate", and their verdicts carry the existing caveat that differences were not significance-tested.

## Measured QA (built app served as https://ifyoumind.com, real pending consent banner)

Statements are the primary controls. Clearance is the gap between the bottom of the lowest statement and the top of the banner. Hit testing checks that `elementFromPoint` at the centre and both ends of each statement returns that statement.

| Viewport | Banner | Statement clearance | Statement targets | Hit-tested | Example buttons above banner |
|---|---|---|---|---|---|
| 1280×800 | 78 | 245 | 562×52 | yes | yes |
| 390×844 | 132 | 167 | 324×48 | yes | yes |
| 414×715 | 132 | 221 | 348×44 | yes | yes |
| 390×664 | 132 | 170 | 324×44 | yes | yes |
| 375×667 | 132 | 173 | 309×44 | yes | yes |
| 375×553 | 132 | 59 | 309×44 | yes | no (below the statements) |
| 360×640 | 137 | 141 | 294×44 | yes | yes |
| 320×568 | 156 | 62 | 254×44 | yes | no (below the statements) |

Example buttons measure at least 118×44. There is no horizontal overflow at any size. After a tap, the verdict and finding are visible above the banner at every size.

`consent-layout.spec.mjs` now asserts this for all three statements, with a 24 px minimum clearance, at seven phone sizes.

**Keyboard and assistive tech:**
- Statements are buttons with `aria-expanded` and `aria-controls`.
- Focus stays on the chosen statement, and every stop has a 3 px focus outline.
- A polite status region announces "<verdict>. <finding>".
- With reduced motion, the cells → steps → verdict sequence is not animated.
- axe (WCAG 2.0/2.1 A and AA) reports no violations at 1280×800 or 390×664, before or after a check.

**GA4 semantics**, checked with the real public tag replayed locally; hits were recorded and never sent:

| Consent | Result |
|---|---|
| Allow | 1 `page_view`, nothing else on load. `free_tax_example_viewed` ×1 on the first tax check, unchanged by repeat taps. `free_electricity_example_viewed` ×1. `evidence_revealed` ×1 (tax). No city event (as live). No UTM or private values in `dl`. |
| Reject | 0 Google requests |
| Pending | 0 Google requests |

- `free_tax_example_viewed` keeps its documented meaning, "saw the tax example": it fires on a statement check, an example choice or a deep link, as it fired on Reveal, an example choice or a deep link before.
- `evidence_revealed` stays tied to the "Show the evidence" disclosure. The compact cells inside a check do not fire it, so its rate stays comparable with the baseline.

The scripts that produced these results are `bplus-app-qa.js` and `bplus-ga4.js`. The raw output is in `qa-*.json`.

## Side-by-side screenshots

`screens/compare-<viewport>.jpg`: live production | B+ before a choice | B+ after the first statement, all with the pending banner.

## Three-second comprehension test: not run

No cold visitors were available to this agent, and simulated answers would not be evidence. This protocol is ready to run:

1. Five adults who have never seen ifYouMind or its Instagram posts, recruited outside the team.
2. On a phone, show the 390×664 B+ screen (`screens/compare-390x664.jpg`, middle panel) for 3 seconds, then hide it.
3. Ask, without hints: "What does this website do?" and "What would you do first?" Record their exact words.
4. Count as **understood** if the answer mentions comparing or checking bills or numbers, or what changed. Record anything else verbatim.
5. Optionally repeat with the live screen (left panel) on five different people for a baseline.

| # | Phone/OS | "What does it do?" (verbatim) | "What would you do first?" (verbatim) | Understood? |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

## Rollback

- **Release:** this ships, after separate authorization, as its own Hosting-only release. Rollback is the standard Hosting version restore to `f0250d10c22751a7` (current live), with no Functions, rules or config involved.
- **Code:** revert this PR's commits; the change is confined to the landing component, its example data module and specs.
