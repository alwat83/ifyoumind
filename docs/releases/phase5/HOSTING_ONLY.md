# Exact-source Hosting-only procedure — proposed, not authorized

Preparation is permitted. **Do not execute production deployment, rollback, master merges or workflow changes under Phase5.** A green local report/manifest is not release authorization. Maintain the four [risk levels](../../verification/RISK_BASED_GATES.md), actual branch protections and independent review. Never synthesize hosted checks or bypass a required protection.

## Current blast radius

`.github/workflows/firebase-production.yml` runs on master push/manual dispatch, uses production credentials/environment, creates subscription deployment configuration (enrollment forced empty), then deploys **Hosting, Firestore rules/indexes, Storage rules and27 named Functions**, including checkout, portals, webhooks and report generation. Build/test/predeploy work also executes. It remains byte-identical to master in this proposal.

Its `firebase-production` concurrency group has `cancel-in-progress:true`. Cancellation is not a distributed deployment lock and does not prove an already-submitted cloud operation stopped. A new manual workflow sharing the group cannot neutralize an older cancel-in-progress producer. A local lock alone cannot exclude Actions, another computer or Console. **There is currently no demonstrated global serialization control.** Do not run a second deployment to test this.

## Local preparation, no credentials required

Use a clean full-SHA checkout containing the reviewed #118→#119→#121 consumer stack and these preparation tools. Do not assume a future merge commit is verified by an earlier head. Recheck current master/heads, diffs and protections. Exclude #120, experimental PR95/96/101 and any private records. No new Functions source is included.

```sh
npm run verify:local -- --level=consumer --base-sha=fded8759251204b4e3fa1db7573f05fd835aa41c --expected-sha=FULL_CANDIDATE_SHA
node scripts/prepare-hosting-release.mjs --expected-sha=FULL_CANDIDATE_SHA --run-dir=test-results/local-first/EXACT_RUN --out=test-results/hosting-CANDIDATE_SHA
node scripts/prepare-hosting-release.mjs --expected-sha=FULL_CANDIDATE_SHA --verify=test-results/hosting-CANDIDATE_SHA
```

The base here assesses **this preparation increment**, not all consumer changes: those include security-relevant routing/Hosting configuration and retain their own full historical #118/#121 evidence plus unresolved gates. Any further changes to those surfaces require the applicable higher level. This phase's selected consumer run is not a new all-backend pass. `--install` is available for locked independent reproduction. Local browser platform gaps and NOT_RUN checks remain in the report.

The preparer requires valid exact-source consumer/release checks, including production build, bundle/isolation and both Hosting/authenticated journeys. It rechecks the clean Git source digest and isolated source snapshot, copies that run's production output (not local/demo output), rejects unsafe files and emits only:

```text
firebase.json     # single explicit site, static-only reviewed Hosting configuration
manifest.json     # full source/report/config/file hashes; releaseAuthorized:false
public/           # verified production static assets, no Functions source or rules
```

The tool deliberately has **no deploy/rollback mode** and does not authenticate. Artifact mutation makes verification fail. Preserve the reviewed report and manifest SHA256 in the authorization record; hashes without an independently reviewed record are not signatures. Keep generated assets/reports ignored, not in Git. Preserve reviewed source, lockfiles and report to rebuild. No claim that dependency installation is fully hermetic or native pixels equal Linux.

## Before a future separately authorized release

1. Founder approves exact source and static artifact/config digest, proposed narrower scope/residual #111/transaction risks, remaining visual/device/human coverage, deployment identity, independent reviewer, rollback target and **exclusive production window**. Read current GitHub branch/environment rules; satisfy every applicable required check. Current absent protection is a gap, not permission.
2. **Prevent every overlapping writer before starting.** Obtain separate approval to temporarily disable the broad production workflow during the window (or first approve a permanent serialized release mechanism). Disabling is not performed here. Freeze master pushes, dispatches and Console/manual releases by agreement with all authorized operators. Record the previous workflow state for separately approved restoration. Do not cancel an in-flight cloud deployment; wait for each queued/running producer and provider operation to settle and re-read serving state. If exclusive control cannot be established, STOP. A runner completion/cancellation alone is insufficient.
3. A permanent alternative needs its own reviewed workflow/control change: one serialized producer for all production releases, `cancel-in-progress:false`, approval controls and no alternate writer. This document neither applies nor authorizes that change. No paid CI/hosted replacement is required for local development.
4. Acquire one local process mutex for the entire readback→deploy→verify window (same mutex for any separately approved rollback). For example, atomically `mkdir /private/tmp/ifyoumind-production-hosting.lock`; failure means STOP. Record owner and authorized operation without credentials. Never auto-delete or steal a stale lock. This is a second guard, **not a replacement for step2**. Release only your own lock after no cloud operation remains uncertain.
5. GET the latest production release/channel and its exact version; reject SITE_DISABLE, missing state or any newer unexpected release. GET the version and all paginated files: require FINALIZED, expected nonzero file count, ACTIVE file metadata/hashes and readable config. Save redacted release/version/timestamps/config hash as the **immediate rollback target**, not a hardcoded old version. Verify a permitted existing Hosting identity, CLI13.35.1 and current deployment-specific permissions without broad IAM grants. Do not read credentials into chat/history. Verify all live non-Hosting revision/config metadata needed to prove it stayed unchanged.
6. Confirm no other queued/running production workflow/provider operation, same serving release and same reviewed artifact/config immediately before mutation. Hash-check the artifact again. If anything changed, STOP and reassess; no API compare-and-swap is assumed. Use an isolated directory without `.firebaserc`, Functions source, hooks or inherited config.

