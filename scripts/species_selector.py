"""
Filter Borneo bird species to those with enough Grade A/B recordings
for model training, and flag which species will need augmentation.

Input:  borneo_birds.csv  (project root)
Output: species_list.csv  (project root)
"""

import csv
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Column names in borneo_birds.csv — edit here if your CSV uses different headers
# ---------------------------------------------------------------------------
COL_SPECIES: str = "English Name"
COL_SCIENTIFIC: str = "Scientific Name"
COL_GRADE_A: str = "Grade A"
COL_GRADE_B: str = "Grade B"

# ---------------------------------------------------------------------------
# Thresholds
# ---------------------------------------------------------------------------
MIN_RECORDINGS: int = 20        # species with fewer are dropped entirely
AUGMENTATION_THRESHOLD: int = 50  # species below this are flagged for augmentation

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
INPUT_CSV: Path = Path("borneo_birds.csv")
OUTPUT_CSV: Path = Path("species_list.csv")


def to_snake_case(name: str) -> str:
    """Convert a display name to a filesystem-safe snake_case label.

    Args:
        name: Raw species name, e.g. "White-crowned Hornbill".

    Returns:
        snake_case string, e.g. "white-crowned_hornbill".
    """
    name = name.strip().lower()
    name = re.sub(r"[^\w\s-]", "", name)   # remove punctuation except hyphens
    name = re.sub(r"\s+", "_", name)        # spaces → underscores
    return name


def load_birds(path: Path) -> list[dict[str, str]]:
    """Load the raw Borneo bird CSV and validate expected columns.

    Args:
        path: Path to borneo_birds.csv.

    Returns:
        List of row dicts with raw string values.
    """
    if not path.exists():
        sys.exit(
            f"[ERROR] {path} not found.\n"
            "        Place borneo_birds.csv in the project root and retry."
        )

    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    if not rows:
        sys.exit(f"[ERROR] {path} is empty.")

    required = {COL_SPECIES, COL_SCIENTIFIC, COL_GRADE_A, COL_GRADE_B}
    present = set(rows[0].keys())
    missing = required - present
    if missing:
        sys.exit(
            f"[ERROR] {path} is missing columns: {missing}\n"
            f"        Present columns: {sorted(present)}\n"
            f"        Expected: {COL_SPECIES!r}, {COL_SCIENTIFIC!r}, "
            f"{COL_GRADE_A!r}, {COL_GRADE_B!r}\n"
            "        Update the COL_* constants at the top of this script if your "
            "CSV uses different header names."
        )

    return rows


def filter_species(rows: list[dict[str, str]]) -> list[dict]:
    """Apply recording-count thresholds and build the output rows.

    Args:
        rows: Raw rows from borneo_birds.csv.

    Returns:
        Filtered and normalised list, sorted by recording_count descending.
    """
    selected: list[dict] = []
    skipped_low: int = 0
    skipped_bad: int = 0

    for row in rows:
        raw_name = row[COL_SPECIES]

        try:
            count = int(row[COL_GRADE_A]) + int(row[COL_GRADE_B])
        except ValueError:
            print(f"[WARN] Skipping '{raw_name}': non-integer count in grade columns.")
            skipped_bad += 1
            continue

        if count < MIN_RECORDINGS:
            skipped_low += 1
            continue

        selected.append(
            {
                "species_name": to_snake_case(raw_name),
                "scientific_name": row[COL_SCIENTIFIC].strip(),
                "recording_count": count,
                "augmentation_needed": count < AUGMENTATION_THRESHOLD,
            }
        )

    selected.sort(key=lambda r: r["recording_count"], reverse=True)

    print(f"[INFO] {len(rows)} total species in CSV")
    print(f"[INFO] {skipped_low} dropped — fewer than {MIN_RECORDINGS} Grade A/B recordings")
    if skipped_bad:
        print(f"[WARN] {skipped_bad} dropped — malformed count values")

    return selected


def write_species_list(species: list[dict], path: Path) -> None:
    """Write the filtered species list to CSV.

    Args:
        species: Filtered and normalised species rows.
        path: Destination path for species_list.csv.
    """
    fieldnames = ["species_name", "scientific_name", "recording_count", "augmentation_needed"]
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(species)


def print_summary(species: list[dict]) -> None:
    """Print a formatted table of selected species to stdout.

    Args:
        species: Filtered species rows.
    """
    needs_aug = [s for s in species if s["augmentation_needed"]]
    sufficient = [s for s in species if not s["augmentation_needed"]]

    print(f"\n[OK] {len(species)} species written to {OUTPUT_CSV}")
    print(
        f"     {len(sufficient)} sufficient  |  "
        f"{len(needs_aug)} need augmentation (< {AUGMENTATION_THRESHOLD} recordings)"
    )
    print()
    print(f"  {'Species (folder name)':<40} {'Scientific Name':<35} {'Count':>6}  Augment?")
    print("  " + "-" * 88)
    for s in species:
        flag = "YES" if s["augmentation_needed"] else "no"
        print(
            f"  {s['species_name']:<40} {s['scientific_name']:<35} "
            f"{s['recording_count']:>6}  {flag}"
        )


def main() -> None:
    """Entry point: filter borneo_birds.csv and write species_list.csv."""
    rows = load_birds(INPUT_CSV)
    species = filter_species(rows)

    if not species:
        sys.exit(
            f"[ERROR] No species passed the {MIN_RECORDINGS}-recording threshold. "
            "Check borneo_birds.csv."
        )

    write_species_list(species, OUTPUT_CSV)
    print_summary(species)


if __name__ == "__main__":
    main()
