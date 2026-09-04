import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

const visionWasmUrl =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

type VisionFileset = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;

let visionPromise: Promise<VisionFileset> | null = null;

function loadVisionFileset(): Promise<VisionFileset> {
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

export async function createPoseLandmarker(canvas: OffscreenCanvas) {
  const vision = await loadVisionFileset();

  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
      delegate: "GPU",
    },
    canvas,
    runningMode: "VIDEO",
    numPoses: 1,
  });
}
