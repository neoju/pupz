export const SPEECH_CACHE_MAX_ENTRIES = 32;
export const SPEECH_CACHE_MAX_BYTES = 8 * 1024 * 1024;

export const SPEECH_KINDS = {
  COUNT: "COUNT",
  WARNING: "WARNING",
} as const;

export type SpeechKind = (typeof SPEECH_KINDS)[keyof typeof SPEECH_KINDS];

export type SpeechPhrase = {
  readonly text: string;
  readonly voice: string;
  readonly speed: number;
};

export type SpeechPhraseKey = string;

export type SpeechCacheLookup =
  | { readonly kind: "hit"; readonly key: SpeechPhraseKey; readonly audio: Blob }
  | { readonly kind: "miss"; readonly key: SpeechPhraseKey };

export type SpeechCacheWrite =
  | {
      readonly kind: "inserted" | "replaced";
      readonly key: SpeechPhraseKey;
      readonly evicted: readonly SpeechPhraseKey[];
    }
  | {
      readonly kind: "rejected";
      readonly key: SpeechPhraseKey;
      readonly reason: "oversized";
      readonly bytes: number;
    };

export interface SpeechCache {
  get(phrase: SpeechPhrase): SpeechCacheLookup;
  set(phrase: SpeechPhrase, audio: Blob): SpeechCacheWrite;
  clear(): void;
  size(): number;
  bytes(): number;
  keys(): readonly SpeechPhraseKey[];
}

type SpeechCacheEntry = {
  readonly audio: Blob;
  readonly bytes: number;
};

export function createSpeechPhraseKey(phrase: SpeechPhrase): SpeechPhraseKey {
  return JSON.stringify([phrase.text, phrase.voice, phrase.speed]);
}

/** Cache entries are session-memory-only; Blob ownership remains with this cache. */
export function createSpeechCache(): SpeechCache {
  const entries = new Map<SpeechPhraseKey, SpeechCacheEntry>();
  let totalBytes = 0;

  return {
    get(phrase): SpeechCacheLookup {
      const key = createSpeechPhraseKey(phrase);
      const entry = entries.get(key);
      if (entry === undefined) {
        return { kind: "miss", key };
      }

      entries.delete(key);
      entries.set(key, entry);
      return { kind: "hit", key, audio: entry.audio };
    },

    set(phrase, audio): SpeechCacheWrite {
      const key = createSpeechPhraseKey(phrase);
      if (audio.size > SPEECH_CACHE_MAX_BYTES) {
        return { kind: "rejected", key, reason: "oversized", bytes: audio.size };
      }

      const previous = entries.get(key);
      if (previous !== undefined) {
        entries.delete(key);
        totalBytes -= previous.bytes;
      }

      entries.set(key, { audio, bytes: audio.size });
      totalBytes += audio.size;

      const evicted: SpeechPhraseKey[] = [];
      while (entries.size > SPEECH_CACHE_MAX_ENTRIES || totalBytes > SPEECH_CACHE_MAX_BYTES) {
        const oldestKey = entries.keys().next().value;
        if (oldestKey === undefined) {
          break;
        }
        const oldest = entries.get(oldestKey);
        if (oldest === undefined) {
          break;
        }
        entries.delete(oldestKey);
        totalBytes -= oldest.bytes;
        evicted.push(oldestKey);
      }

      return {
        kind: previous === undefined ? "inserted" : "replaced",
        key,
        evicted,
      };
    },

    clear(): void {
      entries.clear();
      totalBytes = 0;
    },

    size(): number {
      return entries.size;
    },

    bytes(): number {
      return totalBytes;
    },

    keys(): readonly SpeechPhraseKey[] {
      return [...entries.keys()];
    },
  };
}
