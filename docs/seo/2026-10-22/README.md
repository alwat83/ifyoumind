# SEO foundation audit — 2026-10-22

OpenAI / Codex. Tracks [#56](https://github.com/alwat83/ifyoumind/issues/56). Status: local fixes verified, not merged or deployed. Existing Business flow preserved; no public Life calculation link or availability claim added.

## Measured baseline and fixes

Read-only Chrome audit: 10 paths × 2 widths (390/1280) × JavaScript on/off = 40 observations. [Production baseline](production-before.json) and [local Hosting-emulator candidate](local-after.json) record exact observation times, statuses, final URLs, metadata, schema, headings, resources and overflow. These are browser observations, not Search Console indexing or ranking evidence.

| Verified problem | Baseline | Candidate fix / evidence |
|---|---|---|
| Initial metadata is shared across app routes | All 4 public SPA pages initially use the homepage title, have no canonical, and require JS for correct route metadata | Build emits 4 distinct initial heads with one self-canonical and matching OG/Twitter. Client navigation stays synchronized. |
| Private routes initially claim indexability | `/login`, `/register`, `/app/result/seo-audit` return raw `index,follow`; rendered pages become noindex | Known auth/app paths serve a separate initial `noindex,nofollow` shell with no canonical or offer schema. No private data is included in static generation. |
| Homepage commercial schema persists elsewhere | Application/offers JSON-LD appears on sample/legal/auth/private pages even after rendering | Shared homepage schema emitted only on `/`; route metadata owner removes it on client navigation. Guide Article/Breadcrumb schema remains intact. |
| Unknown URLs are soft 404s | Probe returns HTTP 200 then Angular redirects to `/` | Hosting rewrites cover only known auth/app routes; a static noindex 404 page returns HTTP 404 for unknown public routes. Public clean URLs use generated `.html` artifacts. |
| Sitemap lastmod is a build timestamp | Generator rewrites all public app dates on every build, even without content changes | Explicit content-revision dates in public metadata; sitemap deterministic across supplied wall-clock dates. Baseline source histories reviewed (sample Oct 14, privacy Oct 2, terms Oct 11); homepage metadata changed Oct 22. |
| Homepage metadata understates broader direction | Title only describes market analysis | Clearer-decisions title; description explicitly says Business reports work today and personal tools are in development. |

`src/public-pages.json` remains the single public route/metadata registry. `scripts/build-seo.js` runs after Angular for production and local builds. This generates **initial head metadata, not server-rendered body content**. No new dependencies. `firebase.json` now uses clean URLs plus explicit private-shell rewrites; genuine unknown paths can return 404. Reserved Firebase Auth endpoints retain existing header rules. Production workflow already invokes `npm run build` and receives the generated artifacts.

Explicit 301 rules normalize public/auth app entry trailing slashes and retain guide directory canonicals. A Hosting-emulator probe caught `/sample-report/` returning 404 under clean URLs; this was corrected before release review. `.html` URLs redirect to clean URLs. Bare guide URLs redirect to their trailing-slash canonicals; asset paths with extensions are excluded from that rule.

## Checks and limitations

- Fast web tests: 86/86 PASS, including initial metadata, noindex shell, 404 artifact, deterministic sitemap and routing/header assertions.
- Production build, local build, production bundle guard PASS. Changed TypeScript ESLint PASS. Existing bundle warning budgets remain exceeded; error budgets pass. Previous full lint/default Angular spec failures are baseline and not masked here.
- Chrome + local auth/Firestore/Functions: 16/16 metadata and layout/Business-funnel browser regressions PASS. Covers initial responses, query-free canonicals, schema cleanup during client navigation, auth/report registration, signed-in report/account/pricing layout and accessibility.
- Actual Firebase Hosting emulator: 40 raw/rendered observations recorded; public routes return 200 with correct metadata, private routes stay noindex, unknown probe returns 404, guides remain static. First attempt used an invalid temporary-config root and returned only generic 404s; discarded and rerun with a project-relative config. First backend browser attempt started before Functions output existed; compiled and reran successfully. Those setup failures are not product failures or passes.
- The legacy `src/app/services/seo.service.ts` still contains idea-sharing defaults and raw router URL construction. Actual references lead only to `IdeaDetailComponent`, which is not in current `app.routes.ts`. Current routes initialize `PageMetaService`. **No verified current-route defect is attributable to that legacy service**; retained rather than claiming its dead defaults caused the live failures. Recommend retiring it with the unrouted idea feature in a separate cleanup.
- robots.txt and sitemap returned 200; sitemap contains 6 canonical public URLs. No auth/private/experimental Life route listed. Existing guide JSON-LD parses as Article + BreadcrumbList; no invalid JSON observed. Single-language English pages do not need speculative hreflang entries.

## Verified observations requiring separate action / recommendations

- `www.ifyoumind.com` returns 200 with no redirect in the baseline. Canonicals use the non-www origin. Recommend founder-approved domain redirect configuration; DNS/Hosting domain settings were not changed.
- SPA body content is empty with JS disabled; static guides contain complete article text. Broader body prerender/SSR is a performance/discovery recommendation, not proof Google cannot index the rendered app. Do not call this head-generation change full prerendering.
- Search Console connector returned **zero sites**. Analytics exposed no selected ifYouMind property (only unrelated account summaries, which were not queried). Connector reports Free-plan/account-selection limitations. [Select/reconnect the ifYouMind property](https://app.hypd.ai/sources?utm_source=mcp&utm_content=none_selected) before retrieving impressions, clicks, CTR, coverage, organic conversions and field Core Web Vitals. No baselines invented; keyword volume and ranking opportunity are unmeasured.
- Preserve existing consent/privacy decisions. No analytics configuration, event payloads, purchase tracking, Stripe setup or user-input collection changed. A consent-reviewed organic-to-purchase attribution audit remains a follow-up when the correct properties are accessible.
- Manual screen-reader testing, Search Console URL Inspection/Rich Results validation, field performance and post-deployment checks remain unverified. A valid JSON-LD shape does not establish rich-result eligibility or search visibility.

## Provenance, reproduction and release gate

Google references: [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [sitemap dates/canonical URL guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap). Local findings are based on the linked inventories and repository source, not assumptions from those guides.

Run `npm run test:seo`, `npm run build`, `npm run check:production-bundle`, and `npm run build:local`; use `scripts/audit-seo.mjs BASE_URL OUTPUT_JSON` for raw/rendered inventory. Browser regressions: `e2e/specs/seo-metadata.spec.mjs` and `layout-a11y.spec.mjs` against `demo-ifyoumind` emulators. On local macOS set `QA_BROWSER_CHANNEL=chrome`; CI uses pinned Chromium.

Prepare separate draft PRs for these technical fixes and decision-intent content. #56 remains open for founder review, measurement access and release validation. Merge/deployment require founder approval. After any authorized deployment, record exact revision/run and repeat live raw/rendered, HTTP-status, auth/Business and mobile checks. Rollback: revert the approved SEO commit as a unit (including hosting routing and post-build generation) and run an authorized redeployment; do not partially revert its coupled routing/artifact changes.
