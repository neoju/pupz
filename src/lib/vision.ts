import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

const visionWasmUrl = new URL("/wasm", self.location.origin).href;

type VisionFileset = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;

let visionPromise: Promise<VisionFileset> | null = null;

function loadVisionFileset(): Promise<VisionFileset> {
  visionPromise ??= FilesetResolver.forVisionTasks(visionWasmUrl, true).catch(
    (error: unknown) => {
      visionPromise = null;
      throw error;
    },
  );

  return visionPromise;
}

export async function createPoseLandmarker(canvas: OffscreenCanvas) {
  const vision = await loadVisionFileset();

  const options = {
    baseOptions: {
      modelAssetPath: "/pose_landmarker_lite.task",
      delegate: "GPU" as const,
    },
    canvas,
    runningMode: "VIDEO" as const,
    numPoses: 1,
  };

  try {
    return await PoseLandmarker.createFromOptions(vision, options);
  } catch (gpuError: unknown) {
    console.warn("MediaPipe GPU initialization failed; using CPU.", gpuError);
    return PoseLandmarker.createFromOptions(vision, {
      ...options,
      baseOptions: {
        ...options.baseOptions,
        delegate: "CPU",
      },
      canvas: undefined,
    });
  }
}
