import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import {
  getExerciseHistorySummary,
  recordPushups,
} from "@/lib/exercise-history";

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
  const { today: startingReps, currentStreak } = startingSummary;

  const { reps, formError, isLoaded, cameraError } =
    usePoseSession(videoRef, canvasRef);
  const { speechEnabled, toggleSpeech } = useAudioSession(
    startingReps,
    reps,
    formError,
  );
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

  const progress = Math.min(reps / 30, 1);
  const weekTotal = startingSummary.currentWeek + Math.max(0, reps - startingReps);
  const repDisplay = String(reps).padStart(2, "0");

  return (
    <section
      className="exercise-page"
      aria-labelledby="exercise-title"
      aria-busy={!isLoaded}
    >
      <h1 id="exercise-title" className="sr-only">
        Daily push-up challenge
      </h1>

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
        <div className="exercise-frame" aria-hidden="true" />

        <div className="exercise-topbar">
          <div className="exercise-metric exercise-week-total">
            <span>total in week</span>
            <strong>{weekTotal}</strong>
            <Link className="exercise-exit" to="/" aria-label="Exit session">
              <ArrowLeft aria-hidden="true" />
              <span>Exit</span>
            </Link>
          </div>

          <span className="exercise-brand" aria-label="pupz">
            pupz
          </span>

          <div className="exercise-metric exercise-streak">
            <span>daily streak</span>
            <strong>{currentStreak}</strong>
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
        </div>

        <div
          className="exercise-tracking-marker"
          data-live={isLoaded}
          aria-hidden="true"
        >
          <span className="exercise-marker-ring" />
          <span className="exercise-marker-ring" />
          <span className="exercise-marker-core" />
        </div>

        <p
          className="exercise-guidance"
          aria-live="polite"
          data-warning={Boolean(formError)}
        >
          {formError ?? "hold your line"}
        </p>

        <div className="exercise-bottom-bar" aria-label="Push-up session status">
          <button
            className="exercise-speech-control"
            type="button"
            aria-pressed={speechEnabled}
            aria-label={speechEnabled ? "Mute voice coaching" : "Enable voice coaching"}
            title={speechEnabled ? "Mute voice coaching" : "Enable voice coaching"}
            onClick={toggleSpeech}
          >
            {speechEnabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
            <span className="sr-only">{speechEnabled ? "Voice on" : "Voice off"}</span>
          </button>

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
              aria-valuenow={reps}
            >
              <span style={{ transform: `scaleX(${progress})` }} />
            </div>
          </div>
        </div>
      </div>

      <ExerciseInitializationDialog
        cameraError={cameraError}
        isOpen={!isLoaded}
      />
    </section>
  );
}
