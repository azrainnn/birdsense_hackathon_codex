"""
Resample and extract fixed-length clips from raw recordings.

For each .mp3 in dataset/raw/<species>/, slices non-overlapping DURATION-second
windows and writes them as 16-bit PCM .wav files to dataset/processed/<species>/.
Recordings shorter than DURATION are zero-padded to exactly one full window.
Trailing audio that does not fill a complete window is discarded.

Safe to re-run: existing output clips are skipped.

Input:  dataset/raw/<species>/*.mp3  (run split_holdout.py first)
Output: dataset/processed/<species>/<stem>_<window_index>.wav
"""

import csv
import sys
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf

from constants import DURATION, SAMPLE_RATE

SPECIES_CSV: Path = Path("species_selected.csv")
RAW_DIR: Path = Path("dataset/raw")
PROCESSED_DIR: Path = Path("dataset/processed")
TARGET_SAMPLES: int = DURATION * SAMPLE_RATE


def load_audio(path: Path) -> np.ndarray:
    """Load an audio file and resample to SAMPLE_RATE as mono.

    Args:
        path: Path to the audio file (.mp3 or .wav).

    Returns:
        Mono float32 numpy array at SAMPLE_RATE.
    """
    audio, _ = librosa.load(path, sr=SAMPLE_RATE, mono=True)
    return audio


def extract_windows(audio: np.ndarray) -> list[np.ndarray]:
    """Slice audio into non-overlapping TARGET_SAMPLES windows.

    Short recordings are zero-padded to exactly TARGET_SAMPLES.
    Long recordings yield as many full windows as possible; any remainder
    shorter than TARGET_SAMPLES is discarded.

    Args:
        audio: Mono float32 audio array.

    Returns:
        List of (TARGET_SAMPLES,) float32 arrays.
    """
    if len(audio) < TARGET_SAMPLES:
        padded = np.zeros(TARGET_SAMPLES, dtype=np.float32)
        padded[: len(audio)] = audio
        return [padded]

    n_windows = len(audio) // TARGET_SAMPLES
    return [
        audio[i * TARGET_SAMPLES : (i + 1) * TARGET_SAMPLES]
        for i in range(n_windows)
    ]


def preprocess_species(species_name: str) -> tuple[int, int, int]:
    """Process all raw recordings for one species.

    Args:
        species_name: Snake_case species folder name.

    Returns:
        Tuple of (clips_written, clips_skipped_existing, files_failed).
    """
    raw_dir = RAW_DIR / species_name
    out_dir = PROCESSED_DIR / species_name
    out_dir.mkdir(parents=True, exist_ok=True)

    if not raw_dir.exists():
        print(f"  [WARN] {raw_dir} does not exist — skipping.")
        return 0, 0, 0

    mp3_files = sorted(raw_dir.glob("*.mp3"))
    if not mp3_files:
        print(f"  [WARN] No .mp3 files in {raw_dir} — run downloader.py and split_holdout.py first.")
        return 0, 0, 0

    written = skipped = failed = 0

    for mp3 in mp3_files:
        try:
            audio = load_audio(mp3)
        except Exception as exc:
            print(f"  [FAIL] {mp3.name} — {exc}")
            failed += 1
            continue

        windows = extract_windows(audio)

        for idx, window in enumerate(windows):
            out_path = out_dir / f"{mp3.stem}_{idx:02d}.wav"
            if out_path.exists():
                skipped += 1
                continue
            sf.write(out_path, window, SAMPLE_RATE, subtype="PCM_16")
            written += 1

    return written, skipped, failed


def load_species_list(path: Path) -> list[dict[str, str]]:
    """Load species_selected.csv.

    Args:
        path: Path to species_selected.csv.

    Returns:
        List of row dicts.
    """
    if not path.exists():
        sys.exit(
            f"[ERROR] {path} not found.\n"
            "        Ensure species_selected.csv exists in the project root."
        )

    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    if not rows:
        sys.exit(f"[ERROR] {path} is empty.")

    return rows


def main() -> None:
    """Entry point: preprocess raw audio for all selected species."""
    species_rows = load_species_list(SPECIES_CSV)

    print("BirdSense Preprocessor")
    print(f"Input  : {RAW_DIR}/")
    print(f"Output : {PROCESSED_DIR}/")
    print(f"Window : {DURATION}s  |  Sample rate : {SAMPLE_RATE} Hz")
    print()

    total_written = total_skipped = total_failed = 0

    for idx, row in enumerate(species_rows, start=1):
        name = row["species_name"]
        print(f"[{idx}/{len(species_rows)}] {name}")

        written, skipped, failed = preprocess_species(name)
        total_written += written
        total_skipped += skipped
        total_failed += failed

        print(f"  >> {written} clips written  |  {skipped} already existed  |  {failed} failed")
        print()

    print("=" * 60)
    print(f"Done. {total_written} new clips in {PROCESSED_DIR}/")
    if total_skipped:
        print(f"      {total_skipped} clips skipped (already existed).")
    if total_failed:
        print(f"[WARN] {total_failed} files failed — check logs above.")


if __name__ == "__main__":
    main()
