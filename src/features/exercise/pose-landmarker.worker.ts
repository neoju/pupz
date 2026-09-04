import { PoseLandmarker } from "@mediapipe/tasks-vision";

import {
  extractExerciseMetrics,
  pushupStrategy,
  smoothAlignmentMetrics,
} from "@/lib/exercises";
import { createPoseLandmarker } from "@/lib/vision";
import type {
  PoseWorkerRequest,
  PoseWorkerResponse,
} from "@/features/exercise/pose-worker-protocol";
import type { JointMetrics } from "@/types/exercise";

let landmarker: PoseLandmarker | null = null;
let previousMetrics: JointMetrics | null = null;

const send = (message: PoseWorkerResponse) => self.postMessage(message);

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Pose tracking failed.";

const closeLandmarker = () => {
  landmarker?.close();
  landmarker = null;
  previousMetrics = null;
};

const initialize = async () => {
  if (landmarker) return;

  const canvas = new OffscreenCanvas(1, 1);
  landmarker = await createPoseLandmarker(canvas);
  send({
    type: "READY",
    connections: PoseLandmarker.POSE_CONNECTIONS,
  });
};

const detect = (request: Extract<PoseWorkerRequest, { type: "FRAME" }>) => {
  if (!landmarker) {
    request.frame.close();
    send({ type: "ERROR", message: "Pose tracker is not initialized." });
    return;
  }

  try {
    const result = landmarker.detectForVideo(request.frame, request.timestamp);
    const landmarks = result.landmarks[0] ?? [];
    const rawMetrics = extractExerciseMetrics(landmarks, pushupStrategy.id);
    const metrics = smoothAlignmentMetrics(previousMetrics, rawMetrics);

    previousMetrics = landmarks.length > 0 ? metrics : null;
    send({ type: "RESULT", landmarks, metrics });
  } catch (error: unknown) {
    send({ type: "ERROR", message: getErrorMessage(error) });
  } finally {
    request.frame.close();
  }
};

const assertNever = (value: never): never => {
  throw new Error(`Unhandled pose worker request: ${String(value)}`);
};

const handleMessage = async (event: MessageEvent<PoseWorkerRequest>) => {
  switch (event.data.type) {
    case "INITIALIZE":
      try {
        await initialize();
      } catch (error: unknown) {
        send({ type: "ERROR", message: getErrorMessage(error) });
      }
      break;
    case "FRAME":
      detect(event.data);
      break;
    case "CLOSE":
      closeLandmarker();
      break;
    default:
      assertNever(event.data);
  }
};

self.addEventListener("message", (event: MessageEvent<PoseWorkerRequest>) => {
  void handleMessage(event);
});
