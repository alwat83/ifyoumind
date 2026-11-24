# GA4 URL privacy repair — local review only

November 23, 2026 PST · OpenAI / Codex · branch `codex/ga4-url-privacy-repair` · implementation **c28fa8bd52b7e27fead59b56033f15fde40f60d7**. Based on PR129 rollback-evidence **cce90dc1**, not master. [Draft corrective PR130](https://github.com/alwat83/ifyoumind/pull/130), stacked on PR129. No merge or analytics redeployment authorized/performed.

## Production is restored

Founder-authorized Hosting-only rollback: **08500dca665abbab FINALIZED**, release **1795476390936000**, **2026-11-23T23:26:30.936Z**. [Independent rollback and public smoke](hosting-rollback.json). All64files/config match; all35Functions unchanged, including `claimverifiedpurchase-00001-jul`; pricing, enrollment, AI, billing, customer data and security rules untouched. Six public marketing JPEGs match. Homepage finding/evidence, pricing and private Discovery example/clear/CSP/no-post-load-network pass; zero Google traffic observed. Static scan of30restored JS/HTML entries finds zero occurrences of G-NRT31062LW. Original failed release and all frozen files/archives are retained unchanged.

## Confirmed cause and bounded correction

The app put sanitized page fields and `send_page_view:false` into the destination-scoped `config` command, then updated fields before manual events. The currently served Google tag nevertheless initializes a destination and emits an automatic first pageview using document defaults before those scoped settings protect that first hit. This is reproduced without Angular in a network-blocked replay, even **when no manual pageview is sent**. The captured tag's resource starts destination handling on `gtm.init`; do not extrapolate to every Google tag/version or blame Enhanced MeasurementOFF without evidence.

| Offline control, same captured public tag | Observed collector payload |
| --- | --- |
| Original initialization + manual event | One pageview with full synthetic query / document title |
| Original initialization, no manual event | Still one automatic pageview with full synthetic query / document title |
| Global defaults before initialization + manual event | One pageview with query-free canonical URL / fixed title |
| Global defaults before initialization, no manual event | Zero pageviews |
| Diagnostic-only duplicate-config flag change | Still leaked document values; not a qualified correction |

**Implementation:** set the existing privacy/page/cookie/ad options as global defaults **before** `gtag('js',...)`, then reuse the same options for `config`. Keep event-level sanitized fields and `send_page_view:false`. No document/URL rewriting, request monkey-patching, custom proxy, remote Google change, new dependency or backend modification is shipped. The only runtime diff is the initialization ordering in `src/app/services/analytics.service.ts`.

Google documents [global/config/event parameter scopes](https://developers.google.com/tag-platform/gtagjs/reference) and [explicit manual pageviews with automatic views disabled](https://developers.google.com/analytics/devguides/collection/ga4/views). Those documents explain the supported API; the specific early-initialization behavior and correction above come from the replay, not an inferred universal provider bug.

## Verification and original failures

- Isolated local production build PASS; output `dist/ifyoumind-ga4-privacy-repair/`, never substituted into frozen packages. Existing SCSS budget warnings retained.
- Exact committed implementationc28fa8bd: **194fast web tests PASS**, including3new tests of the actual browser adapter extracted with TypeScript (not a copied implementation). **20focused adapter/policy tests PASS** overlap this194total.
- **Nine distinct offline browser cases have passing observations across1280/390/320**, covering actual vendor serialization, pending/granted/stored/rejected/withdrawn consent, canonical URL/title, SPA views, example/evidence events/deduplication, provider failure and accessibility/overflow. This is combined coverage, **not a claim of a single clean nine-case run**. The preserved initial run had4pass/2fail/1interrupted/2notrun; focused desktop-stored and mobile-navigation reruns passed, then all3narrow cases passed. No privacy, event-count, deduplication or accessibility assertion was relaxed; automatic test retries remain0. Earlier missing-event/navigation timing failures remain a repeatability limitation, not erased or relabeled.
- New browser regression run against the untouched frozen297efc22artifact **fails as expected** at its raw-query/document-title assertion. This negative control proves the real serialization failure is detected; the old mocked-tag probe did not exercise it.
- The initial sandboxed build aborted134 before output; normal-access isolated build passed. Initial fast suite190pass/1file-watcher-fail; normal-access watcher suite8pass and full191pass, then194pass with new tests. First transport launch preceded completed build; the first fixture also assumed a nonexistent Privacy-page Pricing link. Corrected to the existing Back to home path, without UI/assertion changes. Original local diagnostics retained.
- No fresh Functions/emulator/commerce suite or hosted CI claimed: no backend/billing/security-rule diff; all35deployed services independently unchanged. PhysicalSafari, spokenVoiceOver, Linux pixels and human comprehension remain untested.

### Replay boundary

Public Google script fetched once for offline analysis at **2026-11-23T23:27:48.152Z**,480479bytes, SHA256 **e2c32f0ef35c04567b06cde952b9a82357a6489f961e58a71cacf9ef127c9c47**. It is ignored local evidence, not committed/vendor-shipped. Every application response is fulfilled from local build files. Google collect requests are intercepted and answered locally204; all other requests are aborted. No original questions, customer data, provider generation or live analytics collection was used during correction testing. Payload observations exclude provider-assigned client/session identifiers, cookies and headers.

The new replay gate requires an explicit local `GA4_REPLAY_TAG` file and fails to start if absent; it does not silently substitute a mock, download a tag or call Google. The tag is dynamic and may change; a future release needs a fresh reviewed capture and a separately authorized bounded live check. The captured instance is evidence, not a promise of future provider behavior. GA delivery remains best effort; receipt-claim undercount and Stripe financial authority remain unchanged.

### Reproduction

Use existing Node22/dependencies/installed Chrome; no paid runner or new system installation:

```sh
node node_modules/@angular/cli/bin/ng.js build --configuration production \
  --output-path dist/ifyoumind-ga4-privacy-repair
node --test test/ga4-browser-port.test.mjs test/ga4-policy.test.mjs
node scripts/web-tests.js
QA_BROWSER_CHANNEL=chrome \
GA4_REPLAY_TAG="$PWD/test-results/ga4-release/google-tag-private.js" \
PLAYWRIGHT_JSON_OUTPUT_NAME="$PWD/test-results/ga4-release/transport.json" \
node node_modules/@playwright/test/cli.js test --config e2e/ga4-transport.config.mjs
```

The tag path is the explicitly captured public script above; no credential is needed or permitted. An external capture is read-only public JavaScript retrieval, never permission to send test events. For the expected-negative control only, set `GA4_REPLAY_ROOT=test-results/ga4-activation/hosting-297efc22/public` and select desktop/`vendor initialization`; failure is expected. Preserve that result separately from positive runs.

## Impact and release boundary

| Surface | Disposition / evidence |
| --- | --- |
| Analytics startup | Change Required: global privacy defaults before provider initialization |
| Homepage, evidence, pricing and registration | Verify Only: shared transport; no rendered UI/input/auth/commercial change;194fast tests / offline journeys |
| Private Discovery | Verify Only: same files/CSP, rollback public example/clear/no network |
| Reports, saved decisions, Account, Business | Not Affected implementation: no route, data, entitlement or generation change; analytics policy still maps IDs to fixed categories |
| Billing, Stripe, enrollment, AI, rules, customer data | Not Affected implementation: no code/config/write; all35Functions unchanged after rollback |
| Mobile/a11y | Verify Only:1280/390/320;axe serious/critical and overflow checks; no visual or motion change/baseline update |
| Operations | Change Required documentation/tests only; original artifact, manifests, workflows and protection settings unchanged |

**GO for local correction review; NO-GO for analytics redeployment.** No new Hosting release package prepared. The branch still inherits the earlier activation flag; an unmerged local build does not enable production. Do not deploy/merge it based on the previous artifact authorization. The website now serves the original untracked version. Nextthree: review the small correction and preserved replay repeatability limits; prepare a new exact artifact only when authorized; separately approve and perform bounded live collector/Realtime verification before accepting marketing measurements. No real purchase required or requested. No new paid service/GitHub/provider spend; normal rollback/Hosting usage charges unmeasured. QA is not traction or revenue.
