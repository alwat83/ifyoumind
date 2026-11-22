# ifYouMind marketing assets

One local-first pipeline extends the existing Midnight Slate renderer. [assets.json](assets.json) is the **authoritative lifecycle registry**. Render receipts, review galleries and publication handoffs are derived evidence, not competing approval trackers. Drafts and editable sources stay under `docs/marketing/drafts/<campaign>/`; only exact approved exports may enter `public/assets/marketing/`. No new dependencies, services or paid GitHub requirement.

## Routine commands

Run from the repository with Node 22 and the existing Chrome/Playwright installation:

```sh
npm run marketing:assets:render -- --campaign property-tax
npm run marketing:assets:manifest -- --campaign property-tax
npm run marketing:assets:validate
npm run marketing:assets:review -- --campaign property-tax
npm run test:marketing-assets
```

`render` runs the configured existing campaign renderer, writes versioned HTML/JPEG/caption/render receipt, reconciles registry metadata, validates it and produces a gallery/contact sheet/publication handoff. `manifest` reconciles receipts without changing approved publication records. Repeating reconciliation without changes is idempotent. `review` independently validates and regenerates the index/contact sheet. Defaults select property-tax; `validate` without a campaign checks **all** registered assets including historical versions.

The [five-slide review](drafts/property-tax/REVIEW.md), [contact sheet](drafts/property-tax/contact-sheet.jpg), [before/after](drafts/property-tax/comparison.jpg), [versioned caption](drafts/property-tax/caption-v2.txt) and [publication handoff](drafts/property-tax/publication-handoff.json) are ready. Current exports are **review-ready / unapproved / not hosted / not published**. `prepare` must return BLOCKED (exit 2) for them. Direction approval is insufficient.

## Layout and versions

```text
docs/marketing/
  assets.json                      # authoritative states/evidence
  drafts/{property-tax,electricity,city-comparisons,brand}/
  releases/                        # sanitized release/verification evidence
public/assets/marketing/
  brand/{logos,profile,banners}/
  social/instagram/{posts,carousels,reels,stories}/
  social/{facebook,tiktok,linkedin}/
  campaigns/{property-tax,electricity,city-comparisons}/
  archive/
```

Empty directories retain `.gitkeep`; placeholders are excluded from Hosting. Category directories do not assert that new creative/renderers exist. Add future campaigns to the **same** registry with an existing/reused renderer, preset, caption working source, required category-specific disclosure strings and explicit public/synthetic provenance. Do not build a separate campaign tracker. Share one export through manifest references across channels; avoid duplicate bytes merely for categorization.

Current filenames use `property-tax-carousel-01-v2.jpg` through `05-v2.jpg`, with matching editable HTML. Stable IDs retain campaign/slide/version. `manifest.json` selects the latest rendering receipt; `render-receipt-v2.json` and `caption-v2.txt` preserve its evidence. `caption.txt` is the editable next-render source. Once a version is approved/hosted/published, rendering selects a new version instead of overwriting its files or caption. Metadata drift on immutable versions is rejected. Archived originals remain byte-identical in `before-v1/`, with historical source references. Existing welcome URLs remain unchanged; legacy filename is explicitly recorded.

## State and safety

Lifecycle: **draft → review-ready → approved → hosted → published → archived**. These are source-controlled evidence states, not authority to perform external actions. Each asset records stable ID, campaign/channel/preset, source/export path, dimensions/MIME/bytes/SHA256, version/timestamps, alt text, privacy attestation, approval, deployment and social receipt. Unknown artwork creation dates remain null.

Final approval must explicitly identify the exact export SHA256 (`approval.status=approved`, `scope=final-export`, `sha256`, actual founder `reference`) and exact caption hash/reference. Codex records the actual decision; the founder need not manage files. No command invents approval. A hosted record requires independently verified public path/URL and Hosting version/release. Published records additionally require the **actual** platform post ID, permalink, timestamp and evidence reference. A successful Hosting operation never implies social publication.

Validation checks real JPEG headers/dimensions, MIME/size/hash/naming, registry consistency, source hashes, rendering receipts, fonts, text/canvas bounds, contrast, mobile-equivalent type, required disclosures and original arithmetic. The tax renderer checks source cells/bar ratios and an unaltered public product capture. Render networking is blocked except local files/data. Private-data protection combines an explicit synthetic/public-source attestation, known fixture/capture allowlist and obvious secret/email/SSN text rejection. **This is not a general PII detector or permission to import customer bills**; human source/appearance review remains required.

## Platform targets

