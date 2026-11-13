# Wow 3.1 cross-surface review

Planning baseline `36b9c1e420fb3fd1c76b3344fcffc1525498bb83` on draft PR #91. The original visual comparison is `69cc8c985b7c7e5d0e9a904530b24a42506647a5`. The founder selected its composition. PR #90 remains the Wow 2.2 comparison.

## Impact assessment

The status and rationale below were set before the implementation. The verification column identifies the evidence to collect.

| Surface | Status | Action or rationale | Verification |
| --- | --- | --- | --- |
| Homepage, public examples, navigation and footer | Change Required | Audit the first screen and the handoff to the demo. Keep any refinements within the existing editorial composition, photography, serif, palette and three sections. | Five-width comparison, responsive and keyboard tests |
| Discovery tools and example evidence | Verify Only | Existing browser-local app, fixture calculations and source cells remain authoritative. Homepage demo changes must keep all three examples and the handoff to full discovery. | Fixture tests, Hosting isolation and browser suite |
| Public sample, Decision Reports and Business offering | Verify Only | The homepage explains the free brief and full report. Existing sample, report creation and offer screens handle the next steps. | Homepage and sample journeys, paid-report and print contract |
| Pricing, one-time checkout and legacy Pro | Verify Only | The public pricing link hands off to existing account pricing. Existing products, terms and checkout routes stay in use. | Guarded return, account pricing, report and Pro checkout contracts, commerce tests |
| Starter, Plus, subscription and billing portal | Verify Only | Verify existing gated availability, payment verification, credits, renewal, cancellation and owner boundaries. No enrollment or live activity is required for this review. | Sandbox-free emulator and callable regressions, commercial diff |
| Payment success, cancellation and failure; entitlement grants, credit reservation and report access | Verify Only | Existing lifecycle governs when reports unlock and credits are used. | Commerce and subscription emulator tests, paid return browser contract |
| Registration, login and password recovery | Verify Only | Homepage and sample send visitors to existing auth screens. | Free and paid-intent signup, verification, password reset, sign-in return |
| Dashboard, account, saved reports, history and report generation | Verify Only | The existing signed-in flow owns navigation, persistence and generation. | Signed-in browser suite, explicit returning-customer path |
| Profile and unrelated settings | Not Affected | No profile routes, settings UI or account fields are in the proposed diff. | Changed-path review |
| Wide desktop, standard desktop, tablet, mobile, 320 px, touch, keyboard and reduced motion | Verify Only | Viewport and interaction coverage applies to the homepage and downstream paths. | Full-page captures, Playwright, axe, keyboard, forced colors, text spacing and reduced motion |
| Loading, empty, success, error, expired session, unauthorized access, network and retry | Verify Only | Reuse existing sample and authenticated recovery states. | Sample recovery, discovery, session, verification, fixture and commerce suites |
| Guides and educational content, legal and privacy | Verify Only | Footer continues linking to existing destinations. Their content and data handling remain in place. | Navigation, Hosting, legal and privacy checks |
| Analytics events | Not Affected | The local example and proof interactions use current client state and introduce no instrumentation. | Changed-path and dependency review |
| SEO and social metadata | Verify Only | Existing metadata and canonical paths continue to describe the same public destinations. | SEO and Hosting checks |
| Automated tests | Change Required | Add targeted coverage for material homepage or journey gaps. Keep existing assertions. | Review and run relevant suites |
| CI workflows, Hosting configuration and security rules | Verify Only | Run existing release gates without changing production configuration. | Workflow results, Hosting and rules tests, changed-path review |
| Documentation, handoff, GitHub issue, Notion and release procedures | Change Required | Record scope, evidence and permanent cross-surface review practice. Keep the founder's separate release authorization. | Repository instructions and PR template, synchronized handoff |

## Shared design system audit

The homepage uses scoped Instrument Serif, Inter, and page-local palette variables. Discovery, sample and signed-in pages already use their own Angular layouts and shared application patterns for forms and feedback. Apply reusable behavior and accessible semantics where a control is genuinely shared. Keep the editorial treatment on the public homepage. A broader consolidation of forms, cards, loading and navigation would require a separate coordinated review across real product states.

## Expert five-second review

| Viewport | Original Wow 3.0 | Wow 3.1 |
| --- | --- | --- |
| 320 × 568 | The headline and CTA fit. The photograph puts the demo at y=491. | The supporting sentence names a specific discovery without implying a cause. The demo starts at y=466. After the CTA jump, the finding, chart, and evidence control fit within 568 px. |
| 390 × 844 | The CTA is clear. The demo begins at y=536 and the evidence control sits at y=611 after the jump. | The crop and spacing bring the demo to y=507. After the jump, the evidence control ends at y=535. |
| 768 × 1024 and 1024 × 800 | Split headline and photo with the free action leading. | The same hierarchy remains. The photo is decorative. The copy names a bill increase and place comparison. |
| 1440 × 900 | Headline and city photography carry the opening. “Try a Free Example” leads directly to the example. | The same focal points and CTA remain. The next interaction shows the explicit $420 total and $240 school charge comparison before source details. |

