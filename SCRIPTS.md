# BirdSense — Script Reference

This file is auto-maintained. It is updated whenever a script in `scripts/` is added or modified.

---

## Pipeline overview

```
borneo_birds.csv
       │
       ▼
species_selector.py   →   species_list.csv   (all eligible species)
                                  │
                          (manual selection)
                                  │
                                  ▼
                        species_selected.csv  (15 chosen species)
                                  │
                          ┌───────┘
                          ▼
                    downloader.py   →   dataset/raw/<species>/*.mp3
                                  │
                                  ▼
                    split_holdout.py  →   dataset/test_holdout/<species>/*.mp3
                                          (15% held out, never preprocessed)
                                  │
                                  ▼ (remaining 85%)
                    preprocess.py   →   dataset/processed/<species>/*.wav
                                          (5s windows, 16 kHz)
```

Scripts to be added in later phases: `train.py`, `evaluate.py`, `export.py`.

---

## `scripts/constants.py`

**Purpose:** Single source of truth for all shared numeric constants. Import from here — never redefine inline.

| Constant | Value | Meaning |
|---|---|---|
| `SAMPLE_RATE` | `16000` | Hz — all audio resampled to this |
| `DURATION` | `5` | seconds — fixed clip length for model input |
| `N_MELS` | `128` | mel filterbank bins |
| `HOP_LENGTH` | `512` | STFT hop size |
| `N_FFT` | `1024` | STFT window size |
| `NUM_SPECIES` | `15` | output classes — provisional; update once species list is finalised (target: 25–30) |
| `TARGET_F1` | `0.80` | minimum macro-F1 required before exporting |
| `SILENCE_THRESHOLD` | `0.01` | RMS threshold for noise gate in preprocess.py; windows below this are dropped |

---

## `scripts/species_selector.py`

**Purpose:** Reads `borneo_birds.csv` and produces `species_list.csv` — the full list of eligible species (those with ≥ 20 Grade A/B recordings on Xeno-canto).

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
| `MIN_RECORDINGS` | 20 | Species with fewer Grade A/B recordings are dropped |
| `AUGMENTATION_THRESHOLD` | 50 | Species below this are flagged `augmentation_needed = True` |
| `COL_SPECIES` | `"English Name"` | Column header for common name in input CSV |
| `COL_SCIENTIFIC` | `"Scientific Name"` | Column header for scientific name |
| `COL_GRADE_A` / `COL_GRADE_B` | `"Grade A"` / `"Grade B"` | Column headers for recording counts |

**Functions:**

| Function | What it does |
|---|---|
| `to_snake_case(name)` | Converts `"White-crowned Hornbill"` → `"white-crowned_hornbill"` for use as folder names |
| `load_birds(path)` | Opens `borneo_birds.csv`, validates required columns, returns all rows |
| `filter_species(rows)` | Sums Grade A + B, drops species under `MIN_RECORDINGS`, flags augmentation need, sorts by count |
| `write_species_list(species, path)` | Writes the filtered list to `species_list.csv` |
| `print_summary(species)` | Prints a formatted table to the terminal |
| `main()` | Entry point |

**Output CSV columns:**

| Column | Example |
|---|---|
| `species_name` | `rhinoceros_hornbill` |
| `scientific_name` | `Buceros rhinoceros` |
| `recording_count` | `37` |
| `augmentation_needed` | `True` |

---

## `scripts/downloader.py`

**Purpose:** Reads `species_selected.csv` and downloads Grade A/B `.mp3` recordings from the Xeno-canto API into `dataset/raw/<species_name>/`. Safe to re-run — already-downloaded files are skipped.

**Run:**
```bash
python scripts/downloader.py
```

**Inputs / Outputs:**

| | Path |
|---|---|
| Input | `species_selected.csv` (project root) |
| Output | `dataset/raw/<species_name>/*.mp3` |

**Key constants (top of file):**

| Constant | Value | Meaning |
|---|---|---|
| `XC_API_URL` | `https://xeno-canto.org/api/2/recordings` | Xeno-canto API endpoint |
| `REQUEST_DELAY` | `1.0` s | Pause between every HTTP request to avoid rate-limiting |
| `HTTP_TIMEOUT` | `30` s | Timeout for API calls |
| `DOWNLOAD_TIMEOUT` | `120` s | Timeout for `.mp3` file downloads |
| `ACCEPTED_GRADES` | `{"A", "B"}` | Only these quality grades are kept |

