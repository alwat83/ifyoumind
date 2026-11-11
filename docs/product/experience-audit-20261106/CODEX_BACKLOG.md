# Codex execution backlog

November 6, 2026 · OpenAI / Codex. **Prepared requirements, not shipped changes.** Source audit precedes this plan; see [AUDIT.md](AUDIT.md), [REPORT_SPEC.md](REPORT_SPEC.md), [MEASUREMENT.md](MEASUREMENT.md). Estimates are engineering effort for one developer with existing dependencies, excluding review/CI/user scheduling; not deadlines, cost commitments or conversion forecasts. No new infrastructure/service cost assumed.

## Recommended next assignment: Business report proof in one screen

Build one focused sample-report slice in two reviewable commits: **A—repair the reproduced print output; B—add a sample-only factual digest.** Both serve the same existing paid deliverable. If A exposes broader global-style or schema work, stop expansion and deliver the smallest isolated repair; B can remain separate. This avoids making an already promised export worse while improving the demonstration. No large redesign is needed.

### Implementation card P1-01 — trustworthy Business proof

- **Priority / effort:** first product work; A0.5–1 day, B1–2 days. No new paid service.
- **Current problem:** mobile sample begins with long contextual prose and is 9,051 px high; its export has a reproducible dark final-page tail with print backgrounds and an orphan heading in captured A4. The backgrounds-off Letter export retains its source text without the dark tail.
- **Proposed improvement:** correct print cascade/pagination; add an immediately useful, sample-only two-finding digest and an existing-data comparison lens above the long summary. Preserve the complete original sample and evidence.
- **User benefit:** see a concrete trade-off quickly, inspect it, and judge a usable deliverable before account/purchase.
- **Commercial hypothesis:** more relevant visitors will understand/reuse the sample and consider their own brief/report; no projected lift or validated willingness to pay.
- **Technical scope:** `market-report.component.html/.ts`, scoped report styles/mobile styles and possibly a small pure presentation helper; existing `summary/brief.metrics/brief.comparisons/sources`. A narrowly scoped global print override only if reproduction demonstrates it is needed. Reuse current native controls/formatters; no new chart library. Deterministic calculated facts only. New digest initially only `sampleMode`.
- **Dependencies:** fresh master and release baseline; existing public sample fixture and saved-schema handling; exact CSV/Household PR77 kept separate. If a legacy sample payload lacks metadata, show unknown/retain existing view instead of changing cache policy or inventing a date.
- **Acceptance:** original report/copy/source/actions retained; short factual income/population-change insight and directly labeled city values; visible untested-growth caveat; no winner/confidence score; ties/missing/reversed values handled; no hardcoded demo figures. One keyboard action opens relevant evidence, with focus/return. No new request or persistent state for lens selection. No private data exposed to public sample. All print requirements in REPORT_SPEC pass.
- **Verification:** reproduce with an existing sample fixture locally, then use read-only public comparison as baseline. Test pure transformation for ties/missing/zero/large values if helper logic is introduced; do not snapshot copy-only implementation. Run targeted report ESLint, fast tests, production build/bundle guard, relevant sample/recovery/registration/return/decision/commerce coverage. Render complete Letter/A4 PDF output with backgrounds on/off; visually inspect all pages. Browser desktop/mobile/narrow, keyboard/axe/text-spacing/reduced-motion/forced-colors and unpaid/purchased/Pro/report-intent assertions. New-head CI independent of PR77; no claim that a print-button event proves PDF quality.

### Execute in this order

