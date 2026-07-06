# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Summary

BirdSense is an AI-powered bird species identification system for Bornean birds. The primary deliverable (Phase 1) is a **web dashboard** where a user uploads an audio recording and receives the predicted species, confidence score, and spectrogram visualisation — no hardware required. Phase 2 (optional, post-FYP) extends the same trained model to a portable Raspberry Pi device for real-time in-field detection.

The ML pipeline (preprocessing → model → inference) is kept modular and separate from the interface layer so that Phase 2 adds only a new input/output layer rather than redesigning the core logic.

---

## Repo Structure

Maintain this layout from day one. Do not reorganise without updating this file.

```
birdsense/
├── dataset/
│   ├── raw/                  # Original Xeno-canto downloads (never modified)
│   ├── processed/            # Resampled, windowed .wav clips ready for training
│   │   └── <species_name>/   # Folder name = class label (snake_case)
│   └── test_holdout/         # 15% held out before preprocessing — never touched by training
│       └── <species_name>/
├── scripts/
│   ├── constants.py          # Single source of truth for shared numeric constants
│   ├── species_selector.py   # Filter borneo_birds.csv → species_list.csv
│   ├── downloader.py         # Xeno-canto API download + filtering
│   ├── split_holdout.py      # Move 15% of raw files to test_holdout/ (run before preprocess)
│   ├── preprocess.py         # Resample, noise-gate, window → processed/
│   ├── train.py              # Model fine-tuning entry point (Colab)
│   ├── evaluate.py           # Metrics, confusion matrix, SNR field test, export gate
│   └── export.py             # Trained model → TFLite
├── backend/
│   ├── app.py                # Flask app — POST /predict, GET /history
│   ├── inference.py          # Load TFLite model, run prediction
│   ├── preprocessing.py      # Audio → mel-spectrogram (reusable, no Flask imports)
│   └── birdsense.db          # SQLite — stores prediction metadata (git-ignored)
├── frontend/
│   └── src/                  # React upload form + results dashboard
├── models/
│   ├── checkpoints/          # .pt files saved during training (git-ignored)
│   └── export/               # Final .tflite and labels.txt
├── notebooks/
│   └── *.ipynb               # Colab exploratory work only — no production logic here
├── tests/
│   ├── test_preprocess.py
│   ├── test_model.py
│   └── test_inference.py
├── CLAUDE.md
├── SCRIPTS.md
├── .gitignore
└── requirements_train.txt    # Training-environment deps (Colab)
```

> `dataset/raw/`, `dataset/test_holdout/`, `models/checkpoints/`, and `backend/birdsense.db` are git-ignored. Use Git LFS or cloud storage for large binaries.

---

## Tech Stack

### Phase 1 — Training (Google Colab / local GPU)

| Purpose | Library |
|---|---|
| Deep learning | PyTorch ≥ 2.2 |
| Audio loading & feature extraction | librosa ≥ 0.10 |
| Metrics & preprocessing utilities | scikit-learn ≥ 1.4 |
| Spectrogram augmentation | torchaudio |
| Model export | torch.onnx → TFLite via ai-edge-torch / tf-nightly |

### Phase 1 — Web Application

| Purpose | Library / Framework |
|---|---|
| Backend API | Flask |
| Frontend | React |
| Database | SQLite (stdlib `sqlite3`) |
| On-server inference | TFLite runtime |

### Phase 2 — Raspberry Pi (Optional, post-FYP)

| Purpose | Library |
|---|---|
| On-device inference | tflite-runtime |
| Live audio capture | sounddevice |
| Feature extraction | numpy + scipy (no librosa on RPi) |
| Result persistence | SQLite via sqlite3 |

Keep training and deployment environments **strictly separate**. No PyTorch imports in Flask/RPi code; no sounddevice imports in training code.

---

## Coding Conventions

- **Python version:** 3.11 throughout.
- **Naming:** `snake_case` for variables, functions, modules, and folder/file names. `PascalCase` for classes only.
- **Type hints:** required on every function signature (parameters and return type).
- **Docstrings:** required on every function — one-line summary, then `Args:` and `Returns:` blocks if non-trivial. Use Google style.
- **Imports:** stdlib → third-party → local, separated by blank lines.
- **No magic numbers** in scripts — use the constants below or define named constants at the top of the file.

