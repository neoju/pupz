import { CircleAlert, LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router";

import "./exercise-initialization-dialog.css";

interface ExerciseInitializationDialogProps {
  readonly cameraError: string | null;
  readonly isOpen: boolean;
}

export function ExerciseInitializationDialog({
  cameraError,
  isOpen,
}: ExerciseInitializationDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
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
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="exercise-initialization-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-initialization-title"
      aria-describedby="exercise-initialization-description"
    >
      <div
        ref={dialogRef}
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
  );
}
