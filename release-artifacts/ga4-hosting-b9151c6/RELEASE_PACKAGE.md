# GA4 Hosting-only candidate — GO/NO-GO package (November 26, 2026)

Prepared by Claude Code (Anthropic) in a cloud session. **Not deployed.** Production deploy needs explicit founder GO.

## Decision
- **Verification: GO** for a Hosting-only deploy of this artifact.
- **Production: NOT AUTHORIZED** yet. This session has no Firebase/Google credentials, so a credentialed deployer must also do the pre-deploy readback below.

## Exact refs
- Tested source: `b9151c64b602e29b0ba98fd8b256b5d618e722d1` (PR #130 HEAD, branch `codex/ga4-url-privacy-repair`). Fix: `c28fa8bd`. Stacked on #129 `cce90dc1`. Master `6dcffca4` is **not** the base.
- Live source (per repo record of PR #127 release): `a71cad822e40515b7e9f56ee926762ae53fd73e3`, Hosting `08500dca665abbab`, release `1795476390936000`.

## Artifact
- `hosting-browser.tar.gz` SHA256 `bce0999643b447a629591e341de1c53a3311e9456a7e04c553876cf484c4e147` (deterministic tar, 66 files, 1.8 MB).
- `MANIFEST.sha256` SHA256 `be3fb6822feac3f01b507ee314c27743010a45fddbba6f6ed11b1ced01e5cbda`. Extract → `sha256sum -c` passed 66/66.
- Built with `npm run build` (preflight, sitemap, guides, SEO pages, `/discover/` island). The handoff's plain `ng build` gives only the 64-file app shell, which is **not** the deploy artifact. Main-app JS/CSS is byte-identical between the two builds, so the transport suite tested the shipped code.
- Filename hashes differ from Codex's builds even where content is identical, so **deploy this tarball; do not rebuild**.

## Tests run Nov 26 on the exact HEAD
| Check | Result |
|---|---|
| `npm ci`, production build, full `npm run build` | PASS (existing SCSS budget warning only) |
| `node scripts/web-tests.js` | 194 pass / 0 fail / 0 skip |
| `node --test test/ga4-browser-port.test.mjs test/ga4-policy.test.mjs` | 20 / 20 (overlaps the 194) |
| Real-tag transport suite (`e2e/ga4-transport.config.mjs`), 3 cases × 1280/390/320 | **9/9 in one clean run, 0 retries, assertions unchanged** |

Transport run details:
- First attempt: 9/9 failed with a browser-launch error. Playwright 1.56 expects Chromium build 1194; build 1243 is installed. No privacy assertion ran.
- Rerun: a scratch wrapper config set only `launchOptions.executablePath=/opt/pw-browsers/chromium` (Chrome for Testing 158). The spec was not edited.
- Tag capture: fresh public `gtag/js?id=G-NRT31062LW` at 2026-11-26T19:08:52Z, 480,449 B, SHA256 `288c9555c906fcded854319a51116e4c58548b63dfbd06f5d43f74ce8ebbdcbe`. This is a newer Google build than the Nov 23 capture (`e2c32f0e…`, 480,479 B). It is kept outside Git.
- Observed payloads: every `page_view` used only the canonical URL and the reviewed title (`/privacy-policy|Privacy policy`, `/|Explore examples`, `/pricing|Pricing`). There were no query strings, no raw document title and no early automatic hit.
- The stored-grant run sent only `page_view`, `free_tax_example_viewed` and `evidence_revealed`.
- Reject and provider-failure runs sent zero hits.
- Every request outside the app was aborted locally (fonts.gstatic.com, apis.google.com). No real collector traffic.

## Comparison of the full artifact with live production (public read-only, Nov 26)
- Live still serves the Nov 23 rollback content: root `last-modified` is Nov 23 00:05 GMT. Headless load of `/` and `/pricing` made **zero Google requests**.
- Live `main` still bundles the old `@angular/fire/analytics` code and `G-DZMLBPS4ZX`, but it sends nothing.
- 26 files are byte-identical. They include the 6 marketing JPEGs, the images, the fonts and 5 guide pages, and `/404`.
- `/discover/` and polyfills have byte-identical content and only new filename hashes.
- Changed by design: the root app bundles and the HTML pages that reference them (`/`, pricing, privacy-policy, sample-report, terms, app-shell).
- App source diff from the live source to HEAD covers 27 files. All of them are GA4 consent-stack work from PR #128/#129 plus the fix:
  - analytics policy and service
  - cookie banner and preferences
  - privacy-policy text
  - registration, checkout and verified-purchase analytics hooks, which call the existing `claimVerifiedPurchase`
  - removal of the old Firebase Analytics provider and `measurementId`
- Since #129 head, the only source change is `analytics.service.ts` (+5/−1).
- `firebase.json` (Hosting headers, redirects, rewrites and CSP), `firestore.rules`, `storage.rules` and indexes are **unchanged** from the live source.
- The `functions/` diff (`acquisition-measurement.ts`) does **not** ship with a Hosting-only deploy.

## Founder-run deploy (after explicit GO, credentialed shell, never via a master merge)
**Warning:** a master push runs `.github/workflows/firebase-production.yml`. It deploys Hosting plus rules, storage and about 30 Functions. Do not merge #128, #129 or #130 to master as the way to release this.
```bash
# 1. Pre-deploy readback: abort unless live = 08500dca665abbab, 35 Functions/claimVerifiedPurchase-00001-jul unchanged, enrollment OFF, Enhanced Measurement OFF
#    (Hosting REST sites/ifyoumind-473fe/channels/live/releases?pageSize=1, as used Nov 23)
# 2. Stage exact artifact
rm -rf dist/ifyoumind-deploy/browser && mkdir -p dist/ifyoumind-deploy/browser
tar -xzf release-artifacts/ga4-hosting-b9151c6/hosting-browser.tar.gz -C dist/ifyoumind-deploy/browser
(cd dist/ifyoumind-deploy/browser && sha256sum -c ../../../release-artifacts/ga4-hosting-b9151c6/MANIFEST.sha256)
# 3. Hosting only
firebase deploy --only hosting --project ifyoumind-473fe
```
- **Rollback:** create a release from version `08500dca665abbab` on the live channel. Use the same `releases.create` method as Nov 23, or `firebase hosting:clone ifyoumind-473fe@08500dca665abbab ifyoumind-473fe:live`.
- **Post-deploy:** do a bounded live consented check with a synthetic marker. Confirm the canonical `dl`/`dt`, no early hit, zero hits on reject, and that withdrawal stops collection. Confirm GA4 Realtime or DebugView receives the hits. Roll back immediately on any privacy failure.

## Residual risk / not verified here
- No authenticated readback was done today of the Hosting version, the 35 Functions, the enrollment flag or GA4 Enhanced Measurement.
  - The SPA runs saw no duplicate or automatic events with today's served tag config. This fits Enhanced Measurement being OFF, but it is not an admin readback.
- Hosted CI on #130 HEAD was not run.
- No physical Safari or VoiceOver testing.
- No checks against real payments or customer data.
- The candidate replaces the old inert Firebase Analytics code in the live `main` bundle. That is intended and is a reduction.
