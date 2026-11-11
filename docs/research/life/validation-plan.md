# ifYouMind Life: job-offer comparison prototype and consumer validation plan

**Status:**
- **Work Package 4:** research and design only.
- **Not live:** `/life` is not launched, no consumer workflow is built, and no one has been contacted.
- **Prototype:** https://claude.ai/artifact/P4Zbdha5TFQyHXdksk4R6R (private; source: `job-offer-prototype.html` in this folder). All external figures are illustrative.

## What the prototype demonstrates
| Required element | How it appears |
| --- | --- |
| Natural-language intake | One question box. The page names the two options it found and what it will compare |
| Short clarifying questions | Three topics only: money after rent and prices, commute, the user's own priorities |
| Manual data entry | Salary, rent, commute and two 1–5 ratings per option; every input editable |
| External source transparency | Each added figure carries a chip and a source line (BEA price parities, ACS rent shape), marked illustrative |
| Side-by-side options | A table per month; the better value is highlighted only when it is outside the "about the same" band |
| Editable assumptions | The tax share is labelled an estimate and can be changed |
| Weighted priorities | Four sliders, 0–5 |
| Sensitivity | Each weight is moved by about 20% (at least one step); if the leader changes, the page says "No clear winner on your priorities" |
| Decision summary | "Staying in Raleigh looks stronger given your priorities", or the no-winner wording |
| Next steps | Three real-world checks (relocation package in writing, two rent quotes, a rush-hour commute) |

**With the default illustrative inputs:**
- **Money is about the same.** The $12,000 raise is mostly absorbed by rent and prices: $3,897 vs $3,925 a month in buying power.
- **Raleigh leads on commute and family; Denver leads on career.**
- **Result:** with the default weights, "Staying in Raleigh looks stronger", and it survives the sensitivity check.
- **The flip:** raising career growth to 5 out of 5 makes it no clear winner.

It uses the same rules as the business engine (`docs/engine/evidence-model.md`):
- the "about the same" band;
- recommendations only with the user's own criteria and weights;
- a choice must survive weight changes;
- no "best city".

A real version would reuse that engine, not a separate consumer one.

## Data feasibility for a real version
See `docs/research/data-feasibility.md`.

- **Wages:** BLS OEWS by metro (public domain; flat files or API).
- **Price levels:** BEA Regional Price Parities by metro (free key; required notice).
- **Rent benchmark:** ACS B25064 (live connector), or HUD Fair Market Rents (terms to confirm).
- **Taxes:** stay a user-editable estimate. A tax calculator would be a regulated-adjacent feature and is out of scope.

## Consumer validation track (proposal; needs approval before any contact)
- **Who:** 6 people who expect to compare a job offer, or a move between US cities, within 6 months.
    - At least 3 on phones.
    - At least 2 non-technical.
    - Exclude people close to the team or to Dose Ninja.
- **Recruitment:** no-spend channels the founder approves (own network; one community post where research requests are allowed).
- **Consent and notes:** follow the business toolkit (recorded or notes-only; participant ids only).
- **Session:** 35 minutes. Participants use their own two options, or a scenario given to them if they prefer privacy.

| Task | Prompt | Pass (per participant) | Study decision rule |
| --- | --- | --- | --- |
| C1 · 10-second test | Show the top of the prototype for 10 s: "What does this do? Who is it for?" | Names comparing jobs or cities using their own numbers | At least 5 of 6 |
| C2 · Complete unaided | "Compare your two options." Timer runs; hints logged | Reaches the verdict in under 8 min, with no more than 1 hint | At least 4 of 6 |
| C3 · Interpret estimates | "Which numbers are facts, which are estimates, which are yours?" Then: "What did it conclude?" | Labels all three correctly and states the verdict, including "no clear winner" if shown | At least 4 of 6 |
| C4 · Usefulness and trust | "How useful (1–5)? How much do you trust it (1–5)? Why?" | 4 or more on both | At least 4 of 6 |
| C5 · Return and share | "Would you come back to this? Would you share it? With whom?" | Names a specific person or moment | At least 3 of 6 name a person (stated, not behaviour) |
| C6 · Other decisions and payment | "What other decisions would you use this for? What would you pay for, if anything?" | Recorded verbatim | Lists the next decision types; never counted as willingness to pay |

**Stated vs actual behaviour.** Interviews show comprehension and stated interest only. Actual demand is measured only after a workflow ships: completions, 30-day return, shares that bring visitors, and paid conversion if a paid tier is offered. No product-market-fit claim is made from interviews.

**Gate to build** (Phase D, separate approval):
- C2 and C3 pass.
- At least 3 of 6 name someone they would share it with.
- The data terms are confirmed for wages, price levels and rent.
