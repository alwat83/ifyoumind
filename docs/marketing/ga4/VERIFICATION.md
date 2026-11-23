# GA4 verification evidence

November 23, 2026 · OpenAI / Codex · native macOS arm64 · Node22.23.2 / Playwright1.56.0 / installed Chrome fallback. Local testing is not GitHub-hosted CI or proof of Google collection.

Candidate branch: `codex/ga4-privacy-measurement`, based on `75afab61209db5f9389c696a6241020dfc1d59e2` / `codex/marketing-asset-launch`. The stacked base keeps previously deployed marketing/AI/consumer work out of this focused PR diff. No master merge or release is authorized. Exact final head and clean-source readbacks are recorded on the draft PR; ignored machine reports remain local.

## Executed checks

| Check | Result | Scope |
| --- | --- | --- |
| `npm --prefix functions test` | 101 PASS | Existing Functions unit tests |
| `npm run test:seo` | 191 PASS | Existing fast web/guards plus17new analytics policy tests |
| Firestore integration command below | 75 PASS | Existing commerce/subscriptions/rules and7new receipt tests, including signed synthetic webhook and concurrent claims |
| `e2e/ga4.config.mjs` | 24 PASS before final banner-height correction; exact-head refresh recorded on PR | Consent/regrant, one tag/page, SPA, payload exclusions, attribution, registration, mocked Checkout, receipt proof, offline CSV/clear at1280/390/320 |
| Four affected existing browser suites below | 28 PASS after banner correction | Public/Free/Starter/Plus/legacyPro, Account, email verification, question/reveal, mock fulfillment/cancellation |
| `npm run build:local` | PASS | Local app plus isolated Discovery |
| `npm run build` | PASS | Production app/guides/SEO plus isolated Discovery; no deployment |
| `npm run check:production-bundle` | PASS |42files, no QA/emulator configuration |
| `node scripts/check-discovery-isolation.mjs --production` | PASS |25appJS/3allowlistedDiscoveryassets, no provider endpoints in private island |
| `git diff --check` | PASS | No whitespace errors |
| Authenticated read-only Hosting baseline | PASS at2026-11-23T17:08:03.700Z | Serving08500dca665abbab FINALIZED;64file hashes and config match retained artifact; manifest041091799b09ac159063df0011ebf2acc5b77869d235d6b8b2dd1f356384deb4 |

Backend integration command (demo-only):

```sh
env GCLOUD_PROJECT=demo-ifyoumind \
  FIRESTORE_EMULATOR_HOST=127.0.0.1:9988 \
  FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9989 \
  node --test --test-concurrency=1 \
  test/commerce.integration.test.mjs test/subscriptions.integration.test.mjs \
  test/intelligence.rules.test.mjs test/ga4-acquisition.integration.test.mjs
```

The new receipt suite is also included in the existing `npm run test:commerce` entry, so it is not orphaned from future CI/local verification. No workflow, dependency or lockfile change.

Browser commands (after a successful local build and emulator startup):

```sh
env GCLOUD_PROJECT=demo-ifyoumind \
  FIRESTORE_EMULATOR_HOST=127.0.0.1:9988 \
  FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9989 \
  QA_FUNCTIONS_EMULATOR_HOST=127.0.0.1:5008 \
  QA_PORT=4307 QA_BROWSER_CHANNEL=chrome \
  node node_modules/@playwright/test/cli.js test --config e2e/ga4.config.mjs

env GCLOUD_PROJECT=demo-ifyoumind \
  FIRESTORE_EMULATOR_HOST=127.0.0.1:9988 \
  FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9989 \
  QA_FUNCTIONS_EMULATOR_HOST=127.0.0.1:5008 \
  QA_PORT=4308 QA_BROWSER_CHANNEL=chrome \
  node node_modules/@playwright/test/cli.js test --config e2e/playwright.config.mjs \
  registration.spec.mjs consumer-pricing.spec.mjs subscription-launch.spec.mjs \
  question-reveal.spec.mjs --workers=2
```

