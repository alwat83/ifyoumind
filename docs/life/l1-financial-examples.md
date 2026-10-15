# Life L1: hand-verified financial examples and review notes

Each example is also a test in `test/life-engine.test.mjs` (E1–E8).
- **Price levels** are illustrative (U.S. = 100).
- **Tax shares** are entered as stated, unless the example says "estimate".
- **Formula:** money left = salary × (1 − tax share) ÷ 12 − housing − commute cost. Buying power = money left ÷ (price level ÷ 100).

| # | Case | Inputs | Hand calculation | Expected result |
|---|---|---|---|---|
| E1 | Different salaries, same place | A 60,000; B 75,000; housing 1,500 each; tax 20%; price 100 | A 4,000 − 1,500 = **2,500**. B 5,000 − 1,500 = **3,500**. Gap 1,000 ÷ 2,500 = 40% | "B leaves $1,000 more a month … (40%)" |
| E2 | Different housing, same salary | 80,000 each; tax 25%; housing A 1,200, B 2,000 | Take-home 5,000 each. A **3,800**, B **3,000**. Gap 800 ÷ 3,000 = 26.7% | "A leaves $800 more … (27%)". An all-items price level is flagged `price_level_includes_rent` |
| E3 | Different state-tax situations | 100,000 each; housing 2,000. A: 20.82% (federal + payroll estimate, no state income tax). B: 25.82% (user added 5 points of state tax) | Federal on 83,900 taxable: 1,240 + 4,560 + 7,370 = 13,170. Payroll 7,650. Total 20,820 = 20.82%. A 6,598.33 − 2,000 = **4,598.33**. B 6,181.67 − 2,000 = **4,181.67**. Gap 416.67 = 9.96% | "$417 more … (10.0%)". If B's state tax isn't entered, the note reads "State and local income tax is not included for B" |
| E4 | Zero and negative left | 36,000 each; tax 20% (take-home 2,400); housing A 2,400, B 2,600 | A **0**, B **−200**. Gap 200 ÷ \|−200\| = 100% | Both flagged `shortfall`. When the other side is exactly 0, no percentage is printed (no division by zero) |
| E5 | Missing or outdated data | A price level missing; B data year 2020 with as-of 2026 | A uses 100 (U.S. average) | `price_level_missing` for A, tagged an **estimate**, not a fact. `price_level_outdated` for B. The first next step warns that money left is rough |
| E6 | Near-identical outcomes | 80,000 vs 81,000; housing 1,500; tax 20%; money is the only priority | 3,833.33 vs 3,900. Gap 66.67 = 1.74% | Money flagged not clearly different, and it **does not decide** the verdict: "No clear winner … too close". Commutes within 5 minutes are treated the same way |
| E7 | Conflicting priorities | A 70,000, 15 min, family 5. B 110,000, 50 min, family 1 | Weights money 4, time 2, family 2 → 4 vs 4 | **No clear winner**. With money 5, time 1, family 1 → B. The verdict lists the priorities used, says career growth was not rated, and says it is not a judgement of which option is better overall |
| E8 | Extreme but valid inputs | A 1,000,000, housing 0, price 50; B salary 0, 180 min, price 200; tax 60% | Federal on 983,900 = 320,000.25. Social Security capped at 11,439. Medicare 14,500 + 0.9% × 800,000 = 21,700 | No NaN or Infinity anywhere. B is flagged `shortfall`. Every sentence passes the claim checker |

## Review findings addressed in this PR
- **State tax.** One shared tax share couldn't represent two states. Each option can now carry its own tax share, plus a flag for whether state and local tax is included. When it isn't, the page names it per option. The federal + payroll figure is always labelled an *estimate* (single filer, standard deduction).
- **Double counting.** Housing is subtracted once, as the user's own figure. The price level adjusts only what is left, so it must be a **non-housing** index. If an all-items index is supplied, the result says rent may be counted twice there. L2 must ship the non-housing composite, or disclose the overlap.
- **Tiny differences.** Before this fix, scaling within the pair turned a $67 or one-minute difference into a full priority point, which could produce a verdict from noise. Money gaps under 5%, commutes within 5 minutes, and equal ratings now don't count toward the verdict, and the text says so.
- **Incomplete priorities.** A verdict now names the priorities it rests on and those not rated or given no weight. It adds "It is not a judgement of which option is better overall." With no usable priority, it says so instead of choosing.
- **Silent defaults.** A missing price level used to become 100 silently. It is now an *estimate* with a warning. Outdated and fallback data are flagged too.
- **Privacy.**
  - The engine makes no network, storage or DOM calls; a source scan enforces this in tests.
  - Shared text carries no amounts unless the user opts in (tested). It includes place names and a percentage only.
