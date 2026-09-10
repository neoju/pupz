import type {
  SpeechKind,
  SpeechPhrase,
} from "./speech-cache";

export type SpeechSessionId = string;
export type SpeechRequestId = number;

export type SpeechWorkerRequest =
  | {
      readonly type: "INITIALIZE";
      readonly sessionId: SpeechSessionId;
    }
  | {
      readonly type: "SPEAK";
      readonly sessionId: SpeechSessionId;
      readonly requestId: SpeechRequestId;
      readonly speechKind: SpeechKind;
      readonly phrase: SpeechPhrase;
    }
  | {
      readonly type: "CANCEL_STALE";
      readonly sessionId: SpeechSessionId;
      readonly requestId: SpeechRequestId;
    }
  | {
      readonly type: "CLOSE";
      readonly sessionId: SpeechSessionId;
    };

export type SpeechWorkerResponse =
  | {
      readonly type: "READY";
      readonly sessionId: SpeechSessionId;
    }
  | {
      readonly type: "AUDIO";
      readonly sessionId: SpeechSessionId;
      readonly requestId: SpeechRequestId;
      readonly speechKind: SpeechKind;
      readonly phrase: SpeechPhrase;
      /** Blob crosses worker-to-main; object URLs belong to the main-thread playback layer. */
      readonly audio: Blob;
    }
  | {
      readonly type: "ERROR";
      readonly sessionId: SpeechSessionId;
      readonly message: string;
      readonly requestId?: SpeechRequestId;
    }
  | {
      readonly type: "CLOSED";
      readonly sessionId: SpeechSessionId;
    };
