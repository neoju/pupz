import type { KokoroTTS } from "kokoro-js";

type KokoroLoadOptions = NonNullable<
  Parameters<typeof KokoroTTS.from_pretrained>[1]
>;
type KokoroGenerateOptions = NonNullable<
  Parameters<KokoroTTS["generate"]>[1]
>;

type KokoroSpeechConfig = Readonly<{
  readonly modelId: string;
  readonly voice: KokoroGenerateOptions["voice"];
  readonly dtype: KokoroLoadOptions["dtype"];
  readonly device: KokoroLoadOptions["device"];
  readonly sampleRateHz: number;
  readonly speed: KokoroGenerateOptions["speed"];
}>;

export const KOKORO_SPEECH_CONFIG = {
  modelId: "onnx-community/Kokoro-82M-v1.0-ONNX",
  voice: "af_heart",
  dtype: "q8",
  device: "wasm",
  sampleRateHz: 24000,
  speed: 1,
} as const satisfies KokoroSpeechConfig;
