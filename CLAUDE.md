# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Summary

BirdSense is an AI-powered field bird species detector built around a portable Raspberry Pi 5 device. It listens to ambient forest sounds, extracts mel-spectrogram features in real time, and classifies Bornean bird species using a lightweight TFLite model — all without internet connectivity. The project spans three phases: Phase 1 builds the dataset and trains the classifier on Google Colab; Phase 2 deploys the inference pipeline onto the Raspberry Pi with audio capture and local logging; Phase 3 adds cloud sync, a monitoring dashboard, and CI/CD automation.

---

## Repo Structure

Maintain this layout from day one. Do not reorganise without updating this file.

```
birdsense/
├── dataset/
│   ├── raw/                  # Original Xeno-canto downloads (never modified)
│   └── processed/            # Resampled, trimmed clips ready for feature extraction
│       └── <species_name>/   # Folder name = class label (snake_case)
├── scripts/
│   ├── download_data.py      # Xeno-canto API download + filtering
│   ├── preprocess.py         # Resample, trim, augment
│   ├── train.py              # Model training entry point
│   ├── evaluate.py           # Metrics, confusion matrix, export decision
│   └── export.py             # PyTorch → ONNX → TFLite conversion
├── models/
│   ├── checkpoints/          # .pt files saved during training
│   └── export/               # Final .tflite and labels.txt
├── notebooks/
│   └── *.ipynb               # Colab exploratory work only — no production logic here
├── tests/
│   ├── test_preprocess.py
│   ├── test_model.py
│   └── test_inference.py
├── CLAUDE.md
├── .gitignore
└── requirements_train.txt    # Training-environment deps (Colab)
```

> `dataset/raw/` and `models/checkpoints/` are git-ignored. Use Git LFS or cloud storage for large binaries.

---

## Tech Stack

### Training Environment (Google Colab / local GPU)

| Purpose | Library |
|---|---|
| Deep learning | PyTorch ≥ 2.2 |
| Audio loading & feature extraction | librosa ≥ 0.10 |
| Metrics & preprocessing utilities | scikit-learn ≥ 1.4 |
| Spectrogram augmentation | torchaudio |
| Model export | torch.onnx → ai-edge-torch / tf-nightly |
| Experiment tracking | (Phase 3 — Weights & Biases) |

### Deployment Environment (Raspberry Pi 5)

| Purpose | Library |
|---|---|
| Model inference | tflite-runtime (not full TensorFlow) |
| Live audio capture | sounddevice |
| Feature extraction | numpy + scipy (no librosa on RPi) |
| Result persistence | SQLite via sqlite3 (stdlib) |
| Hardware GPIO (Phase 2) | RPi.GPIO or gpiozero |

Keep these two environments **strictly separate**. No PyTorch imports in deployment code; no sounddevice imports in training code.

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

Define these in a shared `scripts/constants.py` and import from there. Do not redefine inline.

```python
SAMPLE_RATE: int = 16000       # Hz — resample all audio to this
DURATION: int = 5              # seconds — fixed clip length for model input
N_MELS: int = 128              # mel filterbank bins
HOP_LENGTH: int = 512          # STFT hop size
N_FFT: int = 1024              # STFT window size
NUM_SPECIES: int = ...         # TBD — set once species list is finalised
TARGET_F1: float = 0.80        # Minimum macro-F1 required before exporting model
```

`NUM_SPECIES` must be set before training begins. It controls the final classifier head size and the `labels.txt` exported alongside the `.tflite` file.

---

## Data Rules

1. **Source:** Xeno-canto only. Accept Grade **A** and **B** recordings. Reject C/D/E.
2. **Minimum per species:** 20 original recordings before augmentation. Do not proceed to training with fewer.
3. **Folder = label:** `dataset/processed/<species_name>/` where `species_name` is the class label in `snake_case` (e.g. `rhinoceros_hornbill`). The folder name is the ground-truth label — keep it consistent.
4. **Preprocessing:** resample to `SAMPLE_RATE`, trim or pad to exactly `DURATION` seconds, then generate the mel-spectrogram. Store processed clips as `.wav`; do not store spectrograms on disk (generate at training time).
5. **Augmentation** (training split only): time-stretch ±10%, pitch-shift ±2 semitones, add Gaussian noise (σ = 0.005), SpecAugment (frequency and time masking). Never augment the validation or test splits.
6. **Split:** 70 / 15 / 15 train / val / test. Stratify by species. Fix `random_state=42`.

---

## Model Rules

1. **Architecture:** EfficientNet-B0 pretrained on ImageNet (via `torchvision.models`). Treat the mel-spectrogram as a 3-channel image by repeating the single channel.
2. **Fine-tuning strategy:** freeze the entire feature extractor backbone. Replace and train only the final classifier head (`model.classifier`). Unfreeze the full network only if val-F1 plateaus below `TARGET_F1` after 20 epochs.
3. **Input shape:** `(batch, 3, 128, 128)` — resize spectrograms to 128×128 before feeding.
4. **Loss:** `CrossEntropyLoss` with label smoothing = 0.1.
5. **Export gate:** run `evaluate.py` on the held-out test set. Only call `export.py` if macro-F1 ≥ `TARGET_F1`. Commit the evaluation report alongside the exported model.
6. **Export format:** `.tflite` (INT8 quantised where possible). Save `models/export/model.tflite` and `models/export/labels.txt` (one species per line, matching class index order).

---

## What NOT To Do

- **Do not train on the Raspberry Pi.** The RPi is inference-only. All training and export happens on Colab or a GPU machine.
- **Do not install full TensorFlow on the RPi.** Use `tflite-runtime` only — the binary footprint of full TF will not fit comfortably and is unnecessary.
- **Do not skip evaluation before export.** Never run `export.py` without first running `evaluate.py` and confirming F1 ≥ `TARGET_F1` on the test set.
- **Do not commit raw audio or model checkpoints to git.** These go in `dataset/raw/` and `models/checkpoints/` which are git-ignored.
- **Do not put production logic in notebooks.** Notebooks in `notebooks/` are for exploration and visualisation only. Finalised logic must be moved to `scripts/`.
- **Do not hardcode species names or class indices** outside of `labels.txt` and `constants.py`.

---

## Phase Status

Update this section as phases are completed.

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | Data collection, preprocessing, model training & export | 🟡 In progress |
| **Phase 2** | Raspberry Pi hardware setup, real-time inference pipeline, SQLite logging | ⬜ Not started |
| **Phase 3** | Cloud sync, monitoring dashboard, CI/CD | ⬜ Not started |

### Phase 1 Checklist
- [ ] Species list finalised — set `NUM_SPECIES` in `constants.py`
- [ ] Xeno-canto download script complete (`scripts/download_data.py`)
- [ ] Preprocessing pipeline complete (`scripts/preprocess.py`)
- [ ] ≥ 20 Grade A/B recordings per species confirmed
- [ ] Training script complete (`scripts/train.py`)
- [ ] Val-F1 ≥ 0.80 achieved
- [ ] Evaluation report generated (`scripts/evaluate.py`)
- [ ] Model exported to `.tflite` (`scripts/export.py`)
- [ ] `models/export/model.tflite` and `labels.txt` committed

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
