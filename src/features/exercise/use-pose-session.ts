import { useEffect, useState, type RefObject } from "react";
import { createActor } from "xstate";

import { pushupStrategy } from "@/lib/exercises";
import { counterMachine } from "@/stores/counter";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type {
  PoseConnection,
  PoseWorkerRequest,
  PoseWorkerResponse,
} from "./pose-worker-protocol";

interface PoseSessionSnapshot {
  readonly reps: number;
  readonly machineState: string;
  readonly formError: string | null;
  readonly isLoaded: boolean;
  readonly cameraError: string | null;
}

const initialSnapshot: PoseSessionSnapshot = {
  reps: 0,
  machineState: "searching",
  formError: null,
  isLoaded: false,
  cameraError: null,
};

const assertNever = (value: never): never => {
  throw new Error(`Unhandled pose worker message: ${String(value)}`);
};

export function usePoseSession(
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
): PoseSessionSnapshot {
  const [snapshot, setSnapshot] = useState<PoseSessionSnapshot>(initialSnapshot);

  useEffect(() => {
    const actor = createActor(counterMachine(pushupStrategy));
    const worker = new Worker(
      new URL("./pose-landmarker.worker.ts", import.meta.url),
      { type: "module" },
    );
    let animationFrameId = 0;
    let mediaStream: MediaStream | null = null;
    let isCancelled = false;
    let isWorkerFailed = false;
    let isFramePending = false;
    let lastVideoTime = -1;
    let connections: readonly PoseConnection[] = [];
    let resolveWorkerReady: (() => void) | null = null;
    let rejectWorkerReady: ((reason: unknown) => void) | null = null;
    const workerReady = new Promise<void>((resolve, reject) => {
      resolveWorkerReady = resolve;
      rejectWorkerReady = reject;
    });

    const stopMediaStream = () => {
      mediaStream?.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    };

    const fail = (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "We could not prepare the camera.";
      setSnapshot((current) => ({ ...current, cameraError: message }));
    };

    const drawPose = (landmarks: readonly NormalizedLandmark[]) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      const video = videoRef.current;

      if (!canvas || !context || !video) return;

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = "#ffffff";
      context.lineWidth = 3;
      context.beginPath();

      for (const connection of connections) {
        const start = landmarks[connection.start];
        const end = landmarks[connection.end];

        if (!start || !end) continue;

        context.moveTo(start.x * canvas.width, start.y * canvas.height);
        context.lineTo(end.x * canvas.width, end.y * canvas.height);
      }

      context.stroke();
      context.fillStyle = "#ffffff";

      for (const landmark of landmarks) {
        context.beginPath();
        context.arc(
          landmark.x * canvas.width,
          landmark.y * canvas.height,
          4,
          0,
          Math.PI * 2,
        );
        context.fill();
      }
    };

    const predictWebcam = () => {
      const video = videoRef.current;

      if (
        video &&
        video.currentTime !== lastVideoTime &&
        !isFramePending &&
        !isWorkerFailed
      ) {
        lastVideoTime = video.currentTime;
        isFramePending = true;

        void createImageBitmap(video)
          .then((frame) => {
            if (isCancelled) {
              frame.close();
              isFramePending = false;
              return;
            }

            const message: Extract<PoseWorkerRequest, { type: "FRAME" }> = {
              type: "FRAME",
              frame,
              timestamp: performance.now(),
            };

            try {
              worker.postMessage(message, [frame]);
            } catch (error: unknown) {
              frame.close();
              throw error;
            }
          })
          .catch((error: unknown) => {
            isWorkerFailed = true;
            isFramePending = false;
            if (!isCancelled) fail(error);
          });
      }

      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    const subscription = actor.subscribe((next) => {
      setSnapshot((current) => ({
        ...current,
        reps: next.context.reps,
        machineState: String(next.value),
        formError: next.context.formError,
      }));
    });

    worker.onmessage = (event: MessageEvent<PoseWorkerResponse>) => {
      const response = event.data;

      switch (response.type) {
        case "READY":
          connections = response.connections;
          resolveWorkerReady?.();
          break;
        case "RESULT":
          isFramePending = false;
          drawPose(response.landmarks);
          actor.send({ type: "POSE_UPDATED", metrics: response.metrics });
          break;
        case "ERROR":
          isWorkerFailed = true;
          isFramePending = false;
          rejectWorkerReady?.(new Error(response.message));
          if (!isCancelled) fail(new Error(response.message));
          break;
        default:
          assertNever(response);
      }
    };

    worker.onerror = (event) => {
      const error = new Error(event.message || "Pose worker failed.");
      isWorkerFailed = true;
      isFramePending = false;
      rejectWorkerReady?.(error);
      if (!isCancelled) fail(error);
    };

    const initialize = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera access is not available in this browser.");
        }

        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });

        if (isCancelled) {
          stopMediaStream();
          return;
        }

        actor.start();
        worker.postMessage({ type: "INITIALIZE" });
        await workerReady;

        if (isCancelled) return;

        const video = videoRef.current;
        if (!video) throw new Error("Camera preview is unavailable.");

        video.srcObject = mediaStream;
        video.onloadedmetadata = () => {
          void video.play();
          setSnapshot((current) => ({ ...current, isLoaded: true }));
          predictWebcam();
        };
      } catch (error: unknown) {
        stopMediaStream();
        if (!isCancelled) fail(error);
      }
    };

    initialize();

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animationFrameId);
      subscription.unsubscribe();
      actor.stop();
      worker.postMessage({ type: "CLOSE" });
      worker.terminate();
      stopMediaStream();
    };
  }, [canvasRef, videoRef]);

  return snapshot;
}
