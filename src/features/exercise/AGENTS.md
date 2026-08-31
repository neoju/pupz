# EXERCISE FEATURE

## OVERVIEW

The exercise feature owns the browser-based push-up session at `/exercise/push-up`, including camera capture, pose visualization, HUD, and session cleanup.

## STRUCTURE

```text
exercise/
├── pages/push-up.tsx  # Camera/session integration surface
├── pages/push-up.css  # Camera stage and responsive HUD styles
├── routes.tsx         # Lazy route definition
└── index.ts            # Public route export
```

## WHERE TO LOOK

- `pages/push-up.tsx` coordinates `getUserMedia`, animation frames, canvas drawing, MediaPipe metrics, and the XState actor.
- `pages/push-up.css` contains the edge-to-edge mobile and split desktop session layout.
- `routes.tsx` is the lazy-loading boundary consumed by `src/app/router.tsx`.
- Exercise geometry and validation live in `src/lib/exercises.ts`; MediaPipe setup lives in `src/lib/vision.ts`.

## CONVENTIONS

- Treat the video and pose canvas as separate layers; canvas is decorative and session status must remain text-visible.
- Expose progress with accessible progress semantics and keep exit navigation semantic.
- On every session lifecycle change, account for camera tracks, animation frames, actor subscriptions, and landmarker disposal.
- Preserve mirrored video behavior, responsive stage sizing, and reduced-motion rules documented in `DESIGN.md`.

## ANTI-PATTERNS

- Do not initialize MediaPipe independently from the shared vision driver.
- Do not leave camera tracks, RAF callbacks, or actors running after unmount.
- Do not make pose/canvas visuals the only source of exercise status.

