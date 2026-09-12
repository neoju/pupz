export type AudioAssetCategory = "counts" | "warnings";

const WARNING_AUDIO_ASSET_KEYS = [
  "HEAD_MISALIGNED",
  "HIPS_MISALIGNED",
  "JOINTS_OUT_OF_FRAME",
  "JOINTS_UNCLEAR",
  "KNEES_BENT",
  "POSITION_UNSUPPORTED",
] as const;

export function getAudioAssetPath(
  category: AudioAssetCategory,
  textKey: string,
): string {
  const filename = textKey.toLowerCase().replaceAll("_", "-");
  return `/audio/${category}/${filename}.wav`;
}

const AUDIO_ASSET_PATHS = [
  ...Array.from({ length: 30 }, (_, index) =>
    getAudioAssetPath("counts", `COUNT_${index + 1}`),
  ),
  ...WARNING_AUDIO_ASSET_KEYS.map((key) =>
    getAudioAssetPath("warnings", key),
  ),
] as const;

export function preloadAudioAssets(): void {
  if (typeof Audio === "undefined") return;

  for (const assetPath of AUDIO_ASSET_PATHS) {
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = assetPath;
    audio.load();
  }
}
