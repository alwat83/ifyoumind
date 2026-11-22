# ifYouMind marketing assets

Approved public exports live in `public/assets/marketing/`, matching Angular's existing static-copy convention. [assets.json](assets.json) is the source-controlled registry; this README, registry, editable artwork and working drafts are **not** deployed to the public asset directory. No new service or recurring subscription is required.

## Organization

```text
public/assets/marketing/
  brand/{logos,profile,banners}/
  social/instagram/{posts,carousels,reels,stories}/
  social/{facebook,tiktok,linkedin}/
  campaigns/{property-tax,electricity,city-comparisons}/
  archive/
```

Hidden `.gitkeep` placeholders preserve empty folders in Git and are excluded by the existing Hosting ignore rules. Only approved export files belong here. Never add credentials, customer/report/bill files, personal research, unpublished sensitive drafts, account secrets or build artifacts. Keep editable masters in founder-approved private working storage; do not duplicate this JPEG across channels/campaign folders merely to categorize it.

## Add and approve

1. Obtain the exact founder-approved export. Copy it without regeneration, re-encoding, cropping or metadata changes. Confirm MIME, dimensions, size, privacy and actual appearance. For a supplied approved file, compare its SHA256 before/after copying.
2. Use a descriptive stable filename, e.g. `ifyoumind-launch-01.jpg`. Register URL, channel, campaign, dimensions, MIME, bytes, SHA256, version, explicit approval, publication state and creation/update timestamps in `assets.json`. Record an unknown artwork-creation date as null; registry creation is not authorship evidence.
3. A changed creative gets a new filename/version. Do not silently replace content behind a URL already handed to a publishing API. Preserve approved historical records; moving an export into `archive/` does not authorize breaking an existing public URL. Removing a public export requires a reviewed decision and check for existing posts/references.

## Deploy an additive Hosting package

Asset publication and social posting are separate actions. Use the existing founder-controlled Firebase CLI/immutable-artifact procedure; never dispatch the broad master workflow for an image. Obtain the applicable Hosting deployment authorization, preserve exact source and use the production project's existing credentials.

1. Freshly read the serving Hosting version/configuration and complete file inventory. Verify the retained local application artifact matches **every** serving asset and the prior version is finalized for rollback. Stop if that baseline differs; do not substitute an old application build.
2. On a separate asset branch, commit the approved file, directory structure and registry. Prepare an isolated package from the verified serving static artifact **without rebuilding the app**, adding only the approved export. Carry the identical Hosting-only configuration, with no Functions/rules/Storage/IAM/hooks. Exclude all `.gitkeep` files and docs/registry/drafts from this package. Independently verify the old file hashes are identical, exactly the intended paths are added, and no files disappear.
3. Record exact candidate SHA, baseline version, file/config/manifest hashes and local validation evidence. Confirm no known production deploy is running. Pin Node22 and the reviewed Firebase CLI13.35.1; run from the isolated package, explicitly targeting only Hosting:

```sh
# Substitute the verified absolute package path, not the repository's broad firebase.json.
cd "$VERIFIED_ASSET_PACKAGE"
"$NODE22" "$REPOSITORY/node_modules/firebase-tools/lib/bin/firebase.js" deploy \
  --project ifyoumind-473fe --config firebase.json --only hosting --non-interactive
```

4. Independently read back the finalized live version and all file hashes/configuration. Verify the public HTTPS URL without authentication and without following redirects: HTTP200, `Content-Type: image/jpeg`, expected bytes/SHA256 and decoded dimensions. Check representative public routes/application bundles and Discovery privacy headers against the unchanged baseline. Compare all Functions revisions/configuration and AI/billing/enrollment state; do not make a paid/provider request just to validate an image release.
5. Update registry Hosting status and release evidence only after those checks pass. Keep Instagram status separate and unknown until its publishing workflow supplies real post evidence. Retain the prior Hosting version; rollback is a separate authorized action, never automatic. Readable current release evidence: [launch image verification](LAUNCH_IMAGE_RELEASE.md).

## Initial publishing handoff

Approved image: [ifyoumind-launch-01.jpg](https://ifyoumind.com/assets/marketing/social/instagram/posts/ifyoumind-launch-01.jpg). Exact source `ifyoumind_instagram_launch_1080.jpg`,1080×1080,76,114bytes, SHA256 `0e87ff1aa9a9d1cb5db09175fe2c83624198ab86a5ef7c98cc4330e97bc19252`. No substitute artwork.

ChatGPT's existing Windsor.ai connection and founder-approved caption handle the subsequent `@ifyoumindapp` welcome post. Codex publishes **the file only** and makes no Instagram API call, caption substitution, ad purchase or social-performance claim. This asset authorization supersedes Pending Founder Setup only for this file's public Hosting publication, not unrelated outreach.
