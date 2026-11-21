# Final homepage refinement — cohesive question, less empty height

November21,2026 · OpenAI / Codex · `codex/hero-question-wrap`, separate draft from #123 `ade00b0c21c8e499a434ec8cf5581ef52984b829`. Midnight Slate visual direction is founder-approved; this implementation still requires review and separate merge/release authorization. No redesign, new content or capability.

## What changed

The serif question was an inline element inside a mixed sans/serif heading. Whole-heading text balancing left `go?` alone at several widths; the viewport-height minimum then kept a large empty tail below the hero content. Existing Google-font availability also changes line measurements, so both loaded and fallback states were checked.

Only two component stylesheets change product behavior:

- Give the serif phrase its own block and balanced text flow. No hardcoded break, no hidden/repeated copy, no nonbreaking text that can force overflow.
- Reduce the desktop maximum heading size from92px to88px; existing tablet/mobile sizes remain64/46/39px.
- Remove the desktop and mobile viewport-height minimums. Let content set height, with desktop padding56/48px rather than64/64px, and mobile24/40px rather than32/48px. The existing320px top spacing remains24px.

Preserved: Inter/Instrument Serif pairing, palette, column arrangement, wording, property-tax emphasis, CTA, findings, source calculations, evidence disclosure, private CSV continuation, other examples, reduced-motion rules, authentication and all commercial behavior. No template/TypeScript/backend/dependency/workflow changes. No enrollment or provider configuration changes.

## Actual before / after

All images are full-page Chrome captures from local demo builds with synthetic data. Both existing fonts are confirmed loaded; external access was restricted to loopback and the site's existing font hosts. Only the standard emulator warning overlay is hidden. No product content or visual baseline is hidden/updated. [Before metadata/hashes](screenshots/before.json), [after](screenshots/after.json), [primary-font checks](screenshots/font-readiness.json), [fallback measurements](screenshots/fallback-wrap.json).

| Width | Before | After | Question after / intro height before→after |
|---|---|---|---|
|320|[Before](screenshots/before-320.jpg)|[After](screenshots/after-320.jpg)|Where did the / extra $420 go? ·510→500px|
|390|[Before](screenshots/before-390.jpg)|[After](screenshots/after-390.jpg)|Where did the / extra $420 go? ·776→474px|
|820|[Before](screenshots/before-820.jpg)|[After](screenshots/after-820.jpg)|Where did the / extra $420 go? ·812→406px|
|1280|[Before](screenshots/before-1280.jpg)|[After](screenshots/after-1280.jpg)|One complete line with Inter loaded; balanced two lines in fallback ·812→396px|
|1440|[Before](screenshots/before-1440.jpg)|[After](screenshots/after-1440.jpg)|Where did the / extra $420 go? ·812→504px|

No orphan or horizontal overflow after the correction at any requested width in either font state. CTA remains fully visible in each initial viewport (320×568,390×844, other widths×900). Instrument Serif is self-hosted; Inter is the existing Google font. Its availability was not changed. The before build is exact4fa109f, executable/UI identical to reviewedade00b0; after style/markup hashes are recorded and compared with the final source. Screenshots are review evidence, not Linux baseline acceptance or observed user comprehension.

## Verification

Consumer frontend risk level is appropriate: this is a real public-surface refinement, not an infrastructure or backend change. [Exact-source summary](VERIFIED_45ebd3f.md) / [JSON](VERIFIED_45ebd3f.json), tested **45ebd3fab6e8d0864ff30db6b20eee81baaf8c31**, reviewed baseade00b0c21c8e499a434ec8cf5581ef52984b829.19 checks PASS,594 tests PASS/zero FAIL/14 Linux visual SKIP; clean integrity VALID, zero source events. Selected development PASS; overall PARTIAL for native renderer/Node/Java differences. Six sensitive suites NOT_RUN, not new passes. Existing transaction findings remain open. No standalone lint run or hosted CI pass claimed; no test/assertion weakened.

```sh
npm run verify:local -- --level=consumer --base-sha=ade00b0c21c8e499a434ec8cf5581ef52984b829 --expected-sha=45ebd3fab6e8d0864ff30db6b20eee81baaf8c31
```

Local preview **http://127.0.0.1:4393/** uses the exact tested snapshot and synthetic demo emulators; seed readiness plus home/pricing/CSV-entry HTTP200 and actual-byte matches checked after restart. Run directory: `test-results/local-first/2026-11-21T19-10-41-520Z-45ebd3fa`. To restart, use the existing [credential-free preview procedure](../../releases/phase5/PREVIEW.md), substituting this run and port4393; never run overlapping emulators or use real information. Later evidence-only follow-up changes no executable/customer bytes and is not represented as a rerun.

Checkpoint: `npm run build:local` PASS with existing unchanged Discovery stylesheet-budget warnings. Existing `question-reveal.spec.mjs`:4 cases PASS; desktop loop expanded to1280 alongside820/1440, mobile320/390. Added actual DOM word-line checks (no isolated word) and an empty-tail bound, retaining every keyboard, axe, overflow, reveal/focus, evidence, private-input and normal/reduced-motion assertion. No CSS-string mirror tests. The final exact-source Consumer run independently includes these cases; original backend failures are not rerun or cleared by these results.

The first final-font capture command was not executed because automatic approval review hit an account usage limit. On the founder's resume it ran successfully through the normal approval mechanism. Earlier standard QA/fallback captures were replaced by actual primary-font pairs; fallback measurements retained. No permission bypass, source discard or production action.

Physical Safari/iPhone, spoken VoiceOver, Linux pixel comparisons and unassisted comprehension remain unverified. Existing Linux assertions/baselines unchanged; never call skips passes. Existing #111 and #120/month/dataset findings remain open. Hosted CI is separate from local results.

## Cross-surface impact

| Surface | Classification | Rationale / evidence |
|---|---|---|
|Public homepage intro and responsive typography|Change Required|Two CSS files, five-width actual pairs, loaded/fallback checks|
|Reveal/evidence/own CSV/other examples|Verify Only|Existing functional, keyboard, axe and reduced-motion assertions retained|
|Navigation and mobile controls|Verify Only|No new route/control, unchanged semantics; responsive/overflow and browser coverage|
|Auth/Account/saved decisions/reports/Business/pricing|Verify Only|Unchanged source; applicable Consumer browser regression coverage, known backend risks retained|
|Billing/credits/enrollment/backend/AI/rules|Not Affected|No source/configuration/deployment/provider or data change|
|Analytics/SEO/privacy|Not Affected|No content, tracking, request, persistence or bill lifecycle changes|
|Handoff/GitHub/Notion|Change Required|Exact source, captures, results and release boundary synchronized|

## Review and release

Hypothesis: a visitor can read one complete question, find the same CTA and reach the same useful finding without an awkward orphan or excessive empty space. This is a visual/engineering improvement, not measured comprehension or conversion lift. Founder review: compare the two390px and1440px pairs, read the question, reveal the finding and open the evidence. Keep the approved design; do not add elements.

**GO for founder visual review; no merge/deployment authorization.** The retained #123 Hosting artifact predates this refinement and must not be claimed to include it. Integration and a new exact-source release artifact require their own verification and approval; no protected draft head, production resource or existing release gate is altered here.
