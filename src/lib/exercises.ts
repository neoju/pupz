import type {
  ExerciseStrategy,
  Keypoint,
  JointMetrics,
} from "@/types/exercise";

export interface WholeBodyAlignment {
  alignmentError: number;
  bodyLineAngle: number;
  headDeviation: number;
  hipDeviation: number;
  kneeDeviation: number;
  confidence: number;
}

const EMPTY_ALIGNMENT: WholeBodyAlignment = {
  alignmentError: 1,
  bodyLineAngle: 0,
  headDeviation: 0,
  hipDeviation: 0,
  kneeDeviation: 0,
  confidence: 0,
};

function midpoint(a: Keypoint, b: Keypoint): Keypoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    visibility: ((a.visibility ?? 0) + (b.visibility ?? 0)) / 2,
  };
}

function distance(a: Keypoint, b: Keypoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function signedDeviation(
  point: Keypoint,
  origin: Keypoint,
  direction: Keypoint,
): number {
  return (
    direction.x * (point.y - origin.y) -
    direction.y * (point.x - origin.x)
  );
}

export function calculateWholeBodyAlignment(
  landmarks: readonly Keypoint[],
): WholeBodyAlignment {
  const nose = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  if (
    !nose ||
    !leftShoulder ||
    !rightShoulder ||
    !leftHip ||
    !rightHip ||
    !leftKnee ||
    !rightKnee ||
    !leftAnkle ||
    !rightAnkle
  ) {
    return EMPTY_ALIGNMENT;
  }

  const points = [
    nose,
    midpoint(leftShoulder, rightShoulder),
    midpoint(leftHip, rightHip),
    midpoint(leftKnee, rightKnee),
    midpoint(leftAnkle, rightAnkle),
  ];
  const centroid = points.reduce(
    (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }),
    { x: 0, y: 0 },
  );
  const center = {
    x: centroid.x / points.length,
    y: centroid.y / points.length,
  };

  const covariance = points.reduce(
    (sum, point) => {
      const x = point.x - center.x;
      const y = point.y - center.y;
      return {
        xx: sum.xx + x * x,
        xy: sum.xy + x * y,
        yy: sum.yy + y * y,
      };
    },
    { xx: 0, xy: 0, yy: 0 },
  );
  const angle =
    0.5 * Math.atan2(2 * covariance.xy, covariance.xx - covariance.yy);
  let direction = { x: Math.cos(angle), y: Math.sin(angle) };
  const shoulder = points[1];
  const ankle = points[4];

  if (!shoulder || !ankle) return EMPTY_ALIGNMENT;

  const shoulderToAnkle = {
    x: ankle.x - shoulder.x,
    y: ankle.y - shoulder.y,
  };
  if (
    direction.x * shoulderToAnkle.x + direction.y * shoulderToAnkle.y <
    0
  ) {
    direction = { x: -direction.x, y: -direction.y };
  }

  const bodyLength = distance(shoulder, ankle);
  const confidence =
    points.reduce((sum, point) => sum + (point.visibility ?? 0), 0) /
    points.length;

  if (bodyLength < 0.05) return EMPTY_ALIGNMENT;

  const deviations = points.map((point) =>
    (signedDeviation(point, centroid, direction) * Math.sign(direction.x || 1)) /
    bodyLength,
  );
  const alignmentError = Math.sqrt(
    deviations.reduce((sum, deviation) => sum + deviation ** 2, 0) /
      deviations.length,
  );

  return {
    alignmentError,
    bodyLineAngle: (Math.atan2(direction.y, direction.x) * 180) / Math.PI,
    headDeviation: deviations[0] ?? 0,
    hipDeviation: deviations[2] ?? 0,
    kneeDeviation: deviations[3] ?? 0,
    confidence,
  };
}

