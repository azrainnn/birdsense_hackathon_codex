# BirdSense — Script Reference

This file is auto-maintained. It is updated whenever a script in `scripts/` is added or modified.

---

## `scripts/species_selector.py`

**Purpose:** Reads `borneo_birds.csv` and produces `species_list.csv` — the filtered, clean list of species the downloader will use.

**Run:**
```bash
python scripts/species_selector.py
```

**Inputs / Outputs:**

| | Path |
|---|---|
| Input | `borneo_birds.csv` (project root) |
| Output | `species_list.csv` (project root) |

**Key constants (top of file):**

| Constant | Value | Meaning |
|---|---|---|
| `MIN_RECORDINGS` | 20 | Species with fewer Grade A/B recordings are dropped entirely |
| `AUGMENTATION_THRESHOLD` | 50 | Species below this are flagged `augmentation_needed = True` |
| `COL_SPECIES` | `"English Name"` | Column header for common name in input CSV |
| `COL_SCIENTIFIC` | `"Scientific Name"` | Column header for scientific name |
| `COL_GRADE_A` / `COL_GRADE_B` | `"Grade A"` / `"Grade B"` | Column headers for recording counts |

**Functions:**

| Function | What it does |
|---|---|
| `to_snake_case(name)` | Converts a display name like `"White-crowned Hornbill"` to a filesystem-safe folder name like `"white-crowned_hornbill"` |
| `load_birds(path)` | Opens `borneo_birds.csv`, checks required columns exist, returns all rows as a list of dicts |
| `filter_species(rows)` | Sums Grade A + B per species, drops anything under `MIN_RECORDINGS`, sets `augmentation_needed` flag, sorts by count descending |
| `write_species_list(species, path)` | Writes the filtered list to `species_list.csv` |
| `print_summary(species)` | Prints a formatted table to the terminal showing all selected species and which need augmentation |
| `main()` | Entry point — chains the above four functions |

**Output CSV columns:**

| Column | Example |
|---|---|
| `species_name` | `rhinoceros_hornbill` |
| `scientific_name` | `Buceros rhinoceros` |
| `recording_count` | `87` |
| `augmentation_needed` | `False` |

---

## `scripts/downloader.py`

**Purpose:** Reads `species_list.csv` and downloads Grade A/B `.mp3` recordings from the Xeno-canto API into `dataset/<species_name>/`. Safe to re-run — already-downloaded files are skipped.

**Run:**
```bash
python scripts/downloader.py
```

**Inputs / Outputs:**

| | Path |
|---|---|
| Input | `species_list.csv` (project root, produced by `species_selector.py`) |
| Output | `dataset/<species_name>/*.mp3` |

**Key constants (top of file):**

| Constant | Value | Meaning |
|---|---|---|
| `XC_API_URL` | `https://xeno-canto.org/api/2/recordings` | Xeno-canto API endpoint |
| `REQUEST_DELAY` | `1.0` s | Pause between every HTTP request (API + downloads) to avoid rate-limiting |
| `HTTP_TIMEOUT` | `30` s | Timeout for API calls |
| `DOWNLOAD_TIMEOUT` | `120` s | Timeout for `.mp3` file downloads |
| `ACCEPTED_GRADES` | `{"A", "B"}` | Only recordings with these quality grades are kept |

**Functions:**

| Function | What it does |
|---|---|
| `fetch_page(scientific_name, page)` | Hits the Xeno-canto API for one page of results for a species using the scientific name and `q_gt:C` filter |
| `get_all_recordings(scientific_name)` | Loops through all API pages for a species, collecting every Grade A/B recording dict |
| `download_file(url, dest)` | Downloads a single `.mp3` by streaming in 8 KB chunks; returns `False` (skips) if the file already exists |
| `download_species(name, scientific, count)` | Creates `dataset/<species_name>/`, fetches all recordings, downloads each with `OK` / `EXISTS` / `FAIL` progress logging |
| `load_species_list(path)` | Loads `species_list.csv`; exits with an error if the file is missing |
| `main()` | Entry point — iterates over every species in `species_list.csv` and calls `download_species()` |

**Per-file terminal output:**

| Status | Meaning |
|---|---|
| `OK` | File was newly downloaded |
| `EXISTS` | File already on disk — skipped |
| `FAIL` | Network error or missing URL in API response |

---

## Pipeline overview

```
borneo_birds.csv
       │
       ▼
species_selector.py   →   species_list.csv
                                  │
                                  ▼
                          downloader.py   →   dataset/<species_name>/*.mp3
```

Scripts to be added in later phases: `preprocess.py`, `train.py`, `evaluate.py`, `export.py`.
