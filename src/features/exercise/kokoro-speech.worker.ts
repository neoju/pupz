import Denque from "denque";
import { KokoroTTS } from "kokoro-js";

import { SPEECH_KINDS } from "./speech-cache";
import { KOKORO_SPEECH_CONFIG } from "./speech-config";
import type {
  SpeechRequestId,
  SpeechSessionId,
  SpeechWorkerRequest,
  SpeechWorkerResponse,
} from "./speech-worker-protocol";

type SpeakJob = Extract<SpeechWorkerRequest, { type: "SPEAK" }>;
type KokoroVoice = NonNullable<
  NonNullable<Parameters<KokoroTTS["generate"]>[1]>["voice"]
>;
type ParsedSpeakJob = Omit<SpeakJob, "phrase"> & {
  readonly phrase: Omit<SpeakJob["phrase"], "voice"> & {
    readonly voice: KokoroVoice;
  };
};
type ParsedRequest = Exclude<SpeechWorkerRequest, SpeakJob> | ParsedSpeakJob;

const { modelId, dtype, device } = KOKORO_SPEECH_CONFIG;

let ttsPromise: Promise<KokoroTTS> | null = null;
let readyPromise: Promise<void> | null = null;
let sessionId: SpeechSessionId | null = null;
let readySent = false;
let closed = false;
let inFlight: ParsedSpeakJob | null = null;
let processing = false;

const pendingJobs = new Denque<ParsedSpeakJob>();
const supersededJobIds = new Set<SpeechRequestId>();

const send = (response: SpeechWorkerResponse) => self.postMessage(response);

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Speech synthesis failed.";

const loadModel = (): Promise<KokoroTTS> => {
  ttsPromise ??= KokoroTTS.from_pretrained(modelId, { dtype, device }).catch(
    (error: unknown) => {
      ttsPromise = null;
      throw error;
    },
  );
  return ttsPromise;
};

const dropQueuedWarnings = () => {
  for (let index = pendingJobs.length - 1; index >= 0; index -= 1) {
    const job = pendingJobs.peekAt(index);
    if (job?.speechKind === SPEECH_KINDS.WARNING) {
      supersededJobIds.add(job.requestId);
      pendingJobs.removeOne(index);
    }
  }
};

const supersedeCurrentWarning = () => {
  if (inFlight?.speechKind === SPEECH_KINDS.WARNING) {
    supersededJobIds.add(inFlight.requestId);
  }
};

const initializeModel = async (id: SpeechSessionId): Promise<void> => {
  try {
    await loadModel();
  } catch (error: unknown) {
    if (!closed) {
      send({ type: "ERROR", sessionId: id, message: getErrorMessage(error) });
    }
    throw error;
  }
  if (!closed) {
    readySent = true;
    send({ type: "READY", sessionId: id });
  }
};

const initialize = (id: SpeechSessionId): Promise<void> => {
  if (sessionId === null) {
    sessionId = id;
  }
  if (readySent) {
    return Promise.resolve();
  }
  readyPromise ??= initializeModel(id);
  return readyPromise.catch((error: unknown) => {
    readyPromise = null;
    throw error;
  });
};

const enqueueJob = (job: ParsedSpeakJob) => {
  dropQueuedWarnings();
  supersedeCurrentWarning();
  pendingJobs.push(job);
  if (!processing) {
    void processQueue();
  }
};

const processQueue = async (): Promise<void> => {
  processing = true;
  try {
    while (!closed) {
      const job = pendingJobs.shift();
      if (!job) break;
      inFlight = job;
      try {
        if (supersededJobIds.delete(job.requestId)) continue;
        const tts = await loadModel();
        const audio = await tts.generate(job.phrase.text, {
          voice: job.phrase.voice,
          speed: job.phrase.speed,
        });
        if (closed || supersededJobIds.has(job.requestId)) continue;
        supersededJobIds.delete(job.requestId);
        send({
          type: "AUDIO",
          sessionId: job.sessionId,
          requestId: job.requestId,
          speechKind: job.speechKind,
          phrase: job.phrase,
          audio: audio.toBlob(),
        });
      } catch (error: unknown) {
        if (closed || supersededJobIds.has(job.requestId)) continue;
        supersededJobIds.delete(job.requestId);
        send({
          type: "ERROR",
          sessionId: job.sessionId,
          requestId: job.requestId,
          message: getErrorMessage(error),
        });
      } finally {
        supersededJobIds.delete(job.requestId);
        if (inFlight?.requestId === job.requestId) {
          inFlight = null;
        }
      }
    }
  } finally {
    processing = false;
  }
};