---

## Key Constants

Define these in `scripts/constants.py` and import from there. Do not redefine inline.

```python
SAMPLE_RATE: int = 16000          # Hz — resample all audio to this
DURATION: int = 5                 # seconds — fixed clip length for model input
N_MELS: int = 128                 # mel filterbank bins
HOP_LENGTH: int = 512             # STFT hop size
N_FFT: int = 1024                 # STFT window size
NUM_SPECIES: int = ...            # Set once species list is finalised (target: 25–30)
TARGET_F1: float = 0.80           # Minimum macro-F1 required before exporting model
SILENCE_THRESHOLD: float = 0.01   # RMS threshold for noise gate — clips below are dropped
```

`NUM_SPECIES` controls the final classifier head size and the `labels.txt` exported alongside the `.tflite` file. Do not train until this is set.

---

## Data Rules

1. **Source:** Xeno-canto only. Accept Grade **A** and **B** recordings. Reject C/D/E.
2. **Target species count:** 25–30 species. Prioritise iconic or acoustically distinctive Bornean birds (hornbills, pittas, babblers). Current status: 15 species downloaded — expand before training.
3. **Minimum per species:** 20 original recordings before augmentation. Do not proceed to training with fewer.
4. **Tiered augmentation rule:**
   - ≥ 50 Grade A/B recordings → use as-is, no augmentation required
   - 20–49 recordings → apply augmentation to reach sufficient sample count
   - < 20 recordings → exclude the species
5. **Folder = label:** `dataset/processed/<species_name>/` where `species_name` is the class label in `snake_case` (e.g. `rhinoceros_hornbill`). The folder name is the ground-truth label — keep it consistent.
6. **Preprocessing pipeline (in order):**
   1. Load .mp3, resample to `SAMPLE_RATE`, convert to mono
   2. Apply noise gate: drop any 5-second window whose RMS is below `SILENCE_THRESHOLD`
   3. Slice into non-overlapping `DURATION`-second windows; zero-pad short recordings to one full window
   4. Write as 16-bit PCM `.wav` to `dataset/processed/<species>/`
   5. Spectrograms are **not** stored on disk — generated at training time
7. **Holdout split:** run `split_holdout.py` **before** `preprocess.py`. It physically moves 15% of raw `.mp3` files per species to `dataset/test_holdout/`. These files are never preprocessed and never seen during training.
8. **Train/val split:** after preprocessing, split `dataset/processed/` 82/18 train/val (stratified by species, `random_state=42`). The 15% holdout in `test_holdout/` is the true test set, kept separate until final evaluation.
9. **Augmentation** (training split only, applied at load time during training):
   - Pitch shift ±2 semitones
   - Time stretch ±15%
   - Add background forest noise (Freesound.org ambience clips)
   - Random volume change ±6 dB
   - Never augment the val or test splits.

---

## Model Rules

