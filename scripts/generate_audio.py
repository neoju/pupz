#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "kokoro>=0.9.4",
#   "soundfile>=0.13.1",
# ]
# ///

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from kokoro import KPipeline
import soundfile as sf


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONSTANTS_PATH = PROJECT_ROOT / "src/lib/constants.ts"
AUDIO_ROOT = PROJECT_ROOT / "public/audio"
VOICE = "af_heart"
SAMPLE_RATE = 24_000
CONSTANT_PATTERN = re.compile(
    r"(?P<key>[A-Z][A-Z0-9_]*)\s*:\s*(?P<text>\"(?:\\.|[^\"\\])*\")",
)


def read_pose_messages() -> list[tuple[str, str]]:
    source = CONSTANTS_PATH.read_text(encoding="utf-8")
    messages = [
        (match.group("key"), json.loads(match.group("text")))
        for match in CONSTANT_PATTERN.finditer(source)
    ]
    if not messages:
        raise RuntimeError(f"No audio messages found in {CONSTANTS_PATH}")
    return messages


def text_key_to_filename(text_key: str) -> str:
    return text_key.lower().replace("_", "-")


def audio_path(category: str, text_key: str) -> Path:
    filename = text_key_to_filename(text_key)
    return AUDIO_ROOT / category / f"{filename}.wav"


def generate_file(
    pipeline: KPipeline,
    text: str,
    output_path: Path,
    force: bool,
) -> None:
    if output_path.exists() and not force:
        print(f"skip {output_path.relative_to(PROJECT_ROOT)}")
        return

    result = next(
        (item for item in pipeline(text, voice=VOICE) if item.audio is not None),
        None,
    )
    if result is None or result.audio is None:
        raise RuntimeError(f"Kokoro returned no audio for {text!r}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(output_path, result.audio.numpy(), SAMPLE_RATE)
    print(f"write {output_path.relative_to(PROJECT_ROOT)}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate static Kokoro voice assets for PupZ.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate files that already exist.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    pipeline = KPipeline(lang_code="a")

    for key, text in read_pose_messages():
        generate_file(pipeline, text, audio_path("warnings", key), args.force)

    for number in range(1, 31):
        generate_file(
            pipeline,
            str(number),
            audio_path("counts", f"COUNT_{number}"),
            args.force,
        )


if __name__ == "__main__":
    main()