“Show the evidence” changes to “Hide the evidence” when open. It remains a native disclosure and keeps focus when toggled. The formula appears first, with the original arithmetic, limitations, and source cells below it. The full discovery link stays within the demo. The report section explains the value of a full Decision Report after a free personalized brief.

For a five-second user check, ask what someone can discover and what they would click. After thirty seconds, ask them to explain what the 57.1% measures, find the evidence, and tell the free brief from the paid report. These are expert hypotheses. The project has no human test or conversion result for this candidate.

## Full-page visual evidence

Both builds were served by the Firebase Hosting emulator. The baseline was rebuilt from `69cc8c985b7c7e5d0e9a904530b24a42506647a5`. Chrome, device scale 1, reduced motion, remote requests blocked. Captures use the same viewport dimensions in each pair.

| Viewport | Original Wow 3.0 | Wow 3.1 candidate |
| --- | --- | --- |
| 320 × 568 | [Full page](screenshots/cross-surface/before/320-full.jpg) | [Full page](screenshots/cross-surface/after/320-full.jpg) |
| 390 × 844 | [Full page](screenshots/cross-surface/before/390-full.jpg) | [Full page](screenshots/cross-surface/after/390-full.jpg) |
| 768 × 1024 | [Full page](screenshots/cross-surface/before/768-full.jpg) | [Full page](screenshots/cross-surface/after/768-full.jpg) |
| 1024 × 800 | [Full page](screenshots/cross-surface/before/1024-full.jpg) | [Full page](screenshots/cross-surface/after/1024-full.jpg) |
| 1440 × 900 | [Full page](screenshots/cross-surface/before/1440-full.jpg) | [Full page](screenshots/cross-surface/after/1440-full.jpg) |

| Focus | 390 px before / after | 1440 px before / after |
| --- | --- | --- |
| Hero | [Before](screenshots/cross-surface/before/390-first.jpg) · [After](screenshots/cross-surface/after/390-first.jpg) | [Before](screenshots/cross-surface/before/1440-first.jpg) · [After](screenshots/cross-surface/after/1440-first.jpg) |
| Demo | [Before](screenshots/cross-surface/before/390-demo.jpg) · [After](screenshots/cross-surface/after/390-demo.jpg) | [Before](screenshots/cross-surface/before/1440-demo.jpg) · [After](screenshots/cross-surface/after/1440-demo.jpg) |
| Evidence | [Before](screenshots/cross-surface/before/390-evidence.jpg) · [After](screenshots/cross-surface/after/390-evidence.jpg) | [Before](screenshots/cross-surface/before/1440-evidence.jpg) · [After](screenshots/cross-surface/after/1440-evidence.jpg) |
| Decision Reports | [Before](screenshots/cross-surface/before/390-reports.jpg) · [After](screenshots/cross-surface/after/390-reports.jpg) | [Before](screenshots/cross-surface/before/1440-reports.jpg) · [After](screenshots/cross-surface/after/1440-reports.jpg) |

## Verification record

| Journey | Verified surface and boundary |
| --- | --- |
| A — Discovery | Homepage CTA, 57.1% formula, evidence toggle and full tax example showing the $420 increase. The Hosting suite covers electricity, cities, raw cells and browser-local privacy. |
| B — Decision Reports | Public sample opens without sign-in. Free and $79 registration links preserve their distinct intents. Existing browser tests cover registration verification and Business brief creation. The homepage free brief also returns to Business location entry after sign-in. |
| C — Commerce | Homepage pricing preserves its sign-in return. Browser tests verify the report and Pro checkout request contract. Commerce and subscription tests verify owner scope, payment success, duplicate delivery, credit use, failed renewal, cancellation and retained report access. Checkout destinations are intercepted or simulated in tests. |
| D — Returning customer | Login, Account, Back to your decisions, and reopening a saved report are exercised with an isolated fixture. Paid report rendering and retained access use the existing browser and commerce suites. |

Local commands: `npm run build`, `npm run build:local`, `npm run test:seo`, `npm run check:production-bundle`, `node scripts/check-discovery-isolation.mjs --production`, and `QA_BROWSER_CHANNEL=chrome npm run test:discover`. Targeted authenticated cases use `firebase emulators:exec --project demo-ifyoumind --only auth,firestore,functions` with Playwright's authenticated config. The draft's exact-head checks record the full build, Functions, discovery, Firestore rules, organization, commerce, fixture and browser suites.

Three fresh contexts per viewport produced zero horizontal overflow and a maximum initial layout shift of about 0.052 in both builds. The same local fonts transfer 43,160 bytes. Encoded scripts grew by 397 bytes from Wow 3.0. The corrected 1024 px image hint selects 77,842 bytes instead of 251,544. Median loopback paint timing was slower in this sample. The two runs had different concurrent workloads, and these timings do not establish field performance. Native screen readers, physical touch devices, and live billing and portal behavior were outside this verification.

The new [agent policy](../../../AGENTS.md#cross-surface-engineering-standard) and [PR template](../../../.github/pull_request_template.md) carry the standard forward. The production baseline remains PR #88. Founder visual review and separate release authorization are pending.
