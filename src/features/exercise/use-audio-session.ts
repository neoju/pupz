import { useEffect, useRef, useState } from "react";

import { getAudioAssetPath } from "@/lib/audio";
import { POSE_DETECTION_ERROR } from "@/lib/constants";

const MAX_REPS = 30;
const WARNING_DELAY_MS = 1_000;
const WARNING_COOLDOWN_MS = 4_000;

type AudioKind = "COUNT" | "WARNING";

type AudioItem = {
  readonly kind: AudioKind;
  readonly source: string;
};

type AudioController = {
  announceCount: (reps: number) => void;
  announceWarning: (message: string) => void;
  clearWarning: () => void;
  setEnabled: (enabled: boolean) => void;
  dispose: () => void;
};

type AudioSessionControls = {
  readonly speechEnabled: boolean;
  readonly toggleSpeech: () => void;
};

const getWarningSource = (message: string): string | null => {
  const match = Object.entries(POSE_DETECTION_ERROR).find(
    ([, text]) => text === message,
  );
  return match === undefined
    ? null
    : getAudioAssetPath("warnings", match[0]);
};

const createAudioController = (initialReps: number): AudioController => {
  const audio = new Audio();
  let previousReps = initialReps;
  let previousWarning: string | null = null;
  let warningAvailableAt = 0;
  let pendingWarning: AudioItem | null = null;
  let activeKind: AudioKind | null = null;
  let enabled = true;
  let disposed = false;

  const finish = () => {
    activeKind = null;
    if (pendingWarning === null || !enabled || disposed) return;
    const nextWarning = pendingWarning;
    pendingWarning = null;
    start(nextWarning);
  };

  const start = (item: AudioItem) => {
    activeKind = item.kind;
    audio.src = item.source;
    void audio.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.warn("Audio coaching unavailable:", error);
      finish();
    });
  };

  const stop = () => {
    pendingWarning = null;
    activeKind = null;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  };

  audio.addEventListener("ended", finish);
  audio.addEventListener("error", finish);

  return {
    announceCount(reps): void {
      const isNewCount = reps === previousReps + 1;
      previousReps = reps;
      if (!isNewCount || reps < 1 || reps > MAX_REPS || !enabled) return;

      stop();
      start({
        kind: "COUNT",
        source: getAudioAssetPath("counts", `COUNT_${reps}`),
      });
    },

    announceWarning(message): void {
      const source = getWarningSource(message);
      if (source === null || !enabled) return;

      const isDuplicate = message === previousWarning;
      previousWarning = message;
      const now = Date.now();
      if (isDuplicate || now < warningAvailableAt) return;

      warningAvailableAt = now + WARNING_COOLDOWN_MS;
      const warning: AudioItem = { kind: "WARNING", source };
      if (activeKind !== null) {
        pendingWarning = warning;
        return;
      }
      start(warning);
    },

    clearWarning(): void {
      previousWarning = null;
      warningAvailableAt = 0;
      pendingWarning = null;
      if (activeKind === "WARNING") stop();
    },

    setEnabled(nextEnabled): void {
      enabled = nextEnabled;
      if (!enabled) stop();
    },

    dispose(): void {
      if (disposed) return;
      disposed = true;
      stop();
      audio.removeEventListener("ended", finish);
      audio.removeEventListener("error", finish);
    },
  };
};

export function useAudioSession(
  initialReps: number,
  reps: number,
  formError: string | null,
): AudioSessionControls {
  const controllerRef = useRef<AudioController | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  useEffect(() => {
    const controller = createAudioController(initialReps);
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
    }, WARNING_DELAY_MS);

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
