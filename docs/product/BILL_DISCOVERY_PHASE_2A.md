# Bill Discovery Phase 2A — The first useful result

**Scope.** Build on production master `59a4b80a8e427a13e0d8bee0f753f8954ea8611f` and the [Phase 1 specification](BILL_DISCOVERY_MVP.md) from [PR #94](https://github.com/alwat83/ifyoumind/pull/94). The first useful result comes from typed numbers. County and utility PDF readiness is test-only and cannot enter the deployed bundle.

## Cross-surface impact before implementation

| Surface | Status | Acceptance |
| --- | --- | --- |
| Discovery, responsiveness, accessibility, error/empty and correction states | Change Required | Both categories lead to a local result with evidence, an optional comparison, clear and focused error recovery. Verify at 320, 390 and 1440 px with keyboard and touch. Preserve CSV and examples. |
| Privacy, isolation and public metadata | Change Required | Explain local handling before fields. Keep the existing CSP and noindex boundary. Test offline, zero post-load requests and no bill persistence, including navigation and stale reads. |
| Homepage, Business, Decision Reports, registration and login | Verify Only | Existing links still work. Registration follows a meaningful typed result through a fixed URL with no payload. No bill saving or report entitlement. |
| Dashboard, Account, pricing, checkout, subscriptions and infrastructure | Not Affected | The isolated browser bundle has no connection to those features. No production configuration or deployment changes. |
| PDF readiness | Change Required | Test-only adapters for one county and one utility candidate with synthetic, issuer-informed fixtures. Keep them out of all app bundles. No real PDF compatibility claims. |
| Handoff | Change Required | Record screenshots, measured size and performance, exact-head checks, limitations, and next gate. |
