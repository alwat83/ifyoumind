# Release authorization

November 4, 2026, founder message in this task: “For now lets make that live.” Context: the immediately preceding completed visual redesign, draft PR75, application cff948a, documentation0cbc3be. Routine release-readiness repair d58d74e pins only the QA runner to supported Ubuntu24.04 after CI proved latest26.04 incompatible with Playwright1.56. App/assets, dependencies, pricing/Stripe unchanged. Scope: merge reviewed PR75 and automatic configured Firebase production deployment; no other PRs, customer communications, spending or commercial configuration changes.

Pre-release build/full QA, unchanged expected head, retained rollback target and post-deploy live verification required. Record actual outcomes separately; failed/skipped checks are not passes.
