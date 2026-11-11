# A report someone can inspect, reuse and share

Proposed November 6, 2026 · OpenAI / Codex. **Specification only.** Reuse existing `MarketProject`, `brief`, `summary` and entitled `decisionReport`; no new engine/data/provider. Sources and baseline in [AUDIT.md](AUDIT.md).

## Product contract

**Deliverable:** a city-level demographic comparison and adaptable market-analysis draft. It is not a business feasibility study, automated recommendation, lending endorsement or site-selection report. Free brief and full-report boundaries remain enforced on the server; public sample continues to show the complete illustrative report. Do not “preview” paid fields by shipping them to unpaid clients.

Reader questions, in order: What does this compare? What matters in these figures? What supports that observation? What remains unknown? What can I do with the report? What should I verify next?

## Reading order

| Section | Requirement and exact example copy | Existing source / acceptance |
|---|---|---|
| Compact report identity | ifYouMind / Decision Report / Sample or purchased status. **“A sourced comparison for your next planning step.”** Selected cities/business context, actual report date | Existing project fields; sample always labeled illustrative decision/real Census estimates. Never label a free brief “full report” |
| At a glance | **“Higher household income here. Greater estimated population change there.”** Up to two short factual findings, one neutral visual; no overall score | Derive from metrics, retain ties/missing values, named cities and distinct units. No fixed sample values in production code |
| Boundary alongside finding | **“Demographic context—not proof of customer demand.”** A plain full sentence in final product: “These estimates describe residents; they do not establish demand, competition, commercial rent or a winning location.” | Existing summary limits, visible without disclosure; population differences untested and small gaps flagged using existing method |
| Lens comparison | Household income / Population / Population change / Home value; begin with one simple view, do not require selection | Same values/formatters as current report. Direct labels+units, common scale within each metric, no dual-axis or composite score; home values never labeled commercial rent or “lower is better” |
| Evidence | **“Check this figure”** with dataset/table variable, period/geography, actual stored retrieved/generated date and source URL | Official source references; retain 2019 and 2024 vintage provenance for change; no extra request solely to open proof. No source-count certainty meter |
| Analysis draft | **“Use this as a starting point for your market section.”** Existing deterministic paragraphs and copy action | Preserve factual content/citations, use business context without implying researched industry conditions. Copy succeeds/errors announced; no unearned “lender ready” claim |
| Comparison takeaways | Existing measure-by-measure gaps in compact readable rows | Currency vs percentage-point distinctions retained. Ties/zero/missing values meaningful; keep caveat attached in copy/print |
| Next research | **“What to verify before you commit.”** Existing demand/competition/site-cost checks, with strengthen/weaken/unresolved distinctions | No city recommendation or fresh inference. Do not present higher population growth as the “biggest risk” simply because it is first in an array; any content revision needs a deterministic justified rule and existing fact fixtures |
| Method and limits | Dataset periods, place definition, survey estimates/no significance testing, explicitly missing inputs | A citation is not confidence; existing small-gap heuristic remains a reading aid. No numerical confidence/accuracy label without a validated methodology |
| Export and revisit | **“Copy market-analysis text”**, **“Print / save PDF”**, **“Back to saved decisions”** | Existing controls/entitlements; no new download service or server PDF. Public sample remains print/copyable; purchased/Pro access must remain correct |

A real comparison stays visible before optional controls. Full report navigation remains accessible; progressive disclosure reduces repeated reading without hiding core limits, sources or paid-proof content. Avoid a generic empty dashboard or form before the first useful result.

## Dates and freshness

Replace ambiguous display language such as “Sample · live data” with **“Sample · public Census estimates”**. Show **“Data: ACS 2020–2024; population change compares ACS 2015–2019 and2020–2024.”** Use actual stored report/retrieval dates; observed sample was generated October 11, 2026, not today. Explain cached/saved data rather than promise live refresh. If per-source vintage/retrieved metadata is missing, say unavailable; do not synthesize it from render time or rerun a paid report implicitly. Backend refresh/cache policy changes are outside the first slice.

A source inspector for population change must expose both vintages even though the current metric's source URL points to the2024table. Reuse existing brief sources as well as metric links; do not relabel the single2024URL as proof of both inputs.

## Interaction and accessibility

Native buttons/links/disclosures, logical heading order and visible focus. A selected lens changes only the comparison view and announces a concise update, never reorders the user's focus or the whole page. Every numeric chart has readable exact values in a semantic table/list. Names/units explain the series without relying on color; no automatic carousel. Respect reduced-motion, forced-colors,200% zoom and increased text spacing; control targets44 px where practical. Scope desktop/mobile/narrow checks to 1280×900/390×844/320×568; permit vertical scrolling. Do not achieve a first-screen target by making limits/values unreadably small.

Loading names a real operation. Existing sample timeout/offline/retry/focus-recovery behavior remains. A failed request yields no report or simulated conclusion. A saved stale sample preserves its real date. No artificial delay, model label or staged “collecting/scoring” sequence for deterministic cached rendering.

## Print and reusable output

**Observed baseline:** [contact sheet](screenshots/sample-print-contact-sheet.png), [Letter backgrounds enabled](screenshots/print-letter-backgrounds-last-page.png), [Letter default](screenshots/print-letter-default-last-page.png). These document the backgrounds-enabled defect and a default-settings comparison, not new final deliverables.

Acceptance for a future implementation:

1. Render actual sample and representative free/unlocked/Pro fixture outputs in Chrome to Letter and A4, backgrounds both enabled/disabled. Inspect every page via PNG; a print-control click or hidden nav test is insufficient.
2. No dark page/body tail, surplus empty terminal page, clipped line/table, orphan section heading, missing source or paid-content leak. Keep headings with at least the first following paragraph/row; allow long content to break naturally rather than make an oversized section unbreakable.
3. White paper and high-contrast text are reliable independent of the app's global dark body styles. Isolate print-only changes; do not globally recolor the app on screen. Diagnose the actual cascade before choosing the selector/root.
4. Use consistent page margins and readable body text (target10–12 pt); chart labels/source notes remain legible. No strict page-count target: shorter is useful only if it preserves content and readability. The observed7 pages are not inherently a defect; their pagination/background artifacts are.
5. Report title, sample status, data periods, source citations, caveats and action plan survive export. Remove navigation/checkout controls, not the sample provenance or methodological limits. Optional page numbers only if supported by the browser export path; no new PDF generator for them.
6. Copy-as-text preserves actual figures, meaning and citations. It must not imply that a pasted draft is endorsed by a lender. Private reports have no public URL unless a separately authorized sharing design exists.

## Implementation limits

First slice is sample-only for the new digest; shared print fixes are regression-checked against free/paid/Pro paths. Applying the digest to own authenticated reports is a separate backlog item after source/entitlement behavior is confirmed. No ranking normalization, user weights, AI writer, MOE ingestion, competitor API, chart dependency, report schema migration, billing change or server storage introduced here.

Keep existing exact-head PR77 untouched. Implement from current master on its own `codex/*` branch, after checking current repository/CI/concurrent changes. Finish as a draft PR with reproducible before/after images and print proof; no automatic master push or deployment.
