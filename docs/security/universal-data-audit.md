# Universal-data functions: security and cost audit

**Audited:** 2026-10-14, production `92b3196`. Fix: this PR (draft, not deployed).

**Status:**
- Production still runs the unbounded versions below.
- Nothing has been deployed or removed.

## Who can call them today (verified)
- **Free sign-up is enough.** Anyone who signs up for free gets a workspace as its owner, so these functions are open to any free account.
- **No server-side email verification.** The server does not require a verified email (#26 is held).
- **No App Check and no rate limit.** The emulator log shows `app: MISSING`, and no function enforces a rate limit.
- **Concurrency.** Cloud Functions v2 defaults allow up to 100 instances per function.
- **Tenancy is correct.** Every function runs `authorizeOrganization` (membership plus role), and Firestore rules keep the data closed to clients. Integration tests confirm another workspace gets `PERMISSION_DENIED` and an anonymous caller gets `UNAUTHENTICATED`.

## Per-function findings
| Function | Used by the app | Reads per call (today, max) | Writes per call | Request bounds | Finding | Fix in this PR |
| --- | --- | --- | --- | --- | --- | --- |
| `createUniversalDataset` | `/app/data`, canvas | 0 | 1 | Text lengths | **Unlimited datasets per workspace** | ≤ 50 per workspace; 100 calls/day |
| `addUniversalObservation` | canvas | 1 | 2 | Text lengths; **`dimensions` unvalidated** (any object, up to the request size) | Unbounded observations and document size | ≤ 5,000 per dataset; dimensions validated (20 string pairs); 200 write calls/day |
| `importUniversalObservations` | `/app/data` | 1 | 401 | 400 rows | **Unlimited calls**: about 400 writes per call, with storage growing without bound | ≤ 5,000 per dataset; shares the 200/day write quota |
| `listUniversalDatasets` | `/app/data`, canvas | 100 docs + 100 `count()` queries, each costing 1 read per 1,000 index entries; **unbounded** while observations are unbounded | 0 | — | **Denial-of-wallet path** (see below) | 50 listed; with ≤ 5,000 observations, at most 50 + 250 reads |
| `getUniversalDataset` | **No** (no frontend caller) | 501 | 0 | `datasetId` not pattern-checked (stays inside the caller's workspace) | Unused endpoint | Id validated. **Recommend removal** (approval needed) |
| `analyzeUniversalDatasets` | canvas | 8 × 501 = 4,008 | 0 | 2–8 ids | Unlimited calls | 200 analyses/day |
| `reasonAcrossUniversalDatasets` | canvas | 4,008 | 1 (stores the full result, including every matched point) | 2–8 ids | Unlimited calls; run document can approach the 1 MB limit | Shares the 200/day quota; stored copy drops the matched points |
| `askUniversalIntelligence` | `/app/ask` | **100 + 100 × 500 ≈ 50,100** | 1 (stores the full result) | 500-character question | **The largest denial-of-wallet path** | At most 50 metadata + 13 × 500 = 6,550; 100 asks/day; history stored without points |
| `getRecentUniversalAnalysisRuns` | canvas | 12 | 0 | — | Bounded | `maxInstances` only |
| `seedUniversalDemoData` | canvas ("load demo data") | 0 | 76 (idempotent, fixed ids) | — | Synthetic data written next to real data; unlimited calls | 5 calls/day. Keep while the canvas uses it; **recommend retiring** with the `/app/data` redesign |

**All ten** also get `maxInstances: 10`. That caps how fast any abuse can spend, at the cost of queuing under a genuine traffic spike that is very unlikely at today's usage.

## Denial-of-wallet scenarios (before the fix)
These are illustrative arithmetic, not observed incidents. Firestore list prices vary by region; about $0.06 per 100,000 reads and $0.18 per 100,000 writes are used here.

1. **Ask flood.** One free account fills 100 datasets with 500 observations each (about 125 import calls), then loops `askUniversalIntelligence`. Each call reads about 50,100 documents (about $0.03). At 10 calls a second for 24 hours, that is about 43 billion reads, roughly **$26,000 a day**, plus function compute.
2. **Count blow-up.** Observations are unbounded, so a dataset can hold millions of rows. Every `listUniversalDatasets` call then pays 1 read per 1,000 index entries for each of up to 100 datasets, and the cost grows with the data.
3. **Write and storage flood.** `importUniversalObservations` in a loop: 10 calls a second is about 4,000 writes a second, roughly **$600 a day** plus growing storage.

**After the fix:** a single user's worst day is bounded by quota × per-call maximum:
- Ask: 100 × 6,550 = 655,000 reads (about $0.40).
- Analysis: 200 × 4,008 = about 800,000 reads (about $0.50).
- Writes: 200 × 401 = about 80,000 writes (about $0.15).

This sits on top of `maxInstances`. Remaining exposure is many accounts at once (sign-ups are free). The next steps for that are App Check enforcement and #26.

## Deployment-risk assessment
| Risk | Likelihood | Effect | Mitigation |
| --- | --- | --- | --- |
| A real user hits a quota or cap | Low: the limits are far above observed product use (the canvas is not in the main journey) | Clear error message; their data is untouched | Limits are constants in `universal-limits.ts`; raising one is a one-line change |
| Ask results change | Medium | It now compares the 12 most recently updated datasets, not all 100, and score ties go to the most recent dataset rather than the largest | `datasetsConsidered` and `datasetIds` in the response already say what was compared |
| Stored runs and questions lose their matched points | Certain | `getRecentUniversalAnalysisRuns` reads only the conclusion, confidence and target (verified), so nothing displayed changes | — |
| `maxInstances: 10` queues requests under a spike | Very low | Slower responses | Raise or remove per function |
| Extra cost per call | Certain, small | +1 read and +1 write for the quota transaction; +1 `count()` on writes | — |
| Deploy itself | Low | A redeploy updates these 10 functions' configuration. The deploy workflow's allowlist already includes them, and no function is added or removed | Rollback: revert the merge |

**Not changed:**
- the frontend, rules (except a new test), Stripe, entitlements, the market-analysis functions;
- what any function returns on success, except Ask's candidate set.

## Recommendations needing approval (not in this PR)
1. **Retire `getUniversalDataset`.** Remove it from the deploy allowlist, then delete it with `firebase functions:delete getUniversalDataset`; no frontend calls it.
2. **Retire `seedUniversalDemoData`** when `/app/data` and the canvas are redesigned.
3. **Turn on App Check enforcement** for all callables. This needs a client provider (reCAPTCHA Enterprise) and a monitoring period first.
4. **Release #26** (verified email on the server), then add the universal functions to its list.
5. **Set a budget alert** on the Firebase project. This is a console setting; it costs nothing.
