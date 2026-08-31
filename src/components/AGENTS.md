# SHARED COMPONENTS

## OVERVIEW

Shared React UI includes the application shell, global route fallback pages, and Base UI/shadcn-style primitives.

## WHERE TO LOOK

| Concern | Location | Notes |
|---|---|---|
| Application shell | `layouts/root-layout.tsx` | Header/footer, theme persistence, `Outlet` |
| Route failures | `pages/app-route-error.tsx` | Router error element |
| Missing routes | `pages/not-found.tsx` | Wildcard recovery UI and local CSS |
| Reusable primitives | `ui/` | Button, badge, card, progress, separator |

## CONVENTIONS

- Keep primitives presentational and reusable; compose class names with `cn()` from `@/lib/utils`.
- Follow Base UI APIs configured by `components.json`; this is not a Radix component layer.
- Keep page-level behavior in feature pages or the layout, not inside generic primitives.
- Visual changes must preserve the design tokens, keyboard focus, contrast, and reduced-motion requirements in the parent `AGENTS.md` and `DESIGN.md`.

## ANTI-PATTERNS

- Do not add feature-specific camera, exercise, or MediaPipe behavior here.
- Do not introduce a second styling/token system beside `src/index.css`.

