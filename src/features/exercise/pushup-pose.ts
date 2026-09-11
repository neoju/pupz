import { POSE_DETECTION_ERROR } from "@/lib/constants";

export type PosePoint = {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly visibility?: number;
};

export type PushupObservation =
  | {
    readonly status: "valid";
    readonly timestamp: number;
    readonly arms: "both" | "left" | "right";
    readonly elbowAngles: {
      readonly minimum: number;
      readonly maximum: number;
    };
    readonly supportHeight: number;
  }
  | {
    readonly status: "invalid" | "unobservable";
    readonly timestamp: number;
    readonly message: string;
  };

export type PushupPose = {
  readonly worldLandmarks: readonly PosePoint[];
  readonly landmarks: readonly PosePoint[];
  readonly timestamp: number;
};

const thresholds = {
  visibility: 0.65,
  straightHip: 160,
  straightKnee: 160,
  neutralHead: 120,
  maximumBodyVerticalFraction: 0.65,
  minimumSupportVerticalFraction: 0.12,
  minimumSegmentLength: 0.05,
} as const;

// Computes the vector from point b to point a.
const subtract = (a: PosePoint, b: PosePoint): PosePoint => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});
// Computes the dot product of two 3D vectors.
const dot = (a: PosePoint, b: PosePoint) => a.x * b.x + a.y * b.y + a.z * b.z;
// Computes the magnitude of a 3D vector.
const length = (a: PosePoint) => Math.hypot(a.x, a.y, a.z);

// Measures the angle formed by three pose points.
function angle(a: PosePoint, joint: PosePoint, b: PosePoint): number | null {
  const first = subtract(a, joint);
  const second = subtract(b, joint);
  const denominator = length(first) * length(second);
  if (
    length(first) < thresholds.minimumSegmentLength ||
    length(second) < thresholds.minimumSegmentLength
  )
    return null;
  return (
    (Math.acos(Math.max(-1, Math.min(1, dot(first, second) / denominator))) *
      180) /
    Math.PI
  );
}

// Returns a world landmark only when its paired image landmark is usable.
function visiblePoint(pose: PushupPose, index: number): PosePoint | null {
  const world = pose.worldLandmarks[index];
  const image = pose.landmarks[index];
  if (!world || !image) return null;
  if (
    ![
      world.x,
      world.y,
      world.z,
      image.x,
      image.y,
      image.z,
      image.visibility,
    ].every((value) => typeof value === "number" && Number.isFinite(value))
  )
    return null;
  if (
    (image.visibility ?? 0) < thresholds.visibility ||
    image.x < 0 ||
    image.x > 1 ||
    image.y < 0 ||
    image.y > 1
  )
    return null;
  if (
    world.visibility !== undefined &&
    (!Number.isFinite(world.visibility) ||
      world.visibility < thresholds.visibility)
  )
    return null;
  return world;
}

type ArmAssessment =
  | {
    readonly status: "valid";
    readonly elbowAngle: number;
    readonly supportHeight: number;
  }
  | { readonly status: "invalid" | "unobservable"; readonly message: string };

// Validates one side of the body and calculates its push-up metrics.
function assessSide(pose: PushupPose, side: 0 | 1): ArmAssessment {
  const shoulder = visiblePoint(pose, 11 + side);
  const elbow = visiblePoint(pose, 13 + side);
  const wrist = visiblePoint(pose, 15 + side);
  const hip = visiblePoint(pose, 23 + side);
  const knee = visiblePoint(pose, 25 + side);
  const ankle = visiblePoint(pose, 27 + side);
  if (!shoulder || !elbow || !wrist || !hip || !knee || !ankle) {
    return {
      status: "unobservable",
      message: POSE_DETECTION_ERROR.JOINTS_OUT_OF_FRAME,
    };
  }
  const elbowAngle = angle(shoulder, elbow, wrist);
  const hipAngle = angle(shoulder, hip, knee);
  const kneeAngle = angle(hip, knee, ankle);
  if (elbowAngle === null || hipAngle === null || kneeAngle === null) {
    return {
      status: "unobservable",
      message: POSE_DETECTION_ERROR.JOINTS_UNCLEAR,
    };
  }
  if (hipAngle < thresholds.straightHip)
    return {
      status: "invalid",
      message: POSE_DETECTION_ERROR.HIPS_MISALIGNED,
    };
  if (kneeAngle < thresholds.straightKnee)
    return {
      status: "invalid",
      message: POSE_DETECTION_ERROR.KNEES_BENT,
    };

  const body = subtract(ankle, shoulder);
  const bodyLength = length(body);
  const armLength =
    length(subtract(elbow, shoulder)) + length(subtract(wrist, elbow));
  const support = subtract(wrist, shoulder);
  const alongBody = dot(support, body) / bodyLength;
  const bodyIsTooVertical =
    Math.abs(body.y) / bodyLength > thresholds.maximumBodyVerticalFraction;
  const supportIsTooLow =
    support.y / armLength < thresholds.minimumSupportVerticalFraction;
  const handsAreBehindBody = alongBody < -0.5 * armLength;
  const handsAreTooFarForward = alongBody > 0.75 * armLength;

  // Camera-upright heuristic, not a calibrated gravity or floor-contact estimate.
  if (
    bodyIsTooVertical ||
    supportIsTooLow ||
    handsAreBehindBody ||
    handsAreTooFarForward
  ) {
    return {
      status: "invalid",
      message: POSE_DETECTION_ERROR.POSITION_UNSUPPORTED,
    };
  }
  const ear = visiblePoint(pose, 7 + side);
  const headAngle = ear ? angle(ear, shoulder, hip) : null;
  if (headAngle !== null && headAngle < thresholds.neutralHead) {
    return {
      status: "invalid",
      message: POSE_DETECTION_ERROR.HEAD_MISALIGNED,
    };
  }
  const supportHeight =
    Math.sqrt(Math.max(0, dot(support, support) - alongBody ** 2)) / armLength;

  return { status: "valid", elbowAngle, supportHeight };
}

// Combines both side assessments into the overall push-up observation.
export function evaluatePushupPose(pose: PushupPose): PushupObservation {
  const left = assessSide(pose, 0);
  const right = assessSide(pose, 1);

  if (left.status === "invalid") {
    return { ...left, timestamp: pose.timestamp };
  }

  if (right.status === "invalid") {
    return { ...right, timestamp: pose.timestamp };
  }

  const sides = [left, right].filter((side) => side.status === "valid");
  if (sides.length === 0) {
    return {
      status: "unobservable",
      timestamp: pose.timestamp,
      message: POSE_DETECTION_ERROR.JOINTS_OUT_OF_FRAME,
    };
  }

  const angles = sides.map((side) => side.elbowAngle);

  const arms =
    left.status === "valid"
      ? right.status === "valid"
        ? "both"
        : "left"
      : "right";

  return {
    status: "valid",
    timestamp: pose.timestamp,
    arms,
    elbowAngles: { minimum: Math.min(...angles), maximum: Math.max(...angles) },
    supportHeight:
      sides.reduce((sum, side) => sum + side.supportHeight, 0) / sides.length,
  };
}
