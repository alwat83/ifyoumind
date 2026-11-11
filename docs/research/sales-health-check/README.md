# Sales Health Check: concierge research package

**Status:**
- **Work Package 3:** research materials and design only.
- **Not done:** no customer has been contacted, no real sales file has been received, and nothing is built or deployed.
- **Founder approval needed before any contact:** channel, wording, incentive, and who receives files.

**The question it answers:** "Why have my sales changed, and what should I check first?"

**Who it's for:** owners of restaurants, cafés, retail shops and service businesses (segment B3 in the 2.0 blueprint).

**What it promises:** measurable patterns, plausible explanations stated as hypotheses, and cheap tests to try. It never claims to know the cause.

## 1. How the concierge test works
1. The owner exports a sales file (section 2) and shares it through an approved, private, ifYouMind-only channel.
2. The analysis follows section 4. Claude may draft it, and the founder checks every number by hand before anything is sent.
3. A 30-minute walkthrough follows the interview guide (section 7).
4. A follow-up comes 3–4 weeks later: did they run the suggested test, and what happened?
5. The file is deleted when the session's notes are final, or at once if the owner asks (section 8).

**Volume:** 3 owners. Nothing is automated, and no upload feature is built until the success criteria (section 9) are met.

## 2. Data requirements
| Field | Required | Notes |
| --- | --- | --- |
| Date | Yes | One row per day, or per day and daypart or channel. ISO dates preferred; others are confirmed with the owner |
| Net sales | Yes | After discounts. State whether tax and tips are included |
| Transactions (orders) | Strongly preferred | Splits a change into fewer customers vs smaller orders |
| Daypart, channel or location | Optional | Lunch/dinner; dine-in/takeout/delivery; a site id for multi-site owners |
| Category or item | Optional | Only if the owner wants item-level questions |

- **History:** at least 13 months, so each recent month has the same month last year. Up to 3 years is fine.
- **File:** a CSV export from the POS or accounting tool, under 10 MB.
- **Never needed:** customer names, emails, card data, staff names or payroll. Ask owners to remove them; any such column found is deleted before analysis.

Example file: `example-sales.csv`. It is **synthetic**, made by `generate-example.py` with a fixed seed. It contains 18 months of a fictional restaurant, lunch and dinner rows, a planted weekday-lunch decline from April 2026, and four realistic data problems.

## 3. Data-quality checklist (run before any analysis)
- [ ] **Row counts:** rows read vs rows usable, with each rejected row listed with its reason.
- [ ] **Exact duplicate rows:** removed and counted.
- [ ] **Same date and daypart twice:** keep the first and flag it; ask the owner which is right.
- [ ] **Dates in more than one format:** normalised only when unambiguous (a day above 12). Otherwise ask.
- [ ] **Negative rows** (refunds, voids): set aside and reported separately, not netted silently.
- [ ] **Missing days:** listed, then split into expected closures (holidays) and gaps (outage, export error) after asking the owner.
- [ ] **Partial first or last period:** dropped from comparisons.
- [ ] **Outliers** (beyond 3 × the median absolute deviation for that weekday and daypart): flagged, never removed without the owner's say.
- [ ] **Tax, tips, discount and currency definitions:** confirmed in writing.

Result on the example file:
- 1,083 rows read, 1,080 usable.
- 1 exact duplicate, 1 non-ISO date (normalised), 1 refund row set aside, 1 date-and-daypart duplicate flagged.
- 8 missing days: 5 holidays and a 3-day gap on Feb 10–12, 2026.

## 4. Analysis method (deterministic; every number reproducible)
1. **Like with like.**
    - Compare the recent period with the same months a year earlier.
    - Split by weekday or weekend, and by daypart or channel where the data has it.
    - Never compare April with January.
2. **Size of the change:** mean per day, the change in %, and a 95% confidence interval (Welch, on daily values).
    - A change whose interval includes 0 is "no clear change".
3. **Decompose:** sales = transactions × average ticket.
    - Report which part moved. "Fewer orders" and "smaller orders" point to different causes.
4. **Normal variation:** the median week-to-week change for that segment. A change smaller than normal noise is not called a change.
5. **Timing:** the first week where the 4-week average falls below every comparable week last year. This gives when it started, which is the strongest clue for "what changed then?"
6. **External context** (only once approved and licensed; none used in this package):
    - BLS county employment;
    - NOAA weather for the same dates;
    - local events the owner names.

    These are shown as context only, never as the cause.
7. **Hypotheses and tests:** each plausible explanation is listed with the evidence for and against it, and a cheap test that would distinguish it.

## 5. Evidence and uncertainty rules
These are the same rules as `docs/engine/evidence-model.md`:

- Every number cites its source: the file, its rows, and the method and version.
- "Higher" or "lower" only when the confidence interval excludes 0. Otherwise "no clear change".
- **Never** "because", "caused by" or "due to". Explanations are written as "one possible explanation", with the evidence for and against.
- Data problems are part of the result, not a footnote.
- A recommendation is a test to run, with what result would confirm or rule out the idea. It is never a business decision made for the owner.

