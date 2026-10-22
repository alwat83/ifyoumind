# Homepage release verification — 2026-10-22

OpenAI / Codex. Status: local candidate verified; PRs remain drafts. No merge, deployment or public Life calculation approved or performed.

## Preserved Git state

Original checkout: `codex/fred-economic-indicators` at `1a7c78c`, existing sitemap edit untouched. Homepage review: `codex/consumer-entry-review` at #54 head `7a45016`, existing #49 mobile patch and generated sitemap retained. Life review: `codex/life-comparison-review` at #55 head `4732c6a`, clean at inspection. Latest fetched `origin/master`: `bb6744b`. No reset, stash, branch replacement or existing-work deletion.

## Latest CI

- #54 `7a4501667f261b747a173d172830a57ecffc1f39`: [build SUCCESS](https://github.com/alwat83/ifyoumind/actions/runs/39802724089), [emulator QA SUCCESS](https://github.com/alwat83/ifyoumind/actions/runs/39802724065).
- #55 `4732c6acc3e7350ccd54e4a30c0f0743037ef7d1`: [build SUCCESS](https://github.com/alwat83/ifyoumind/actions/runs/39811898425), [emulator QA SUCCESS](https://github.com/alwat83/ifyoumind/actions/runs/39811898202). GitHub's workflow-list wrapper returned no runs for this commit; direct commit check-runs confirmed both successes. No outstanding failed head check.

## Combined #49 / #54 local checks

- Production build, local build, production bundle guard PASS; production output contains no `/life/quick-compare` route. Warning budgets remain exceeded; error budgets pass.
- Fast web tests 82/82; Functions unit tests 72/72; fixed #55 Life component tests 10/10 PASS.
- Firebase demo-project browser regression: 16/16 PASS in installed Chrome at 390x844 and 1280x800. Homepage also checked at 320x568 for overflow. Covers homepage audience anchors by keyboard, honest Life disclosure, no calculator links/inputs, $79/$39 prices, Business sample path, report registration intent, public auth pages and signed-in report/pricing/account navigation.
- Sample report: analytical headline starts above 764px on 390x844; all seven contents links and both top-bar actions remain; source jump is keyboard usable, official source links remain, paid-intent registration works. Desktop contents still wrap. No page overflow. axe helper checks serious/critical WCAG A/AA violations and found none; this is not a manual screen-reader audit.
- Screenshots: `home-390.png`, `home-1280.png`, `sample-390.png`, `sample-1280.png`.
- Local setup issues resolved: sandbox build/port restrictions required approved local execution; installed locked Functions dependencies. Pinned Playwright browser installer stalled; stopped it and used the explicit `QA_BROWSER_CHANNEL=chrome` override. CI still defaults to its pinned Chromium. Local host Node 26 differs from Functions declared Node 22; exact-head CI supplies independent Linux evidence. No dependency versions changed.
- Prior baseline: full lint 91 pre-existing errors; default Angular specs have legacy compilation failures. New browser tests do not mask these; scoped work is covered separately.

Reproduce after `npm run build:local` and `npm --prefix functions ci`:

```sh
QA_BROWSER_CHANNEL=chrome JAVA_HOME=/opt/homebrew/opt/openjdk@21 PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" ./node_modules/.bin/firebase emulators:exec --project demo-ifyoumind --only auth,firestore,functions "node_modules/.bin/playwright test --config e2e/playwright.config.mjs e2e/specs/homepage-release.spec.mjs e2e/specs/sample-report-mobile.spec.mjs e2e/specs/layout-a11y.spec.mjs --workers=1"
```

## Release decision and next work

#54 and #49 are ready for founder review on their exact tested heads. Keep the local combined patch separate from #54's remote product diff. New #54 regression/documentation commit requires its own CI verification. Founder approval is required before merging; master pushes trigger production deployment. #55 remains experimental/local-only; #51 methodology and #52 scope are unresolved. No live-production verification claimed.

Rollback after any separately approved release: revert only the approved release commits and run the authorized deployment workflow, then repeat live smoke checks. Never reset master or alter billing configuration.

#56 is next: technical SEO on a separate feature branch/draft PR, followed by separate decision-intent content. GitHub/repository documentation are the development source of truth per latest founder direction. Notion destination confirmed by founder as `3eb02474659c81ecba55cc4eed184a71`; the handoff and roadmap were appended successfully without replacing history.
