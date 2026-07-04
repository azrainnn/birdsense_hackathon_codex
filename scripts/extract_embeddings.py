"""
Extract fixed-size BirdNET embeddings for all processed training clips.

Uses BirdNET (via birdnetlib) as a frozen feature extractor: each processed
WAV clip is embedded into a 1024-d vector (BirdNET's second-to-last layer,
averaged across internal 3-second windows if a clip yields more than one).
Caches the result so train.py never needs to re-run extraction.

Run after preprocess.py, before train.py:
  python scripts/extract_embeddings.py
"""

import csv
import sys
from pathlib import Path

import numpy as np
from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer

sys.path.insert(0, str(Path(__file__).parent))

_ROOT: Path = Path(__file__).parent.parent
PROCESSED_DIR: Path = _ROOT / "dataset" / "processed"
SPECIES_CSV: Path = _ROOT / "species_selected.csv"
CHECKPOINT_DIR: Path = _ROOT / "models" / "checkpoints"
EMBEDDINGS_PATH: Path = CHECKPOINT_DIR / "embeddings_train.npz"


def load_species_list(path: Path) -> list[dict[str, str]]:
    """Load species_selected.csv.

    Args:
        path: Path to species_selected.csv.

    Returns:
        List of row dicts.
    """
    if not path.exists():
        sys.exit(f"[ERROR] {path} not found. Run species_selector.py first.")
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def collect_files(
    species_list: list[dict[str, str]],
) -> tuple[list[str], list[int], list[str]]:
    """Scan processed/ and return file paths, integer labels, and class names.

    Args:
        species_list: Rows from species_selected.csv.

    Returns:
        Tuple of (file_paths, int_labels, class_names).
    """
    file_paths: list[str] = []
    int_labels: list[int] = []
    class_names: list[str] = []

    for row in species_list:
        name = row["species_name"]
        species_dir = PROCESSED_DIR / name
        wavs = sorted(species_dir.glob("*.wav")) if species_dir.exists() else []
        if not wavs:
            print(f"  [SKIP] {name} — no WAV files in processed/")
            continue
        idx = len(class_names)
        class_names.append(name)
        for wav in wavs:
            file_paths.append(str(wav))
            int_labels.append(idx)

    return file_paths, int_labels, class_names


def embed_file(analyzer: Analyzer, path: str) -> np.ndarray | None:
    """Extract a single 1024-d BirdNET embedding for one clip.

    Averages across all internal BirdNET windows if a clip yields more
    than one (e.g. clips longer than BirdNET's 3-second window).

    Args:
        analyzer: Shared BirdNET Analyzer instance.
        path: Path to a WAV clip.

    Returns:
        Float32 array of shape (1024,), or None if extraction failed.
    """
    try:
        recording = Recording(analyzer, path)
        recording.extract_embeddings()
    except Exception as exc:
        print(f"  [FAIL] {Path(path).name}: {exc}")
        return None

    if not recording.embeddings:
        return None
    vectors = np.array([w["embeddings"] for w in recording.embeddings], dtype=np.float32)
    return vectors.mean(axis=0)


def main() -> None:
    """Entry point: embed every processed clip and cache to embeddings_train.npz."""
    print("BirdSense Embedding Extractor (BirdNET)\n")

    species_list = load_species_list(SPECIES_CSV)
    file_paths, int_labels, class_names = collect_files(species_list)
    total = len(file_paths)
    print(f"Species: {len(class_names)}  |  Total clips: {total}\n")

    analyzer = Analyzer()

    embeddings: list[np.ndarray] = []
    labels: list[int] = []
    for i, (path, label) in enumerate(zip(file_paths, int_labels)):
        if i % 50 == 0:
            print(f"  {i}/{total}", end="\r", flush=True)
        vec = embed_file(analyzer, path)
        if vec is None:
            continue
        embeddings.append(vec)
        labels.append(label)
    print(f"  {total}/{total}\n")

    X = np.stack(embeddings).astype(np.float32)
    y = np.array(labels, dtype=np.int32)

    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    np.savez(EMBEDDINGS_PATH, X=X, y=y, class_names=np.array(class_names))
    print(f"Embeddings saved: {EMBEDDINGS_PATH}  (X shape {X.shape})")
    print(f"Skipped: {total - len(embeddings)} clip(s) failed extraction.")


if __name__ == "__main__":
    main()
