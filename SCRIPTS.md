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
                                          (5s windows, 16 kHz, noise-gated)
                                  │
                                  ▼
                    extract_embeddings.py  →  models/checkpoints/embeddings_train.npz
                                                (frozen BirdNET, 1024-d per clip)
                                  │
                                  ▼
                    train.py        →   models/checkpoints/best_model.keras
                                        models/checkpoints/label_map.json
                                  │
                                  ▼
                    evaluate.py     →   models/checkpoints/eval_report.txt
                                          (PASS / FAIL gate)
                                  │
                            (PASS only)
                                  │
                                  ▼
                    export.py       →   models/export/model.tflite
                                        models/export/labels.txt
```

Scripts to be added for the web application: `backend/app.py`, `backend/inference.py`, `backend/preprocessing.py`.

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

---

## `scripts/extract_embeddings.py`

**Purpose:** Uses pretrained BirdNET (via `birdnetlib`) as a frozen feature extractor. Runs every processed WAV clip through BirdNET and caches a 1024-d embedding per clip (BirdNET's second-to-last layer, averaged across internal 3-second windows if a clip yields more than one). This is the slow step — a forward pass per clip — so the result is cached to disk and `train.py` never re-runs it.

**Run after `preprocess.py`, before `train.py`:**
```bash
python scripts/extract_embeddings.py
```

**Inputs / Outputs:**

| | Path |
|---|---|
| Input | `species_selected.csv`, `dataset/processed/<species>/*.wav` |
| Output (cache) | `models/checkpoints/embeddings_train.npz` (`X` float32 `(N,1024)`, `y` int32 `(N,)`, `class_names`) |

**Functions:**

| Function | What it does |
|---|---|
| `load_species_list(path)` | Loads `species_selected.csv` |
| `collect_files(species_list)` | Scans `dataset/processed/` and returns `(file_paths, labels, class_names)` |
| `embed_file(analyzer, path)` | Runs BirdNET on one WAV clip, averages across returned windows to a `(1024,)` vector |
| `main()` | Entry point — embeds every clip and writes `embeddings_train.npz` |

**Notes:**
- BirdNET resamples internally to 48 kHz regardless of the source file's rate; note that our clips were already downsampled to 16 kHz in `preprocess.py`, so any content above 8 kHz is permanently unavailable to BirdNET here.
- Clips that fail extraction are skipped (logged, not fatal).

---

## `scripts/train.py`

**Purpose:** Trains a small Dense classifier head on top of cached, frozen BirdNET embeddings. BirdNET itself is never fine-tuned — only the head (Dropout → Dense(256) → Dropout → Dense(num_classes, softmax)) is trained, so this runs in seconds/epoch even on CPU.

**Run after `extract_embeddings.py`:**
```bash
python scripts/train.py
```

**Inputs / Outputs:**

| | Path |
|---|---|
| Input | `models/checkpoints/embeddings_train.npz` |
| Output (model) | `models/checkpoints/best_model.keras` |
| Output (labels) | `models/checkpoints/label_map.json` |

**Key constants (top of file):**

| Constant | Value | Meaning |
|---|---|---|
| `EMBEDDING_DIM` | `1024` | BirdNET embedding size |
| `BATCH_SIZE` | `32` | Training batch size |
| `EPOCHS` | `60` | Maximum training epochs |
| `LEARNING_RATE` | `1e-3` | Adam learning rate |
| `VAL_FRACTION` | `0.18` | Fraction of clips held for validation |
| `DROPOUT_RATE` | `0.4` | Dropout applied after each Dense layer |
| `PATIENCE_STOP` | `10` | EarlyStopping patience (epochs) |
| `PATIENCE_LR` | `4` | ReduceLROnPlateau patience (epochs) |

**Functions:**

| Function | What it does |
|---|---|
| `load_embeddings(path)` | Loads `embeddings_train.npz` → `(X, y, class_names)` |
| `build_model(num_classes)` | Returns uncompiled Keras model: Input(1024) → Dropout → Dense(256, relu) → Dropout → Dense(num_classes, softmax) |
| `make_callbacks(ckpt_path)` | ModelCheckpoint / EarlyStopping / ReduceLROnPlateau / TensorBoard |
| `main()` | Entry point — orchestrates the full training run |

**Notes:**
- Class weights are computed automatically (`sklearn.compute_class_weight`) to handle species imbalance.
- Label order in `label_map.json` defines the class index used by `labels.txt`.

---

## `scripts/evaluate.py`

**Purpose:** Evaluates the trained classifier head on the held-out test set (`dataset/test_holdout/`). Extracts a BirdNET embedding per internal 3-second window for each holdout MP3, classifies each window, and aggregates predictions per file via majority vote. Reports per-species precision/recall/F1 plus macro-F1. Writes `eval_report.txt` which is the export gate for `export.py`.

**Run after `train.py`:**
```bash
python scripts/evaluate.py
```

**Inputs / Outputs:**

| | Path |
|---|---|
| Input | `models/checkpoints/best_model.keras`, `models/checkpoints/label_map.json`, `dataset/test_holdout/<species>/*.mp3` |
| Output | `models/checkpoints/eval_report.txt` (classification report + `[PASS]` or `[FAIL]`) |

**Functions:**

| Function | What it does |
|---|---|
| `load_label_map(path)` | Loads `label_map.json` written by `train.py` |
| `predict_file(model, analyzer, mp3_path)` | Extracts BirdNET embeddings per window for one MP3, classifies each, returns the majority-vote class |
| `main()` | Entry point — evaluates all holdout files and prints/saves the classification report |

**Notes:**
- BirdNET's own internal windowing/resampling (3s @ 48kHz) replaces the manual windowing/noise-gate logic previously done by hand.
- File-level prediction = majority vote across window-level argmax predictions.
- `eval_report.txt` ends with `[PASS]` or `[FAIL]` — `export.py` checks this line.

---

## `scripts/export.py`

**Purpose:** Loads `best_model.keras` (the Dense classifier head) and converts it to TFLite (float16 quantisation). Model-agnostic — works the same regardless of what architecture produced `best_model.keras`. Blocked by the export gate — exits with an error if `eval_report.txt` does not contain `[PASS]`.

**Run after `evaluate.py` reports PASS:**
```bash
python scripts/export.py
```

**Inputs / Outputs:**

| | Path |
|---|---|
| Input | `models/checkpoints/best_model.keras`, `models/checkpoints/label_map.json`, `models/checkpoints/eval_report.txt` |
| Output | `models/export/model.tflite`, `models/export/labels.txt` |

**Functions:**

| Function | What it does |
|---|---|
| `check_eval_gate(report_path)` | Exits unless `eval_report.txt` contains `[PASS]` |
| `load_class_names(label_map_path)` | Loads ordered class names from `label_map.json` |
| `main()` | Gate check → load Keras model → convert to TFLite (float16) → write `model.tflite` and `labels.txt` |

**Notes:**
- The exported TFLite model takes a 1024-d BirdNET embedding as input, not raw audio — the Flask backend must run BirdNET embedding extraction itself before calling this model (not yet implemented; see Phase 1 checklist).
- `labels.txt` line index matches the class index in the model's softmax output.
