# Electric Minimal palette review

November 16, 2026 Pacific · OpenAI / Codex · [Draft PR #105](https://github.com/alwat83/ifyoumind/pull/105)

The palette applies to the production Wow 3.3 layout at `20665a3f21a1c01f669395a9d29224c346a63935`. The runtime diff changes only Sass color values and references. The current production baseline and rollback reference is Hosting version `60325c7c14d6bd62`, release `1794855290043000`. [Production verification](https://github.com/alwat83/ifyoumind/blob/a29668c7f530579a185e9aa0023ded28dabed2c0/docs/design/wow-3-3/REVIEW.md#production-release-verification)

| Approved color | Value | Semantic use |
| --- | --- | --- |
| Cloud White | `#FAFAFC` | Page canvas and light text on Midnight Ink |
| Cool Mist | `#ECEEF5` | Existing secondary surfaces and the Decision Reports band |
| Electric Cobalt | `#4355E8` | Primary buttons, priority links, light-surface focus, and selected example underline |
| Midnight Ink | `#171923` | Headings, body text and the existing dark example surface |
| Soft Periwinkle | `#B9C4FF` | The finding, proof marker, and existing dark-surface accents |

| Derived color | Value and purpose |
| --- | --- |
| Paper, muted text | `#FFFFFF` for existing raised surfaces and button text. `#51586C` for secondary copy. |
| Lines and controls | `#CDD1E1` for decorative light dividers. `#767D94` for interactive light boundaries. |
| Hover | `#3444C8` deepens cobalt on light surfaces. `#5263F0` keeps the dark hero button boundary distinguishable on hover. |
| Tinted surface | `#E6EAFF` is the existing pale emphasis surface. The legacy Sass names for clay and olive now resolve to Cool Mist and this periwinkle tint. |
| Dark-surface shades | `#202435` dark panel, `#525975` decorative divider, `#D3D9F2` muted evidence text, `#A0A9CD` interactive boundary. |

The shared tokens and primary button mixin reach the homepage, Discovery, public sample and authenticated Decision Reports, pricing, sign-in, registration, Account and saved decisions. Existing outlined secondary pricing actions preserve their role. Guides and static recovery inherit the same tokens. Existing success, warning, error, and data-signal colors retain their semantic roles. Browser forced colors continue to supply system colors. Photo, shadows, layout, typography, labels, and behavior are unchanged.

Runtime files changed

- `_product-design.scss` defines the palette, derivatives and shared primary fill.
- `public-landing.component.scss` applies cobalt to the existing headline accent and primary button.
- `public-landing-discovery.component.scss` sets the example action, dark hover and selected underline colors.
- `tax-discovery.component.scss` colors the expanded follow-up button.
- `market-report.component.scss` applies cobalt to the existing full-report action.

## Before and after

Full-page Chrome captures of the live baseline and local candidate at identical viewport sizes. The comparison matched all sampled element and text-range bounds, wrapping, fonts, clip widths, links and wording with the evidence open and closed. The two mobile versions contained 87 sampled elements each and the larger views 86.

| Viewport | Live Wow 3.3 | Electric Minimal |
| --- | --- | --- |
| Desktop · 1440 × 900 | [Before](screenshots/before-desktop.jpg) | [After](screenshots/after-desktop.jpg) |
| Tablet · 768 × 1024 | [Before](screenshots/before-tablet.jpg) | [After](screenshots/after-tablet.jpg) |
| Mobile · 390 × 844 | [Before](screenshots/before-mobile.jpg) | [After](screenshots/after-mobile.jpg) |
| Narrow · 320 × 568 | [Before](screenshots/before-narrow.jpg) | [After](screenshots/after-narrow.jpg) |

## Verification

The production-equivalent build and 138 web unit and fixture tests passed. Rendered Chrome contrast checks and axe passed for the homepage with evidence open and the sign-in form. Keyboard focus, hover, disabled sign-in semantics, forced colors, and reduced motion passed. White on cobalt measured 5.67:1, cobalt on Cloud White 5.44:1, and cobalt on Cool Mist 4.89:1. The selected underline and normal button fill against Midnight Ink each measured 3.09:1. The dark hover maintained 4.77:1 text and 3.67:1 against its surrounding surface. Evidence labels measured 12.48:1 and the finding 10.34:1. The sign-in field border and focus measured 4.09:1 and 5.67:1 respectively. [Text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) · [Control contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)

`QA_BROWSER_CHANNEL=chrome node_modules/.bin/playwright test --config e2e/discover.config.mjs visual-home integration` passed 36 local browser cases. The [first authenticated Linux run](https://github.com/alwat83/ifyoumind/actions/runs/43956227073) flagged 26 color differences. Each before, after and pixel diff was reviewed individually. All image dimensions matched, and the differences matched the palette changes. Only those 26 baselines were replaced; the desktop local-tax and mobile decision-question baselines stayed unchanged. The exact-head rerun is tracked in [PR #105](https://github.com/alwat83/ifyoumind/pull/105/checks).

Founder visual review is separate from release approval. No deployment, configuration, provider or commerce change.
