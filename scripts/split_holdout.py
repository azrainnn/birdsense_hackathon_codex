"""
Physically separate a stratified test holdout from raw downloads.

For each species, moves 15% of .mp3 files (minimum MIN_HOLDOUT) from
dataset/raw/<species>/ to dataset/test_holdout/<species>/. Uses a fixed
random seed so the same files are always selected. Safe to re-run — files
already in test_holdout are counted toward the quota and nothing extra is moved.

Input:  dataset/raw/<species>/*.mp3  (produced by downloader.py)
Output: dataset/test_holdout/<species>/*.mp3

Run BEFORE preprocess.py.
"""

import csv
import random
import shutil
import sys
from pathlib import Path

SPECIES_CSV: Path = Path("species_selected.csv")
RAW_DIR: Path = Path("dataset/raw")
HOLDOUT_DIR: Path = Path("dataset/test_holdout")
HOLDOUT_FRACTION: float = 0.15
MIN_HOLDOUT: int = 5
RANDOM_SEED: int = 42


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


def split_species(species_name: str) -> tuple[int, int]:
    """Move holdout files for one species.

    Selects holdout files deterministically using RANDOM_SEED so the same
    set is chosen on every run. Files already in test_holdout are counted
    toward the target and not double-moved.

    Args:
        species_name: Snake_case species folder name.

    Returns:
        Tuple of (files_moved_this_run, files_already_in_holdout).
    """
    raw_dir = RAW_DIR / species_name
    holdout_dir = HOLDOUT_DIR / species_name
    holdout_dir.mkdir(parents=True, exist_ok=True)

    raw_files = {f.name for f in raw_dir.glob("*.mp3")} if raw_dir.exists() else set()
    existing_holdout = {f.name for f in holdout_dir.glob("*.mp3")}

    all_names = sorted(raw_files | existing_holdout)

    if not all_names:
        print(f"  [WARN] No .mp3 files found. Run downloader.py first.")
        return 0, 0

    total = len(all_names)
    target = max(MIN_HOLDOUT, round(total * HOLDOUT_FRACTION))
    target = min(target, total)

    rng = random.Random(RANDOM_SEED)
    selected = set(rng.sample(all_names, target))

    moved = 0
    for name in selected:
        if name in existing_holdout:
            continue
        src = raw_dir / name
        if not src.exists():
            print(f"  [WARN] {name} selected for holdout but not found in raw — skipping.")
            continue
        shutil.move(str(src), str(holdout_dir / name))
        moved += 1

    return moved, len(existing_holdout)


def main() -> None:
    """Entry point: split test holdout for all selected species."""
    species_rows = load_species_list(SPECIES_CSV)
    total_moved = 0

    print("BirdSense Holdout Splitter")
    print(f"Fraction : {HOLDOUT_FRACTION:.0%}  (min {MIN_HOLDOUT} per species, seed {RANDOM_SEED})")
    print(f"From     : {RAW_DIR}/")
    print(f"To       : {HOLDOUT_DIR}/")
    print()

    for idx, row in enumerate(species_rows, start=1):
        name = row["species_name"]
        print(f"[{idx}/{len(species_rows)}] {name}")
        moved, already = split_species(name)
        total_moved += moved
        print(f"  >> {moved} moved to holdout  |  {already} already in holdout")
        print()

    print("=" * 60)
    print(f"Done. {total_moved} files moved to {HOLDOUT_DIR}/")
    print("Run preprocess.py next.")


if __name__ == "__main__":
    main()
