### Summary

Describe what changed and why.

### User Value

Explain the expected benefit and distinguish it from any measured result.

### Cross-Surface Impact Matrix

| Surface | Status | Action / Verification | Evidence |
|---|---|---|---|
| Homepage | | | |
| Discovery | | | |
| Decision Reports | | | |
| Registration / Login | | | |
| Dashboard / Account | | | |
| Pricing / Checkout | | | |
| Subscriptions / Entitlements | | | |
| Business Experience | | | |
| Mobile / Tablet / Desktop | | | |
| Accessibility | | | |
| Loading / Error / Empty States | | | |
| Analytics / SEO | | | |
| Documentation / Handoff | | | |

Use **Change Required**, **Verify Only**, or **Not Affected**. Add or remove rows as needed. Explain every **Not Affected** entry.

### Complete Journey Verification

Record the affected end-to-end journeys, their outcomes, and any gaps.

### Regression Testing

Include the exact commit, commands, results, and CI links. Record skips and pre-existing failures separately.

### Visual Consistency (required)

- **Affected surfaces and shared tokens or components** — identify the rendered routes and any intentionally unchanged design.
- **Before and after** — link mobile and desktop screenshots and the reason for each visual baseline change.
- **Cross-route checks** — record transitions, state feedback, provider handoffs and returns.
- **Responsive and accessibility evidence** — record tested widths, keyboard, touch, focus, contrast and reduced motion as applicable.
- **Known visual exceptions** — explain provider-owned surfaces and remaining discontinuities. Give a reason if the PR has no visual impact.
- **Visual regression and release readiness** — link exact-head results and record baseline review. Material unexplained differences or missing baselines block release.

### Commercial and Security Invariants

State whether authentication, pricing, billing, entitlements, security rules, or report generation changed. Provide the diff and verification evidence.

### Known Risks and Follow-Up

Record unresolved inconsistencies, deferred work, and limits of the evidence.

### Release Authorization

Record whether the PR is draft, ready for review, approved for merge, or approved for deployment. CI success is separate from founder authorization.

### Final Cross-Surface Confirmation

**Have all affected surfaces been updated or explicitly verified?**

Answer with evidence and identify any exceptions.
