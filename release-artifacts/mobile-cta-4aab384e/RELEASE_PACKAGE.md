# Mobile CTA / consent-banner fix: Hosting-only release package (prepared November 27, 2026)

**Status: prepared, NOT deployed.** Production deployment needs an explicit founder GO.
**Provider/agent:** Anthropic / Claude Code, local session on the founder's machine.

## Exact refs
- **Source built:** `4aab384ecd026fafe147161b03165f73a0025d84`, the PR #132 commit verified in hosted QA. Compared with the deployed source `b9151c64`, the only change is CSS in 2 files:
  - `cookie-consent-banner.component.scss`
  - `public-landing-visual-mobile.component.scss`
- **Release branch:** `claude/release-mobile-cta-4aab384e`, cut from the PR #132 head `8435144a`. Relative to `4aab384e` it adds documentation only, plus this package.
- **Unchanged from production:** `firebase.json` SHA256 `49d17f6d0f9671f2509586d22beaf4e1fffd9905089cbbd0b7522ff90de9002f`, `package-lock.json`, rules and Functions.

## Artifact
| File | SHA256 |
|---|---|
| `hosting-browser.tar.gz` (66 files, 1,822,253 bytes) | `2f68a554ec35624967b63f5c2ca93402364abd975c640cb5d655ad1f2739ada5` |
| `MANIFEST.sha256` (66 entries) | `c24ed36763308e01fd1af4b3d1f295c46b6df752bb5871d9be6a62f0614e5aaf` |

**Provenance:**
- A clean `npm run build` from a pristine checkout of `4aab384e` is **byte-identical, in all 66 files**, to the build that passed the local consent, layout and transport suites.
- The archive is deterministic: sorted entries, fixed mtime, owner and mode, and a gzip mtime of 0. Packing either build gives the same SHA256.
- The extraction round trip passes: 66 regular files, safe paths, 66/66 hashes, nothing extra.
- Dotfiles such as `.gitkeep` are excluded, as Firebase's `**/.*` ignore rule would do.

**Comparison with live production `d47dcec2`:**
- 58 files are byte-identical. They include the GA4 adapter and policy chunk (`chunk-GSGNH4XD.js`), the consent and withdrawal chunk (`chunk-2L4EOUXU.js`), and all of private `/discover/`.
- The main bundle and the landing chunk changed, because the CSS changed: `main-GYRQ7K6J.js` → `main-TMZOUWLA.js` and `chunk-ITIQ24BY.js` → `chunk-NMNSSR6T.js`.
- 6 HTML pages differ **only** in those two file names: `index`, `app-shell`, `pricing`, `privacy-policy`, `sample-report` and `terms-of-conduct`.

## Verification already completed (not repeated)
- **Hosted QA on `4aab384e`** ([run 45928002433](https://github.com/alwat83/ifyoumind/actions/runs/45928002433)): 251 passed, 15 failed, 0 skipped. `ga4.spec.mjs` 28/28.
- **Control run on the deployed source `b9151c64`** ([run 45929693032](https://github.com/alwat83/ifyoumind/actions/runs/45929693032)): 251 passed, 15 failed, with identical suites. The failures are 14 stale `visual-journeys` baselines and one flaky `session.spec` duplicate-link check. **None are caused by #132. Snapshots and unrelated tests were left untouched.**
- **Local results:**
  - Build PASS.
  - Fast tests 194/194.
  - GA4 unit tests 20/20.
  - Production-hostname consent spec 3/3.
  - New consent-layout spec 5/5. It fails on the deployed baseline.
  - Real-tag transport suite 9/9.
  - Offline consent flows 42/42.
  - `visual-home` 18/18.
  - Pixel-identical with the banner dismissed, except the intended `/` hero spacing at ≤600px height.
- **Evidence and screenshots:** `docs/marketing/first-impression/MOBILE_CONSENT_CTA.md`.

## Read-only production preflight (2026-11-27T03:15:26Z), all PASS
- **Hosting:** live release `1795723013497000`, version `d47dcec2093b625f` FINALIZED.
- **Functions:** 35, all ACTIVE, **0 changed** versus the Nov 26 snapshot. `claimVerifiedPurchase` on `claimverifiedpurchase-00001-jul`.
- **Enrollment:** public closed. Empty on 23 functions. The same single-entry allowlist (fingerprint `65c3faa285`) on the same 5 functions.
- **Headers:** `/`, `/pricing` and `/discover/` return 200 with HSTS, nosniff, frame, referrer and permissions headers. `/discover/` carries its strict CSP.
- **GA4:** the GA4 code chunks are byte-identical to production. **Enhanced Measurement can't be read through the API** (the Firebase CLI token gets 403 for scope), so the founder must re-confirm it OFF in GA4 Admin immediately before deploy, as on Nov 26.

## Deploy instructions (only after founder GO)
Run from an isolated worktree of **this release branch**. **Never** deploy from `codex/fred-economic-indicators`: its `firebase.json` lacks the security headers and CSP.

```bash
# 0. Founder re-confirms Enhanced Measurement OFF (property 565380927 / stream 16394318092).
# 1. Re-run the read-only preflight: live = d47dcec2093b625f; 35 Functions unchanged; enrollment fingerprint unchanged.
shasum -a 256 firebase.json   # must be 49d17f6d…
A=release-artifacts/mobile-cta-4aab384e
shasum -a 256 $A/hosting-browser.tar.gz   # must be 2f68a554…
rm -rf dist/ifyoumind-deploy/browser && mkdir -p dist/ifyoumind-deploy/browser
tar -xzf $A/hosting-browser.tar.gz -C dist/ifyoumind-deploy/browser
(cd dist/ifyoumind-deploy/browser && shasum -a 256 -c ../../../$A/MANIFEST.sha256)   # 66/66 OK
# 2. Hosting only, once. No rebuild.
firebase deploy --only hosting --project ifyoumind-473fe
```

**Post-deploy checks (bounded; synthetic data only):**
1. The new release and version are FINALIZED, and all 66 served files match the manifest. HTML is fetched through the `cleanUrls` 301 target.
2. 35 Functions unchanged. Headers and Discovery CSP unchanged.
3. Live CTA geometry with no choice made: the CTA sits fully above the banner at 390×664, 375×553, 360×640 and 320×568.
4. Live consent suite: pending and rejected send zero Google requests, consented hits use the canonical `dl` and fixed `dt`, and withdrawal stops new collection. This is the same 21-check suite used on Nov 26.

## Rollback plan
- **Trigger:** any integrity mismatch, a privacy check failure, an unexpected Functions change, or a CTA or consent regression.
- **Action:** restore the current GA4 release, `d47dcec2093b625f`:
  - `firebase hosting:clone ifyoumind-473fe@d47dcec2093b625f ifyoumind-473fe:live`, or
  - Hosting REST `releases.create` with that version.
- **Verify:** the live version, file hashes and headers.
- `08500dca665abbab`, the pre-GA4 version, is the fallback **only** if GA4 itself must be removed.

## Recommendation
**GO for the founder to authorize this Hosting-only release.** No privacy, accessibility or configuration regression was found.

Open items, kept separate and **not** blocking:
- **PR #134:** WCAG 2.2 SC 2.4.11 focus fix, an existing issue. Next accessibility priority; release it separately.
- **PR #133:** the founder-selected copy. Unreleased until a post-layout baseline exists.
- **GA4 withdrawal-batching wording:** tracked for separate review in [issue #135](https://github.com/alwat83/ifyoumind/issues/135).
- **GA4 Realtime receipt for release `1795723013497000`:** pending founder confirmation.
