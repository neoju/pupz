import { assign, createMachine } from "xstate";
import type { ExerciseStrategy, JointMetrics } from "@/types/exercise";

export const REP_COOLDOWN_MS = 800;

export interface BaseExerciseContext {
  reps: number;
  formError: string | null;
  strategy: ExerciseStrategy;
}

export type BaseExerciseEvent =
  | { type: "POSE_UPDATED"; metrics: JointMetrics }
  | { type: "CHANGE_EXERCISE"; strategy: ExerciseStrategy }
  | { type: "RESET" };

const isCurrentFormValid = (
  context: BaseExerciseContext,
  event: BaseExerciseEvent,
) =>
  event.type === "POSE_UPDATED" &&
  context.strategy.validateForm(event.metrics) === null;

export const counterMachine = (initialStrategy: ExerciseStrategy) =>
  createMachine(
    {
      id: "BaseExerciseCounter",
      types: {} as {
        context: BaseExerciseContext;
        events: BaseExerciseEvent;
      },
      context: {
        reps: 0,
        formError: "",
        strategy: initialStrategy,
      },
      initial: "searching",
      states: {
        searching: {
          on: {
            POSE_UPDATED: [
              { guard: "isPoseLost", actions: "checkForm" },
              { target: "ready", guard: "isReadyPosition" },
              { actions: "checkForm" },
            ],
          },
        },
        ready: {
          entry: "clearError",
          on: {
            POSE_UPDATED: [
              { target: "searching", guard: "isPoseLost", actions: "checkForm" },
              { target: "flexion", guard: "isFlexionStarted" },
              { actions: "checkForm" },
            ],
          },
        },
        flexion: {
          on: {
            POSE_UPDATED: [
              { target: "searching", guard: "isPoseLost", actions: "checkForm" },
              { target: "bottom", guard: "isBottomReached" },
              { target: "ready", guard: "isAbortedMovement" },
              { actions: "checkForm" },
            ],
          },
        },
        bottom: {
          on: {
            POSE_UPDATED: [
              { target: "searching", guard: "isPoseLost", actions: "checkForm" },
              { target: "extension", guard: "isExtensionStarted" },
              { actions: "checkForm" },
            ],
          },
        },
        extension: {
          on: {
            POSE_UPDATED: [
              { target: "searching", guard: "isPoseLost", actions: "checkForm" },
              {
                target: "cooldown",
                guard: "isFullyExtendedAndInForm",
                actions: "incrementReps",
              },
              {
                actions: "checkForm",
              },
            ],
          },
        },
        cooldown: {
          on: {
            POSE_UPDATED: [
              { target: "searching", guard: "isPoseLost", actions: "checkForm" },
              { actions: "checkForm" },
            ],
          },
          after: {
            REP_COOLDOWN: "ready",
          },
        },
      },
      on: {
        RESET: {
          target: ".searching",
          actions: assign({
            reps: 0,
            formError: null,
          }),
        },
        CHANGE_EXERCISE: {
          target: ".searching",
          actions: assign({
            strategy: ({ event }) => event.strategy,
            reps: 0,
            formError: null,
          }),
        },
      },
    },
    {
      guards: {
        isReadyPosition: ({ context, event }) =>
          event.type === "POSE_UPDATED" &&
          event.metrics.confidence > 0.6 &&
          event.metrics.primaryAngle >= context.strategy.lockoutThreshold &&
          isCurrentFormValid(context, event),

        isPoseLost: ({ event }) =>
          event.type === "POSE_UPDATED" && event.metrics.confidence <= 0.5,

        isFlexionStarted: ({ context, event }) =>
          event.type === "POSE_UPDATED" &&
          event.metrics.primaryAngle < context.strategy.lockoutThreshold &&
          isCurrentFormValid(context, event),

        isBottomReached: ({ context, event }) =>
          event.type === "POSE_UPDATED" &&
          event.metrics.primaryAngle <= context.strategy.depthThreshold &&
          isCurrentFormValid(context, event),

        isExtensionStarted: ({ context, event }) =>
          event.type === "POSE_UPDATED" &&
          event.metrics.primaryAngle > context.strategy.ascentThreshold &&
          isCurrentFormValid(context, event),

        isFullyExtendedAndInForm: ({ context, event }) =>
          event.type === "POSE_UPDATED" &&
          event.metrics.primaryAngle >= context.strategy.lockoutThreshold &&
          isCurrentFormValid(context, event),

        isAbortedMovement: ({ context, event }) =>
          event.type === "POSE_UPDATED" &&
          event.metrics.primaryAngle > context.strategy.lockoutThreshold - 5 &&
          isCurrentFormValid(context, event),
      },
      actions: {
        incrementReps: assign({ reps: ({ context }) => context.reps + 1 }),
        clearError: assign({ formError: () => null }),
        checkForm: assign({
          formError: ({ context, event }) =>
            event.type === "POSE_UPDATED"
              ? context.strategy.validateForm(event.metrics)
              : context.formError,
        }),
      },
      delays: {
        REP_COOLDOWN: REP_COOLDOWN_MS,
      },
    },
  );