1. Read current AGENTS/current/log/master; inspect worktrees/uncommitted changes/current master/CI. Start a separate `codex/business-report-proof-*` branch from verified master; no cherry-pick or merge of PR77 required for report-only files. Preserve private campaign material and source heads.
2. Reproduce print defects against the exact existing report and a local fixture. Inspect `body`/report host backgrounds and break rules in print media; do not assume the first suspected selector is the cause. Capture before/after, default/background-enabled and Letter/A4. Do not modify authentication, billing, report-generation data or cache to repair a stylesheet.
3. Add one sample-only digest using existing facts. Default income view: Austin $93,658, Charlotte $82,068, Nashville $77,371 only as golden-fixture expectations, never constants in the component. Population-change view: Charlotte 5.4%, Nashville 4%, Austin 3%, correct ACS periods, no overall city score. In production derive labels/order/values from the loaded sample. Existing uncertainty text and exact source paths remain accessible.
4. Keep the full report readable and link to existing analysis/action/source sections. Maintain sample/cached-date labels; a change of lens does not fetch new data or imply user-specific analysis. Fallback to the current valid full report for an unsupported old shape.
5. Complete focused checks and actual print render QA; add only meaningful transformation/behavior coverage. Record source SHA, test commands/results, images/hash manifests, CI and limits. Create a draft PR with before/after proof and rollback (revert scoped presentation commit). **No merge or deploy.**

## Phase 1 — immediate wow

### P1-02 — coherent entry paths

| Field | Requirement |
|---|---|
| Priority / effort | After P1-01;1–2 days |
| Current problem | Live homepage primarily identifies the product as a two-bill tool; optional paid Business proof is below it |
| Improvement | Apply tested evidence-first copy in AUDIT, preserve the useful bill demo and add a clear secondary Business sample path; no new decision wizard |
| User benefit | Recognize the appropriate task and get a result with minimal explanation |
| Commercial hypothesis | More relevant Business visitors find the sample while household users keep an uninterrupted free experience |
| Technical scope | Existing landing HTML/TS/SCSS, metadata where truthful, existing links; reuse current preview states and PR77 findings after its separate disposition, without merging unrelated branches |
| Dependencies | Review P1-01 proof and final approved copy; existing SEO/first-screen checks; no implied PR77 release |
| Acceptance | Made-up provenance stays visible; selected category matches destination; actionable finding+CTA within 390×844and 320×568 reference viewport; clear supported CSV/no-PDF boundary; Business route findable; prices/intent/SEO/headers/privacy unchanged |
| Verification | Desktop/mobile/narrow browser and keyboard/axe/forced-colors/spacing, source arithmetic/target-link guards, main build/bundle/isolation checks, compare content and first-screen screenshots; later five-second participant protocol, not automated comprehension claims |

## Phase 2 — product experience

### P2-01 — own-report reading and reusable output

| Field | Requirement |
|---|---|
| Priority / effort | After sample digest demonstrates correct behavior;2–3 days |
| Current problem | Authenticated report repeats metrics/paragraphs and next research without a compact decision-oriented reading order |
| Improvement | Extend proven digest to owned reports using the same real fields; prioritize finding→proof→unknown→next check; clearer copy/print/source labels |
| User benefit | Revisit/adapt a report and understand trade-offs without rereading every section |
| Commercial hypothesis | Better deliverable reuse and repeat task completion, not assumed subscription retention |
| Technical scope | Report presentation/helper and existing market-analysis component only. Preserve schema2/legacy fallback and server response shape |
| Dependencies | P1-01; free/paid/Pro/legacy fixtures; any content-rule adjustment separately justified from validated inputs |
| Acceptance | Unpaid report never receives paid data; correct included allowance/unlock state; copied text/citations/date consistent; no overall recommendation/confidence number or invented industry research; exact existing report access retained |
| Verification | Entitlement/rules/commerce plus authenticated decision/revisit/copy/print fixture coverage; unit cases for new logic; full print render proof across representative outputs; relevant exact-head CI. No live payment or private-report export for QA |

### P2-02 — source and freshness clarity