**Functions:**

| Function | What it does |
|---|---|
| `fetch_page(scientific_name, page)` | Hits the Xeno-canto API for one page of results using the scientific name and `q_gt:C` grade filter |
| `get_all_recordings(scientific_name)` | Loops all API pages, collecting every Grade A/B recording dict |
| `download_file(url, dest)` | Streams a single `.mp3` in 8 KB chunks; returns `False` if the file already exists |
| `download_species(name, scientific, count)` | Creates `dataset/raw/<name>/`, fetches all recordings, downloads each with progress logging |
| `load_species_list(path)` | Loads `species_selected.csv`; exits with an error if missing |
| `main()` | Entry point — iterates over every species and calls `download_species()` |

**Per-file terminal output:**

| Status | Meaning |
|---|---|
| `OK` | File was newly downloaded |
| `EXISTS` | File already on disk — skipped |
| `FAIL` | Network error or missing URL in API response |

---

## `scripts/split_holdout.py`

**Purpose:** Physically moves 15% of raw `.mp3` files per species (minimum 5) to `dataset/test_holdout/<species>/` before any preprocessing. These files are **never seen during training** and are reserved for final model evaluation.

**Run after `downloader.py`, before `preprocess.py`:**
```bash
python scripts/split_holdout.py
```

**Inputs / Outputs:**

| | Path |
|---|---|
| Input | `dataset/raw/<species>/*.mp3` |
| Output | `dataset/test_holdout/<species>/*.mp3` |

**Key constants (top of file):**

| Constant | Value | Meaning |
|---|---|---|
| `HOLDOUT_FRACTION` | `0.15` | 15% of each species' recordings are held out |
| `MIN_HOLDOUT` | `5` | Minimum files held out per species, regardless of fraction |
| `RANDOM_SEED` | `42` | Fixed seed — same files always selected; script is idempotent |

**Functions:**

| Function | What it does |
|---|---|
| `load_species_list(path)` | Loads `species_selected.csv` |
| `split_species(species_name)` | Determines holdout filenames deterministically, moves files not yet in holdout |
| `main()` | Entry point — iterates all species and reports moved vs. already-held-out counts |

**Notes:**
- Safe to re-run: files already in `test_holdout/` are counted toward the quota and not moved again.
- The same 15% is always selected because selection uses a deterministic seed over a sorted file list.

---

## `scripts/preprocess.py`

**Purpose:** Resamples raw recordings and extracts non-overlapping 5-second windows, saving them as 16-bit PCM `.wav` files ready for feature extraction at training time. Only processes `dataset/raw/` — holdout files in `dataset/test_holdout/` are untouched.

**Run after `split_holdout.py`:**
```bash
python scripts/preprocess.py
```

**Inputs / Outputs:**

| | Path |
|---|---|
| Input | `dataset/raw/<species>/*.mp3` |
| Output | `dataset/processed/<species>/<stem>_<window_index>.wav` |

**Key constants:**

| Constant | Source | Value |
|---|---|---|
| `SAMPLE_RATE` | `constants.py` | `16000` Hz |
| `DURATION` | `constants.py` | `5` seconds |
| `TARGET_SAMPLES` | derived | `80000` samples per clip |

**Functions:**

| Function | What it does |
|---|---|
| `load_audio(path)` | Loads `.mp3` with librosa, resamples to `SAMPLE_RATE`, returns mono float32 array |
| `is_near_silent(window, threshold)` | Returns `True` if a window's RMS is below `SILENCE_THRESHOLD`; used to drop near-silent clips before writing |
| `extract_windows(audio)` | Slices audio into non-overlapping 5s windows; short recordings are zero-padded to one full window; trailing remainder is discarded |
| `preprocess_species(species_name)` | Processes all `.mp3` files for one species, applies noise gate, and writes windowed `.wav` clips; returns `(written, skipped, failed, dropped_silent)` |
| `load_species_list(path)` | Loads `species_selected.csv` |
| `main()` | Entry point — iterates all species and reports written/skipped/silent-dropped/failed counts |

**Naming convention for output clips:**

```
XC123456_00.wav   ← window 0 of XC123456.mp3
XC123456_01.wav   ← window 1
XC123456_02.wav   ← window 2
...
```

**Notes:**
- Safe to re-run: existing clips are skipped.
- Spectrograms are **not** stored on disk — they are generated at training time.
- For recordings shorter than 5 seconds, a single zero-padded clip is produced.
