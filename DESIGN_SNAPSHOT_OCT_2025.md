# Design System Snapshot (October 2025)

This document freezes the current UI design language so future changes can be compared against an authoritative baseline.

## 1. Core Principles

- Elevated clarity: reduced visual noise, clear hierarchy, subtle depth.
- Motion-respectful: animations gated by `prefers-reduced-motion`.
- Theming: Dark default, light mode tokens mapped via semantic surfaces.
- Cohesive interaction patterns: unified buttons, pills, elevated cards.
- Accessibility: focus-visible states, high contrast, multi-line clamps, semantic text utilities.

## 2. Token Layers

### Color (Semantic / Core)

Primary scale: `--primary-50` → `--primary-900`
Secondary scale: `--secondary-50` → `--secondary-700`
Accent scale: `--accent-50` → `--accent-600`
Neutral scale: `--neutral-50` → `--neutral-900`

Gradients:

- `--gradient-primary`: teal→violet
- `--gradient-secondary`: amber→red
- `--gradient-surface`: subtle frosted layer

Light theme overrides redefine neutral scale & introduce text role tokens:

- `--text-high`, `--text-medium`, `--text-low`
- Surface roles: `--surface-1`, `--surface-2`, `--surface-3`, borders: `--surface-border`, `--surface-border-strong`

### Elevation / Shadows

- `--elev-1`, `--elev-2`, `--elev-3` (composite layered shadows + subtle inset border)
- Glow accent: `--shadow-glow`

### Radii

`--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`, `--radius-full`

### Typography

Fonts: Inter (body), Space Grotesk (headings)
Line-height presets: `--line-tight`, `--line-snug`
Responsive clamps applied to headings (H1-H3)

### Spacing

Scale: xs, sm, md, lg, xl, 2xl (mapped to rems)

### Transitions

- `--transition-fast`
- `--transition-base`

## 3. Components & Primitives

### Elevated Card (`.card-elevated`)

- Background: `--surface-1` (light: white gradient)
- Border: `--surface-border` / hover `--surface-border-strong`
- Shadow: elev-1 → elev-2 on hover
- Behavior: subtle translateY on hover, blur backdrop

### Legacy Card (`.card-modern`)

Retained for backward compatibility (to be deprecated once all references are gone). Uses frosted gradient & larger padding.

### Buttons

Base: `.btn` sets structure & token hooks.
Variants:

- `.btn-primary-modern`: gradient primary/secondary, glow shadow, brightness hover
- `.btn-outline`: transparent surface, subtle fill hover
- `.btn-ghost`: no background; gains surface on hover

Legacy `.btn-primary` / `.btn-secondary` kept temporarily; not used in new templates.

### Pills (`.pill` / `.pill-active`)

- Used for filters & category selection.
- Active state: gradient background + shadow; hover brightness modulation.

### Inputs (`.input-modern`)

- Frosted dark surface (light theme: neutral background)
- Focus ring and subtle background shift

### Avatar (`.avatar-modern`, `.avatar-hover`)

- Gradient fill, white text, ring border.
- Optional grayscale → color transition on parent card hover.

### Skeleton Helpers

- `.skeleton-card`: wrapper adding overflow hidden
- `.shimmer`: gradient sweep animation via `::after`
- Uses `animate-pulse` + shimmer for layered feedback

## 4. Utilities

- Typography: `.heading-1/2/3`, `.body-large/medium/small`
- Text tone: `.text-dim`, `.text-subtle`
- Dividers: `.divider-subtle` (gradient line)
- Motion: `.hover-scale-sm`, `.pressable`, `.motion-safe-transition`, `.motion-safe-reveal`
- Layout: `.grid-modern`, `.hero-wrapper`, `.app-shell`, clamp-based spacing utilities
- Clamping: `.clamp-4` for multi-line truncation
- Focus: `.focus-ring` + global `*:focus-visible` support

## 5. Animation Keyframes

- fadeInUp, slideInRight, scaleIn (wrapped by motion preference)
- glow (loop for accent buttons)
- pulse-bg (skeleton pulsing)
- shimmer (sweeping highlight for placeholders)
- popIn (upvote micro-interaction)

## 6. Idea Wizard Modernization (Baseline)

- Buttons: Back → `.btn.btn-outline`; Next/Submit → `.btn.btn-primary-modern`
- Category select uses pill controls with gradient icon blocks
- Modal container: gradient panel with progress bar & step indicators

## 7. Active Light Theme Adaptations

- Re-mapped subtle text classes to maintain contrast
- Buttons & pills override text color tokens for legibility
- Cards lighten via layered white gradients

## 8. Accessibility & A11y Notes

- All interactive elements support `:focus-visible` outlines
- Contrast preserved for body text & controls (verify future changes with WCAG AA ≥ 4.5:1 for small text)
- Motion reduction fully disables non-essential animations
- Aria labels applied on wizard category buttons & action buttons

## 9. Deprecated / Transitional

- `.card-modern`, `.btn-primary`, `.btn-secondary`, `.glass-card` (still present for older templates; new work should avoid)
- Plan: remove after confirming no references & performing visual regression QA.

## 10. Future Enhancements (Suggested Backlog)

- Extract tokens into `tokens.scss` partial
- Add semantic text role utilities (e.g., `.text-high`, `.text-low` globally)
- Introduce dark/light adaptive gradient mapping in a single place
- Provide density scale (comfortable / compact mode)
- Add theming hook for brand customization (CSS var override injection layer)

## 11. Snapshot Integrity

This snapshot represents state after modernization sweep & skeleton enhancements just prior to the October 2025 deployment. Treat as a point-in-time reference for audits, regressions, and onboarding.

— End of Snapshot