export function smoothAlignmentMetrics(
  previous: JointMetrics | null,
  current: JointMetrics,
  smoothingFactor = 0.25,
): JointMetrics {
  if (!previous) return current;

  return {
    ...current,
    alignmentError:
      previous.alignmentError * (1 - smoothingFactor) +
      current.alignmentError * smoothingFactor,
    headDeviation:
      previous.headDeviation * (1 - smoothingFactor) +
      current.headDeviation * smoothingFactor,
    hipDeviation:
      previous.hipDeviation * (1 - smoothingFactor) +
      current.hipDeviation * smoothingFactor,
    kneeDeviation:
      previous.kneeDeviation * (1 - smoothingFactor) +
      current.kneeDeviation * smoothingFactor,
  };
}

/**
 * Calculates the interior angle in degrees at joint vertex B.
 *
 * @param a First landmark (e.g., Shoulder)
 * @param b Joint vertex landmark (e.g., Elbow)
 * @param c Third landmark (e.g., Wrist)
 * @returns Angle in degrees between [0, 180]
 */
export function calculateAngle(a: Keypoint, b: Keypoint, c: Keypoint): number {
  if (!a || !b || !c) return 0;

  // Compute angle of vector BA and BC relative to the horizontal axis
  const radiansA = Math.atan2(a.y - b.y, a.x - b.x);
  const radiansC = Math.atan2(c.y - b.y, c.x - b.x);

  // Absolute difference in degrees
  let degrees = Math.abs(((radiansA - radiansC) * 180.0) / Math.PI);

  // Ensure the internal angle is measured (<= 180 degrees)
  if (degrees > 180.0) {
    degrees = 360.0 - degrees;
  }

  return degrees;
}

export const pushupStrategy: ExerciseStrategy = {
  id: "pushup",
  name: "Push Up",
  lockoutThreshold: 150,
  depthThreshold: 90,
  ascentThreshold: 100,
  extractExerciseMetrics: (landmarks) => {
    if (landmarks.length === 0) {
      return {
        primaryAngle: 0,
        secondaryAngle: 0,
        ...EMPTY_ALIGNMENT,
      };
    }

    const primaryAngle = calculateAngle(
      landmarks[11],
      landmarks[13],
      landmarks[15],
    );
    const secondaryAngle = calculateAngle(
      landmarks[11],
      landmarks[23],
      landmarks[27],
    );

    return {
      primaryAngle,
      secondaryAngle,
      ...calculateWholeBodyAlignment(landmarks),
    };
  },
  validateForm: (metrics: JointMetrics) => {
    if (metrics.confidence <= 0.6) {
      return "Step back so your whole body is visible";
    }
    if (metrics.alignmentError <= 0.07) return null;
    if (metrics.hipDeviation > 0.07) {
      return "Keep your body straight: lift your hips";
    }
    if (metrics.hipDeviation < -0.07) {
      return "Lower your hips to keep one straight line";
    }
    if (Math.abs(metrics.headDeviation) > 0.07) {
      return "Keep your head and neck aligned";
    }
    if (Math.abs(metrics.kneeDeviation) > 0.07) {
      return "Keep your legs in one straight line";
    }
    return "Keep your whole body in one straight line";
  },
};

export const squatStrategy: ExerciseStrategy = {
  id: "squat",
  name: "Bodyweight Squat",
  lockoutThreshold: 160,
  depthThreshold: 90,
  ascentThreshold: 100,
  extractExerciseMetrics: (landmarks) => {
    if (landmarks.length === 0) {
      return {
        primaryAngle: 0,
        secondaryAngle: 0,
        ...EMPTY_ALIGNMENT,
      };
    }

    const primaryAngle = calculateAngle(
      landmarks[23],
      landmarks[25],
      landmarks[27],
    );
    const secondaryAngle = calculateAngle(
      landmarks[11],
      landmarks[23],
      landmarks[25],
    );
    const confidence =
      ((landmarks[25].visibility ?? 0) + (landmarks[27].visibility ?? 0)) / 2;

    return {
      primaryAngle,
      secondaryAngle,
      ...EMPTY_ALIGNMENT,
      confidence,
    };
  },
  validateForm: (metrics) => {
    if (metrics.secondaryAngle < 80) {
      return "Keep chest up: Avoid leaning too far forward";
    }
    return null;
  },
};
