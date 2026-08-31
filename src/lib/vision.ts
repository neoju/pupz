import { PoseLandmarker, type FilesetResolver } from "@mediapipe/tasks-vision";

const visionWasmUrl =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

type VisionFileset = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;

let visionPromise: Promise<VisionFileset> | null = null;

export function preloadVision(): Promise<VisionFileset> {
  visionPromise ??= import("@mediapipe/tasks-vision")
    .then(({ FilesetResolver: resolver }) =>
      resolver.forVisionTasks(visionWasmUrl),
    )
    .catch((error: unknown) => {
      visionPromise = null;
      throw error;
    });

  return visionPromise;
}

export async function getLandmaker() {
  const vision = await preloadVision();

  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
  });
}
