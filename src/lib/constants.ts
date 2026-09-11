const POSE_DETECTION_ERROR = {
  JOINTS_OUT_OF_FRAME:
    "Keep a shoulder, elbow, wrist, hip, knee and ankle clearly in frame.",
  JOINTS_UNCLEAR: "Move into clearer view so your joints can be tracked.",
  HIPS_MISALIGNED: "Keep your hips in line with your shoulders and legs.",
  KNEES_BENT: "Keep your knees extended throughout the push-up.",
  POSITION_UNSUPPORTED:
    "Take a straight-body push-up position with your hands supporting your shoulders.",
  HEAD_MISALIGNED: "Keep your head aligned with your torso.",
} as const;

export {
  POSE_DETECTION_ERROR,
};
