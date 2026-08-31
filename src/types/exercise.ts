export type ExerciseId = "pushup" | "squat";

export interface JointMetrics {
  primaryAngle: number;
  secondaryAngle: number;
  confidence: number;
}

export interface ExerciseStrategy {
  id: ExerciseId;
  name: string;

  // Angle thresholds
  lockoutThreshold: number; // Angle to consider full extension (e.g., >= 150 deg)
  depthThreshold: number; // Angle to consider target depth reached (e.g., <= 90 deg)
  ascentThreshold: number; // Angle trigger to initiate return phase

  // Custom form validation logic
  validateForm: (metrics: JointMetrics) => string | null;
}
