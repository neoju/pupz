import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getExerciseHistorySummary,
  recordPushups,
} from "@/lib/exercise-history";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";

import { ExerciseInitializationDialog } from "../components/exercise-initialization-dialog";
import { useAudioSession } from "../use-audio-session";
import { usePoseSession } from "../use-pose-session";

import "./push-up.css";
import "./push-up-overlay.css";
import "./push-up-responsive.css";

export default function Page() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [startingSummary] = useState(() => getExerciseHistorySummary());
  const { today: startingReps } = startingSummary;

  const { reps, formError, isLoaded, cameraError, isRunning, toggleRunning } =
    usePoseSession(videoRef, canvasRef);
  const { speechEnabled, toggleSpeech } = useAudioSession(
    startingReps,
    reps,
    formError,
    isRunning,
  );
  const [hasStarted, setHasStarted] = useState(false);
  const completedRepsRef = useRef(0);

  useEffect(() => {
    completedRepsRef.current = reps;
  }, [reps]);

  useEffect(
    () => () => {
      recordPushups(
        Math.max(0, completedRepsRef.current - startingReps),
      );
    },
    [startingReps],
  );

  const sessionReps = Math.max(0, reps - startingReps);
  const progress = Math.min(sessionReps / 30, 1);
  const repDisplay = sessionReps == 0 ? "0" : String(sessionReps).padStart(2, "0");
  const canStart = isLoaded && cameraError === null;
  const guidance = cameraError
    ?? (!isLoaded
      ? "warming up the tracker"
      : !isRunning
        ? (hasStarted ? "paused — press play to resume" : "press start when ready")
        : (formError ?? "hold your line"));

  const handleToggleRunning = () => {
    if (!isRunning) setHasStarted(true);
    toggleRunning();
  };

  return (
    <section
      className="exercise-page"
      aria-labelledby="exercise-title"
      aria-busy={!isLoaded}
    >
      <h1 id="exercise-title" className="sr-only">
        Daily push-up challenge
      </h1>

      <div className="exercise-stage relative">
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
        <div className="exercise-frame" aria-hidden="true" />

        {!isRunning && cameraError === null && (
          <div className="exercise-paused-screen" aria-hidden="true">
            <span className="exercise-paused-ring" />
            <span className="exercise-paused-ring" />
          </div>
        )}
        <div className="exercise-topbar z-30">
          <div>
            <Button className={cn("size-fit z-10 hover:cursor-pointer", !isRunning && "hidden")}
              variant="ghost"
              type="button"
              aria-label="Pause session"
              onClick={handleToggleRunning}
            >
              <Pause className="size-8 -ml-5" aria-hidden="true" />
            </Button>
          </div>

          <span className="exercise-brand" aria-label="pupz">
            <Logo />
          </span>

          <div className="exercise-metric exercise-streak">
            <p
              className="exercise-live-status"
              data-live={isLoaded && isRunning}
              aria-live="polite"
            >
              <span aria-hidden="true" />
              {cameraError
                ? "Camera unavailable"
                : !isLoaded
                  ? "Warming up"
                  : isRunning
                    ? "Tracking live"
                    : hasStarted
                      ? "Paused"
                      : "Ready"}
            </p>
          </div>
        </div>

        <Button className={cn("absolute z-10 inset-0 size-fit m-auto hover:cursor-pointer", isRunning && "hidden")}
          variant="ghost"
          type="button"
          aria-label={hasStarted ? "Resume session" : "Start session"}
          onClick={handleToggleRunning}
          disabled={!canStart}
        >
          <Play className="size-20" aria-hidden="true" />
        </Button>

        <p
          className="exercise-guidance"
          aria-live="polite"
          data-warning={isRunning && Boolean(formError)}
        >
          {guidance}
        </p>

        <div className="exercise-bottom-bar" aria-label="Push-up session status">
          <Button
            className="exercise-speech-control"
            size="icon-lg"
            aria-label={speechEnabled ? "Disable voice coaching" : "Enable voice coaching"}
            aria-pressed={speechEnabled}
            onClick={toggleSpeech}
          >
            {speechEnabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
          </Button>

          <div className="exercise-rep-readout">
            <span className="exercise-rep-label">reps</span>
            <strong>
              <span>{repDisplay}</span>
              <em>/ 30</em>
            </strong>
            <div
              className="exercise-progress"
              role="progressbar"
              aria-label="Push-up set progress"
              aria-valuemin={0}
              aria-valuemax={30}
              aria-valuenow={sessionReps}
            >
              <span style={{ transform: `scaleX(${progress})` }} />
            </div>
          </div>
        </div>

      </div>

      <ExerciseInitializationDialog
        cameraError={cameraError}
        isOpen={!isLoaded || cameraError !== null}
      />
    </section>
  );
}
