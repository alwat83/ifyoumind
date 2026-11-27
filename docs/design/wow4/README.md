# Wow Factor 4.0: first-impression prototypes (exploration only)

**Status:** prototypes for founder review. Not merged, not deployed. No production, analytics, consent, billing or Instagram change.
**Review page (private):** https://claude.ai/artifact/R4P9JteiKdh8YtdFx9n5nD
**Provider/agent:** Anthropic / Claude Code, 2026-11-27.

## Directions
| | Prototype | Idea |
|---|---|---|
| A · Clarity | `prototypes/a-clarity.html` | "Know why a bill changed." One tap merges two statements into a change table |
| **B · Curiosity (recommended)** | `prototypes/b-guess.html` | "Guess the line": the landing continues the Instagram quiz. Your guess becomes the chart, with the cell citation inline |
| C · Wildcard | `prototypes/c-annotated.html` | "The bill that explains itself": scrub a statement from 2024 to 2025, and verifiable margin notes write themselves |

All three use the app's illustrative tax fixture ($4,200 → $4,620; +$90 / +$240 / +$90; 57.1%) and are labelled as made up. Renders at 1280, 390, 375 and 320 (first view and after interaction) are in `renders/`.

## Scorecard (design judgment, 1–5; not conversion results)
| Criterion | Live | A | B | C |
|---|---|---|---|---|
| Three-second comprehension | 2 | 5 | 4 | 4 |
| Emotional impact and memorability | 3 | 2 | 5 | 5 |
| Consumer-benefit clarity | 2 | 5 | 4 | 4 |
| First interaction | 2 | 3 | 5 | 4 |
| Trust and evidence visibility | 3 | 4 | 4 | 5 |
| Mobile and accessibility (with a pending consent banner) | 4 | 2 | 5 | 2 |
| Capability alignment | 5 | 5 | 4 | 3 |
| Engagement potential | 2 | 3 | 4 | 4 |
| **Total / 40** | **23** | **29** | **35** | **31** |

**Banner check (all actions clear of a pending consent banner):**
- B clears it at 390×664, 375×553 and 320×568.
- A's compare button and C's scrubber are covered even at 390×664.

## Recommendation
Build B. It borrows A's one-line product statement and C's inline citation.

- **Implementation:** one focused PR that replaces only the tax hero. The guess calls the existing reveal, which fires the approved `free_tax_example_viewed`, so there's no new tracking. The consent banner, layout and focus tests are kept.
- **Release:** a separate Hosting-only release. It supersedes the PR #133 copy test.
- **Measurement:** compare against the post-fix baseline using the existing events (see `docs/marketing/ga4/MEASUREMENT_GUIDE.md`).

## B+ refinement: "Check the claim" (2026-11-27)

Prototype: `prototypes/bplus-check.html`. Renders: `renders/bplus/`. Checks: `tools/` (Playwright; GET-only against the live site to capture the pending consent banner with computed styles).

- The guess becomes a claim and the reveal becomes a check: cells light up, the math appears, then the verdict (Supported / Not supported / Can't tell from this data).
- The `<h1>` is the product promise ("Find what changed between two bills, with the proof."). Tabs cover Tax bill, Electricity and Two cities; every figure and limit comes from the live examples (`home-bill-examples.json`, `HOME_EXAMPLES`).
- Returning visitors: no new persistence. The header "Compare your own CSVs" link and non-locking claims replace any stored skip.
- Measured with the real banner injected: header link, 3 tabs and 3 claims are all clear at 390×664 (461/532), 375×553 (379/421) and 320×568 (402/412). Claims are at least 44 px; tabs are 36 px on short phones.
- Design-judgment score: 37/40 (B 35, C 31, A 29, live 23). Not a visitor result.
- Risk: "Pick a claim" must not imply free-text claim checking; buttons say "Compare your own…".
