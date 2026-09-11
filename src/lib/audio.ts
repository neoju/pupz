export type AudioAssetCategory = "counts" | "warnings";

export function getAudioAssetPath(
  category: AudioAssetCategory,
  textKey: string,
): string {
  const filename = textKey.toLowerCase().replaceAll("_", "-");
  return `/audio/${category}/${filename}.wav`;
}
