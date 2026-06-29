"""
Evaluate the trained classifier on the held-out test set.

For each MP3 in dataset/test_holdout/<species>/, applies the same windowing
and noise-gate as preprocess.py, computes a mel-spectrogram for each window,
runs the full EfficientNetB0 model, and aggregates predictions per file via
majority vote.

Reports per-species precision, recall, and F1. Checks whether macro-F1
meets TARGET_F1 (the export gate). Saves the report to
models/checkpoints/eval_report.txt — export.py reads this file.

Run from project root:
  python scripts/evaluate.py
"""

import json
import sys
from pathlib import Path

import librosa
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, f1_score

sys.path.insert(0, str(Path(__file__).parent))
from constants import DURATION, HOP_LENGTH, N_FFT, N_MELS, SAMPLE_RATE, SILENCE_THRESHOLD, TARGET_F1

_ROOT: Path = Path(__file__).parent.parent
HOLDOUT_DIR: Path = _ROOT / "dataset" / "test_holdout"
CHECKPOINT_DIR: Path = _ROOT / "models" / "checkpoints"

IMG_H: int = 128
IMG_W: int = 128
WINDOW_SAMPLES: int = DURATION * SAMPLE_RATE


def load_label_map(path: Path) -> tuple[list[str], dict[str, int]]:
    """Load class names and label-to-index map saved by train.py.

    Args:
        path: Path to label_map.json.

    Returns:
        Tuple of (class_names, label_to_idx).
    """
    if not path.exists():
        sys.exit(f"[ERROR] {path} not found. Run train.py first.")
    with path.open() as f:
        data = json.load(f)
    return data["class_names"], data["label_to_idx"]


def waveform_to_spectrogram(waveform: np.ndarray) -> np.ndarray:
    """Convert a waveform array to a normalized (IMG_H, IMG_W, 3) mel-spectrogram.

    Args:
        waveform: Mono float32 audio array at SAMPLE_RATE.

    Returns:
        Float32 array of shape (IMG_H, IMG_W, 3).
    """
    mel = librosa.feature.melspectrogram(
        y=waveform, sr=SAMPLE_RATE,
        n_mels=N_MELS, n_fft=N_FFT, hop_length=HOP_LENGTH,
    )
    mel_db = librosa.power_to_db(mel, ref=np.max)
    mel_norm = (mel_db - mel_db.min()) / (mel_db.max() - mel_db.min() + 1e-6)
    mel_resized = tf.image.resize(mel_norm[..., np.newaxis], [IMG_H, IMG_W]).numpy()
    return np.concatenate([mel_resized] * 3, axis=-1).astype(np.float32)


def predict_file(model: tf.keras.Model, mp3_path: Path, num_classes: int) -> int:
    """Predict species for one MP3 via majority vote over 5-second windows.

    Args:
        model: Loaded full Keras model.
        mp3_path: Path to holdout .mp3 file.
        num_classes: Number of output classes (used for silent-file fallback).

    Returns:
        Predicted integer class index, or 0 on total load/silent failure.
    """
    try:
        audio, _ = librosa.load(str(mp3_path), sr=SAMPLE_RATE, mono=True)
    except Exception as exc:
        print(f"  [FAIL] {mp3_path.name}: {exc}")
        return 0

    votes: list[int] = []
    for start in range(0, len(audio), WINDOW_SAMPLES):
        chunk = audio[start : start + WINDOW_SAMPLES]
        if len(chunk) < WINDOW_SAMPLES:
            chunk = np.pad(chunk, (0, WINDOW_SAMPLES - len(chunk)))
        if float(np.sqrt(np.mean(chunk ** 2))) < SILENCE_THRESHOLD:
            continue
        spec = waveform_to_spectrogram(chunk)[np.newaxis]  # (1, H, W, 3)
        probs = model(spec, training=False).numpy()[0]
        votes.append(int(np.argmax(probs)))

    if not votes:
        return 0
    return max(set(votes), key=votes.count)


def main() -> None:
    """Entry point: evaluate on test_holdout/ and save classification report."""
    print("BirdSense Evaluator\n")

    label_map_path = CHECKPOINT_DIR / "label_map.json"
    class_names, label_to_idx = load_label_map(label_map_path)
    idx_to_label = {v: k for k, v in label_to_idx.items()}
    num_classes = len(class_names)
    print(f"Classes: {num_classes}")

    model_path = CHECKPOINT_DIR / "best_model.keras"
    if not model_path.exists():
        sys.exit(f"[ERROR] {model_path} not found. Run train.py first.")
    print(f"Loading model: {model_path}")
    model = tf.keras.models.load_model(str(model_path))

    if not HOLDOUT_DIR.exists():
        sys.exit(f"[ERROR] {HOLDOUT_DIR} does not exist. Run split_holdout.py first.")

    holdout_files: list[Path] = []
    y_true: list[int] = []
    for species in class_names:
        species_dir = HOLDOUT_DIR / species
        if not species_dir.exists():
            continue
        for mp3 in sorted(species_dir.glob("*.mp3")):
            holdout_files.append(mp3)
            y_true.append(label_to_idx[species])

    total = len(holdout_files)
    print(f"Holdout files: {total}\n")

    y_pred: list[int] = []
    for i, mp3 in enumerate(holdout_files):
        if i % 20 == 0:
            print(f"  {i}/{total}", end="\r", flush=True)
        y_pred.append(predict_file(model, mp3, num_classes))
    print(f"  {total}/{total}\n")

    target_names = [idx_to_label.get(i, f"class_{i}") for i in range(num_classes)]
    report = classification_report(
        y_true, y_pred,
        labels=list(range(num_classes)),
        target_names=target_names,
        digits=3,
        zero_division=0,
    )
    macro_f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)

    separator = "=" * 70
    gate = "PASS" if macro_f1 >= TARGET_F1 else "FAIL"
    gate_msg = (
        f"[{gate}] F1 {macro_f1:.4f} >= {TARGET_F1} — safe to run export.py."
        if gate == "PASS"
        else (
            f"[{gate}] F1 {macro_f1:.4f} < {TARGET_F1} — do not export. "
            "Consider: more training data, data augmentation, or unfreezing more layers."
        )
    )

    report_text = "\n".join([
        separator,
        "Classification Report — Held-out Test Set",
        separator,
        report,
        f"Macro F1 : {macro_f1:.4f}",
        f"Target   : {TARGET_F1}",
        "",
        gate_msg,
    ])

    print(report_text)

    report_path = CHECKPOINT_DIR / "eval_report.txt"
    report_path.write_text(report_text, encoding="utf-8")
    print(f"\nReport saved: {report_path}")


if __name__ == "__main__":
    main()
