# Production observability: access findings and least-privilege plan

**Status:** proposal for founder approval. Nothing has been created, granted or changed.

## Findings (2026-10-15)
| Where | Result | Exact reason |
|---|---|---|
| Main Claude session (environment "Default") | **No Google access** | `gcloud auth list` shows no account. `firebase login:list` shows none. The `CLOUDSDK_AUTH_ACCESS_TOKEN` variable is set, but Google rejects it (`invalid_token`), and `gcloud projects describe` fails with `CREDENTIALS_MISSING`. There is no `GOOGLE_APPLICATION_CREDENTIALS` |
| `ifyou` environment session | **Not attempted** | The session will act only on the founder's instruction given in its own conversation, not one relayed by another session. It has not inspected its auth context. To proceed, the founder repeats the authorisation directly there: https://claude.ai/code/session_01Gfgb2Sj1thA6U9THbQTmKE |
| GitHub Actions deploy credential | **Not used** (founder instruction) | Usable only inside the deploy workflow |

**So these remain unverified:**
- function errors since deploys #184 and #185;
- universal-function request trends;
- Firestore read and write metrics;
- the deployed function inventory (including the Ask-history and saved-question functions);
- `getUniversalDataset`'s 30-day calls.

## If the `ifyou` environment has no usable credential: least-privilege plan (for approval)
**Principal:** a dedicated read-only identity used only for diagnostics, for example `ifyoumind-observer@ifyoumind-473fe.iam.gserviceaccount.com`. Alternatively, the founder's own Google account, signed in by the founder inside the `ifyou` session.

**Project-level roles:**

| Role | Why | What it excludes |
|---|---|---|
| `roles/cloudfunctions.viewer` | Function inventory and configuration (the v2 metadata) | Deploy, delete, source access |
| `roles/run.viewer` | v2 functions run as Cloud Run services: revisions, instance limits | Changing services |
| `roles/logging.viewer` | Read the `_Default` bucket: request and error logs | Data Access audit logs (those need `roles/logging.privateLogViewer`, **not requested**) |
| `roles/monitoring.viewer` | Request counts, latencies, and Firestore `document/read_count` and `write_count` | Creating alerts or dashboards |

**Not requested:**
- Firestore data access (`roles/datastore.viewer`);
- any `*.admin` or `*.editor` role;
- billing roles;
- IAM roles;
- Secret Manager access.

**How the credential reaches the environment:**
- **Preferred:** the founder signs in himself, interactively, inside the `ifyou` session.
- **Alternative:** a short-lived token or key stored by the founder as an environment secret under the `ifyou` environment's settings.

Either way, Claude never sees or handles key material in chat.

**Retention and privacy:**
- Default log retention is 30 days, so older `getUniversalDataset` calls can't be recovered.
- Reports summarise by service, status class and error class, without payloads, uids or emails.

**Revocation:** remove the four role bindings, or disable the identity, after the diagnostic window. Expiring IAM Conditions on the bindings are another option.

## Commands to run once access exists (read-only)
- `gcloud functions list --project ifyoumind-473fe`
- `gcloud logging read 'resource.type="cloud_run_revision" AND severity>=ERROR AND timestamp>="2026-10-14T22:36:00Z"' --project ifyoumind-473fe`
- A per-service request summary over 7 days.
- The `getuniversaldataset` request entries since 2026-09-14.
- Monitoring time series for `firestore.googleapis.com/document/read_count` and `write_count`, hourly, from 2026-10-07.
