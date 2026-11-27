# ifYouMind Instagram campaign: "Guess the line" carousel and product Reel (founder review)

**Status: produced. Awaiting founder approval. Not hosted, not published.**
Publish manifest (with captions, alt text and checksums): [`2026-12-campaign.publish-manifest.json`](2026-12-campaign.publish-manifest.json)

## Carousel concepts
| | Concept | Slide 1 | Verdict |
|---|---|---|---|
| A | "One line did most of it" (explainer: total → breakdown → share → CTA) | Statement | Clear, but easy to scroll past |
| **B** | **"Guess the line" (quiz)** | "This tax bill went up $420. Which line did most of it?" with A County / B School / C Municipal | **Selected.** An open question stops the scroll and invites comments; the answer is only on swipe |

**Slides (1080×1350):**
1. The quiz.
2. "Same home, two years": $4,200 → $4,620, with zero-based bars.
3. The answer, "B. School": +$90 / +$240 / +$90 = $420.
4. 57% of the increase (exact 57.1%), with the limit: "It doesn't mean the bill is wrong".
5. "Find the line that moved", with the `ifyoumind.com` call to action.

Contact sheet: [`2026-12-guess-the-line/contact-sheet.png`](2026-12-guess-the-line/contact-sheet.png)

**Sources and safeguards:**
- Every figure is read from the app's illustrative fixture, and `build.cjs` refuses to render if the fixture drifts.
- Every slide carries "ILLUSTRATIVE EXAMPLE · MADE-UP FIGURES. Not a customer result. Not tax advice or a finding that any bill is wrong."
- No stock or AI imagery. Uses brand tokens, Inter and Instrument Serif.

**Files:**
| File | SHA256 |
|---|---|
| `ifyoumind-2026-12-01-tuesday-carousel-01-3488fe54.jpg` | `3488fe542f5923f45c9b19eab0f9860ddf5bc3f9d1857ea277acc7f92b6dd4c9` |
| `…-02-e3533622.jpg` | `e353362251fe72e72460292dc03c622f616db7f1780e150ed1e410a41d6dd791` |
| `…-03-32f63950.jpg` | `32f639506bbd6330780dc4d2fc1e0459e2de4cb8e73c75ae06c239621ad794fa` |
| `…-04-8e540bd5.jpg` | `8e540bd5f73f9f327476f4c548e8d832cc1855a8fa99675a8f9d37410f0482b4` |
| `…-05-018ae4ec.jpg` | `018ae4ecf5c171478e9d6dbf67d6c5ef7da642bcaa1bf5bbf4e654885e58e919` |

## Product Reel (17.8 s, 1080×1920, H.264 High / silent AAC / 30 fps)
**Footage:** a genuine screen recording of the live site, using the illustrative example, with analytics rejected. The product footage is unaltered; only text overlays were added.

| Time | Footage | Overlay |
|---|---|---|
| 0–3.0 s | Real hero | **Hook:** "$420 more this year. Where did it go?" |
| 3.0–7.2 s | Real finding after one tap | "School taxes: $240 of the $420." |
| 7.2–11.0 s | Real evidence panel | "Every number, with its source." |
| 11.0–14.8 s | Real calculations | "Check the math yourself." |
| 14.8–17.8 s | End card | "Find the line that moved. Explore the free property-tax example. No account needed. ifyoumind.com", plus the disclosure |

Every overlay also carries "Made-up example · not tax advice". All text sits inside the Reels safe zone.

**Files:**
| File | SHA256 |
|---|---|
| `2026-12-product-reel/ifyoumind-2026-12-03-thursday-reel-d607738f.mp4` | `d607738fd89275f14d79895f5e4cca27291a8ebfb8f9a526fd6f3e3646777546` |
| Cover (1080×1920), `…-thursday-reel-cover-91fcf692.jpg` | `91fcf692ecba4b833a3d996a874afcd175821aeb25c6930f055608f7b391b355` |

Review sheet: [`2026-12-product-reel/review-contact-sheet.png`](2026-12-product-reel/review-contact-sheet.png)

Captions, hashtags and alt text are in the publish manifest.

## Publication path (after approval)
1. The founder approves or edits the creative and captions.
2. Host the files under `assets/marketing/social/instagram/{carousels,reels}/` using the static-asset workflow (`PUBLISHING.md`), with a fresh preflight and live-file integrity checks.
3. Add the posts to the live `manifest.json` as `ready_to_publish`.
4. The existing Windsor automation checks for duplicates, publishes once, and records the media ID and permalink in issue #131.
