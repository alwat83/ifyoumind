# Evidence model and claim grounding: specification v1

**Status:**
- **Work Package 2:** specification plus test-only code.
- **Approved for:** draft only.
- **Not used by production:** `functions/src/index.ts` does not import `functions/src/engine/`. No endpoint, report or data changes.

## Why
The live result chose its verdict by counting "supports" against "gives us pause" bullets (Value Review F9/F20). The evaluation suite shows the defect on real and constructed inputs:

| Fixture | Today's output | What the checker finds |
| --- | --- | --- |
| Live sample (Austin vs Nashville, Charlotte) | "leans favorable" | A recommendation with no criteria or priorities; bare figures as "supports"; Austin's 3% growth vs Nashville's 4% ranked although the gap is inside the band |
| $60,000 ± 2,500 vs $61,000 ± 2,600 | "1 comparison market has a higher median household income" (a concern) | The Census 90% test says no difference |
| Near-identical cities (income gap 0.8%) | "suggests caution" | Every measure is similar; the verdict has no criteria |
| City name containing instructions | Same output as the plain name | Correct: labels are data |

## Objects
Every number a customer reads comes from one of these objects. Each has an `id`, a `subject` (a place, a business or an option), a `measure` and a `unit`.

| Kind | Meaning | Required fields |
| --- | --- | --- |
| `fact` | A published external figure | value (or null if not published), 90% `moe` when published, period, geography level and name, source (publisher, dataset, table, URL, retrieval time) |
| `observation` | A value from the customer's own data | value, period, origin (upload id and column, or manual), quality flags |
| `calculation` | A deterministic result | value, `moe` if propagated, method, version, input ids |
| `estimate` | A value that rests on assumptions | value, input ids, each assumption with whether the user can edit it |
| `hypothesis` | A possible explanation | statement, supporting and contradicting evidence ids, how to test it |

## Claims
A **claim** is one sentence a customer reads. It has:
- a `role`: finding, support, concern, verdict, next step or limitation;
- its `text`;
- the evidence ids it rests on;
- a structured **assertion**.

| Assertion | Means | The checker re-derives |
| --- | --- | --- |
| `value` | "X is N" | The evidence exists and is published, and the text states the number. A *support* or *concern* must compare, so a bare value in that role fails |
| `compare` | "X is higher, lower or about the same as Y" | Census 90% test when both margins exist (SE = MOE / 1.645; \|diff\| / SE > 1.645), else the disclosed closeness band (5% relative, 2 percentage points for rates). The relation must match, and the text must use the matching words. Ranking inside the uncertainty fails |
| `recommendation` | "Option A appears strongest", or "no clear winner" | A chosen option needs criteria with weights (the user's priorities). It must be top-ranked on normalised weighted scores and stay top when any single weight moves ±20%; otherwise the honest output is `chosen: null`. A no-winner claim may not use verdict words (favorable, caution, recommend, best) |
| `hypothesis` | "One possible explanation is…" | The hypothesis object exists, and the text is hedged (may, might, could, possible) |
| `causal` | "X caused Y" | Always fails with observational evidence. There is no experimental evidence type yet |

Rules for every claim:
- Every cited id must resolve.
- No certainty words: proves, guarantees, will succeed or fail, certainly.
- No causal wording (because, caused, due to, drives) unless the assertion is causal, and causal assertions always fail for now.
- Limitations ("these figures don't measure rent") need no assertion.

**Citing evidence is not enough.** The suite includes claims that cite the right ids but state the wrong relation, or use the wrong words. Both fail.

## Files
- `functions/src/engine/evidence.ts`: the types, `EvidenceStore`, `relationOf`, `checkClaim` and `checkClaims`.
- `functions/src/engine/legacy-brief.ts`: turns today's production brief into evidence and claims, so it can be graded unchanged.
- `functions/test/engine-evals.test.cjs`: 13 cases.
  - **Part A, 6 cases:** characterise today's builder.
  - **Part B, 7 cases:** prove the checker accepts grounded claims and rejects fake grounding, fragile choices, causal wording and certainty words.

## How it is used later (not yet approved)
1. **WP1 summary (#45):** grade its claims with this checker. They are built to pass, using the same band.
2. **#29:** add the published margins to facts, so comparisons use the z-test instead of the band.
3. **Report builders:** emit claims and evidence directly. The report renders only claims that pass. Any failure blocks the release in CI.
4. **AI wording (Phase F):** model output is parsed into claims and checked. Anything that fails falls back to the template sentence.

## Known limits
- The legacy adapter maps today's sentences to assertions with pattern matching. It is fit only for grading the current builder.
- The closeness band is a disclosed stand-in, not a statistical test.
- Ratio and percent-change margins (for example, 5-year growth) are not yet propagated, so growth uses the band.
