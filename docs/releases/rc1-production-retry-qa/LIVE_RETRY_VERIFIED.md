# #111 bounded production retry — verified GO

November21,2026,3:51p.m. PST (23:51UTC) · OpenAI / Codex · `codex/rc1-production-retry-qa`. **GO for the authorized live same-attempt replay acceptance gate. RC1 production remains NO-GO pending separate gates/authorization.** [Machine-readable redacted evidence](LIVE_RETRY_RESULT.json).

## Authorization, identity and preconditions

Executed only [founder authorization7070107031](https://github.com/alwat83/ifyoumind/pull/111#issuecomment-7070107031) and its [exact documented scope](RESULT_AND_MINIMAL_PROPOSAL.md), with the founder's subsequent clarification/resume. The historical founder development account and all other existing founder accounts were excluded and untouched. [Fresh dedicated-alias lookup](RESUMED_ALIAS_ELIGIBILITY.json) confirmed unused/email-password enabled. The prior stopped journal is retained; its unknown original client failure has not been assigned a speculative cause. No existing account was relabeled or reused.

Founder privately created the one new dedicated identity and verified its email through Firebase's existing SDK flow. Operator confirmed the normal refreshed ID token against Firebase Auth: intended alias/UID, new creation time, verified email, enabled password identity, exact QA display name and no custom claims. No password, verification code, ID/refresh token or public API key value was printed, committed or requested in chat; no Gmail access. Session was memory-only. No privileged Auth token minting or fabricated verification.

Fresh preflight established no owner index or workspace for this identity, correct production/cache/UTC state, no Auth/blocking hooks and no Firestore trigger covering these paths (only ideas/{ideaId} creation). Serving functions were ACTIVE/latest Ready/100% throughout: creator `createintelligenceorganization-00090-xoq`, writer `createmarketintelligenceproject-00087-nub`, owner reader `getmarketintelligenceproject-00086-gaq`. No configuration changed. Existing Austin2019/2024 ACS cache was present/usable and unchanged. Synthetic hypothetical coffee-shop question, no comparison cities/customer records; demographic evidence came from the existing public cache, not invented figures or new provider requests.

## Observed bounded execution

| Stage | Total decisions | Current-UTC-month used | Remaining Free slots | Scoped Firestore documents |
| --- | ---: | ---: | ---: | ---: |
| New QA workspace baseline |0|0|3|3|
| One synthetic save |1|1|2|5|
| One identical same-ID retry |1|1|2|5|

One existing authenticated `createIntelligenceOrganization` call created exactly the approved QA-named root, sole active owner membership and owner index. The empty root has normal default Free behavior, no manual plan/allowance/billing fields. One `createMarketIntelligenceProject` call used a fresh UUIDv4, creating only the deterministic project and normal internalUsage/cityDecisions lock. Exactly one second request reused the identical payload/UUID; it returned the identical saved result/ID. Redacted attempt reference SHA256 prefix **5ac148f6093949c8**; actual identity/workspace/project/UUID and trace references retained privately.

All four normal callables returned HTTP200: workspace3211ms, first save3902ms, retry249ms, owner read3490ms (client HTTP timings, not whole-stage timing). Exactly one distinct project ID across both writer responses and owner read. Full scoped document content/create/update-time snapshots were identical after first save and retry, including the usage lock; root/member/index unchanged. No extra documents, subscriptions, paid-access flags, reservations, datasets, imports or analytics records under the QA workspace. Paid report access remained none. Authorized owner recovery read returned the same synthetic decision without mutation. Counts were derived from authoritative workspace/project timestamps and the unchanged normal3-per-UTC-month Free rule, not a manually reset counter.

Every relevant precondition was rechecked before each operation and after execution. No automatic HTTP/callable retry, forced transport loss, concurrent extra request, extra save, provider simulation, purchase, report unlock or generation. The two remaining Free slots are not authorized for further use. Existing QA identity/workspace/project/lock retained as audit evidence; no cleanup, deletion, quota restoration or entitlement adjustment. Operator process terminated and temporary auth pages closed to clear local in-memory credentials; private audit remains ignored0700/0600.

## Release state and limits

Final23:53UTC read-only metadata: unchanged Hosting **39dc573f3826dca6**, release **1794933315802000**; writer00087-nub ACTIVE/latest Ready/100%, writer enrollment empty, cache present. PR125 remains draft at074c8bad88f5e2f48f8b1cb3395bb24c3aa4a138, frozen source9d8caefc9943d65767198d6ec490dbdd63fd02e8. Manifestb7067f63d53e08457b4234901415749f19600bdcb81ff2319432f0bb835ac397/archive756b3d23fc067025c13c4713d5d4708d599a9797e905e0f85d8ea366728963f7 re-hashed unchanged. No merge, deployment, commercial/enrollment/AI change or original/customer record modification.

This proves the successful bounded production same-ID replay and single allowance use for this QA case. It does **not** reproduce a natural lost response, establish all concurrency/month/dataset recovery behavior, qualify a Firestore SDK correction or waive historical failures. Private harness syntax/decoder/field guard/canonical hash/source-digest checks passed; no unrelated suite, build/hosted CI or physical-device check was rerun/claimed. Internal QA is not a customer, purchase, revenue or product-comprehension outcome.

Remaining RC1 gates: exclusive coordinated Hosting deployment window/controls, explicit narrow reliability-risk disposition, unresolved physical Safari/spoken VoiceOver/Linux visual/human coverage (or recorded founder limited-coverage decision), and separate exact-artifact release/rollback authorization with fresh rollback checks. Existing billing/subscription activation gates stay independent and closed. **Next founder decision:** assess those remaining risk/coverage and exclusive-window conditions for a narrowly scoped Hosting release; no release is authorized by this test. No further production QA operation is proposed or performed here.
