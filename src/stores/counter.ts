import { assign, createMachine } from "xstate";
import type { ExerciseStrategy, JointMetrics } from "@/types/exercise";

export interface BaseExerciseContext {
  reps: number;
  formError: string | null;
  strategy: ExerciseStrategy;
}

export type BaseExerciseEvent =
  | { type: "POSE_UPDATED"; metrics: JointMetrics }
  | { type: "CHANGE_EXERCISE"; strategy: ExerciseStrategy }
  | { type: "RESET" };

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
            POSE_UPDATED: {
              target: "ready",
              guard: "isReadyPosition",
            },
          },
        },
        ready: {
          entry: "clearError",
          on: {
            POSE_UPDATED: [
              { target: "searching", guard: "isPoseLost" },
              { target: "flexion", guard: "isFlexionStarted" },
            ],
          },
        },
        flexion: {
          on: {
            POSE_UPDATED: [
              { target: "searching", guard: "isPoseLost" },
              { target: "bottom", guard: "isBottomReached" },
              { target: "ready", guard: "isAbortedMovement" },
              { actions: "checkForm" },
            ],
          },
        },
        bottom: {
          on: {
            POSE_UPDATED: [
              { target: "searching", guard: "isPoseLost" },
              { target: "extension", guard: "isExtensionStarted" },
            ],
          },
        },
        extension: {
          on: {
            POSE_UPDATED: [
              { target: "searching", guard: "isPoseLost" },
              {
                target: "ready",
                guard: "isFullyExtendedAndInForm",
                actions: "incrementReps",
              },
              {
                actions: "checkForm",
              },
            ],
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
          event.metrics.primaryAngle >= context.strategy.lockoutThreshold,

        isPoseLost: ({ event }) =>
          event.type === "POSE_UPDATED" && event.metrics.confidence <= 0.5,

        isFlexionStarted: ({ context, event }) =>
          event.type === "POSE_UPDATED" &&
          event.metrics.primaryAngle < context.strategy.lockoutThreshold,

        isBottomReached: ({ context, event }) =>
          event.type === "POSE_UPDATED" &&
          event.metrics.primaryAngle <= context.strategy.depthThreshold,

        isExtensionStarted: ({ context, event }) =>
          event.type === "POSE_UPDATED" &&
          event.metrics.primaryAngle > context.strategy.ascentThreshold,

        isFullyExtendedAndInForm: ({ context, event }) =>
          event.type === "POSE_UPDATED" &&
          event.metrics.primaryAngle >= context.strategy.lockoutThreshold &&
          (context.formError === null
            ? event.metrics.alignmentError <= 0.07
            : event.metrics.alignmentError < 0.05),

        isAbortedMovement: ({ context, event }) =>
          event.type === "POSE_UPDATED" &&
          event.metrics.primaryAngle > context.strategy.lockoutThreshold - 5,
      },
      actions: {
        incrementReps: assign({ reps: ({ context }) => context.reps + 1 }),
        clearError: assign({ formError: () => null }),
        checkForm: assign({
          formError: ({ context, event }) => {
            if (event.type !== "POSE_UPDATED") {
              return context.formError;
            }

            const validationError = context.strategy.validateForm(
              event.metrics,
            );
            if (validationError) return validationError;
            return event.metrics.alignmentError < 0.05
              ? null
              : context.formError;
          },
        }),
      },
    },
  );
