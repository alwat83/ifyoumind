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
| `createUniversalDataset` | `/app/data`, canvas | 0 | 1 | Text lengths | **Unlimited datasets per workspace** | ≤ 50 per workspace (exact under parallel calls); 100 calls/day |
| `addUniversalObservation` | canvas | 1 | 2 | Text lengths; **`dimensions` unvalidated** (any object, up to the request size) | Unbounded observations and document size | ≤ 5,000 per dataset (exact under parallel calls); dimensions validated (20 string pairs); 200 write calls/day |
| `importUniversalObservations` | `/app/data` | 1 | 401 | 400 rows | **Unlimited calls**: about 400 writes per call, with storage growing without bound | ≤ 5,000 per dataset (exact under parallel calls); shares the 200/day write quota |
| `listUniversalDatasets` | `/app/data`, canvas | 100 docs + 100 `count()` queries, each costing 1 read per 1,000 index entries; **unbounded** while observations are unbounded | 0 | — | **Denial-of-wallet path** (see below) | 50 listed; with ≤ 5,000 observations, at most 50 + 250 reads; 2,000 read calls/day (shared) |
| `getUniversalDataset` | **No** (no frontend caller) | 501 | 0 | `datasetId` not pattern-checked (stays inside the caller's workspace) | Unused endpoint | Id validated; shares the 2,000/day read quota. **Removal on hold** (see the caller check below) |
| `analyzeUniversalDatasets` | canvas | 8 × 501 = 4,008 | 0 | 2–8 ids | Unlimited calls | 200 analyses/day |
| `reasonAcrossUniversalDatasets` | canvas | 4,008 | 1 (stores the full result, including every matched point) | 2–8 ids | Unlimited calls; run document can approach the 1 MB limit | Shares the 200/day quota; stored copy drops the matched points |
| `askUniversalIntelligence` | `/app/ask` | **100 + 100 × 500 ≈ 50,100** | 1 (stores the full result) | 500-character question | **The largest denial-of-wallet path** | At most 50 metadata + 13 × 500 = 6,550; 100 asks/day; history stored without points |
| `getRecentUniversalAnalysisRuns` | canvas | 12 | 0 | — | Bounded | Shares the 2,000/day read quota |
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

## Final release checks (founder conditions, 2026-10-14)

### 1. Concurrency
- **Daily counters.** Each counted call runs one Firestore transaction on `universalUsage/{uid}`, which reads the counter, checks it and writes it. Server transactions lock the document, so parallel calls are counted one at a time.
- **Caps.** The 50-dataset and 5,000-observation caps were originally checked with a plain `count()` outside any transaction, so parallel calls could overshoot them. **Fixed:** the count, the check and the write now share one transaction that also writes the parent document (the workspace or the dataset), so parallel writers on the same parent are serialised.
- **Evidence (emulator, parallel calls):**
  - 15 calls with 5 left in the quota: exactly 5 pass and 10 get `RESOURCE_EXHAUSTED`. The counter ends at exactly 100.
  - 10 creates into a workspace holding 48 datasets: exactly 2 pass, and the workspace holds 50.
  - 6 imports of 4 rows each into a dataset holding 4,990: exactly 2 pass, and the dataset holds 4,998.
  - None of these runs produced a contention error.
- **Under heavy contention in production,** a transaction that still conflicts after the SDK's retries returns an error and writes nothing. That is fail-closed.

### 2. Authorization, isolation and counter integrity
- **Authorization runs first.** Every function calls `authorizeOrganization` (membership and role) before anything else, so a caller who names someone else's workspace is refused before any counting.
  - Test: the owner's counter document is never created by another account's call.
- **Counters are per account.** One account's spent quota doesn't affect another account.
  - Test: a refused call isn't counted, and the other account's counter starts at 1.
- **Counters are closed to clients.** `universalUsage` has no rules match, so no client can read, create or reset a counter (rules test).
  - The counter key is the verified token uid, never a client-supplied value.
- **One workspace per identity.** `createIntelligenceOrganization` allows one workspace per uid, and there is no invite function, so per-account and per-workspace limits are equivalent today.

### 3. Worst-case Firestore cost
**Prices used:** $0.06 per 100,000 reads and $0.18 per 100,000 writes. These are multi-region list prices, the conservative choice; the database's actual location prices may be lower. Free-tier allowances are ignored.

**Per account per day, every quota fully used with maximum-size calls.** Each call also pays 1 membership read plus the quota transaction (1 read and 1 write).

| Action (daily quota) | Reads | Writes |
| --- | --- | --- |
| Analysis and reasoning (200; 8 datasets × 501 reads) | 802,000 | 400 |
| Ask (100; 50 dataset documents + 13 × 500 observations) | 655,000 | 200 |
| Reads (2,000; `getUniversalDataset` at 503 reads, the costliest) | 1,006,000 | 2,000 |
| Observation writes (200 imports × 400 rows) | 1,600 | 80,600 |
| Dataset creates (100) and demo seeds (5) | 400 | 700 |
| **Total** | **≈ 2.47 million (≈ $1.48)** | **≈ 84,000 (≈ $0.15)** |

**Other costs for the same account:**
- **Storage:** at most 50 × 5,000 observations, roughly 125–250 MB. That is about $0.05 a month once full.
- **Compute and egress:** a few cents.

**Worst case: about $1.70 per account per day.**

**Retries:**
- A client retry is a new call and is counted, so retries cannot exceed the quota.
- SDK transaction retries only repeat the small counter and cap reads: at most about 5 extra reads per call, under contention.

**Refused calls** still cost 2 reads (membership and counter) and no writes. Their rate is capped by throughput. Assuming the default concurrency of 80 per instance (CPU 1) across 10 instances, at roughly 50 ms per refused call:
- one function tops out at about 16,000 calls a second;
- sustained for a day, that is about 2.8 billion reads, roughly **$1,600 a day**.

That would need a sustained, deliberate flood. Every other deployed callable has the same exposure, and most are worse: they have no `maxInstances`, so they default to 100 instances. App Check is the fix for that class of abuse.

**Many accounts.** The cost scales linearly: N accounts × $1.70 a day, so 1,000 throwaway accounts cost about $1,700 a day. Sign-ups are free; Firebase Auth's per-IP sign-up throttling slows this but doesn't stop it. The mitigations, all needing separate approval:
- App Check (rollout plan in `docs/security/app-check-rollout.md`);
- server-side email verification (#26);
- a budget alert (`docs/security/billing-alert-proposal.md`).

**Fixed compute ceiling.** `maxInstances: 10` caps compute for these 10 functions however many accounts are used. At 1 vCPU and 256 MiB, all 10 saturated for 24 hours is about $25 a day per function.

### 4. Entry points
- **All 10 deployed universal functions are limited.** Each one either counts against a daily quota or (the read functions) shares the new 2,000/day read quota, and each has `maxInstances: 10`.
- **No other function reaches this data.** No other function reads or writes `datasets`, `observations`, `analysisRuns` or universal `questions`.
- **`synthesizeUniversalAnalysis`** (`ai-synthesis.ts`) reads datasets, but it has never been exported from `index.ts` in git history, so it cannot be deployed.
- **`getRecentIntelligenceQuestions`** (`ask.ts`) reads Ask history from the workspace's `questions` collection. It is bounded (`limit(10)`, about 11 reads a call) and read-only. It is **not in the deploy allowlist**, yet `/app/ask` calls it, along with the saved-question functions, which are also not in the allowlist. Whether these run in production from an older full deploy is unknown; the same production `functions:list` check answers it.
- **The frontend calls `synthesizeUniversalAnalysis`, which isn't exported,** so that call fails today. AI synthesis stays inactive by directive; this is a dead UI path to tidy later, not an exposure.
- **Firestore rules** deny every client write under `intelligenceOrganizations`, so the data can't be written around the functions.
- **To confirm before the release:** the deploy allowlist only adds or updates functions. A production `firebase functions:list` should confirm that no function exported in the past is still live outside the allowlist. I couldn't run it, because this session has no production credentials.

### 5. The 10-instance limit
- **Capacity.** The firebase-functions v2 defaults are CPU 1 and concurrency 80, so each function can serve 800 requests at once. Current traffic is orders of magnitude below that.
- **What changes.** The limit doesn't change cold starts (minimum instances stay at 0). Above 800 concurrent requests, Cloud Run briefly queues and then returns 429.
- **Added latency.** About one Firestore round trip per call for the counter transaction. The cap transaction replaces reads the functions already made.
- **No timeouts or memory changed.**

### 6. Rollback and retention
- **Rollback:** revert the merge commit and push. That triggers the production workflow, which redeploys the previous code.
- **Data left behind is inert:**
  - `universalUsage/{uid}` documents (one per active user, under 1 KB, overwritten daily);
  - a `universalDatasetsUpdatedAt` field on workspace documents.

  Nothing else reads either, so no cleanup is needed.
- **Data that stays changed:** questions and runs saved while #47 was live keep no matched points. Nothing displays those points.
- **Retention:**
  - Each counter document holds an `expiresAt` date two days after the counted day.
  - An optional Firestore TTL policy on `universalUsage.expiresAt` would delete idle counters automatically. That is a production configuration change and needs approval. Without it, counters persist at about 1 KB per user.
  - Account deletion doesn't remove a counter today. That's acceptable at this size; add it if account deletion is built.

### 7. `getUniversalDataset`: callers and removal consequences (removal on hold)
- **Frontend:** never referenced. A search across git history of `src/` finds no use. Every `httpsCallable` in the app names its function literally, so no caller is hidden behind a dynamic name.
- **Tests, e2e and scripts:** none.
- **Possible external callers:** any signed-in client of the project could call it, for example a hand-written script. That can only be ruled out from production logs: invocation count for `getUniversalDataset` over the last 30 days, in Cloud Logging. It needs production access, so I haven't checked it.
- **Removal consequences:**
  - Dropping it from the deploy allowlist does **not** delete it; it would keep running the last deployed code, without #47's limits.
  - Deletion requires `firebase functions:delete getUniversalDataset --region us-central1`.
  - The `index.ts` export must also go, or a future full deploy would recreate it.
  - Any external caller would get `NOT_FOUND`.
- **Recommended order, each step approved separately:**
  1. Check the 30-day logs.
  2. Ship #47, which limits it in the meantime.
  3. Open a PR that removes the export and the allowlist entry.
  4. After that deploy, delete the function.
- **Rollback:** restore the export and allowlist entry, then deploy.