1. **Architecture:** Frozen pretrained **BirdNET** (via `birdnetlib`) as a feature extractor — extract a 1024-d embedding per clip (`scripts/extract_embeddings.py`), then train only a small Dense classification head on top (`scripts/train.py`). BirdNET itself is never fine-tuned.
2. **Input:** cached 1024-d BirdNET embedding vector per clip (`models/checkpoints/embeddings_train.npz`), not a raw spectrogram.
3. **Loss:** `sparse_categorical_crossentropy`.
4. **Unfreezing:** not applicable — BirdNET stays frozen; only the Dense head is trained. (Earlier iterations tried YAMNet-frozen and end-to-end EfficientNetB0 fine-tuning; both were abandoned — EfficientNetB0 in particular failed because ImageNet-style vision transfer learning doesn't transfer well to spectrogram "images," and hit a separate `[0,255]`-vs-`[0,1]` input-scaling bug that collapsed the model to predicting one class.)
5. **Export gate:** run `evaluate.py` on the held-out test set. Only call `export.py` if macro-F1 ≥ `TARGET_F1`. Commit the evaluation report alongside the exported model.
6. **Export format:** `.tflite` (INT8 quantised where possible). Save `models/export/model.tflite` and `models/export/labels.txt` (one species per line, matching class index order).
7. **Field evaluation:** test at simulated SNR levels — 20 dB (quiet), 10 dB (moderate), 5 dB (loud background). Report accuracy and F1 per noise level. Target: > 80% F1 at 20 dB, > 65% F1 at 10 dB.

---

## Flask Backend Rules

- `backend/preprocessing.py` contains the audio → BirdNET embedding function. It has **no Flask imports** — it must be callable from the RPi in Phase 2 without modification.
- `backend/inference.py` loads the `.tflite` classifier head at startup and exposes a single `predict(embedding) → (species, confidence)` function.
- `backend/app.py` wires these together. The `/predict` route must not contain any ML logic itself.
- API response envelope:
  ```json
  {
    "species": "Rhinoceros Hornbill",
    "confidence": 0.92,
    "spectrogram_url": "/spectrograms/<id>.png"
  }
  ```
- Store uploaded audio in `backend/uploads/`, generated spectrogram images in `backend/spectrograms/`, and prediction metadata in `backend/birdsense.db`.

---

## Script Documentation Rule

`SCRIPTS.md` (project root) is the human-readable reference for every script in `scripts/`. Keep it up to date automatically:

- **When you add a new script** to `scripts/`, append a new section to `SCRIPTS.md` following the same structure as existing entries.
- **When you modify an existing script** in any meaningful way (new function, changed constant, changed behaviour), update the corresponding section in `SCRIPTS.md`.
- Do this as part of the same task — never leave `SCRIPTS.md` out of sync with the actual scripts.

---

## What NOT To Do

- **Do not train on the Raspberry Pi.** The RPi is inference-only. All training and export happens on Colab or a GPU machine.
- **Do not install full TensorFlow on the RPi.** Use `tflite-runtime` only.
- **Do not skip evaluation before export.** Never run `export.py` without first running `evaluate.py` and confirming F1 ≥ `TARGET_F1` on the test set.
- **Do not commit raw audio, holdout audio, or model checkpoints to git.** These are git-ignored.
- **Do not put production logic in notebooks.** Notebooks are for exploration only. Finalised logic must be in `scripts/` or `backend/`.
- **Do not hardcode species names or class indices** outside of `labels.txt` and `constants.py`.
- **Do not run `preprocess.py` before `split_holdout.py`.** The holdout must be physically moved first so preprocessed clips do not include test data.
- **Do not augment validation or test splits.**

---

## Phase Status

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | Data pipeline → frozen BirdNET embeddings + Dense head → Flask API → React dashboard | 🟡 In progress |
| **Phase 2** | Optional — Raspberry Pi real-time inference, on-device detection loop | ⬜ Not started |

### Phase 1 Checklist

**Data**
- [ ] Species list expanded to 25–30 species — `NUM_SPECIES` set in `constants.py`
- [x] Xeno-canto download script complete (`scripts/downloader.py`)
- [ ] ≥ 20 Grade A/B recordings per species confirmed for all 25–30 species
- [x] `split_holdout.py` run — 15% test files moved to `dataset/test_holdout/`
- [x] `preprocess.py` run — processed clips in `dataset/processed/`

**Model**
- [x] Training script complete (`scripts/train.py`) — frozen BirdNET embeddings + Dense head
- [x] Val-F1 ≥ 0.80 achieved (macro-F1 = 0.90 on held-out test set, 15 species)
- [x] Evaluation report generated (`scripts/evaluate.py`) — SNR field test still outstanding
- [x] Model exported to `.tflite` (`scripts/export.py`)
- [x] `models/export/model.tflite` and `labels.txt` committed

**Web Application**
- [x] Flask backend complete (`backend/app.py`, `inference.py`, `preprocessing.py`) — verified end-to-end against held-out audio
- [ ] React frontend complete — upload form + results dashboard
- [x] SQLite schema set up (`backend/birdsense.db`)
- [ ] End-to-end demo working (upload audio → species + confidence + spectrogram) — backend verified via curl; full demo pending React frontend

---

## Git Workflow

Commit and push after every meaningful unit of work:

```bash
git add <specific files>
git commit -m "type: short description"
git push
```

Prefixes: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `data:`.

Remote: https://github.com/azrainnn/fyp-ai-bird-detection (private)
