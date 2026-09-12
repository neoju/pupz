import type { RefObject } from "react";
import { RotateCcw, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ExerciseCompletionDialogProps {
  readonly countdown: string;
  readonly onRenew: () => void;
  readonly remainingCooldownMs: number;
  readonly renewButtonRef: RefObject<HTMLButtonElement | null>;
}

export function ExerciseCompletionDialog({
  countdown,
  onRenew,
  remainingCooldownMs,
  renewButtonRef,
}: ExerciseCompletionDialogProps) {
  return (
    <div
      className="exercise-completion-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-completion-title"
      aria-describedby="exercise-completion-description exercise-cooldown-status"
    >
      <div className="exercise-completion-dialog">
        <Trophy aria-hidden="true" />
        <p className="exercise-eyebrow">Session complete</p>
        <h2 id="exercise-completion-title">Congratulations</h2>
        <p id="exercise-completion-description">
          30 reps is enough for this session. Take two minutes to recover
          before you renew.
        </p>
        <p
          id="exercise-cooldown-status"
          className="exercise-cooldown-status"
          aria-live="polite"
        >
          <span>Ready in</span>
          <strong>{countdown}</strong>
        </p>
        <Button
          ref={renewButtonRef}
          type="button"
          onClick={onRenew}
          disabled={remainingCooldownMs > 0}
        >
          <RotateCcw aria-hidden="true" />
          Renew session
        </Button>
      </div>
    </div>
  );
}
