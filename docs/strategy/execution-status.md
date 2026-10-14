# ifYouMind 2.0: consolidation map and release dependencies

**Checked:** 2026-10-14 against GitHub master, the deploy history and the open PRs.

**Labels:**
- **Production:** live at `92b3196`.
- **Draft PR:** built, not merged.
- **Design proposal:** designed, nothing built.
- **Verified:** checked in code or on the live site.
- **Assumption:** needs customer validation.
- **Founder-approved:** a direction you have approved.
- **Awaiting approval:** nothing happens until you decide.

## Baseline (verified)
- **Production:** master `92b3196` (PR #43). Deploy run #183 succeeded at 16:14:33Z on 2026-10-14. Signed-out checks passed.
- **Not yet verified:** the authenticated `/app/growth` view.
- **QA setup:** the QA account and the `adminConfig/qaExclusion` entry do not exist yet.
- **Open PRs:** 14 drafts before this round, plus #45 and #46 from this round. None is merged.
- **No discrepancy** with the directive's baseline. One note: PR #12 uses the branch `claude/jolly-ramanujan-ofr18a`, so new work goes on separate branches to keep #12 unchanged.

## What changed in direction (founder directive, 2026-10-14)
- **Before:** the Customer Value Review recommended selling "one job", the business-plan market analysis.
- **Now:** the founder clarified that this is the **Business landing message only**. The platform remains one general-purpose decision engine with two audiences, Business (the revenue priority) and Life (the growth opportunity).
- **Life:** moves from "wait until Phase C" to a parallel research and design workstream. It stays unbuilt and unlaunched until separately approved. The blueprint's "Business door only through Phase C" is revised accordingly.

## Value Review findings → where each is addressed
| # | Verified problem | Addressed by | Status |
| --- | --- | --- | --- |
| 1 | Verdict chosen by counting bullets (F9/F20) | **#45** `summarizeEvidence` replaces it on the result and sample pages. **#46** proves the defect on today's builder and supplies the checker | Draft PRs |
| 2 | No margins of error (F10) | Interim: the disclosed closeness band in #45. Real tests: **#29** (held for the live Census-key validation). #46 already supports margins | Draft / held |
| 3 | Same 4 measures for every business (F11) | #29 adds income bands and the age band. Competitors: R4 (#32 resolver, design) | Held / design |
| 4 | Weak free vs paid difference (F16) | Report jobs designed in the Value Review §3. #29 sizing. Before-you-sign checklist copy | Design / held |
| 5 | Offer before the answer on phones (F8) | **#45** | Draft PR |
| 6 | No password reset (F22) | **#45** | Draft PR |
| 7 | Terms and Privacy unlinked (F23) | **#45** | Draft PR |
| 8 | Pro vs $79 tension (F15) | A hypothesis, tested by study task T8. #30 groundwork held. No price change | Awaiting evidence |
| 9 | "Your own data" claims (F2/F5) | **#45** removes the landing claim and labels the app tile | Draft PR |
| — | City entry by semicolons (F6) | `docs/ux/city-input-proposal.md` (in #45, design only) | Design proposal |

## Work packages this round
| WP | Deliverable | Where | Tests | Status |
| --- | --- | --- | --- | --- |
| 1 | Trust and usability fixes | [#45](https://github.com/alwat83/ifyoumind/pull/45), `claude/jolly-ramanujan-ofr18a-trust-fixes` | Fast 62/62, functions 55/55, e2e 76/76, production build pass | Draft, not deployed |
| 2 | Evidence model and evaluation suite | [#46](https://github.com/alwat83/ifyoumind/pull/46), `claude/jolly-ramanujan-ofr18a-evidence-evals` | Functions 68/68 (13 new) | Draft, test-only |
| 3 | Sales Health Check concierge package | `docs/research/sales-health-check/` (this branch, #27) | The example analysis reproduces the planted −20% weekday-lunch change | Research only |
| 4 | Life job-offer prototype and validation plan | `docs/research/life/`; [prototype](https://claude.ai/artifact/P4Zbdha5TFQyHXdksk4R6R) | Script syntax checked | Design only |
| 5 | API and ingestion feasibility | `docs/research/data-feasibility.md` | — | Research only |

## Release readiness
| PR | What | Ready? | Blocked by / awaiting |
| --- | --- | --- | --- |
| #45 | Trust fixes | Code-complete; CI pending on GitHub | Founder review of the wording and the 5% / 2-point band; release approval |
| #46 | Evidence suite (test-only) | Code-complete | Merge approval (no customer change) |
| #44 | Verify-page race and test harness fix | CI green at `4cf8b4b` | Release approval |
| #26 | Server-side verified email | Prepared | **Signed-in production QA run** (needs the QA account) |
| #39 | Revenue ledger | Prepared | **Read-only live Stripe reconciliation** (founder key) |
| #29 | Margins, difference tests, income and age bands | Built | **Live Census API validation** with a dev key |
| #42 | Pro 50-decision enforcement | Built | Release approval; pricing context |
| #18 → #24 | GA4 consent, then funnel events | Built | GA4 property review |
| #35 | First-party engagement events | Built | Release approval; conflicts with #29/#45 (mechanical) |
| #12 | Refund, cancellation and AI-sentence disclosures | Copy | Refund-policy decision; counsel |
| #41 | Account deletion | Proposal | Retention decisions; counsel. **Required before real uploads** |
| #30, #32 | Professional prep, geography resolver | Built | Pricing decision; R4 approval |
| #27 | Master doc and research docs | Docs | Merge with the next approved release |
| #2 | FRED (Codex) | Old | Excluded: FRED terms |

**Unresolved risks:**
- Founder metrics include QA activity until the exclusion entry exists.
- The server doesn't enforce verified email (#26).
- The deployed universal functions have no quotas; `askUniversalIntelligence` can read about 50,000 documents per call (data feasibility §1).
- There are no genuine paying customers yet.
