# SHARED LIBRARY

## OVERVIEW

This directory contains cross-feature helpers, exercise-domain calculations, and the MediaPipe vision integration.

## WHERE TO LOOK

| Concern | Location | Notes |
|---|---|---|
| Class composition | `utils.ts` | `cn()` for Tailwind class merging |
| Exercise math | `exercises.ts` | Angles, landmark metrics, push-up/squat strategies |
| Vision loading | `vision.ts` | Cached lazy fileset and landmarker creation |

## CONVENTIONS

- Keep pure exercise calculations deterministic and browser-independent where possible.
- Keep third-party MediaPipe setup isolated in `vision.ts`; callers consume the returned landmarker rather than rebuilding configuration.
- Preserve the `ExerciseStrategy`, `JointMetrics`, and `ExerciseId` contracts in `src/types/exercise.ts` when extending exercise support.
- Use named exports and the `@/` alias for source imports.

## ANTI-PATTERNS

- Do not couple pure geometry helpers to React lifecycle or DOM state.
- Do not silently change confidence/threshold semantics used by the counter machine.
- Do not duplicate MediaPipe model URLs, delegates, or initialization caching in feature pages.

