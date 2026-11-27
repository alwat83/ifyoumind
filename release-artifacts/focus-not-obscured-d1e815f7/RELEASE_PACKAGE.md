# Keyboard focus clear of the consent banner (WCAG 2.2 SC 2.4.11): Hosting-only release candidate

**Status: prepared, NOT deployed.** Production deployment needs an explicit founder GO. Separate from PR #133 and issue #135.
**Provider/agent:** Anthropic / Claude Code, local session. Prepared 2026-11-27.

## Exact refs
- **Source:** PR [#134](https://github.com/alwat83/ifyoumind/pull/134) head `d1e815f774eefbddc3ad67412d5603b85c69a37b`. This is fix `08f46ece` merged non-destructively onto the deployed #132 source.
- **Release branch:** `claude/release-focus-d1e815f7`.
- **Production baseline:** Hosting `e0240db8dd77d42a`, release `1795749887100000`, source `4aab384e`.
- **Source diff against production:** 3 files.
  - `cookie-consent-banner.component.ts` now publishes the banner's measured height as `--consent-banner-height`, and resets it to 0 when the banner closes.
  - `styles.scss` adds `html { scroll-padding-bottom: var(--consent-banner-height, 0px) }`.
  - `e2e/analytics-activation-specs/consent-focus.spec.mjs` is the new regression spec.
- **No conflict** with the deployed #132 banner CSS: #132 changed the banner SCSS, and this changes the banner TS.
- **Unchanged:** `firebase.json` (`49d17f6d…`), lockfile, rules and Functions.

## Artifact
| File | SHA256 |
|---|---|
| `hosting-browser.tar.gz` (66 files, 1,822,380 bytes) | `304c82f35cc3eaff1fb95611460ba9223fd92e630535dcf53f9e792b6465075f` |
| `MANIFEST.sha256` (66 entries) | `d9a9bf13ba56138c852b8a5ec901c5a1661874a3dc65db75b9b452c23973368c` |

**Reproducible:**
- A clean rebuild at `d1e815f7` is byte-identical to the tested build.
- The deterministic archive gives the same SHA256 from either build.
- The extraction round trip passes 66/66 with safe paths.

**Against production `e0240db8`:**
- 58 files are byte-identical, including the GA4 adapter and policy (`chunk-GSGNH4XD.js`), consent and withdrawal (`chunk-2L4EOUXU.js`), the landing chunk and all of private `/discover/`.
- Changed: `main-TMZOUWLA.js` → `main-PP7HSBGS.js` and `styles-GT4QWZLJ.css` → `styles-HUXHVJFI.css`.
- 6 HTML pages differ **only** in those two names plus the one inlined critical-CSS declaration `scroll-padding-bottom:var(--consent-banner-height, 0px)`.

## Verification
| Check | Result |
|---|---|
| Hosted QA [run 45934856587](https://github.com/alwat83/ifyoumind/actions/runs/45934856587) on `d1e815f7` (Java 21 emulators) | **252 passed / 14 failed.** `ga4.spec` 28/28, including "pending consent never obstructs registration…" and "preferences support keyboard focus…". The 14 failures are identical to the control on the deployed source ([run 45929693032](https://github.com/alwat83/ifyoumind/actions/runs/45929693032)): stale `visual-journeys` baselines. Not caused by this change; snapshots untouched |
| Build | PASS (same 12 existing budget warnings) |
| Fast web tests / GA4 unit tests | 194/194, 20/20 |
| New `consent-focus.spec.mjs` | 5/5 on the candidate. **Fails 3/5 on current production** (390×664, 375×553, 320×568) |
| Registration tab sweep, 7 short viewports (414×715 … 320×460) | **Production: 11 tab stops fully hidden** (Email, Password, "Create free account", "Continue with Google"). **Candidate: 0.** Every stop fully visible |
| Production-hostname consent spec + consent-layout spec | 3/3, 5/5 |
| Real-tag transport suite | 9/9 |
| Offline consent flows at 375×553, 320×568 and 390×664 | 42/42 |
| `visual-home` | 18/18 |
| First view, banner pending | Geometry identical to production at 9 viewports; screenshots byte-identical at 1280×800, 390×664, 375×553 and 320×568 |
| Banner dismissed | 18/18 full pages pixel-identical to production |

**What the checks cover:**
- Consent wording, buttons, defaults, storage and analytics are unchanged.
- No new tracking.
- Accessibility semantics (roles, labels, focus order, focus outlines) are unchanged. Only the scroll position on focus changes.
- The Wow design is unchanged at rest.

**Limitation:** verified in Chromium. `scroll-padding` is supported in Safari, but focus scrolling hasn't been checked on a physical iPhone.

## Read-only production preflight (2026-11-27T03:40:36Z), all PASS
- Live: release `1795749887100000`, version `e0240db8dd77d42a`.
- 35 Functions, 0 changed.
- Enrollment fingerprint `65c3faa285` on the same 5 functions.
- Discovery CSP hash unchanged.
- Repeat all of this, plus the founder's Enhanced Measurement OFF confirmation, immediately before any deploy.

## Deploy instructions (only after founder GO)
Use an isolated worktree of `claude/release-focus-d1e815f7`. Never deploy from `codex/fred-economic-indicators`.

```bash
# 0. Founder re-confirms Enhanced Measurement OFF in GA4 Admin.
# 1. Preflight: live = e0240db8dd77d42a; 35 Functions unchanged; enrollment fingerprint 65c3faa285; headers/CSP present.
shasum -a 256 firebase.json                     # 49d17f6d…
A=release-artifacts/focus-not-obscured-d1e815f7
shasum -a 256 $A/hosting-browser.tar.gz         # 304c82f3…
rm -rf dist/ifyoumind-deploy/browser && mkdir -p dist/ifyoumind-deploy/browser
tar -xzf $A/hosting-browser.tar.gz -C dist/ifyoumind-deploy/browser
(cd dist/ifyoumind-deploy/browser && shasum -a 256 -c ../../../$A/MANIFEST.sha256)   # 66/66 OK
firebase deploy --only hosting --project ifyoumind-473fe   # once; no rebuild
```

**Post-deploy checks (synthetic data only):**
1. The new version is FINALIZED and 66/66 served files match.
2. 35 Functions unchanged. Headers and Discovery CSP intact.
3. Live registration tab sweep at the 7 short viewports shows 0 hidden focus stops.
4. Live CTA geometry is unchanged from `e0240db8`.
5. The 21-check production privacy suite passes.

## Rollback plan
- **Trigger:** any integrity, privacy or consent, focus or CTA regression.
- **Action:** `firebase hosting:clone ifyoumind-473fe@e0240db8dd77d42a ifyoumind-473fe:live`, or Hosting REST `releases.create` with that version.
- **Verify:** version, hashes and headers.
- **Further fallbacks:**
  - `d47dcec2093b625f`: GA4 without the mobile CTA fix.
  - `08500dca665abbab`: pre-GA4, only if GA4 itself must be removed.

## Recommendation
**GO for the founder to authorize this Hosting-only release.** It fixes an existing WCAG 2.2 AA failure that remains in production after #132, with no visual, consent, privacy or configuration change.

Outstanding, not blocking:
- GA4 Realtime event-level confirmation is still pending.
- PR #133 is unreleased until a post-layout baseline exists.
- Issue #135 is awaiting review.
- The CI visual baselines need separate maintenance.
