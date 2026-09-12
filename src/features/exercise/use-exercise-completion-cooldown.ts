import { useEffect, useRef, useState, type RefObject } from "react";

import {
  clearExerciseCooldown,
  readExerciseCooldownDeadline,
  saveExerciseCooldown,
} from "@/lib/exercise-session";

interface CompletionCooldownOptions {
  readonly pause: () => void;
  readonly sessionReps: number;
}

export interface ExerciseCompletionCooldown {
  readonly countdown: string;
  readonly isCooldownActive: boolean;
  readonly onRenew: () => void;
  readonly remainingCooldownMs: number;
  readonly renewButtonRef: RefObject<HTMLButtonElement | null>;
}

export function useExerciseCompletionCooldown({
  pause,
  sessionReps,
}: CompletionCooldownOptions): ExerciseCompletionCooldown {
  const [cooldownDeadline, setCooldownDeadline] = useState(
    readExerciseCooldownDeadline,
  );
  const [remainingCooldownMs, setRemainingCooldownMs] = useState(() =>
    Math.max(0, (cooldownDeadline ?? 0) - Date.now()),
  );
  const renewButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (sessionReps < 30) return;

    pause();
    if (cooldownDeadline !== null) return;

    const deadline = Date.now() + 2 * 60 * 1000;
    saveExerciseCooldown(deadline);
    const updateDialog = window.setTimeout(() => {
      setCooldownDeadline(deadline);
    });
    return () => window.clearTimeout(updateDialog);
  }, [cooldownDeadline, pause, sessionReps]);

  useEffect(() => {
    if (cooldownDeadline === null) return;

    const updateRemainingTime = () => {
      setRemainingCooldownMs(Math.max(0, cooldownDeadline - Date.now()));
    };
    updateRemainingTime();
    const interval = window.setInterval(updateRemainingTime, 1_000);
    renewButtonRef.current?.focus();

    const preventDismissal = (event: KeyboardEvent) => {
      if (event.key === "Escape") event.preventDefault();
      if (event.key === "Tab") {
        event.preventDefault();
        renewButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", preventDismissal);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("keydown", preventDismissal);
    };
  }, [cooldownDeadline]);

  const onRenew = () => {
    if (cooldownDeadline === null || Date.now() < cooldownDeadline) return;
    clearExerciseCooldown();
    window.location.reload();
  };

  const remainingSeconds = Math.ceil(remainingCooldownMs / 1_000);
  const remainingMinutes = Math.floor(remainingSeconds / 60);

  return {
    countdown: `${String(remainingMinutes).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`,
    isCooldownActive: cooldownDeadline !== null,
    onRenew,
    remainingCooldownMs,
    renewButtonRef,
  };
}
