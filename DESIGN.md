# pupz design system

## 0. Research Log

- Supplied Dribbble motion reference: viewed the 9.65s video at logo and hero frames; harvested the full-bleed workout scene, black pill navigation, compressed white display type, yellow CTA, and floating live metric.
- Imagen draft: `/home/neo/.codex/generated_images/01a046af-c3ae-79f0-a36d-4567e7ebcbaa/exec-bac5a4ec-352a-4752-82d9-f509af002b5e.png` → picked as the implementation reference for the original pupz homepage composition and content hierarchy.
- Lazyweb research: skipped because the supplied video is the concrete visual contract.

## 1. Atmosphere & Identity

pupz feels like the quiet second before a set starts: dark, focused, physical, and a little cinematic. The signature is a warm workout scene held inside a near-black shell, with one electric-yellow action and live progress UI that feels like an instrument panel rather than a dashboard.

## 2. Color

### Palette

| Role | Token | Value | Usage |
|------|------|------|------|
| Canvas | `--color-canvas` | `#0b0c0d` | Page and navigation backdrop |
| Canvas raised | `--color-canvas-raised` | `#151718` | Secondary sections |
| Hero panel | `--color-hero-panel` | `#0b0c0d` | Floating metrics over the hero image |
| Ink | `--color-ink` | `#f7f7f2` | Primary text on dark surfaces |
| Ink muted | `--color-ink-muted` | `#c3c6bf` | Supporting copy |
| Ink dim | `--color-ink-dim` | `#858b83` | Labels and metadata |
| Line | `--color-line` | `rgba(247,247,242,0.16)` | Dividers and glass edges |
| Accent | `--color-accent` | `#f1ee19` | Primary CTA, logo dot, progress |
| Accent ink | `--color-accent-ink` | `#111210` | Text/icons on yellow |

Accent is reserved for action and progress. Hero imagery supplies the only additional color, mostly muted sage and warm wood.

The color-scheme toggle keeps the dark palette as the default and maps the same roles to a soft mineral light palette: canvas `#f2f3ee`, raised canvas `#e5e8df`, ink `#171914`, muted ink `#495047`, dim ink `#6c746a`, line `rgba(23,25,20,0.16)`, accent `#686d00`, and accent ink `#f7f7f2`. The selected scheme is stored locally; first visit follows the system preference. Light-mode accent and hover values are chosen to keep small labels and button text above the AA contrast target.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|------|------|------|------|------|------|
| Display | `clamp(3.25rem, 8vw, 8rem)` | 800 | 0.86 | `-0.065em` | Hero statement |
| H1 | `clamp(2rem, 4vw, 4rem)` | 700 | 0.94 | `-0.045em` | Section titles |
| H2 | `1.5rem` | 700 | 1.1 | `-0.03em` | Card and panel titles |
| Body/lg | `1.125rem` | 400 | 1.5 | `-0.01em` | Lead copy |
| Body | `1rem` | 400 | 1.5 | `0` | Default copy |
| Caption | `0.75rem` | 600 | 1.2 | `0.12em` | Utility labels |

### Font Stack

- Display: `@fontsource-variable/roboto-condensed`, uppercase and high weight for the compressed statement.
- Body: `@fontsource-variable/geist`, regular and medium weights.
- Numeric: Geist with tabular figures for progress values.

## 4. Spacing & Layout

All spacing uses a 4px base: `--space-1` 4px, `--space-2` 8px, `--space-3` 12px, `--space-4` 16px, `--space-6` 24px, `--space-12` 48px, `--space-16` 64px.

- Max shell width: 1440px.
- Hero minimum height: `min(880px, 92svh)` on desktop; content-driven on mobile.
- Desktop hero grid: text anchored left, workout subject and metric anchored right, nav floating at top center.
- Mobile hero: nav becomes a two-row compact shell, text stays left aligned, metric moves into normal flow below the CTA.
- Major sections use asymmetric top/bottom spacing so the page feels like a sequence of scenes, not stacked cards.

## 5. Components

### Shadcn stat card

- **Structure**: `Card` with a `Badge` label, icon, tabular value, and `Progress` indicator.
- **Variants**: featured daily target (enlarged display value, hairline-divided readout row with percent-complete and remaining figures so content fills the tall card, thicker progress track); compact supporting metric.
- **Spacing**: `--space-4` icon rhythm, `--space-6` card inset, `--space-8` value separation.
- **States**: default, featured, reduced motion.
- **Accessibility**: the progress primitive exposes the current percentage; the card remains readable without color.
- **Motion**: progress uses the standard indicator transition and respects reduced motion.

### Section divider

- **Structure**: shadcn `Separator` between repeated method items.
- **Variants**: horizontal only.
- **Spacing**: `--space-8` item inset.
- **States**: default, reduced motion.
- **Accessibility**: decorative separation does not interrupt the reading order.
- **Motion**: none.

