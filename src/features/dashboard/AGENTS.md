# DASHBOARD FEATURE

## OVERVIEW

The dashboard feature owns the PupZ homepage composition and its daily-challenge presentation.

## STRUCTURE

```text
dashboard/
├── components/  # Hero, CTA, method, stats, and progress sections
├── pages/       # PupzHomepage composition
├── index.ts     # Public feature exports
└── routes.tsx   # Feature route objects
```

## WHERE TO LOOK

- `pages/pupz-homepage.tsx` is the page composition seam.
- `components/push-up-ritual-hero.tsx` and its CSS define the cinematic entry section.
- `components/daily-progress-overview.tsx` and `stats-item.tsx` define challenge metrics.
- `components/challenge-method.tsx` explains the training method.
- `components/start-today-cta.tsx` owns the primary conversion action.

## CONVENTIONS

- Keep dashboard components focused on presentation and navigation; exercise session state belongs to `src/features/exercise` and `src/stores`.
- Use the established Roboto Condensed display and Geist body typography, accent palette, asymmetric layout, and responsive behavior from `DESIGN.md`.
- Keep the feature barrel and route exports aligned when adding a dashboard entry point.

## ANTI-PATTERNS

- Do not duplicate global shell/theme behavior from `src/components/layouts`.
- Do not make dashboard metrics imply live camera state unless the data contract exists.

