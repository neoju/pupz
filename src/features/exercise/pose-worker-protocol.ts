import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

import type { PushupObservation } from "./pushup-pose";

export interface PoseConnection {
  readonly start: number;
  readonly end: number;
}

export type PoseWorkerRequest =
  | { readonly type: "INITIALIZE" }
  | {
      readonly type: "FRAME";
      readonly frame: ImageBitmap;
      readonly timestamp: number;
    }
  | { readonly type: "CLOSE" };

export type PoseWorkerResponse =
  | {
      readonly type: "READY";
      readonly connections: readonly PoseConnection[];
    }
  | {
      readonly type: "RESULT";
      readonly landmarks: readonly NormalizedLandmark[];
      readonly observation: PushupObservation;
    }
  | { readonly type: "ERROR"; readonly message: string };
