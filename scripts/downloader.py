"""
Download Xeno-canto Grade A/B recordings for species in species_list.csv.

Saves .mp3 files to dataset/<species_name>/.
Safe to re-run: already-downloaded files are skipped by filename.

Input:  species_list.csv  (project root, produced by species_selector.py)
Output: dataset/<species_name>/*.mp3
"""

import csv
import sys
import time
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SPECIES_LIST_CSV: Path = Path("species_list.csv")
DATASET_DIR: Path = Path("dataset")

# ---------------------------------------------------------------------------
# Xeno-canto API
# Note: Xeno-canto's public API base is /api/2/recordings.
# Update XC_API_URL if the API version changes.
# ---------------------------------------------------------------------------
XC_API_URL: str = "https://xeno-canto.org/api/2/recordings"
REQUEST_DELAY: float = 1.0      # seconds between every HTTP request (API + downloads)
HTTP_TIMEOUT: int = 30          # seconds for API calls
DOWNLOAD_TIMEOUT: int = 120     # seconds for .mp3 file downloads

# ---------------------------------------------------------------------------
# Filters
# ---------------------------------------------------------------------------
ACCEPTED_GRADES: frozenset[str] = frozenset({"A", "B"})


def fetch_page(scientific_name: str, page: int) -> dict:
    """Fetch one page of Xeno-canto results for a species.

    Uses the scientific name for precision — common names can match multiple
    unrelated species. Requests Grade A/B server-side via q_gt:C; client-side
    filtering in get_all_recordings() is the safety net.

    Args:
        scientific_name: Scientific name, e.g. "Buceros rhinoceros".
        page: 1-indexed page number.

    Returns:
        Parsed JSON response dict from the Xeno-canto API.

    Raises:
        requests.HTTPError: On a non-2xx HTTP response.
        requests.RequestException: On network or timeout errors.
    """
    params = {
        "query": f'"{scientific_name}" q_gt:C',
        "page": page,
    }
    response = requests.get(XC_API_URL, params=params, timeout=HTTP_TIMEOUT)
    response.raise_for_status()
    return response.json()


def get_all_recordings(scientific_name: str) -> list[dict]:
    """Collect all Grade A/B recording entries for a species across all API pages.

    Args:
        scientific_name: Scientific name from species_list.csv.

    Returns:
        List of recording dicts from the Xeno-canto API, grade-filtered.
    """
    recordings: list[dict] = []
    page = 1

    while True:
        try:
            data = fetch_page(scientific_name, page)
        except requests.RequestException as exc:
            print(f"  [ERROR] API request failed on page {page}: {exc}")
            break

        for rec in data.get("recordings", []):
            if rec.get("q") in ACCEPTED_GRADES:
                recordings.append(rec)

        num_pages = int(data.get("numPages", 1))
        if page >= num_pages:
            break

        page += 1
        time.sleep(REQUEST_DELAY)

    return recordings


def download_file(url: str, dest: Path) -> bool:
    """Download a single audio file, skipping if the destination already exists.

    Args:
        url: Direct download URL for the .mp3 file.
        dest: Local destination path (parent directory must already exist).

    Returns:
        True if the file was downloaded, False if it already existed.

    Raises:
        requests.HTTPError: On a non-2xx HTTP response.
        requests.RequestException: On network or timeout errors.
        OSError: On a filesystem write error.
    """
    if dest.exists():
        return False

    response = requests.get(url, stream=True, timeout=DOWNLOAD_TIMEOUT)
    response.raise_for_status()

    with dest.open("wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

    return True


def download_species(species_name: str, scientific_name: str, expected_count: int) -> None:
    """Download all Grade A/B recordings for one species.

    Creates dataset/<species_name>/ if it does not exist.
    Prints per-file progress and a summary line at the end.

    Args:
        species_name: Snake_case folder name (from English Name).
        scientific_name: Scientific name used for the API query.
        expected_count: Grade A/B count from species_list.csv (informational only).
    """
    species_dir = DATASET_DIR / species_name
    species_dir.mkdir(parents=True, exist_ok=True)

    print(f"  Query: {scientific_name!r}  (CSV count: {expected_count})")
    recordings = get_all_recordings(scientific_name)
    total = len(recordings)

    if total == 0:
        print(f"  [WARN] API returned 0 Grade A/B recordings. Check species name spelling.")
        return

    print(f"  {total} Grade A/B recordings found via API.")

    downloaded = skipped = failed = 0

    for i, rec in enumerate(recordings, start=1):
        file_url: str = rec.get("file", "")
        file_name: str = rec.get("file-name", "") or f"XC{rec.get('id', i)}.mp3"
        dest = species_dir / file_name

        if not file_url:
            print(f"  [{i:>4}/{total}] SKIP     {file_name} — no URL in API response")
            failed += 1
            continue

        try:
            was_new = download_file(file_url, dest)
        except requests.RequestException as exc:
            print(f"  [{i:>4}/{total}] FAIL     {file_name} — {exc}")
            failed += 1
            time.sleep(REQUEST_DELAY)
            continue
        except OSError as exc:
            print(f"  [{i:>4}/{total}] FAIL     {file_name} — disk error: {exc}")
            failed += 1
            continue

        if was_new:
            downloaded += 1
            print(f"  [{i:>4}/{total}] OK       {file_name}")
        else:
            skipped += 1
            print(f"  [{i:>4}/{total}] EXISTS   {file_name}")

        time.sleep(REQUEST_DELAY)

    print(
        f"  >> {downloaded} downloaded  |  {skipped} already existed  |  {failed} failed"
    )


def load_species_list(path: Path) -> list[dict[str, str]]:
    """Load species_list.csv produced by species_selector.py.

    Args:
        path: Path to species_list.csv.

    Returns:
        List of row dicts with species_name, recording_count, augmentation_needed.
    """
    if not path.exists():
        sys.exit(
            f"[ERROR] {path} not found.\n"
            "        Run species_selector.py first."
        )

    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    if not rows:
        sys.exit(f"[ERROR] {path} is empty.")

    return rows


def main() -> None:
    """Entry point: download recordings for all species in species_list.csv."""
    species_rows = load_species_list(SPECIES_LIST_CSV)
    total_species = len(species_rows)

    print(f"BirdSense Downloader")
    print(f"Species to process : {total_species}")
    print(f"Output directory   : {DATASET_DIR}/")
    print(f"Request delay      : {REQUEST_DELAY}s")
    print()

    for idx, row in enumerate(species_rows, start=1):
        name = row["species_name"]
        scientific = row["scientific_name"]
        count = int(row["recording_count"])
        needs_aug = row.get("augmentation_needed", "").lower() == "true"

        aug_tag = "  [needs augmentation]" if needs_aug else ""
        print(f"{'─' * 60}")
        print(f"[{idx}/{total_species}] {name}{aug_tag}")
        print(f"{'─' * 60}")

        download_species(name, scientific, count)
        print()

    print(f"{'=' * 60}")
    print(f"All {total_species} species processed. Files in {DATASET_DIR}/")


if __name__ == "__main__":
    main()
