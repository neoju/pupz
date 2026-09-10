import { useEffect, useRef, useState } from "react";

import { createSpeechController, type SpeechController } from "./speech-controller";

type SpeechSessionControls = {
  readonly speechEnabled: boolean;
  readonly toggleSpeech: () => void;
};

export function useSpeechSession(
  initialReps: number,
  reps: number,
  formError: string | null,
): SpeechSessionControls {
  const controllerRef = useRef<SpeechController | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  useEffect(() => {
    const controller = createSpeechController(initialReps);
    controllerRef.current = controller;
    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, [initialReps]);

  useEffect(() => {
    controllerRef.current?.announceCount(reps);
  }, [reps]);

  useEffect(() => {
    if (warningTimerRef.current !== null) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }

    if (formError === null) {
      controllerRef.current?.clearWarning();
      return;
    }

    warningTimerRef.current = setTimeout(() => {
      warningTimerRef.current = null;
      controllerRef.current?.announceWarning(formError);
    }, 1_000);

    return () => {
      if (warningTimerRef.current !== null) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
    };
  }, [formError]);

  return {
    speechEnabled,
    toggleSpeech: () => {
      setSpeechEnabled((current) => {
        const next = !current;
        controllerRef.current?.setEnabled(next);
        return next;
      });
    },
  };
}
