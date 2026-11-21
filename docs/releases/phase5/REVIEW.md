# Phase 5 — isolated consumer release package

November 21, 2026 · OpenAI / Codex. **Preparation complete; production execution NO-GO.** [Draft #123](https://github.com/alwat83/ifyoumind/pull/123). No merge, deployment, production record write, workflow/protection change, provider request, enrollment activation or dependency experiment. [Hosting-only procedure](HOSTING_ONLY.md), [new exact-source results](VERIFIED_4fa109f.md) / [JSON](VERIFIED_4fa109f.json). Historical backend evidence below remains distinct.

## Candidate and dependency order

Fresh GitHub inspection: master `6dcffca4eb186c6e0da7431523d7137652e14990`; #118 `2f4975f94ac888547df8b1fbdf149a50741f6570` → #119 `172dbaa93231e88fd2256b3ca7c2726d81a7c6e0` → #121 `76ece8d911f7cec1dd269da732478b66199c2f12`. All three are draft, mergeable and already in direct ancestry; there is no integration conflict to resolve or duplicate source to cherry-pick. #122 `fded8759251204b4e3fa1db7573f05fd835aa41c` adds the verification policy and evidence, not product behavior. This isolated preparation branch builds on it. #120 `f856c3b462903422a8cad4aaa6bdaed41268fe3b` remains independent, unchanged and NO-GO.

Repository integration order remains **#118 → #119 → #121**, then tooling/documentation as reviewed. A master merge currently triggers the broad deployment workflow; do not merge even a frontend-only PR to master assuming it cannot redeploy Functions. The proposed alternative is a separately authorized exact-source Hosting artifact from the stacked candidate, with no merge. It requires explicit founder approval of this narrower release and residual gates; it is not an authorized change to the established sequence. Any later merges also need safe deployment coordination.

The cumulative consumer source has **zero changes under `functions/`, Firestore rules/indexes and Storage rules** versus current master. The city writer service and existing retry implementation are unchanged. The full Hosting artifact includes the new authenticated client/shell as well as public assets; this is not a public-homepage-only swap. New routing, navigation and public pricing still exercise the existing deployed backend, so source equality does not establish transaction reliability. Read-only function metadata independently confirms `createMarketIntelligenceProject` ACTIVE, Node22, `createmarketintelligenceproject-00087-nub` latest Ready and serving100%. [Writer readback](WRITER_READBACK.json) is identity evidence, not a live retry test.

## Connected journey and backend exposure

| Leg | What the consumer actually receives | Dependency / unresolved risk |
|---|---|---|
| Home → Reveal what changed | Question-led Concept A, explicitly illustrative $420 tax increase; explanation and $240 school-tax contribution | Static/deterministic; no account, Firestore write, provider generation or claim of overpayment |
| Finding → evidence | Inspectable input amounts, arithmetic, source/illustration qualifications | Static/local; two periods do not establish cause, trend or appeal eligibility |
| Evidence → private analysis | Recognized redacted tax/electricity CSV in the isolated Discovery entry; correction, clearing, comparison and limitations | Browser memory; `/discover/**` keeps `connect-src 'none'` and no-store. No arbitrary PDF, typed-input PR95 or AI capability is released |
| Private analysis → optional account | Navigation carries only the selected example category; private bill figures do not become an account-saved decision | Auth is separate; existing boundary copy explains bills stay in their tab. Do not suggest registration saves private analysis |
| City question → free brief/save | Existing supported public Census evidence, same request ID on uncertain-response retries, quota/auth controls | **Affected by #111 live retry uncertainty and the unresolved city-save transaction failures.** No new backend or retry correction in this package |
| Saved city → reopen/report | Existing authorized project lookup, saved evidence and paid-report offer | Reads/access are distinct from new-save writes. Existing generation/unlock paths retain their transaction dependencies; no payment outcome is inferred |
| Private account datasets | Existing separate account-data feature, not the local bill input | Historical dataset-cap failure remains distinct. Browser-local CSV success does not clear it |
| Pricing | Public Free$0; Starter$4.99/month, one full report/paid period; Plus$9.99/month, three; one-time report$79 | Monthly enrollment explicitly unavailable and backend closed. Existing $39 Pro/Account preserved. Displaying offers does not prove purchasability or fulfillment |
| Checkout / subscription / paid delivery | Existing commercial paths, unchanged | Live signed payment/fulfillment, authorized owner portal and subscription activation/tax/support gates remain; no Checkout session, payment or new provider test in this phase |

Existing relevant checks cover lost replies/refresh, same/different keys, intentional identical questions, authorization, quotas and month boundaries; see #121 and #122 evidence. Strict controlled read-abort recovery remains failing. Natural aggregate lock timeout/masked abort, historical month-boundary failure and dataset-cap finding are not combined into one proven cause. No rejected SDK matrix rerun, arbitrary retry, monkey-patch or cap bypass.

## Four offers and privacy boundaries

Free private bill comparisons are supported **recognized CSV analysis**, not property-specific assessments or appeal advice. Saved city decisions use account-authorized public data. Paid city/business reports expand those decisions; they do not unlock arbitrary private-bill AI. Starter and Plus are prominent proposals with enrollment unavailable, not live offers that a visitor can purchase today. The $79 capability remains available through its existing legitimate flow. Existing paid entitlements and legacy$39 plans remain unchanged.

The isolated artifact copies the reviewed static headers/redirects/rewrites and explicitly fixes the site. Its generated config contains **only Hosting**: no Functions, rules, Storage, hooks or dynamic backend rewrites. Tests reject mismatched/dirty source, missing checks, altered snapshots, local/demo output, missing entrypoints, symlinks, private filenames, tampered/extra assets, extra resource configuration and overwriting an existing package. No deployment mode exists in the preparer.

## Founder experience review

Working local preview: **http://127.0.0.1:4392/** and [pricing](http://127.0.0.1:4392/pricing), with credential-free `demo-ifyoumind` Auth/Firestore/Functions emulators. Synthetic seed readiness and HTTP200/byte equality checked after restart from the tested source snapshot. [Restart instructions](PREVIEW.md), [actual preview checks](PREVIEW_READINESS.json). It is a local simulation, not production/header proof. Use synthetic data only. Existing full desktop/mobile screenshots remain current because this phase changes **no customer HTML, SCSS, routes or behavior**:

- [Homepage1440](../../design/midnight-slate/first-five-seconds/implementation/after-home-1440-full.jpg), [390](../../design/midnight-slate/first-five-seconds/implementation/after-home-390-full.jpg), [320](../../design/midnight-slate/first-five-seconds/implementation/after-home-320-full.jpg).
- [Pricing1440](../../design/consumer-pricing/screenshots/after-desktop.jpg), [390](../../design/consumer-pricing/screenshots/after-mobile.jpg), [320](../../design/consumer-pricing/screenshots/after-narrow.jpg), [820](../../design/consumer-pricing/screenshots/after-tablet.jpg). Before/after and active/legacy states: [pricing review](../../design/consumer-pricing/REVIEW.md).
- [Connected journey before/after](../../design/midnight-slate/phase3/REVIEW.md), including saved-state and bill/account boundary captures.

Five tasks, without explanation or coaching:

1. From the first390px viewport, describe what the site helps you do and reveal the tax example.
2. Explain one finding and one limitation, then find its arithmetic/evidence.
3. Find how to use your own **supported redacted CSV**; explain where the figures stay. Clear and return without carrying figures into a URL/account.
4. Find the separate city journey and where an existing city decision can be resumed. Use only synthetic local credentials; no production fixture.
5. Find the four prices and explain what is available now, which reports cost money and why monthly signup is unavailable.

Automated viewport/axe/keyboard checks are engineering coverage, not observed comprehension. **Physical Safari, spoken VoiceOver, Linux pixel comparisons and unassisted human comprehension are explicitly unverified.** No bulk baseline update, installation or invented participant outcome. These gaps remain visible for founder disposition; they are not passed by local Chrome screenshots.

## New exact-source verification

Tested executable source **`4fa109f5ba683e197efc781223225f0d1fca5407`**, base #122fded875. Consumer level: **19 checks PASS;594 tests PASS/zero FAIL/14 Linux visual SKIP**, selected development PASS; overall PARTIAL for native renderer/Node/Java differences. Source integrity VALID, clean SHA/branch/digest before and after, isolated digest equal, zero source events. Includes fast173 (new artifact safety8), first-screen12, Discovery48, electricity27, unified36, Hosting84 and authenticated214. Browser checks cover the connected journey, public/signed-in/tier/legacy pricing states, responsive/axe/keyboard, auth and recovery; they do not establish genuine payments or human outcomes.

Functions tests, rules, organizations, commerce, fixture/access and strict transport diagnostic are **NOT_RUN at this level**, not new passes. Historical #121 three failures and #122 two strict failures remain open; no rejected SDK experiment repeated. The initial CLI invocation used a mismatched SHA and correctly refused with INVALID/zero tests; the final correct-source report is separate. No hosted check runs listed on #123; no hosted CI success claimed.

Prepared and independently re-hashed **58 static files /2,044,304 bytes**. Manifest SHA256 `ea2a96117cc4b4cac271696c5b2c2c37e4c7350d85592c5332f52eea70e7e97f`, config SHA256 `a985fa400017d793640bd4c895435d0c8d4a302c183efcb7d50999794ce5dec0`. Exact commands/artifact provenance: [verification](VERIFIED_4fa109f.md). Package stays ignored; small redacted records are committed. Later evidence-only documentation commit changes no executable or customer bytes and is not presented as a rerun. Current master protection/rulesets/production approval readback still empty; no settings changed or gate bypassed.

## Release matrix

| Decision | Status | Reason / next gate |
|---|---|---|
| Safe to develop | GO at applicable risk level | Existing local-first tools; no dependency on hosted billing restoration |
| Founder consumer review | GO with recorded device limitations | Integrated preview, existing visual evidence and exact-source local results; no new product layout |
| Static Hosting artifact preparation | GO after exact-source checks pass | Local-only build output and manifest; no infrastructure mutation |
| Isolated Hosting deployment now | **NO-GO** | No execution authorization; shared deployment serialization/control not approved; human/platform gates and #111 disposition remain |
| Proposed narrower public/free/pricing release | **CONDITIONAL proposal only** | Technically separable from backend redeployment; needs founder's explicit acceptance of unchanged but exposed save risks, platform coverage and exclusive release window. Existing gates are neither resolved nor waived |
| Claiming reliable city-save retries or account-dataset caps | **NO-GO** | #111 live retry, strict read-abort recovery, month boundary and separate dataset findings unresolved |
| Subscription activation / verified paid-customer claim | **NO-GO** | Enrollment stays closed; live billing/fulfillment and tax/support evidence gaps remain. See [Phase4](../phase4/READINESS.md) |

A Hosting-only path reduces deployment blast radius and avoids touching billing configuration. It does **not** remove the transaction paths from the consumer journey. Do not label the whole consumer experience reliability-green. If founder requires all current gates to pass before any release, production remains blocked; if a narrower release is approved, record the exact scope, unchanged risks and monitoring/recovery expectations rather than silently waiving them.

## Impact assessment

| Surface | Classification | Evidence / rationale |
|---|---|---|
| Local release tooling | Change Required | Reproducible exact-source static artifact; targeted negative safety tests |
| Homepage/Discovery/pricing/navigation | Verify Only | No new UI change; connected public/authenticated browser and accessibility suites |
| Auth/Account/saved decisions/reports/Business | Verify Only | Existing journeys, state clearing, isolation and contract coverage; unresolved write risks explicitly carried |
| Stripe/entitlements/subscriptions/AI/rules/runtime | Not Affected | No source/configuration/deployment or live provider mutation; prior readiness gaps preserved |
| Production workflow/protections | Verify Only | Read-only scope/concurrency audit; byte-identical workflow; proposed execution remains gated |
| Mobile/visual/a11y/privacy | Verify Only | Existing design/captures, responsive and axe checks; physical/Linux/human gaps retained |
| Analytics/SEO | Not Affected | No new events, tracking, content or public routes |
| Handoff/GitHub/Notion | Change Required | Synced exact-source findings, preparation-only status and founder decision |

No new user, independently paid customer, revenue, conversion lift, attributable cost or comprehension measurement. Business benefit is a smaller release blast radius and a concrete path to real-user learning, not a verified commercial result.
