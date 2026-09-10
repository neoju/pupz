import {
  createSpeechCache,
  SPEECH_KINDS,
  type SpeechKind,
  type SpeechPhrase,
} from "./speech-cache";
import { createSpeechPhrasePolicy } from "./speech-policy";
import { KOKORO_SPEECH_CONFIG } from "./speech-config";
import type {
  SpeechSessionId,
  SpeechWorkerRequest,
  SpeechWorkerResponse,
} from "./speech-worker-protocol";

type AudioItem = {
  readonly speechKind: SpeechKind;
  readonly phrase: SpeechPhrase;
  readonly audio: Blob;
};

export interface SpeechController {
  announceCount(reps: number): void;
  announceWarning(message: string): void;
  clearWarning(): void;
  setEnabled(enabled: boolean): void;
  dispose(): void;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Speech playback failed.";

export function createSpeechController(initialReps: number): SpeechController {
  const worker = new Worker(
    new URL("./kokoro-speech.worker.ts", import.meta.url),
    { type: "module" },
  );
  const sessionId = crypto.randomUUID() as SpeechSessionId;
  const cache = createSpeechCache();
  const policy = createSpeechPhrasePolicy(
    initialReps,
    KOKORO_SPEECH_CONFIG.voice,
    KOKORO_SPEECH_CONFIG.speed,
  );
  const audio = new Audio();
  const pendingAudio: AudioItem[] = [];
  const staleRequestIds = new Set<number>();
  let requestId = 0;
  let latestWarningRequestId: number | null = null;
  let activeUrl: string | null = null;
  let activeSpeechKind: SpeechKind | null = null;
  let playbackToken = 0;
  let pumping = false;
  let enabled = true;
  let closed = false;

  const revokeActiveUrl = () => {
    if (activeUrl === null) return;
    URL.revokeObjectURL(activeUrl);
    activeUrl = null;
  };

  const stopPlayback = () => {
    playbackToken += 1;
    pumping = false;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    revokeActiveUrl();
    pendingAudio.length = 0;
  };

  const finishPlayback = (token: number) => {
    if (token !== playbackToken) return;
    audio.onended = null;
    audio.onerror = null;
    revokeActiveUrl();
    activeSpeechKind = null;
    pumping = false;
    void pump();
  };

  const pump = async (): Promise<void> => {
    if (pumping || closed || !enabled) return;
    const item = pendingAudio.shift();
    if (!item) return;

    pumping = true;
    const token = playbackToken;
    activeSpeechKind = item.speechKind;
    activeUrl = URL.createObjectURL(item.audio);
    audio.src = activeUrl;
    audio.onended = () => finishPlayback(token);
    audio.onerror = () => finishPlayback(token);

    try {
      await audio.play();
    } catch (error: unknown) {
      if (token === playbackToken) {
        console.warn("Speech playback unavailable:", getErrorMessage(error));
        finishPlayback(token);
      }
    }
  };

  const enqueueAudio = (item: AudioItem) => {
    if (item.speechKind === SPEECH_KINDS.COUNT) {
      stopPlayback();
    } else {
      const warningIndex = pendingAudio.findIndex(
        ({ speechKind }) => speechKind === SPEECH_KINDS.WARNING,
      );
      if (warningIndex !== -1) pendingAudio.splice(warningIndex, 1);
    }
    pendingAudio.push(item);
    void pump();
  };

  const cancelLatestWarning = () => {
    if (latestWarningRequestId === null) return;
    staleRequestIds.add(latestWarningRequestId);
    worker.postMessage({
      type: "CANCEL_STALE",
      sessionId,
      requestId: latestWarningRequestId,
    } satisfies SpeechWorkerRequest);
    latestWarningRequestId = null;
  };

  const requestPhrase = (speechKind: SpeechKind, phrase: SpeechPhrase) => {
    const lookup = cache.get(phrase);
    if (lookup.kind === "hit") {
      enqueueAudio({ speechKind, phrase, audio: lookup.audio });
      return;
    }

    const nextRequestId = ++requestId;
    if (speechKind === SPEECH_KINDS.WARNING) {
      if (latestWarningRequestId !== null) {
        staleRequestIds.add(latestWarningRequestId);
      }
      latestWarningRequestId = nextRequestId;
    }
    const message: Extract<SpeechWorkerRequest, { type: "SPEAK" }> = {
      type: "SPEAK",
      sessionId,
      requestId: nextRequestId,
      speechKind,
      phrase,
    };
    worker.postMessage(message);
  };

  worker.onmessage = (event: MessageEvent<SpeechWorkerResponse>) => {
    const response = event.data;
    if (response.sessionId !== sessionId) return;

    switch (response.type) {
      case "READY":
        policy.markReady();
        return;
      case "AUDIO":
        if (staleRequestIds.delete(response.requestId)) return;
        cache.set(response.phrase, response.audio);
        enqueueAudio(response);
        return;
      case "ERROR":
        if (response.requestId === latestWarningRequestId) {
          latestWarningRequestId = null;
        }
        console.warn("Speech synthesis unavailable:", response.message);
        return;
      case "CLOSED":
        return;
      default:
        return;
    }
  };

  worker.onerror = (event) => {
    console.warn("Speech worker unavailable:", event.message);
  };
  worker.postMessage({ type: "INITIALIZE", sessionId } satisfies SpeechWorkerRequest);

  const announce = (decision: ReturnType<typeof policy.observeCount>) => {
    if (decision.kind === "ANNOUNCE") {
      requestPhrase(decision.speechKind, decision.phrase);
    }
  };

  return {
    announceCount(reps): void {
      const decision = policy.observeCount(reps);
      if (decision.kind === "ANNOUNCE") {
        if (latestWarningRequestId !== null) {
          staleRequestIds.add(latestWarningRequestId);
          worker.postMessage({
            type: "CANCEL_STALE",
            sessionId,
            requestId: latestWarningRequestId,
          } satisfies SpeechWorkerRequest);
          latestWarningRequestId = null;
        }
        announce(decision);
      }
    },

    announceWarning(message): void {
      announce(policy.observeWarning(message));
    },

    clearWarning(): void {
      policy.clearWarning();
      cancelLatestWarning();
      for (let index = pendingAudio.length - 1; index >= 0; index -= 1) {
        if (pendingAudio[index]?.speechKind === SPEECH_KINDS.WARNING) {
          pendingAudio.splice(index, 1);
        }
      }
      if (activeSpeechKind === SPEECH_KINDS.WARNING) stopPlayback();
    },

    setEnabled(nextEnabled): void {
      enabled = nextEnabled;
      if (!enabled) stopPlayback();
      else void pump();
    },

    dispose(): void {
      if (closed) return;
      closed = true;
      stopPlayback();
      cache.clear();
      worker.postMessage({ type: "CLOSE", sessionId } satisfies SpeechWorkerRequest);
      worker.terminate();
    },
  };
}
