import { ArrowLeft, Check, CircleAlert, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { createActor } from "xstate";

import { DrawingUtils, PoseLandmarker } from "@mediapipe/tasks-vision";
import {
  extractExerciseMetrics,
  pushupStrategy,
  smoothAlignmentMetrics,
} from "@/lib/exercises";
import { getLandmaker } from "@/lib/vision";
import { counterMachine } from "@/stores/counter";
import type { JointMetrics } from "@/types/exercise";

import "./push-up.css";

export default function Page() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const initializationDialogRef = useRef<HTMLDivElement | null>(null);

  // App UI States
  const [reps, setReps] = useState<number>(0);
  const [machineState, setMachineState] = useState<string>("searching");
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let animFrameId = 0;
    let landmarker: PoseLandmarker | null = null;
    let mediaStream: MediaStream | null = null;
    let isCancelled = false;
    let previousMetrics: JointMetrics | null = null;

    // A. Initialize XState Actor
    const actor = createActor(counterMachine(pushupStrategy));
    const subscription = actor.subscribe((snapshot) => {
      setReps(snapshot.context.reps);
      setMachineState(String(snapshot.value));
      setFormError(snapshot.context.formError);
    });
    actor.start();

    // B. Setup MediaPipe Tasks Vision & Camera
    const initializeTracker = async () => {
      try {
        if (isCancelled) return;

        const landmarkerGetter = getLandmaker();

        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError("Camera access is not available in this browser.");
          return;
        }

        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });

        landmarker = await landmarkerGetter;

        if (isCancelled) return;

        const video = videoRef.current;

        if (!video) return;

        video.srcObject = mediaStream;
        video.onloadedmetadata = () => {
          void video.play();
          setIsLoaded(true);
          predictWebcam();
        };
      } catch (error: unknown) {
        if (!isCancelled) {
          setCameraError(
            error instanceof Error
              ? error.message
              : "We could not prepare the camera.",
          );
        }
      }
    };

    // C. Continuous Frame Prediction Loop
    let lastVideoTime = -1;
    const predictWebcam = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && landmarker) {
        const ctx = canvas.getContext("2d");

        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const startTimeMs = performance.now();

          // Run Inference
          const results = landmarker.detectForVideo(video, startTimeMs);

          // Clear Canvas
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const drawingUtils = new DrawingUtils(ctx);

            if (results.landmarks && results.landmarks.length > 0) {
              const landmarks = results.landmarks[0];

              drawingUtils.drawConnectors(
                landmarks,
                PoseLandmarker.POSE_CONNECTIONS,
                { color: "#00FF00", lineWidth: 3 },
              );
              drawingUtils.drawLandmarks(landmarks, {
                color: "#FF0000",
                lineWidth: 1,
                radius: 4,
              });

              const metrics = smoothAlignmentMetrics(
                previousMetrics,
                extractExerciseMetrics(landmarks, "pushup"),
              );
              previousMetrics = metrics;

              actor.send({
                type: "POSE_UPDATED",
                metrics,
              });
            }
          }
        }
      }
      animFrameId = requestAnimationFrame(predictWebcam);
    };

    initializeTracker();

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animFrameId);
      subscription.unsubscribe();
      actor.stop();

      if (landmarker) landmarker.close();
      mediaStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (isLoaded) return;

    const dialog = initializationDialogRef.current;
    if (!dialog) return;

    dialog.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (
        event.shiftKey &&
        (document.activeElement === firstElement ||
          document.activeElement === dialog)
      ) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isLoaded]);

  const progress = Math.min(reps / 30, 1);

  return (
    <section
      className="exercise-page"
      aria-labelledby="exercise-title"
      aria-busy={!isLoaded}
    >
      <div className="exercise-stage">
        <div className="exercise-media">
          <video
            ref={videoRef}
            className="exercise-video"
            playsInline
            muted
            aria-label="Live camera view for push-up tracking"
          />
          <canvas
            ref={canvasRef}
            className="exercise-canvas"
            aria-hidden="true"
          />
        </div>
        <div className="exercise-stage-scrim" aria-hidden="true" />

        <div className="exercise-stage-topline">
          <Link className="exercise-exit" to="/">
            <ArrowLeft aria-hidden="true" />
            Exit session
          </Link>
          <p
            className="exercise-live-status"
            data-live={isLoaded}
            aria-live="polite"
          >
            <span aria-hidden="true" />
            {cameraError
              ? "Camera unavailable"
              : isLoaded
                ? "Tracking live"
                : "Preparing camera"}
          </p>
        </div>

        <div className="exercise-stage-intro">
          <p className="exercise-eyebrow">Daily push-up challenge</p>
          <h1 id="exercise-title">Show up for the set.</h1>
          <p>
            Set your camera at hip height, then keep your whole body in frame.
          </p>
        </div>

        <div className="exercise-stage-footer" aria-hidden="true">
          <span>Push-up / Set 01</span>
          <span>Live form tracking</span>
        </div>
      </div>

      <aside className="exercise-dashboard" aria-label="Push-up session status">
        <div className="exercise-dashboard-heading">
          <div>
            <p className="exercise-eyebrow">Today&apos;s session</p>
            <p className="exercise-dashboard-kicker">One set. Full focus.</p>
          </div>
          <span className="exercise-set-label">SET 01</span>
        </div>

        <div className="exercise-rep-readout">
          <span className="exercise-rep-value">{reps}</span>
          <span className="exercise-rep-goal">/ 30 reps</span>
        </div>

        <div
          className="exercise-progress"
          role="progressbar"
          aria-label="Push-up set progress"
          aria-valuemin={0}
          aria-valuemax={30}
          aria-valuenow={reps}
        >
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>

        <div className="exercise-stat-grid">
          <div>
            <span>Phase</span>
            <strong>{machineState}</strong>
          </div>
          <div>
            <span>Target</span>
            <strong>30 reps</strong>
          </div>
        </div>

        {formError && (
          <div className="exercise-form-warning" role="alert">
            <CircleAlert aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        <div className="exercise-mobile-hud border p-3 rounded-full">
          <span className="exercise-mobile-reps border-r">{reps}</span>
          <span className="exercise-mobile-status">
            <strong>{machineState}</strong>
          </span>
        </div>

        <div className="exercise-coach-note">
          <Check aria-hidden="true" />
          <p>
            Stay side-on and move with control. The goal is consistency, not a
            perfect first set.
          </p>
        </div>
      </aside>

      {!isLoaded && (
        <div
          className="exercise-initialization-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exercise-initialization-title"
          aria-describedby="exercise-initialization-description"
        >
          <div
            ref={initializationDialogRef}
            className="exercise-initialization-dialog"
            tabIndex={-1}
          >
            {cameraError ? (
              <CircleAlert
                className="exercise-initialization-error-icon"
                aria-hidden="true"
              />
            ) : (
              <LoaderCircle
                className="exercise-initialization-spinner"
                aria-hidden="true"
              />
            )}
            <p className="exercise-eyebrow">Session setup</p>
            <h2 id="exercise-initialization-title">
              {cameraError ? "Camera setup failed" : "Calibrating your camera"}
            </h2>
            <p id="exercise-initialization-description">
              {cameraError
                ? cameraError
                : "We're preparing the camera and pose tracking. This usually takes a moment."}
            </p>
            {cameraError && (
              <Link className="exercise-initialization-exit" to="/">
                Exit session
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
