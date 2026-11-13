# ifYouMind design system

[The approved Wow 3.1 homepage](https://github.com/alwat83/ifyoumind/tree/165b5bbe6f2d9f2c3ceb424ffc289ce7bcf4080c/src/app/intelligence) is the visual reference. [The shared Sass module](../../src/app/_product-design.scss) defines the implementation. App styles, browser-local Discovery, static guides and static 404 reuse it through their existing entry points.

| Role | Use |
| --- | --- |
| Editorial display | Self-hosted Instrument Serif, regular at normal weight. Use it for page titles and a leading finding. Use italic sparingly for emphasis. Preserve the serif fallback. |
| Section and body | Use the shared sans stack for controls, body copy, dense headings, evidence and print. Use weight and space to group content. Keep numerical comparisons aligned, with tabular numerals where relevant. |
| Labels and captions | Use short, consistent labels with a text hierarchy. Captions and source notes use muted ink with readable contrast. Error, warning and helper text stay near the relevant field or action. |
| Surfaces | Paper and ink for the app. Clay and olive for restrained emphasis. The olive studio is for deliberate analytical contrast. Use the shared borders, control and focus roles. |
| Semantic feedback | Use the success, warning and error roles with clear text. A disabled control retains a clear label and disabled semantics. Color complements text and semantics. |
| Layout | Use the shared 8, 12, 16, 24 and 32 px steps and responsive gutter. Reading, working and wide containers are 900, 980 and 1180 px. Keep existing content-driven breakpoints when they work. The default control and panel radii are 5 and 8 px. |
| Controls and navigation | Reuse the primary, secondary, field and focus mixins. Aim for 44 px primary controls, visible keyboard focus and contextual link names. Set the current page in local navigation. Explain provider handoffs where they start. |
| Panels, tables, charts and disclosures | Use a panel or divider when it groups information. Label axes and values, preserve source links, and let dense tables scroll within their own region. Use native disclosure semantics. Keep data labels and access in print. |
| Dialogs, notifications and transient states | Use existing native semantics or the established Angular interaction pattern. Surface loading, errors, and empty states near the affected content. Keep context and an actionable recovery route. Use an alert for actionable failures and a status for routine updates. |
| Responsive and input | Check 320, 390, tablet, standard and wide desktop. Wrap navigation and stack forms before clipping. Keep touch, keyboard, forced colors and reduced motion usable. The existing layouts intentionally vary by context. |

## Visual regression baselines

The [visual browser suite](../../e2e/specs/visual-identity.spec.mjs) compares a 390 × 844 touch viewport and a 1280 × 900 desktop viewport. The suite uses Playwright's locked Chromium in Linux CI, device scale 1, UTC, en-US, a light color scheme, reduced motion, disabled screenshot animations and local font readiness. Auth uses demo-only fixtures with stable account text. External fonts, providers and payment actions are isolated as in the existing browser suite. Only the emulator overlay is hidden. The 0.2% differing-pixel allowance covers minor raster differences. Differences beyond the budget and missing images fail the suite. Other browser tests verify 320 px, tablet, and wide views and functional behavior.

1. Run the relevant browser tests through the demo emulator. Prefer the Ubuntu 24.04 CI artifact for the release comparison. The workflow writes actual and diff images to the test-results artifact when a check fails. A missing image also produces a named candidate there.
2. Compare expected, actual and diff at the original viewport. Identify every material difference in the PR and link the relevant journey and before-and-after images. Use each platform's own screenshot baselines.
3. After visual review of an intentional change, copy only its reviewed candidate image to the corresponding Playwright snapshot path. For local capture, an explicit `--update-snapshots=changed` invocation may generate a candidate for review. Inspect the Git image diff before staging. CI uses `updateSnapshots: 'none'`.
4. Re-run both exact-head checks. Unexplained differences and missing baselines keep the PR out of production. Visual approval remains separate from authorization to merge and deploy.
