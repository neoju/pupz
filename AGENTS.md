# PROJECT KNOWLEDGE BASE

**Generated:** 2026-08-31
**Commit:** 3d07963
**Branch:** main

## OVERVIEW

PupZ is a single-package Vite + React 19 + TypeScript app for a daily push-up challenge. The browser app combines a cinematic dashboard with a MediaPipe-powered exercise session and XState exercise progression.

## STRUCTURE

```text
pupz/
├── src/app/                 # Router and application entry composition
├── src/components/          # Shared layout, fallback pages, and UI primitives
├── src/features/dashboard/  # Homepage/dashboard experience
├── src/features/exercise/   # Camera-based push-up session
├── src/lib/                 # Shared utilities, exercise math, vision driver
├── src/stores/              # XState exercise machine
├── src/types/               # Exercise domain contracts
├── public/                  # Static images, icons, and favicon
├── DESIGN.md                # Visual, motion, and accessibility contract
└── vite.config.ts           # Vite, React, Tailwind, and @ alias
```

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| Browser bootstrap | `src/main.tsx` | Mounts React and warms MediaPipe vision |
| Route composition | `src/app/router.tsx` | Root, dashboard, exercise, error, and 404 routes |
| Shared shell/theme | `src/components/layouts/root-layout.tsx` | Header, footer, outlet, persisted color scheme |
| Homepage | `src/features/dashboard/` | Hero, CTA, progress, stats, and method sections |
| Push-up session | `src/features/exercise/` | Camera stage, HUD, canvas overlay, session lifecycle |
| Exercise rules | `src/lib/exercises.ts` | Angles, landmark metrics, and form strategies |
| Vision integration | `src/lib/vision.ts` | Lazy MediaPipe fileset/landmarker initialization |
| Session state | `src/stores/counter.ts` | XState transitions and repetition context |
| Global styles | `src/index.css` | Tailwind v4 imports, tokens, typography, motion rules |

## CONVENTIONS

- Use Bun commands because `bun.lock` is the repository lockfile.
- Use the `@/` alias for imports from `src`; Vite defines it in `vite.config.ts`.
- Keep product code inside feature directories. Put cross-feature primitives and infrastructure in `src/components` or `src/lib`.
- Shared UI uses Base UI primitives with shadcn-style wrappers, Tailwind v4 classes, `cn()` from `src/lib/utils.ts`, and Lucide icons.
- Treat `DESIGN.md` and `src/index.css` as the source of truth for visual tokens, responsive behavior, accessibility, and reduced motion.
- State is XState-based; the README's Redux statement is stale and Redux is not a dependency.

## ANTI-PATTERNS (THIS PROJECT)

- Do not add Redux assumptions or document Redux as the active state solution.
- Do not put feature-specific exercise logic in shared UI components.
- Do not bypass the documented WCAG focus, contrast, meaningful-alt, or reduced-motion constraints.
- Do not add tests to an assumed existing test setup: this repository currently has no test runner, test script, or project-owned tests.

## COMMANDS

```bash
bun run dev       # Vite development server
bun run build     # tsc -b && vite build
bun run lint      # oxlint
bun run preview   # Serve the production build
bun run doctor    # react-doctor diagnostic
```

## NOTES

- There is no repository CI workflow and no test command.
- `dist/` is present in the workspace as generated output; source changes belong under `src/` and `public/`.
- The worktree may contain in-progress user changes. Preserve unrelated modifications.

