import type {
  ExerciseId,
  ExerciseStrategy,
  JointMetrics,
} from "@/types/exercise";
import type { Landmark } from "@mediapipe/tasks-vision";

export interface Keypoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
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

export function extractExerciseMetrics(
  landmarks: Landmark[],
  strategyId: ExerciseId,
) {
  if (!landmarks || landmarks.length === 0) {
    return { primaryAngle: 0, secondaryAngle: 0, confidence: 0 };
  }

  if (strategyId === "pushup") {
    // Primary: Elbow angle (Shoulder - Elbow - Wrist)
    const primaryAngle = calculateAngle(
      landmarks[11],
      landmarks[13],
      landmarks[15],
    );
    // Secondary: Hip/Plank angle (Shoulder - Hip - Ankle)
    const secondaryAngle = calculateAngle(
      landmarks[11],
      landmarks[23],
      landmarks[27],
    );
    const confidence =
      (landmarks[13].visibility + landmarks[23].visibility) / 2;

    return { primaryAngle, secondaryAngle, confidence };
  }

  if (strategyId === "squat") {
    // Primary: Knee angle (Hip - Knee - Ankle)
    const primaryAngle = calculateAngle(
      landmarks[23],
      landmarks[25],
      landmarks[27],
    );
    // Secondary: Torso inclination angle (Shoulder - Hip - Knee)
    const secondaryAngle = calculateAngle(
      landmarks[11],
      landmarks[23],
      landmarks[25],
    );
    const confidence =
      (landmarks[25].visibility + landmarks[27].visibility) / 2;

    return { primaryAngle, secondaryAngle, confidence };
  }

  throw new Error(`Unsupported exercise strategy: ${strategyId}`);
}

export const pushupStrategy: ExerciseStrategy = {
  id: "pushup",
  name: "Push Up",
  lockoutThreshold: 150,
  depthThreshold: 90,
  ascentThreshold: 100,
  validateForm: (metrics: JointMetrics) => {
    if (metrics.secondaryAngle < 160) {
      return "Keep body straight: Lift your hips"; // Hip sag error
    }
    return null;
  },
};

export const squatStrategy: ExerciseStrategy = {
  id: "squat",
  name: "Bodyweight Squat",
  lockoutThreshold: 160,
  depthThreshold: 90,
  ascentThreshold: 100,
  validateForm: (metrics) => {
    if (metrics.secondaryAngle < 80) {
      return "Keep chest up: Avoid leaning too far forward";
    }
    return null;
  },
};
