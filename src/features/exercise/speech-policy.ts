import {
  SPEECH_KINDS,
  type SpeechKind,
  type SpeechPhrase,
} from "./speech-cache";

export const SPEECH_POLICY_DROP_REASONS = {
  PRE_READY: "PRE_READY",
  INITIAL_COUNT: "INITIAL_COUNT",
  NON_INCREMENTING_COUNT: "NON_INCREMENTING_COUNT",
  DUPLICATE_WARNING: "DUPLICATE_WARNING",
  CLEARED_WARNING: "CLEARED_WARNING",
  WARNING_COOLDOWN: "WARNING_COOLDOWN",
} as const;

export type SpeechPolicyDropReason =
  (typeof SPEECH_POLICY_DROP_REASONS)[keyof typeof SPEECH_POLICY_DROP_REASONS];

export type SpeechPolicyDecision =
  | { readonly kind: "ANNOUNCE"; readonly speechKind: SpeechKind; readonly phrase: SpeechPhrase }
  | { readonly kind: "DROP"; readonly reason: SpeechPolicyDropReason };

export interface SpeechPhrasePolicy {
  markReady(): void;
  observeCount(reps: number): SpeechPolicyDecision;
  observeWarning(formError: string | null): SpeechPolicyDecision;
  clearWarning(): void;
}

export function createSpeechPhrasePolicy(
  initialReps: number,
  voice: string,
  speed: number,
): SpeechPhrasePolicy {
  let ready = false;
  let previousReps = initialReps;
  let previousWarning: string | null = null;
  let warningAvailableAt = 0;

  const drop = (reason: SpeechPolicyDropReason): SpeechPolicyDecision => ({
    kind: "DROP",
    reason,
  });

  const announce = (speechKind: SpeechKind, text: string): SpeechPolicyDecision => ({
    kind: "ANNOUNCE",
    speechKind,
    phrase: { text, voice, speed },
  });

  return {
    markReady(): void {
      ready = true;
    },

    observeCount(reps): SpeechPolicyDecision {
      const isNewCount = reps === previousReps + 1;
      previousReps = reps;
      if (!ready) {
        return drop(SPEECH_POLICY_DROP_REASONS.PRE_READY);
      }
      if (!isNewCount) {
        return drop(
          reps === initialReps
            ? SPEECH_POLICY_DROP_REASONS.INITIAL_COUNT
            : SPEECH_POLICY_DROP_REASONS.NON_INCREMENTING_COUNT,
        );
      }
      return announce(SPEECH_KINDS.COUNT, String(reps));
    },

    observeWarning(formError): SpeechPolicyDecision {
      if (formError === null) {
        previousWarning = null;
        warningAvailableAt = 0;
        return drop(SPEECH_POLICY_DROP_REASONS.CLEARED_WARNING);
      }
      const isDuplicate = formError === previousWarning;
      previousWarning = formError;
      if (!ready) {
        return drop(SPEECH_POLICY_DROP_REASONS.PRE_READY);
      }
      if (isDuplicate) {
        return drop(SPEECH_POLICY_DROP_REASONS.DUPLICATE_WARNING);
      }
      if (Date.now() < warningAvailableAt) {
        return drop(SPEECH_POLICY_DROP_REASONS.WARNING_COOLDOWN);
      }
      warningAvailableAt = Date.now() + 4_000;
      return announce(SPEECH_KINDS.WARNING, formError);
    },

    clearWarning(): void {
      previousWarning = null;
      warningAvailableAt = 0;
    },
  };
}
