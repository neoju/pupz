# Push-up tracking contract

The tracker models a standard push-up as a rigid plank: hands support the shoulders, the head stays aligned with the torso, elbows bend under control to roughly a 90-degree position, and the elbows return to near full extension. These are coaching and computer-vision thresholds, not medical or universal fitness standards.

The sequence is deliberately ordered:

1. Hold an observable top position.
2. Descend with the hips and knees aligned.
3. Hold the bottom depth briefly.
4. Ascend without losing the same observable arm chain.
5. Hold the top again; only then is one repetition counted.

Pose Landmarker world coordinates are used for joint angles because they are measured in meters relative to the hip midpoint. The evaluator can use both arms or one complete visible arm chain, so camera yaw may be front, rear, side, or oblique. An occluded or malformed chain is unobservable and cannot validate a rep. Monocular pose estimation cannot prove floor contact, hidden-joint correctness, or exact spinal curvature.

Technique references:

- [ACE push-up technique](https://www.acefitness.org/resources/everyone/exercise-library/41/push-up/)
- [US Navy Physical Readiness Test Guide 5A](https://www.mynavyhr.navy.mil/Portals/55/Support/Culture%20Resilience/Physical/Guide-5A%20Physical%20Readiness%20Test.pdf)
- [FBI push-up evaluation](https://fbijobs.gov/special-agents/physical-requirements/event-3)
- [MediaPipe Pose Landmarker Web](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js)
