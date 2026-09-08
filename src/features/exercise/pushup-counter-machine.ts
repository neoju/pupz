import { assign, setup } from "xstate";
import type { PushupObservation } from "./pushup-pose";

export const pushupThresholds = {
  topAngle: 145,
  descentAngle: 140,
  bottomAngle: 100,
  ascentAngle: 115,
  stabilityMs: 120,
  maximumGapMs: 333,
  minimumBodyLowering: 0.1,
} as const;

type ValidPose = Extract<PushupObservation, { status: "valid" }>;
type CounterContext = {
  readonly reps: number;
  readonly formError: string | null;
  readonly lastTimestamp: number | null;
  readonly arms: ValidPose["arms"] | null;
  readonly topSince: number | null;
  readonly bottomSince: number | null;
  readonly topSupportHeight: number;
};
type CounterEvent =
  | { readonly type: "POSE_UPDATED"; readonly observation: PushupObservation }
  | { readonly type: "RESET" };

const initialContext: CounterContext = {
  reps: 0,
  formError: null,
  lastTimestamp: null,
  arms: null,
  topSince: null,
  bottomSince: null,
  topSupportHeight: 0,
};
const machineTypes: { context: CounterContext; events: CounterEvent } = {
  context: initialContext,
  events: { type: "RESET" },
};

function observationError(
  context: CounterContext,
  pose: PushupObservation,
): string | null {
  if (
    !Number.isFinite(pose.timestamp) ||
    pose.timestamp < 0 ||
    (context.lastTimestamp !== null && pose.timestamp <= context.lastTimestamp)
  )
    return "Tracking time changed. Hold the top position to restart.";
  if (
    context.lastTimestamp !== null &&
    pose.timestamp - context.lastTimestamp > pushupThresholds.maximumGapMs
  )
    return "Tracking paused. Hold the top position to restart.";
  switch (pose.status) {
    case "invalid":
    case "unobservable":
      return pose.message;
    case "valid":
      if (context.arms !== null && pose.arms !== context.arms)
        return "Tracking view changed. Hold the top position to restart.";
      return null;
  }
}

const isTop = (pose: ValidPose) =>
  pose.elbowAngles.minimum >= pushupThresholds.topAngle;
const isBottom = (pose: ValidPose) =>
  pose.elbowAngles.maximum <= pushupThresholds.bottomAngle;
const stableSince = (since: number | null, timestamp: number) =>
  since !== null && timestamp - since >= pushupThresholds.stabilityMs;

export const pushupCounterMachine = setup({
  types: machineTypes,
  guards: {
    interrupted: ({ context, event }) =>
      event.type === "POSE_UPDATED" &&
      observationError(context, event.observation) !== null,
    stableTop: ({ context, event }) => {
      return event.type === "POSE_UPDATED" &&
        event.observation.status === "valid" &&
        isTop(event.observation) &&
        stableSince(context.topSince, event.observation.timestamp)
    },
    descending: ({ event }) =>
      event.type === "POSE_UPDATED" &&
      event.observation.status === "valid" &&
      event.observation.elbowAngles.maximum <= pushupThresholds.descentAngle,
    stableBottom: ({ context, event }) =>
      event.type === "POSE_UPDATED" &&
      event.observation.status === "valid" &&
      isBottom(event.observation) &&
      stableSince(context.bottomSince, event.observation.timestamp) &&
      context.topSupportHeight - event.observation.supportHeight >=
      pushupThresholds.minimumBodyLowering,
    ascending: ({ event }) =>
      event.type === "POSE_UPDATED" &&
      event.observation.status === "valid" &&
      event.observation.elbowAngles.minimum >= pushupThresholds.ascentAngle,
    returnedToBottom: ({ event }) =>
      event.type === "POSE_UPDATED" &&
      event.observation.status === "valid" &&
      isBottom(event.observation),
  },
  actions: {
    observe: assign(({ context, event }) => {
      if (event.type !== "POSE_UPDATED" || event.observation.status !== "valid")
        return {};
      const pose = event.observation;
      return {
        formError: null,
        lastTimestamp: pose.timestamp,
        arms: pose.arms,
        topSince: isTop(pose) ? (context.topSince ?? pose.timestamp) : null,
        bottomSince: isBottom(pose)
          ? (context.bottomSince ?? pose.timestamp)
          : null,
      };
    }),
    interrupt: assign(({ context, event }) => {
      if (event.type !== "POSE_UPDATED") return {};
      return {
        ...initialContext,
        reps: context.reps,
        lastTimestamp: Number.isFinite(event.observation.timestamp)
          ? Math.max(context.lastTimestamp ?? 0, event.observation.timestamp)
          : context.lastTimestamp,
        formError: observationError(context, event.observation),
      };
    }),
    rememberTop: assign(({ event }) =>
      event.type === "POSE_UPDATED" && event.observation.status === "valid"
        ? { topSupportHeight: event.observation.supportHeight }
        : {},
    ),
    countRep: assign({ reps: ({ context }) => context.reps + 1 }),
    reset: assign(() => initialContext),
  },
}).createMachine({
  id: "pushupCounter",
  context: initialContext,
  initial: "searching",
  on: { RESET: { target: ".searching", actions: "reset" } },
  states: {
    searching: {
      on: {
        POSE_UPDATED: [
          { guard: "interrupted", actions: "interrupt" },
          {
            guard: "stableTop",
            target: "ready",
            actions: ["observe", "rememberTop"],
          },
          { actions: "observe" },
        ],
      },
    },
    ready: {
      on: {
        POSE_UPDATED: [
          { guard: "interrupted", target: "searching", actions: "interrupt" },
          { guard: "descending", target: "descending", actions: "observe" },
          { actions: "observe" },
        ],
      },
    },
    descending: {
      on: {
        POSE_UPDATED: [
          { guard: "interrupted", target: "searching", actions: "interrupt" },
          { guard: "stableBottom", target: "bottom", actions: "observe" },
          {
            guard: "stableTop",
            target: "ready",
            actions: ["observe", "rememberTop"],
          },
          { actions: "observe" },
        ],
      },
    },
    bottom: {
      on: {
        POSE_UPDATED: [
          { guard: "interrupted", target: "searching", actions: "interrupt" },
          { guard: "ascending", target: "ascending", actions: "observe" },
          { actions: "observe" },
        ],
      },
    },
    ascending: {
      on: {
        POSE_UPDATED: [
          { guard: "interrupted", target: "searching", actions: "interrupt" },
          {
            guard: "stableTop",
            target: "ready",
            actions: ["observe", "rememberTop", "countRep"],
          },
          { guard: "returnedToBottom", target: "bottom", actions: "observe" },
          { actions: "observe" },
        ],
      },
    },
  },
});
