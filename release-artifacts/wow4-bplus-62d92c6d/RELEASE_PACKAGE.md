# Wow 4.0 B+ statement-check homepage: Hosting-only release candidate

**Status: prepared, NOT deployed.** Production deployment needs a separate, explicit founder GO. Nothing has been merged to `master`.
**Provider/agent:** Anthropic / Claude Code, local session. Prepared 2026-11-27.

## Exact refs
| | |
|---|---|
| Source (frozen) | PR [#136](https://github.com/alwat83/ifyoumind/pull/136) head `62d92c6dd87c56fdd59e785746ca5d8d817d7d1e` |
| Release branch | `claude/release-bplus-62d92c6d`. It is the frozen source plus this folder only (documentation and the package). |
| Production baseline | Hosting `f0250d10c22751a7`, release `1795757265775000`, source `abb82dd0` |
| Unchanged from production | `firebase.json` `49d17f6d…` (headers and CSP), `package-lock.json`, `package.json`, rules, `functions/` |

## Artifact
| File | SHA256 |
|---|---|
| `hosting-browser.tar.gz` (82 files, 5,151,959 bytes) | `65cb3ebacb7ce4fb71503150ae8eafe5e5d366c9bb1cfb2a4981f763b06483e4` |
| `MANIFEST.sha256` (82 entries) | `bca9c3c5b2431248aeee7439a2bb3482ea3bd3b8f5a040566befff84f5d4e815` |

**Reproducible:**
- Two clean `npm run build` runs of `62d92c6d`, in separate pristine worktrees, are byte-identical.
- Packing either build gives the same archive SHA256 (sorted entries, fixed mtime, owner and mode, gzip mtime 0).
- The extraction round trip passes 82/82 with no absolute or `..` paths.

**Against live `f0250d10` (every live file fetched and hashed):**
- **Control:** a clean rebuild of the production source `abb82dd0` matches live in all 82 files once esbuild's hashed file names (`chunk-`, `main-`, `polyfills-`, `styles-` plus 8 characters) are normalized.
- **Why normalize:** today's toolchain assigns different hash names to byte-identical content. For example, the polyfills are identical bytes but named `5CFQRCPP` live and `QXHPFLGO` now.
- **Candidate:** 81 of 82 files are content-identical to live, including the global CSS, the GA4/consent chunks and all of private `/discover/`. The only content change is the landing chunk: live `chunk-NMNSSR6T.js` (contains "Reveal what changed") becomes `chunk-FPARATVZ.js` (contains `statement-check`).
- **Social assets:** all 22 hosted files under `assets/marketing/` are byte-identical to live, including the public `manifest.json`, the Nov 24 carousel and Story, the Dec 1 "Guess the line" carousel and the Dec 3 Reel. Only the repository's `.gitkeep` placeholders are absent from both.

## Verification
| Check | Result |
|---|---|
| Hosted QA on exact head `62d92c6d` ([run 46024575457](https://github.com/alwat83/ifyoumind/actions/runs/46024575457), Java 21 emulators) | **252 passed / 14 failed.** All other CI steps pass: Functions, rules, organization, commerce, QA-fixture, discovery and unified suites, builds and isolation guards. |
| Hosted QA control on the production source `abb82dd0` ([run 46023828620](https://github.com/alwat83/ifyoumind/actions/runs/46023828620)) | **251 passed / 15 failed:** the same 14, plus `session.spec`. |
| Unit tests (non-emulator) | 194/194 (base: 194/194) |
| `test:discover` (integrated Hosting + unified) | 84/84 |
| GA4 activation suite (real tag replayed) | 21 passed, 24 skipped (project-scoped). 3 failures in `google-transport … consent can be withdrawn`, which also fail on the production build in a control run. Pre-existing. |
| `consent-layout` | 7/7 phone sizes. All three statements are fully above the pending banner with ≥24 px clearance and ≥44 px height, hit-tested at the centre and both ends. |
| App QA, 8 viewports, real banner | Statement clearance 59–245 px. Targets ≥44 px (48–52 px on tall or desktop). Example buttons ≥118×44. No overflow. 0 Google requests before a choice. |
| Keyboard / screen reader / motion | Focus stays on the statement with a 3 px outline. `aria-expanded`/`aria-controls`. Polite status "<verdict>. <finding>". Reduced motion: no animation. |
| axe (WCAG 2.0/2.1 A+AA) | 0 violations at 1280×800 and 390×664 |
| GA4 semantics (real tag replayed) | Allow: 1 `page_view`, nothing else on load. `free_tax_example_viewed` ×1. `free_electricity_example_viewed` ×1. `evidence_revealed` ×1. No new event names. Reject or pending: 0 Google requests. |
| Read-only production preflight (2026-11-27T15:22:44Z) | Live `f0250d10c22751a7` PASS. 35 Functions, 0 changed. Enrollment fingerprint `65c3faa285` on 5 functions. Headers PASS. Discovery CSP `ee8df606908ccf85` |

Screens: `screens/compare-{1280x800,390x664,375x553,320x568}.jpg` show live | B+ before a choice | B+ after the first statement, all with the pending banner.

## Decisions recorded
1. **Wow 4.0 supersedes the Nov 20 "Reveal what changed" CTA decision.** That AGENTS.md founder selection said to keep the "Reveal what changed" button. The founder's Wow 4.0 B+ selection (2026-11-27) replaces it with the statement check as the first action. Everything else that decision protected is kept: the question-led example, Midnight Slate, evidence before the private CSV continuation, reduced motion, and the bill/city promise line. AGENTS.md must be updated when this is merged.
2. **PR #133 stays separate and unreleased.** B+ supersedes it as the next hero release. Its sentence could replace B+'s `hero-promise` line in a one-line follow-up if wanted. Do not release both.

## Analytics measurement discontinuity
No events were added, renamed or removed, but two definitions shift. Treat the B+ release time as a **breakpoint** and annotate it in GA4. Compare pre and post as separate periods, and don't join them into one trend.

| Event | Fired before (live) | Fires with B+ | Effect on rates |
|---|---|---|---|
| `free_tax_example_viewed` | "Reveal what changed" click, the "Property taxes" button, or a `?example=tax` / `#business` deep link | First tax statement checked, the "Property taxes" button, or the same deep links | The first action is now a choice between three statements, not one generic button. "Homepage → example viewed" measures a different gesture, so a change in rate is a design effect, not a like-for-like comparison. |
| `free_electricity_example_viewed` | "Electricity bills" button or deep link | Same | Comparable |
| `evidence_revealed` | Opening "Show the evidence" | Opening "Show the evidence" (unchanged) | Each statement check now shows its cells and calculation inline **without** firing this event, so the rate may fall because people see evidence without opening the disclosure. A fall is not a regression signal. |
| Cities | No event | No event | Unchanged |

**Not measurable without new tracking (which needs separate review):**
- which statement was chosen, or the verdict seen;
- city engagement.

The post-fix baseline in the measurement guide (from 2026-11-27 04:20:46 UTC) ends at the B+ release.

## Deploy instructions (only after founder GO)
Use an isolated worktree of `claude/release-bplus-62d92c6d`. Never deploy from `codex/fred-economic-indicators`. Run everything once, with no rebuild.

```bash
# 0. Founder re-confirms Enhanced Measurement OFF in GA4 Admin.
# 1. Read-only preflight. Expect: LIVE f0250d10c22751a7 PASS, FUNCTIONS 35 changed [] PASS, ENROLLMENT PASS, HEADERS PASS, CSP ee8df606908ccf85
bash smoke/preflight-bplus.sh f0250d10c22751a7 /tmp/pre
shasum -a 256 firebase.json                                   # 49d17f6d0f9671f2509586d22beaf4e1fffd9905089cbbd0b7522ff90de9002f
A=release-artifacts/wow4-bplus-62d92c6d
shasum -a 256 $A/hosting-browser.tar.gz                       # 65cb3eba…83e4
rm -rf dist/ifyoumind-deploy/browser && mkdir -p dist/ifyoumind-deploy/browser
tar -xzf $A/hosting-browser.tar.gz -C dist/ifyoumind-deploy/browser
(cd dist/ifyoumind-deploy/browser && shasum -a 256 -c ../../../$A/MANIFEST.sha256)   # 82/82 OK
firebase deploy --only hosting --project ifyoumind-473fe
```

## Post-deploy smoke (synthetic only)
Run from the Playwright tools directory.
1. **Version and files:** the new version is FINALIZED. All 82 served files match `MANIFEST.sha256`, including the 22 social files and `assets/marketing/social/manifest.json`.
2. **Configuration:** `smoke/preflight-bplus.sh <newVersion>` shows 35 Functions unchanged, enrollment unchanged, headers PASS and Discovery CSP `ee8df606908ccf85`.
3. **Homepage:** `node smoke/bplus-app-qa.js LIVE <out> axe.min.js` runs with consent never granted and every Google request aborted, so it can't send analytics. It checks:
   - all three statements clear the real banner at 8 viewports;
   - tap → verdict;
   - keyboard;
   - axe 0;
   - 0 Google requests.
4. **Privacy:** `node smoke/live-privacy.js <out>`, the existing 21-check production privacy suite. Its only change is that the homepage check now looks for the first statement instead of "Reveal what changed".
5. **Deep links:** `/?example=electricity#business` opens the first electricity check.

## Rollback
- **Trigger:** any integrity, privacy or consent, layout, accessibility or analytics regression.
- **Action:** `firebase hosting:clone ifyoumind-473fe@f0250d10c22751a7 ifyoumind-473fe:live`, or Hosting REST `releases.create` with version `f0250d10c22751a7`.
  - This restores the "Reveal what changed" homepage with all social assets intact.
- **Verify:** the version, 82/82 hashes against the live mirror (`live-f0250d10.sha256`), headers and CSP.
- **Code:** revert PR #136's commits. The change is confined to the landing component, its example data module and specs.
- **Note:** visitors with an open old tab may fail to lazy-load a removed chunk until they reload. This is the same as every previous app release.

## Final QA: failure classification
| Failure | Exact head `62d92c6d` | Production `abb82dd0` | Class |
|---|---|---|---|
| `visual-journeys` ×7 tests × desktop and mobile (homepage, registration, pricing, sample, workspace, decision, local tax) | fail | fail | **Outdated visual snapshots.** Page heights differ and 73–97% of pixels differ on pages B+ does not touch. The homepage snapshot will also legitimately change with B+. Snapshots were **not** refreshed; this needs a separate baseline-maintenance PR on Linux. |
| `session.spec` "signed-in readers can go home…" | pass | fail | **Flaky.** It failed on production and on the first B+ run, and passed on `bff8fcd6` and `62d92c6d`. Pre-existing and unrelated (session and auth). |
| `google-transport` "…consent can be withdrawn" ×3 (local) | fail | fail | **Pre-existing harness limit** in the local replay, identical on the production build. |
| New B+ regressions | none | – | – |

**Earlier B+ issues, fixed:**
- `bff8fcd6`: a new spec's no-text-input check was scoped to the whole page and matched an input outside the example card. It is now scoped to the card.
- `62d92c6d`: a code comment containing "visible" made Tailwind add an unused `.visible` rule to the global CSS. It was reworded; the global CSS is now identical to production.