| Field | Requirement |
|---|---|
| Priority / effort | Include display-only labels in P1-01 where safe; remaining work 1 day |
| Current problem | “Live data” and source links can obscure cached report dates and the two vintages behind population change |
| Improvement | Public-estimate wording, explicit source periods and actual stored dates, named table links and unavailable metadata state |
| User benefit | Know what a figure represents and whether it is timely enough for the task |
| Commercial hypothesis | Better trust/less expectation mismatch; not increased statistical certainty |
| Technical scope | Presentation of existing metric/brief.sources/project dates; no cache refresh endpoint, provider or MOE ingestion |
| Dependencies | Actual metadata availability including older saved sample; don't infer a cached figure's retrieval from report render time |
| Acceptance | Growth proof identifies both official datasets; no invented retrieved date; source-count label remains citation count; existing small-gap/no-significance limitations retained; no source request on disclosure |
| Verification | Saved/current/missing-metadata fixtures, source URL+period assertions, keyboard/link behavior and existing recovery; no claim of newer data based on release date |

## Phase 3 — conversion and growth

### P3-01 — transparent offer and handoff

| Field | Requirement |
|---|---|
| Priority / effort | After sample proof;1–2 days |
| Current problem | Purchase CTA precedes concrete proof and the$79 one-time/$39 monthly five-report trade-off is easy to misunderstand |
| Improvement | Deliverable comparison near sample proof and own free brief; state one-time/no-subscription versus recurring/five included/month; precise next-step copy |
| User benefit | Choose an offer knowingly and keep their decision context through account/checkout |
| Commercial hypothesis | More informed checkout starts and fewer wrong-product expectations; no guaranteed net revenue increase |
| Technical scope | Sample/landing/pricing/register copy and supported query/intent continuity only; use current entitlements/services, no Stripe API/config changes |
| Dependencies | P1-01; reviewed factual offer text; any material pricing/entitlement change requires separate founder decision |
| Acceptance | Both prices/allowances/renewal/cancellation accurate and visible; don't invent superior79content; report/project identity preserved; no one-report checkout without project; checkout-return != paid status; free path remains easy; household flow has no irrelevant paid demand |
| Verification | Existing intent/registration/returnURL/checkout-contract/entitlement tests; disabled-checkout behavior; no real checkout session/charge; copy source guards updated intentionally, no weakened assertions |

### P3-02 — lightweight learning and safe public sharing

| Field | Requirement |
|---|---|
| Priority / effort | Protocol now; participant work after end-of-design testing resumes; optional UI0.5–1 day; tracking changes separately scoped |
| Current problem | No measured understanding/willingness-to-pay; private discovery intentionally has no analytics; sharing is not a defined outcome |
| Improvement | Run neutral task observations when resumed; record count/denominator/assistance, test public example/sample-link copying; use existing consented app events and verified payment ledger |
| User benefit | Easy to pass along an inspectable public finding; future work follows demonstrated confusion/utility |
| Commercial hypothesis | Actual sample reuse and qualified buyer learning precede acquisition/retention optimization |
| Technical scope | Manual private notes now; optional existing public-URL clipboard control with announced success/failure; no backend/customer-report sharing, discovery event collector or sensitive payload |
| Dependencies | Deferred testing resumed; exact external publishing/recruitment remains Pending Founder Setup; any instrumentation must respect existing consent and island CSP |
| Acceptance | No CSV/project/identity data in copied public links or events; examples labeled; cancellation/clipboard failure recoverable; assisted use and QA excluded; purchase verified separately from return; no claim that a copy event is a referral or sale |
| Verification | Clipboard permission failure/keyboard/correct public URL tests only if implemented; inspect network/storage during private discovery; denominator/source/exclusion audit in MEASUREMENT; no new service or unattended automation |

## Deliberately not on the active backlog

No chatbot, general file/PDF parser, paid model, site-rent/competitor API, custom weighted winner, synthetic confidence score, billing redesign, account bypass, automatic report refresh, private public-sharing endpoint, notification scheduler, elaborate dashboard or additional dataset category. Some could be valuable later; none is justified by this audit or needed to prove the current paid deliverable.

No new remote outreach/publishing, spend, production merge/deployment or Stripe change authorized. Existing PR77 and current production are preserved. Finished requirements do not count as implemented features; green engineering checks do not grant release approval.
