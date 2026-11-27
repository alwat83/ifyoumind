# ifYouMind Instagram publishing: hosted-asset contract

**Discovery URL (fixed):** https://ifyoumind.com/assets/marketing/social/manifest.json

The weekly automation reads this one URL. The founder doesn't need to send links.

## Manifest contract (`ifyoumind-social-manifest/1`)
- `batches[].posts[]` holds one entry per scheduled post. Fields: `post_id`, `format` (`carousel` | `story` | `reel`), `scheduled_local_date`, `status`, `caption`, `media[]`, `instagram_media_id`, `permalink`.
- Each `media[]` item gives a public HTTPS `url`, `sha256`, `bytes`, `width`, `height` and `content_type`.
- Filenames are **immutable**: `ifyoumind-<date>-<slot>-<nn>-<sha8>.jpg`. A changed asset gets a new name. Files are never overwritten.

## Publish only if all of these hold
1. `status` is `ready_to_publish`.
2. `caption` is the exact founder-approved text and is non-null. Stories have no caption.
3. Every media URL returns 200 with the listed `content_type`, and its bytes match `sha256`.
4. Recent media on @ifyoumindapp has no matching post. If the outcome is ambiguous, don't publish.

Publish exactly once, then record `instagram_media_id` and `permalink` in the GitHub issue #131 log. Update the manifest in the next hosting batch.

## Adding a weekly batch (static assets only, per the standing authorization in issue #131)
1. Put the approved JPEGs (and verified MP4s) under `public/assets/marketing/social/instagram/{carousels,stories,reels}/`, using immutable names.
2. Add the batch to `public/assets/marketing/social/manifest.json`.
3. Package = the **current live Hosting files, unchanged** + the new static files. Never rebuild the app for an asset batch, and never deploy an older artifact.
4. Fresh preflight: live version, 66 app files unchanged, 35 Functions, enrollment, headers and CSP.
5. Deploy `--only hosting` once.
6. Read back every URL, hash and content type.

## Current state (2026-11-27)
| Post | Status |
|---|---|
| Nov 24–30 Tuesday carousel and Saturday Story | Hosted and verified (release `1795754199503000`) |
| Tuesday carousel | Needs the verbatim approved caption |
| Saturday Story | Link sticker must be added in the Instagram app if the publishing API can't add it |
| Thursday Reel | Genuine footage captured (see `2026-11-26-thursday-reel-footage/`). Not yet edited, encoded to MP4, approved or hosted |
