# Actions-control failure — read-only diagnostic finding

November21,2026 · OpenAI / Codex · `codex/rc1-production-retry-qa`, from evidenceb43238e. **API failure cause UNKNOWN. Error/stage-loss in the original wrapper CONFIRMED.** [Machine evidence](ACTIONS_DIAGNOSTIC.json); [original stop](ACTIVE_WINDOW_STOP.md), [PR125 report7072059450](https://github.com/alwat83/ifyoumind/pull/125#issuecomment-7072059450). No control write/retry, deployment, credential/settings change or reuse of the expired5:00–5:20 window.

## A. What can be established

At5:05:28 the wrapper captured the enabled policy, persisted `pauseAttempted:true` and prepared a valid70-byte JSON body. It then stopped with a generic exit1 before a completed readback record. Existing journal contains only authorization/before/capture time/pauseAttempted/restoreAttempted; no HTTP response, provider message, request ID, command exit detail or successful PUT stage. No original error files exist; GH_DEBUG was not configured in the inspected environment. The exact historical environment/source hash was not captured. Current private wrapper contains two acknowledged post-attempt logging edits, so it is not mislabeled as a preserved original binary.

The original `execFileSync` piped stdout/stderr, but catch discarded the thrown exception. It also persisted the successful PUT timestamp only after the next GET completed. Thus PUT rejection, post-PUT GET/JSON failure and a local/transport exception cannot be distinguished from this journal. Offline VM reconstruction of the original logging behavior shows synthetic PUT403, synthetic PUT422 and successful PUT followed by synthetic GET transport failure all produce identical journal/exit output. These are **three synthetic logging tests, zero production requests**, not observed historical HTTP statuses. Reconstruction reverses the known post-attempt edits using the preserved tool transcript; no original forensic file hash is claimed.

**Not established:** whether the original request reached GitHub, whether GitHub rejected it, exact HTTP/error, actual selected credential at that instant, or a specific credential/permission/billing/version/payload/transport cause. Current enabled state is not proof of which earlier leg failed. No billing or authentication root cause is inferred.

## B. Exact request and credential selection

| Item | Evidence |
|---|---|
| Command | Installed `gh`2.98.0; `gh api --method PUT repos/alwat83/ifyoumind/actions/permissions --input <private payload file>` |
| Body | `{"enabled":false,"allowed_actions":"all","sha_pinning_required":false}`; JSON types correct; SHA2565f630e2458529ca0b546f56e3a042c52740d5cbf04050dfb222f7e59c0489cbf |
| Headers/version | Original wrapper did not pin host/Accept/API version or capture headers. New default GET selects2022-11-28; explicit2026-03-10 GET also returns200/same policy. This does not establish a version-related PUT failure. |
| Authentication chain | Child inherits parent environment. Current GH_TOKEN/GITHUB_TOKEN/enterprise overrides, GH_HOST/GH_CONFIG_DIR and proxy/debug flags absent. `gh auth status` identifies active github.com **keyring** credential, account matches repository owner. No token value read/printed/stored. Historical selection is supported by this chain but not cryptographically proven by a missing attempt-time snapshot. |
| Current authorization | CLI and HTTP `x-oauth-scopes`: gist,read:org,repo,workflow. GET/user and repo return200, same owner/admin:true. Both policy GET versions200. Repository is user-owned, not an organization. |

[GitHub's endpoint documentation](https://docs.github.com/en/rest/actions/permissions#set-github-actions-permissions-for-a-repository) requires `repo` for OAuth/classic credentials; fine-grained credentials require Administration:write. The current **scope-based credential plus admin role meets the documented authorization prerequisites**. A separate fine-grained permission bit is not exposed for this credential. Actual effective PUT success—and historical request authorization—cannot be certified with GETs. No new token/scope/IAM grant is justified by current evidence. Method/path/body fields match the documented schema; no confirmed malformed payload. Expected success is204 with no response body, not JSON.

[CLI credential precedence](https://cli.github.com/manual/gh_help_environment) and [--method/--input behavior](https://cli.github.com/manual/gh_api) match the invocation. Current GET reachability does not rule out a past transport failure. There is no retained historical HTTP status to quote.

## C. Minimal correction, without changing product source

Correct the operational wrapper's observability before any future separately approved write:

1. Save a redacted attempt-time credential-source/scope/role snapshot; explicitly select github.com and pin the reviewed API version. For a comparable diagnostic, retain2022-11-28 unless a version change is separately justified; do not treat the2026 documentation example as proof an upgrade fixes this failure.
2. Persist stages **before** each request, **immediately after** each response, and before parsing/readback. Preserve exit code/signal, HTTP status, response request-ID/API-version headers, sanitized API error body/stdout/stderr. Never log Authorization/request headers, token values or use verbose credential tracing. Keep raw private errors0600 if needed; publish allowlisted redacted fields only.
3. Expect PUT204/no body; parse JSON only for GET. Keep all policy-preservation/disabled-state assertions and no-retry latches. Compare policy values semantically rather than relying on object key order. Do not weaken assertions or ignore omitted fields.
4. Fail closed on any error, retaining enough information to distinguish API denial from transport, local file/child-process failure and readback. No automatic retry/restore or deploy. Existing private post-stop logging edits are not a tested live correction; this phase makes **no executable application or control-wrapper change**.

This is wrapper code/audit correction, not a new integration or product change. No evidence calls for a new token, broader repository permissions or billing changes. Under the founder’s explicit follow-up, none may be introduced unless diagnostic evidence demonstrates necessity and the evidence/correction is presented for founder approval first. Founder action is required only for any new control write/window, or a subsequently evidenced and separately reviewed access restriction.

## D. Exact missing evidence and smallest authorized next test

Missing: original child stdout/stderr/exit detail, PUT status/error/request ID and durable stage, plus post-PUT GET outcome. It cannot be recovered retrospectively from the surviving files. A current probe can diagnose a reproducible failure, not prove the cause of an unrecorded transient event.

If the founder wants to exercise **the exact failed state-changing request**, authorize one control-only diagnostic in a **new** bounded window: capture current enabled policy, approved credential/source, relevant freezes and logging; make one logged PUT with the retained false payload; require204 and an independent GET confirming disabled state/preserved policy. **No deployment.** On rejection, reconcile GET-only and stop with the actual error. If it genuinely pauses, authorize one conditional restoration of the captured original policy after known settled state, require204 and GET semantic equality; no automatic retry on uncertainty. Both pause and conditional restoration must be explicitly included in that new authorization. The old5:00–5:20 window is not reused.

A single same-state PUT would be a smaller-impact probe of general write authorization, but would not exercise enabled:false or diagnose a disable-specific rejection. Do not perform/request both by default; no such probe was run here. No additional broad release audit or QA allowance is needed to identify the missing response.

## E. Safe future release verification

After a permitted diagnostic/control correction and a separately approved release window, freshly meet all original identity/custody/quiescence/hash/rollback/protection gates. Pause: captured policy → logged204 → independent disabled readback, with all assertions retained. Restoration: only after reconciled completion, logged204 → independent exact prior-policy readback → no unexpected run. If state is uncertain, keep control as last observed and seek founder direction; no automatic rollback, repeated PUT or deployment. No full release is authorized by this diagnostic recommendation.

## F. Current unchanged-state readbacks

At **5:20p.m. PST**, both Actions policy GETs returned200 and unchanged `{enabled:true,allowed_actions:"all",sha_pinning_required:false}`. At **5:22:33p.m. PST**, Hosting live channel/latest release agree: version **39dc573f3826dca6**, release **1794933315802000**, original release time November17. Frozen manifest/archive/config hashes remain exactly approved; no rebuild or artifact mutation. These are new read-only observations, not a successful control write/deployment. No Firebase/app/QA data request, #111 repeat, billing/enrollment/AI/customer/entitlement/IAM/workflow/permission change, dispatch/cancellation/merge or rollback. Repository/Notion documentation updates are coordination only; diagnostic API requests are GET-only. No new customer/revenue outcome.
