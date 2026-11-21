# Local-first verification

This is an alternative **development** gate while GitHub-hosted Actions cannot execute. It does not authorize a merge, deployment, billing change or provider request. #118 remains a separate dependency and #111's production retry remains unverified. Founder experience review can proceed with the prototype without waiting for GitHub billing restoration.

## One entry point

Start from a clean, committed checkout of the candidate. Supply its full SHA explicitly:

```sh
npm run verify:local -- --expected-sha=FULL_40_CHARACTER_CANDIDATE_SHA
```

For clean dependency installation into the isolated copy (recommended for independent reproduction):

```sh
npm run verify:local -- --expected-sha=FULL_40_CHARACTER_CANDIDATE_SHA --install
```

Use `--browser=chromium` to require the pinned browser or `--browser=chrome` for the installed native Chrome. The default tries pinned Chromium, then installed Chrome and records any fallback. It never installs a browser silently. To prepare the locked browser when needed: `npx --no-install playwright install chromium`. On Linux, existing system browser libraries are also required; use the optional container if appropriate. No paid provider, hosted runner or recurring service is introduced.

The command audits both dependency lockfiles and runs the union of Launch Build and Authenticated QA checks: Functions build/tests, fast web, production/local and three standalone builds, bundle and four isolation checks, all standalone/Hosting browser suites, rules, organizations, commerce/entitlements, fixture/access and authenticated browser suites. Existing browser tests cover keyboard, axe, reduced motion, responsive layouts, recovery and relevant authorization/commerce journeys. All original assertions remain. Normal GitHub workflow definitions are unchanged by this workaround; reporter changes are opt-in only.

## Exact-source and credential boundary

The runner refuses a dirty tree, missing/mismatched full SHA or explicit credential-bearing environment. It fingerprints all tracked source bytes and modes, observes filesystem changes (including a reverted edit), and checks SHA, branch, status and bytes again at the end. Changed source invalidates the whole report, even if tests passed.

Checks run in a separate ignored **tracked-source copy**. It excludes .git, local secrets, .env overrides, Firebase login, ADC and customer files. A fresh HOME and allowlisted child environment prevent inherited cloud credentials. Emulators use only `demo-ifyoumind`; the normal fixture guard and browser external-request isolation remain. No production operations exist in the command plan. Native mode reuses installed dependencies only after checking direct versions against both locks; `--install` instead runs both `npm ci` commands inside the copy, without replacing the working checkout's dependencies. Actual versions and environment differences are reported.

Required ports must be free. The runner does not kill unrelated processes or reuse an existing server. Stop a known local preview's demo emulators before a full run, then restart them after testing if desired. Missing prerequisites mark affected checks BLOCKED. An executed failure is never replaced with a retry/pass. No baseline update command is supported.

## Optional pinned Linux path

```sh
npm run verify:local -- --expected-sha=FULL_40_CHARACTER_CANDIDATE_SHA --docker
```

Docker installation is optional. The runner detects the CLI and a usable **local** daemon, rejecting remote Docker endpoints. If unavailable, it runs native checks and explicitly reports that Docker/Linux was not tested. It does not install Docker or change its configuration. An actual Docker build/run failure remains a failure, rather than disappearing into a fallback.

The image is pinned to Playwright **1.56.0**, Ubuntu Noble (24.04), and manifest digest:

`mcr.microsoft.com/playwright:v1.56.0-noble@sha256:35246d87a7c88ea9b771c65d33171b2611b02a8253b4b12ce6f94376c55f99f2`

Digest verified read-only from Microsoft's registry on November 20, 2026. The existing lockfile must match this Playwright version. The container adds Java 21, uses linux/amd64 for the reviewed renderer, installs the two lockfiles, runs as the caller's unprivileged UID, and mounts only the isolated source/report directory. No host credentials, Docker socket, privileged mode, cloud secrets or production environment are mounted. The image's Node 22 differs from hosted Node 20 (Functions declares 22); the report records this instead of claiming bit-identical parity. Java patch packages, installed versions and image provenance are reported; this is a pinned browser/OS path, not a fully hermetic package mirror.

[Playwright's Docker guidance](https://playwright.dev/docs/docker) requires matching image/package versions; the [versioned 1.56.0 Dockerfile](https://github.com/microsoft/playwright/blob/v1.56.0/utils/docker/Dockerfile.noble) documents Node 22. [Structured reporters](https://playwright.dev/docs/test-reporters) supply machine-readable browser counts.

## Output and interpretation

Each run writes ignored `test-results/local-first/<timestamp>-<sha>/`:

- `report.json`: candidate, before/after fingerprints, tool versions, checks, real test counts, limitations and evidence hashes.
- `SUMMARY.md`: human-readable result and check commands.
- `evidence/`: raw logs, per-browser-suite JSON, screenshots, expected/actual/diff images and traces where emitted.
- `worktree/`, `home/`: isolated source/build and credential-free runtime; never publish these.

Statuses and process exits: **PASS / 0** only with no failed, blocked or environmentally limited checks; **FAIL / 1** for executed failures; **PARTIAL / 2** for unsupported or blocked coverage; **INVALID / 3** if source integrity cannot be established. Test passes, failures and skips are distinct from build/guard checks. A native macOS run can pass functional checks while remaining PARTIAL because 14 Linux visual cases are skipped. Chrome fallback, Node/Java differences and untested Docker are recorded. Native screenshots never become Linux baselines.

Do not commit raw reports containing test payloads, traces, logs or large screenshots. Commit only the sanitized JSON/Markdown summary and use existing approved synthetic design captures for review. The [preserved first result](VERIFIED_2583bf5.md) and [machine report](VERIFIED_2583bf5.json) identify their tested SHA; a subsequent evidence-only commit is a new head and must be identified separately. PR evidence records the final exact-head run, avoiding a false claim that an earlier run covers a moving branch.

Linux visual failures remain failures. Individually inspect expected, actual and diff images; update only reviewed baselines through the existing design-system procedure. This runner cannot accept them automatically. Physical iPhone/Safari, spoken VoiceOver, human comprehension and the unwaived #111 live gate remain separate from automated local verification.