const cancelStale = (requestId: SpeechRequestId) => {
  supersededJobIds.add(requestId);
  let index = -1;
  for (let current = 0; current < pendingJobs.length; current += 1) {
    if (pendingJobs.peekAt(current)?.requestId === requestId) {
      index = current;
      break;
    }
  }
  if (index !== -1) {
    pendingJobs.removeOne(index);
  }
};

const close = (id: SpeechSessionId) => {
  closed = true;
  sessionId = null;
  pendingJobs.clear();
  send({ type: "CLOSED", sessionId: id });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasSessionId = (
  value: Record<string, unknown>,
): value is Record<string, unknown> & { readonly sessionId: SpeechSessionId } =>
  typeof value.sessionId === "string";

const hasRequestId = (
  value: Record<string, unknown>,
): value is Record<string, unknown> & { readonly requestId: SpeechRequestId } =>
  typeof value.requestId === "number" && Number.isSafeInteger(value.requestId);

const isKokoroVoice = (value: unknown): value is KokoroVoice =>
  value === KOKORO_SPEECH_CONFIG.voice;

const parseRequest = (value: unknown): ParsedRequest | null => {
  if (!isRecord(value) || typeof value.type !== "string" || !hasSessionId(value)) {
    return null;
  }

  switch (value.type) {
    case "INITIALIZE":
      return { type: "INITIALIZE", sessionId: value.sessionId };
    case "SPEAK": {
      if (!hasRequestId(value) || !isRecord(value.phrase)) return null;
      const { phrase } = value;
      if (
        (value.speechKind !== SPEECH_KINDS.COUNT &&
          value.speechKind !== SPEECH_KINDS.WARNING) ||
        typeof phrase.text !== "string" ||
        !isKokoroVoice(phrase.voice) ||
        typeof phrase.speed !== "number" ||
        !Number.isFinite(phrase.speed) ||
        phrase.speed <= 0
      ) {
        return null;
      }
      return {
        type: "SPEAK",
        sessionId: value.sessionId,
        requestId: value.requestId,
        speechKind: value.speechKind,
        phrase: {
          text: phrase.text,
          voice: phrase.voice,
          speed: phrase.speed,
        },
      };
    }
    case "CANCEL_STALE":
      return hasRequestId(value)
        ? {
            type: "CANCEL_STALE",
            sessionId: value.sessionId,
            requestId: value.requestId,
          }
        : null;
    case "CLOSE":
      return { type: "CLOSE", sessionId: value.sessionId };
    default:
      return null;
  }
};

const reportMalformedRequest = (value: unknown) => {
  const requestSessionId =
    isRecord(value) && typeof value.sessionId === "string" ? value.sessionId : sessionId;
  if (!closed && requestSessionId !== null) {
    send({
      type: "ERROR",
      sessionId: requestSessionId,
      message: "Invalid speech worker request.",
    });
  }
};

const assertNever = (value: never): never => {
  throw new Error(`Unhandled speech worker request: ${String(value)}`);
};

const handleMessage = async (event: MessageEvent<unknown>) => {
  const request = parseRequest(event.data);
  if (request === null) {
    reportMalformedRequest(event.data);
    return;
  }

  try {
    switch (request.type) {
      case "INITIALIZE":
        if (closed) break;
        if (sessionId !== null && sessionId !== request.sessionId) break;
        try {
          await initialize(request.sessionId);
        } catch {
          // Model errors are already reported as typed ERROR responses.
        }
        break;
      case "SPEAK":
        if (closed || sessionId !== request.sessionId) break;
        if (!readySent) break;
        enqueueJob(request);
        break;
      case "CANCEL_STALE":
        if (closed || sessionId !== request.sessionId) break;
        cancelStale(request.requestId);
        break;
      case "CLOSE":
        if (closed || sessionId !== request.sessionId) break;
        close(request.sessionId);
        break;
      default:
        assertNever(request);
    }
  } catch (error: unknown) {
    const id = sessionId;
    if (closed || id === null) return;
    const requestId = "requestId" in request ? request.requestId : undefined;
    send({
      type: "ERROR",
      sessionId: id,
      ...(requestId === undefined ? {} : { requestId }),
      message: getErrorMessage(error),
    });
  }
};

self.addEventListener("message", (event: MessageEvent<unknown>) => {
  void handleMessage(event);
});
