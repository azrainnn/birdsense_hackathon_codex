"""
Download Xeno-canto Grade A/B recordings for species in species_selected.csv.

Saves .mp3 files to dataset/raw/<species_name>/.
Safe to re-run: already-downloaded files are skipped by filename.

Requires a Xeno-canto API key (v3). Get yours at https://xeno-canto.org/account,
then set it as an environment variable before running:

    $env:XC_API_KEY = "your_key_here"   # PowerShell
    export XC_API_KEY="your_key_here"   # bash / Colab

Input:  species_selected.csv  (project root)
Output: dataset/raw/<species_name>/*.mp3
"""

import csv
import os
import sys
import time
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SPECIES_LIST_CSV: Path = Path("species_selected.csv")
DATASET_DIR: Path = Path("dataset/raw")

# ---------------------------------------------------------------------------
# Xeno-canto API v3
# API key is read from the XC_API_KEY environment variable.
# ---------------------------------------------------------------------------
XC_API_URL: str = "https://xeno-canto.org/api/3/recordings"
REQUEST_DELAY: float = 1.0      # seconds between every HTTP request (API + downloads)
HTTP_TIMEOUT: int = 30          # seconds for API calls
DOWNLOAD_TIMEOUT: int = 120     # seconds for .mp3 file downloads

# ---------------------------------------------------------------------------
# Filters
# ---------------------------------------------------------------------------
ACCEPTED_GRADES: frozenset[str] = frozenset({"A", "B"})


def get_api_key() -> str:
    """Read the Xeno-canto API key from the XC_API_KEY environment variable.

    Returns:
        The API key string.
    """
    key = os.environ.get("XC_API_KEY", "").strip()
    if not key:
        sys.exit(
            "[ERROR] XC_API_KEY environment variable is not set.\n"
            "        Get your API key at https://xeno-canto.org/account then run:\n"
            "            $env:XC_API_KEY = 'your_key_here'   (PowerShell)\n"
            "            export XC_API_KEY='your_key_here'   (bash / Colab)"
        )
    return key


def _build_query(scientific_name: str) -> str:
    """Build an API v3 tag query from a two-part scientific name.

    API v3 requires tag-based queries (e.g. gen:Buceros sp:rhinoceros).
    Grade filtering is done client-side — v3 does not support q>:C in queries.

    Args:
        scientific_name: Two-word scientific name, e.g. "Buceros rhinoceros".

    Returns:
        Tag query string, e.g. "gen:Buceros sp:rhinoceros".
    """
    parts = scientific_name.strip().split()
    if len(parts) >= 2:
        return f"gen:{parts[0]} sp:{parts[1]}"
    return f"gen:{parts[0]}"


def fetch_page(scientific_name: str, page: int, api_key: str) -> dict:
    """Fetch one page of Xeno-canto results for a species.

    Uses genus + species tags for precision. Grade filtering (A/B only)
    is applied client-side in get_all_recordings().

    Args:
        scientific_name: Scientific name, e.g. "Buceros rhinoceros".
        page: 1-indexed page number.
        api_key: Xeno-canto API v3 key.

    Returns:
        Parsed JSON response dict from the Xeno-canto API.

    Raises:
        requests.HTTPError: On a non-2xx HTTP response.
        requests.RequestException: On network or timeout errors.
    """
    params = {
        "query": _build_query(scientific_name),
        "page": page,
        "key": api_key,
    }
    response = requests.get(XC_API_URL, params=params, timeout=HTTP_TIMEOUT)
    response.raise_for_status()
    return response.json()


def get_all_recordings(scientific_name: str, api_key: str) -> list[dict]:
    """Collect all Grade A/B recording entries for a species across all API pages.

    Args:
        scientific_name: Scientific name from species_selected.csv.
        api_key: Xeno-canto API v3 key.

    Returns:
        List of recording dicts from the Xeno-canto API, grade-filtered.
    """
    recordings: list[dict] = []
    page = 1

    while True:
        try:
            data = fetch_page(scientific_name, page, api_key)
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


def download_species(
    species_name: str, scientific_name: str, expected_count: int, api_key: str
) -> None:
    """Download all Grade A/B recordings for one species.

    Creates dataset/raw/<species_name>/ if it does not exist.
    Prints per-file progress and a summary line at the end.

    Args:
        species_name: Snake_case folder name (from English Name).
        scientific_name: Scientific name used for the API query.
        expected_count: Grade A/B count from species_selected.csv (informational only).
        api_key: Xeno-canto API v3 key.
    """
    species_dir = DATASET_DIR / species_name
    species_dir.mkdir(parents=True, exist_ok=True)

    print(f"  Query: {scientific_name!r}  (CSV count: {expected_count})")
    recordings = get_all_recordings(scientific_name, api_key)
    total = len(recordings)

    if total == 0:
        print("  [WARN] API returned 0 Grade A/B recordings. Check species name spelling.")
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
    """Load species_selected.csv.

    Args:
        path: Path to species_selected.csv.

    Returns:
        List of row dicts with species_name, scientific_name, recording_count.
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
    """Entry point: download recordings for all species in species_selected.csv."""
    api_key = get_api_key()
    species_rows = load_species_list(SPECIES_LIST_CSV)
    total_species = len(species_rows)

    print("BirdSense Downloader  (Xeno-canto API v3)")
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
        print(f"{'-' * 60}")
        print(f"[{idx}/{total_species}] {name}{aug_tag}")
        print(f"{'-' * 60}")

        download_species(name, scientific, count, api_key)
        print()

    print("=" * 60)
    print(f"All {total_species} species processed. Files in {DATASET_DIR}/")


if __name__ == "__main__":
    main()