## 6. Sample findings (computed from the synthetic example file by `analyze-example.py`)
> **Sales Health Check: Example Restaurant (synthetic data)**. Data: Apr 1, 2025 – Sep 30, 2026; 1,080 usable rows.
>
> **What changed:** Weekday lunch sales are down **20.2%** compared with the same months last year (Apr–Sep 2026 vs Apr–Sep 2025): $1,635 to $1,305 a day; 95% interval −22.6% to −17.8%.
>
> - **Fewer orders, not smaller ones.** Transactions fell 20.0% (99 to 79 a day). Average ticket is unchanged (−0.4%, interval −1.3% to +0.5%).
> - **When:** it started in early April 2026. By the week of Apr 27, the 4-week average was below every comparable week of 2025.
> - **Where it didn't happen:**
>     - Weekend lunch: +2.9%, interval −0.9% to +6.6%. No clear change.
>     - Weekend dinner: +0.2%. No clear change.
>     - Weekday dinner is down a smaller **5.4%** (interval −7.9% to −2.8%).
> - **Normal variation:** weekday-lunch weeks typically move 4.7% from one week to the next, so a 20% shift is well outside normal noise.
>
> **What this suggests (hypotheses, not causes):**
> 1. *Fewer weekday daytime customers nearby.* An office closure, a hybrid-work change or a road closure from around April 2026 could explain it. It fits: weekday-only, lunch-heavy, orders not ticket. **Check:** ask neighbouring businesses; check whether a large employer changed its office policy; compare with county employment data if approved.
> 2. *A new competitor for weekday lunch.* It fits the timing and the lunch-only pattern. **Check:** list places that opened nearby since March, and compare their lunch prices and hours.
> 3. *An internal change in April* (menu, lunch hours, staffing, delivery-app listing). **Check:** the owner's change log; delivery-platform order counts if exported.
>
> **What we can't tell:** the cause, local footfall, competitors' sales, and whether the 5.4% weekday-dinner drop is related.
>
> **First test to run:** a two-week weekday lunch offer aimed at nearby workers (for example, a pre-order option), measured against the same weekdays before it. If orders recover, demand still exists nearby; if not, hypothesis 1 becomes more likely.
>
> **Data notes:** 1 duplicate removed; 1 refund row set aside; 1 date normalised; 1 date-and-daypart duplicate flagged; closed or missing Feb 10–12, 2026 (to confirm with the owner).

## 7. Interview guide (30 minutes, after the owner has read their findings)
1. **Context (3 min):** "Before you read this, what did you think was happening with your sales?"
2. **Comprehension (5 min):** "In your own words, what changed and when?" Score it correct, partial or wrong. Then: "What is the difference between 'fewer orders' and 'smaller orders' for you?"
3. **Trust (5 min):** "How much do you trust these numbers, 1 to 5? Why?" "Is anything wrong or missing in the data notes?"
4. **Usefulness (7 min):** "Which hypothesis seems most likely to you? What do you know that we don't?" "Would you run the suggested test? What would stop you?"
5. **Value (5 min):** "If this arrived every month or quarter, would it change what you do?" "What would you pay for this, if anything, and what would you compare it with?" Record it as stated, never as willingness to pay.
6. **Data and privacy (3 min):** "How did you feel about sending the file? What would make you comfortable doing it in an app?"
7. **Close (2 min):** "May we contact you in 3–4 weeks to ask what happened?" Yes or no.

Note-taking follows the usability toolkit: participant ids only, quotes kept separate from interpretation.

## 8. Consent language (draft, for review with whoever handles ifYouMind's privacy terms)
> **Sales Health Check: research participation (ifYouMind, operated by Dose Ninja Inc.)**
>
> You are sharing a sales export so ifYouMind can test a new kind of analysis. The analysis is done by a person, with software help; it is not an automated service and not financial advice.
>
> - **What we ask for:** dates, sales totals and order counts. Please remove customer, card and staff details before sending. If we find any, we delete them.
> - **Who sees it:** the ifYouMind team only. It is never shared or sold, never used for any other business, and never used to train AI models.
> - **AI:** [choose one before sending: "No AI service will process your file." / "An AI service under contract may help draft the write-up from summary figures only. Your file itself is never sent to it."]
> - **How long we keep it:** we delete your file within [X] days of your walkthrough, or immediately if you ask. We keep our notes, which refer to you by a participant number.
> - **Your choices:** taking part is voluntary. You can withdraw at any time, and we will delete your file and notes.
> - **Payment:** you won't be asked to pay. [Incentive line, only if approved.]
> - **Questions:** support@ifyoumind.com
>
> ☐ I agree to share my sales export for this research on these terms.

The retention period [X] is a founder decision. The research notes in `docs/research/data-feasibility.md` recommend the shortest period that covers the follow-up, for example 45 days.

## 9. Success criteria (decide before the sessions; proposed)
| Measure | Pass | Source |
| --- | --- | --- |
| Comprehension | At least 2 of 3 owners state what changed and when, correctly | Guide Q2 |
| Trust | At least 2 of 3 rate it 4 or more of 5 | Q3 |
| Usefulness | At least 2 of 3 name a test they would run, and at least 1 runs it within 4 weeks | Q4 + follow-up |
| Data feasibility | All 3 can export a usable file in under 15 minutes without help | Observation |
| Value signal | At least 1 of 3 asks for a repeat, or agrees to pay for a second run when a paid version exists | Q5 + follow-up (behaviour beats statements) |
| Effort | Concierge analysis takes under 2 hours per owner with the method above | Time log |

**If met:** propose Phase C (upload, data review and findings) for approval. **If not met:** revise the method or drop the offer before any build.

## 10. Concierge analysis template
Use the structure of section 6 for every owner:

1. **Header:** business type, data range, usable rows.
2. **What changed:** one sentence with %, interval and comparison period.
3. **Fewer or smaller:** orders vs ticket.
4. **When.**
5. **Where it didn't happen.**
6. **Normal variation.**
7. **Up to 3 hypotheses:** each with fits / doesn't fit / how to check.
8. **What we can't tell.**
9. **First test to run:** with what result would mean what.
10. **Data notes.**

Run `analyze-example.py <file>` as the starting point, then check every figure by hand.