## Only after explicit authorization: one static deployment

Proposed command (not executed). Resolve the pinned installed CLI from the verified checkout; inspect package version13.35.1. `ARTIFACT` is the absolute verified package path, not repository root. Run from that isolated directory. Keep authentication in the approved CLI mechanism, never command-line tokens.

```sh
node /ABSOLUTE/VERIFIED_CHECKOUT/node_modules/firebase-tools/lib/bin/firebase.js deploy --project ifyoumind-473fe --config /ABSOLUTE/ARTIFACT/firebase.json --only hosting --non-interactive
```

The config has an explicit single site and no Functions/rules/Storage sections or hooks; rewrites cannot deploy/pin Functions or Cloud Run. Do not use bare `firebase deploy`, deploy from root config, invoke the existing production workflow, regenerate Functions env, or pass a broader `--only`. Independently inspect resulting Hosting release/version/config and served files. Recheck non-Hosting metadata unchanged and enrollment still closed by read-only means. No production test data, Checkout, payment or provider generation.

Smoke: home→tax reveal($420/$240 illustrative)→evidence→recognized synthetic CSV→clear→return; electricity/city navigation; old `/app` compatibility and clean routes; public four-offer pricing and closed enrollment; existing authorized sign-in/saved-read/report navigation only. Run mobile320/390 and desktop checks. New save or #111 live retry requires its own explicit synthetic production-write authorization; do not claim it passed from a navigation check. Record exact source→artifact digest→release association, timestamp and outcome. Unexpected failure means stop further release operations and seek the separately authorized recovery action.

## Independently authorized rollback

Do not auto-rollback: obtain founder approval of **the exact currently serving release and recorded finalized target**. Preserve the same exclusive window, quiescence, mutex, reviewer and fresh preconditions. Re-read target version/files/config and current release; abort if either differs. If the target is unavailable, do not substitute an old build or deploy Functions.

Supported Hosting REST operation, executed by an authorized operator with credentials kept in memory:

```http
POST https://firebasehosting.googleapis.com/v1beta1/sites/ifyoumind-473fe/releases?versionName=sites/ifyoumind-473fe/versions/VERIFIED_ROLLBACK_VERSION
Content-Type: application/json

{"message":"Founder-authorized Hosting-only rollback; authorization reference recorded privately"}
```

This creates a new Hosting release referring to the existing version; no source rebuild, Function traffic update, Firestore/Storage rule deployment or authentication change. The [official create-release API](https://firebase.google.com/docs/reference/hosting/rest/v1beta1/sites.releases/create) documents the same-site version reference. The installed CLI's same-site clone implementation also creates a release, but can create channels/update Auth domains if a destination is missing; use the explicit existing-site release operation here, not a preview/channel creation path. GET verifies the rollback is serving, file/config hashes match and non-Hosting metadata is unchanged; repeat safe smoke and record the new release ID. No actual rollback or mutation-permission proof was performed in Phase5.

Rollback consequences: the prior public design/pricing returns; new clean links copied during the candidate may not be supported by old route rewrites. Recheck old `/app` callbacks and authentication returns before approval. Account records, purchased reports, legacy access and backend remain untouched. A Hosting rollback does not repair backend transaction defects or authorize payment/refund operations.

## Fresh read-only inventory

[Hosting readback](HOSTING_READBACK.json), November21: serving release `1794933315802000`, version `39dc573f3826dca6`, deployed November17 at16:35:15.802Z. Current version and prior `cd0b78221355e0f4` both FINALIZED with58 accessible ACTIVE files; older `1beeaa395c606d55` FINALIZED with57. All file hashes/config accessible. Use **fresh current version at execution** as immediate target. These GETs establish retained metadata/content availability and a documented restoration path, **not an executed rollback or proof of mutation permission**. Latest listed production workflow run [44126748079](https://github.com/alwat83/ifyoumind/actions/runs/44126748079) is completed/success on current master; a new run could start later. No new deployment occurred.