[Presets and dated official references](../../scripts/marketing-assets/presets.json) cover IG feed 1080×1350 JPEG, square 1080×1080 JPEG, Stories 1080×1920 JPEG/MP4, Reels 1080×1920 MP4, Facebook feed 1080×1350 JPEG, TikTok 1080×1920 MP4. JPEG size ceilings are conservative 8 MB IG / 10 MB Facebook. These are house export targets within platform bounds, not every accepted size. Production preparation blocks after the 30-day specification-review interval; refresh against official sources first.

[Meta Instagram media requirements](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media), [Facebook photo requirements](https://developers.facebook.com/docs/graph-api/reference/page/photos/) and [TikTok transfer requirements](https://developers.tiktok.com/docs/en/content-posting-api-media-transfer-guide) were reviewed November 22, 2026. Publishing permissions, account limits and URL ownership remain publishing-workflow gates.

**Video limitation:** MP4 validation requires an already installed `ffprobe` and verifies codec, dimensions, FPS, duration, audio, pixel format and fast-start. Neither ffprobe nor ffmpeg is installed on this machine. Video validation therefore fails closed; no encoder/video export or real MP4 acceptance is claimed. No software was installed. Still-image rendering and validation work now.

## Approval-gated Hosting preparation — no deployment

After actual final export **and caption** approval is recorded:

```sh
# Local promotion only. This still performs no network write or deployment.
npm run marketing:assets:prepare -- --campaign property-tax --promote
# Commit the exact approved registry/promoted exports on the isolated marketing branch.
# Then prepare from a clean exact source, using the retained serving artifact:
npm run marketing:assets:prepare -- --campaign property-tax \
  --baseline test-results/marketing-assets/hosting-db22d11d \
  --baseline-record docs/marketing/releases/welcome-launch.json \
  --out test-results/marketing-assets/<new-unique-release-directory>
```

Promotion refuses existing public paths with different bytes. The prepare command stops **before credentials/network/public writes** for unapproved creative. It requires clean source before/after; reads current Hosting configuration/file inventory using existing Firebase CLI authentication; verifies every baseline file and provider-normalized configuration against recorded hashes; and builds an additive, isolated Hosting-only package without rebuilding the app. Output must be a new ignored directory; symlinks/traversal/collisions/extra live files/configuration drift are rejected. All existing files/config bytes are preserved. The existing artifact guard independently rejects hooks, Functions, rules, Storage, dynamic rewrites, unexpected targets or privacy-header regressions. No CLI mode deploys or publishes. Local promotion is preparation, not `hosted` state.

`--offline` supports an explicitly labeled **OFFLINE_PACKAGE_NOT_RELEASE_VERIFIED** rehearsal and still requires final approvals/exact clean source. It cannot establish current production state. Unit tests use only temporary synthetic approvals/baselines, never change the real registry to exercise success paths.

Before any separately authorized deployment: capture a fresh finalized rollback version, confirm no known deployment overlaps, verify the prepared manifest/config/file hashes and pinned Node22/Firebase CLI13.35.1. Use only the existing explicit-project `--only hosting` isolated release procedure in [LAUNCH_IMAGE_RELEASE.md](LAUNCH_IMAGE_RELEASE.md). No merge, broad master workflow, automatic retry/rollback, Functions/rules/Storage/IAM, billing/AI/enrollment or customer-data action. After release, independently read back all existing and new files/configuration, HTTP/MIME/SHA256/dimensions and backend invariance, then record Hosting evidence in the registry. Rollback requires its own applicable authorization.

## Publishing handoff and actual receipts

Once the exact approved assets are independently verified hosted, `review` emits `publication-handoff.json` with HTTPS URLs, hashes, Hosting release IDs, campaign/platform, **approved caption**, alt text and publication status. Until then it withholds public URLs and approved caption, clearly labelling the draft. ChatGPT/Windsor handles authorized posting; no Codex social request or ad spend occurs.

Record the real publishing result afterward with:

```sh
npm run marketing:assets:manifest -- --publication-evidence /absolute/private/path/to/receipt.json
```

Receipt shape: `assetIds` array, `platform`, actual `postId`, `permalink`, `publishedAt` ISO timestamp, `evidenceReference`. This imports metadata only; it cannot publish, approve an unhosted asset or replace another post receipt. Instagram, Facebook posts/videos and TikTok video permalink forms are checked; an unsupported form fails closed for review. Do not include tokens, private accounts or customer data in receipts.

The original welcome JPEG and its Hosting evidence are preserved. The [founder’s verified publishing receipt](https://github.com/alwat83/ifyoumind/pull/127#issuecomment-7086695435) records [the actual welcome post](https://www.instagram.com/p/DgD21-tiLBZ/), ID `17924317206450814`, published `2026-11-22T22:16:28Z`. This is reported external evidence, **not** a fresh Codex Instagram API readback. The registry retains that distinction; exact caption text was not supplied in the receipt and is not invented. No visitors, engagement, conversions or revenue are inferred.