### Cinematic hero

- **Structure**: `section` with local image layer, dark gradient overlay, brand mark, navigation, statement, CTA, and live metric panel.
- **Variants**: desktop full-bleed; mobile stacked.
- **Spacing**: `--space-6` mobile gutters, `--space-12` desktop gutters, `--space-16` internal rhythm.
- **States**: default, CTA hover, CTA active, CTA focus, reduced motion.
- **Accessibility**: semantic heading, meaningful image alt, labelled navigation, visible focus ring, contrast-first overlay.
- **Motion**: scene fade/scale entry; CTA uses short transform feedback; metric progress animates once on entry.

### Floating metric panel

- **Structure**: `aside` with eyebrow, numeric split, unit label, progressbar.
- **Variants**: floating hero; inline progress summary.
- **Spacing**: `--space-4` to `--space-6`.
- **States**: default, complete state with success color, reduced motion.
- **Accessibility**: `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`.

### Challenge stat row

- **Structure**: section heading plus asymmetric grid of shadcn stat cards.
- **Variants**: featured daily target; compact supporting metric.
- **Spacing**: `--space-4` tile gap, `--space-8` section separation.
- **States**: default, hover lift, keyboard focus where actionable.
- **Accessibility**: headings and labels remain readable without color.

### Primary action

- **Structure**: semantic anchor styled as a button.
- **Implementation**: shadcn `buttonVariants` with the project accent tokens.
- **Variants**: yellow filled primary; text link secondary.
- **Spacing**: 16px horizontal / 12px vertical minimum hit area.
- **States**: default, hover, active, focus, disabled.
- **Accessibility**: 44px minimum target, visible focus, action copy describes destination.

### Not-found recovery panel

- **Structure**: responsive recovery scene with a short error eyebrow, compressed display heading, primary return action, secondary progress link, and a decorative route-map panel.
- **Variants**: two-column route map on desktop; stacked recovery content and route map on mobile.
- **Spacing**: `--space-6` mobile gutters, `--space-12` desktop gutters, `--space-8` action rhythm.
- **States**: default, primary action hover/active/focus, secondary link hover/focus, reduced motion.
- **Accessibility**: the route map is decorative; recovery actions are semantic links with destination-specific copy and visible focus rings.
- **Motion**: content and route map use the existing hero entry easing; reduced motion is inherited from the global motion rule.

### Color-scheme toggle

- **Structure**: compact icon-only button in the site header.
- **States**: dark mode action, light mode action, hover, active, focus, and reduced motion.
- **Accessibility**: semantic button with an explicit switch label, pressed state, and visible focus ring.
- **Behavior**: follows the system preference on first visit and persists the user&apos;s choice in local storage.

### Exercise session surface

- **Structure**: full-height camera stage with mirrored video, pose canvas overlay, session HUD, and a compact progress rail.
- **Variants**: edge-to-edge mobile camera; split camera and instrument-panel desktop layout.
- **Spacing**: `--space-6` mobile gutters, `--space-12` desktop gutters, `--space-4` HUD rhythm.
- **States**: preparing camera, tracking live, form warning, and reduced motion.
- **Accessibility**: camera status is text-visible, progress exposes `aria-valuenow`, exit is a semantic link, and the canvas remains decorative.
- **Motion**: status and progress use opacity/transform only; reduced motion inherits the global motion rule.

## 6. Motion & Interaction

- Hero entry: 600ms `cubic-bezier(0.16, 1, 0.3, 1)` using opacity and transform only.
- CTA and nav controls: 180ms ease-out; hover translates 2px and active translates 1px.
- Metric progress: 700ms ease-out, once after mount; it communicates the current target rather than decorating the page.
- Interaction reference: beui.dev `button` mechanism for interruptible press feedback and `number` mechanism for metric emphasis; adapted to CSS because this app has no motion library.
- `prefers-reduced-motion: reduce` disables hero and progress movement while preserving contrast and state changes.

## 7. Depth & Surface

Strategy: mixed. The hero uses image atmosphere, a multi-stop scrim, and a soft bottom vignette. UI panels use a translucent black fill, backdrop blur, and a 1px light rim. Lower sections use tonal shifts and restrained dividers instead of card shadows.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- WCAG 2.2 AA target: 4.5:1 for body text and 3:1 for large text/UI boundaries.
- Full keyboard navigation with visible focus indicators.
- Respect reduced-motion preferences.
- Use `svh`/intrinsic sizing rather than hard `100vh`; preserve reading order on mobile.
- Meaningful imagery gets alt text; decorative grain and gradients are hidden from assistive technology.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|------|----------|--------------|--------------|
| Store badge is a visual placeholder | Hero utility control | No app-store URL or official badge asset exists in this repo | Product owner / replace when store listing exists |