Run browser suites sequentially; fixture teardown asserts no remaining QA users across that demo stack. Do not overlap suites sharing it. Google tag transport/Checkout responses are intercepted locally. No live Google collection, Stripe operation or provider request occurs. Subscription test payment receipts are explicitly emulator fixtures, not revenue or a replacement for the live-payment waiver.

Default emulator ports were already occupied by an unrelated retained verification run, which was preserved. For this run use a temporary **repository-root** config (Firebase13.35.1 resolves resources relative to its config directory and refuses paths outside that directory):

```json
{
  "functions": [{"source":"functions","codebase":"default"}],
  "firestore":{"rules":"firestore.rules"},
  "emulators":{
    "auth":{"host":"127.0.0.1","port":9989},
    "firestore":{"host":"127.0.0.1","port":9988},
    "functions":{"host":"127.0.0.1","port":5008},
    "hub":{"host":"127.0.0.1","port":9940},
    "logging":{"host":"127.0.0.1","port":9950},
    "ui":{"enabled":false},"singleProjectMode":true
  }
}
```

```sh
node node_modules/firebase-tools/lib/bin/firebase.js emulators:start \
  --project demo-ifyoumind --only auth,firestore,functions \
  --config .ga4-emulators.local.json
```

Do not commit that temporary file. Confirm Functions actually load before tests. Stop only this owned emulator afterward. Keep logs/traces ignored/private: Auth emulator diagnostic records contain synthetic verification links/tokens. The test-only existing5008adapter now rewrites local callable fetch URLs before interception, so `route.fetch()` mocks cannot bypass the port map and hit the unrelated default5001stack. No production SDK or source endpoint change.

## Failures found and preserved

- Sandbox local build deadlocked (exit134), and fast-web file-watch check was denied. Native executions with the required local process/socket permissions passed; original logs retained. Existing Discovery SCSS budget warnings remain, not failures.
- First temporary config under `test-results/ga4/` made CLI13.35.1 resolve absolute paths under that directory: Functions did not load. Relative `../../` paths were then correctly rejected as outside the config project. Corrected root config loaded actual Functions/rules. Initial checkout3fail and broad10pass/18fail fixture runs are diagnostic failures, not qualified results.
- Early consent browser run12pass/9fail included the local emulator warning intercepting controls and a real asynchronous checkbox regrant race. New native-checkbox handling fixed the race. Only the emulator-only warning is hidden in dedicated GA4 accessibility screens; no product assertion was relaxed.
- The first extended Checkout run2fail/1pass had in-flight request handlers closed by navigation and a concurrent-suite cleanup conflict. Waiting for actual network completion and running suites sequentially fixed it. No entitlement/payment assertion was weakened.
- The extended affected browser run26pass/2fail found a genuine fixed-banner overlap over the bottom “Create a free account” link. The banner now reserves its measured height with a ResizeObserver, releases it on dismissal and cleans up observers/subscriptions. Re-run28/28passes without forcing clicks or accepting consent on behalf of the visitor. Both earlier interrupted diagnostics and final failing run remain local; none is relabeled a pass.

## Coverage limits / release disposition

Automated axe, keyboard navigation, focus, overflow, reject/manage/withdrawal and widths320/390/1280are covered in the new suite; existing pricing checks also cover820/1440. No new motion is introduced. Actual pending/accepted desktop/mobile screenshots are linked in the main runbook; no Linux baseline was updated.

Physical Safari/iPhone, spoken VoiceOver, pinned Linux pixels, outside-human comprehension, consent across every browser storage mode and real Google collector/Realtime/DebugView are **NOT VERIFIED**. Full unrelated sensitive/transaction-transport suites were not rerun; historical Firestore recovery evidence is preserved and not resolved by75targeted passes. Branch protections/workflows were not changed, and hosted CI is not claimed. The public subscription gate remains closed; payment tests are synthetic and the live-payment exception remains unverified rather than passed/failed.

**GO for focused draft founder review. NO-GO for live tracking activation:** Enhanced Measurement is stillON, productionflagOFF, new callable not deployed. Founder authorization, saved admin readback, exact activation build/deployment, and consented collector verification remain separate gates. Stripe/AI/auth/allowances/prices/enrollment and frozen production artifacts are unchanged by this assignment.
