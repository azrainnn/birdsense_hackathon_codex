"""
Evaluate the trained classifier on the held-out test set.

For each MP3 in dataset/test_holdout/<species>/, applies the same windowing
and noise-gate as preprocess.py, extracts YAMNet embeddings, runs the
classifier head, and aggregates window-level predictions per file.

Reports per-species precision, recall, and F1. Checks whether macro-F1
meets TARGET_F1 (the export gate). Saves the report to
models/checkpoints/eval_report.txt — export.py reads this file.

Run from project root:
  python scripts/evaluate.py
"""

import json
import sys
from pathlib import Path
from typing import Any

import librosa
import numpy as np
import tensorflow as tf
import tensorflow_hub as hub
from sklearn.metrics import classification_report, f1_score

sys.path.insert(0, str(Path(__file__).parent))
from constants import DURATION, SAMPLE_RATE, SILENCE_THRESHOLD, TARGET_F1

YAMNET_URL: str = "https://tfhub.dev/google/yamnet/1"
_ROOT: Path = Path(__file__).parent.parent
HOLDOUT_DIR: Path = _ROOT / "dataset" / "test_holdout"
CHECKPOINT_DIR: Path = _ROOT / "models" / "checkpoints"

EMBEDDING_DIM: int = 1024
TARGET_SAMPLES: int = DURATION * SAMPLE_RATE


def load_label_map(checkpoint_dir: Path) -> tuple[list[str], dict[str, int]]:
    """Load class names and label-to-index map saved by train.py.

    Args:
        checkpoint_dir: Path to models/checkpoints/.

    Returns:
        Tuple of (class_names, label_to_idx).
    """
    path = checkpoint_dir / "label_map.json"
    if not path.exists():
        sys.exit(f"[ERROR] {path} not found. Run train.py first.")
    with path.open() as f:
        data = json.load(f)
    return data["class_names"], data["label_to_idx"]


def extract_windows(audio: np.ndarray) -> list[np.ndarray]:
    """Slice audio into non-overlapping 5-second windows.

    Args:
        audio: Mono float32 audio array at SAMPLE_RATE.

    Returns:
        List of (TARGET_SAMPLES,) float32 arrays.
    """
    if len(audio) < TARGET_SAMPLES:
        padded = np.zeros(TARGET_SAMPLES, dtype=np.float32)
        padded[: len(audio)] = audio
        return [padded]
    n = len(audio) // TARGET_SAMPLES
    return [audio[i * TARGET_SAMPLES : (i + 1) * TARGET_SAMPLES] for i in range(n)]


def predict_file(
    path: Path,
    yamnet: Any,
    head: tf.keras.Model,
    num_classes: int,
) -> np.ndarray:
    """Predict class probability vector for a single audio file.

    Loads the file, windows it, drops near-silent windows, extracts YAMNet
    embeddings for each valid window, and returns the mean softmax probability
    vector across all windows.

    Args:
        path: Path to the audio file (.mp3 or .wav).
        yamnet: Loaded YAMNet module.
        head: Trained classifier head model.
        num_classes: Number of output classes (used for fallback shape).

    Returns:
        Mean softmax probability array of shape (num_classes,).
        Returns uniform distribution on load failure.
    """
    try:
        audio, _ = librosa.load(str(path), sr=SAMPLE_RATE, mono=True)
    except Exception as exc:
        print(f"  [FAIL] {path.name}: {exc}")
        return np.full(num_classes, 1.0 / num_classes, dtype=np.float32)

    valid_windows = [
        w for w in extract_windows(audio)
        if float(np.sqrt(np.mean(w ** 2))) >= SILENCE_THRESHOLD
    ]
    if not valid_windows:
        return np.full(num_classes, 1.0 / num_classes, dtype=np.float32)

    embeddings = np.zeros((len(valid_windows), EMBEDDING_DIM), dtype=np.float32)
    for i, window in enumerate(valid_windows):
        _, emb, _ = yamnet(window)
        embeddings[i] = tf.reduce_mean(emb, axis=0).numpy()

    probs = head.predict(embeddings, verbose=0)   # (num_windows, num_classes)
    return probs.mean(axis=0)


def main() -> None:
    """Entry point: evaluate on test_holdout/ and save classification report."""
    print("BirdSense Evaluator")
    print()

    class_names, label_to_idx = load_label_map(CHECKPOINT_DIR)
    num_classes = len(class_names)
    idx_to_label = {v: k for k, v in label_to_idx.items()}
    print(f"Classes: {num_classes}")

    # Load trained head
    ckpt_path = CHECKPOINT_DIR / "best_head.keras"
    if not ckpt_path.exists():
        sys.exit(f"[ERROR] {ckpt_path} not found. Run train.py first.")
    print(f"Loading head: {ckpt_path}")
    head = tf.keras.models.load_model(str(ckpt_path))

    # Load YAMNet
    print("Loading YAMNet...")
    yamnet = hub.load(YAMNET_URL)

    if not HOLDOUT_DIR.exists():
        sys.exit(f"[ERROR] {HOLDOUT_DIR} does not exist. Run split_holdout.py first.")

    species_dirs = [d for d in sorted(HOLDOUT_DIR.iterdir()) if d.is_dir()]
    total = sum(len(list(d.glob("*.mp3"))) for d in species_dirs)
    print(f"Holdout files: {total}\n")

    y_true: list[int] = []
    y_pred: list[int] = []
    done = 0

    for species_dir in species_dirs:
        name = species_dir.name
        if name not in label_to_idx:
            print(f"[SKIP] {name} not in label map")
            continue
        true_idx = label_to_idx[name]
        for mp3 in sorted(species_dir.glob("*.mp3")):
            probs = predict_file(mp3, yamnet, head, num_classes)
            y_true.append(true_idx)
            y_pred.append(int(np.argmax(probs)))
            done += 1
            print(f"  {done}/{total}", end="\r", flush=True)

    print(f"  {done}/{total}\n")

    # Classification report
    target_names = [idx_to_label.get(i, f"class_{i}") for i in range(num_classes)]
    report = classification_report(y_true, y_pred, target_names=target_names, digits=3)
    macro_f1 = f1_score(y_true, y_pred, average="macro")

    print("=" * 70)
    print("Classification Report — Held-out Test Set")
    print("=" * 70)
    print(report)
    print(f"Macro F1 : {macro_f1:.4f}")
    print(f"Target   : {TARGET_F1}")

    gate = "PASS" if macro_f1 >= TARGET_F1 else "FAIL"
    if gate == "PASS":
        print(f"\n[{gate}] F1 {macro_f1:.4f} >= {TARGET_F1} — safe to run export.py.")
    else:
        print(
            f"\n[{gate}] F1 {macro_f1:.4f} < {TARGET_F1} — do not export. "
            "Consider: more training data, data augmentation, or unfreezing YAMNet layers."
        )

    # Save report (export.py reads this for the gate check)
    report_path = CHECKPOINT_DIR / "eval_report.txt"
    report_path.write_text(
        report
        + f"\nMacro F1 : {macro_f1:.4f}\n"
        + f"Target   : {TARGET_F1}\n"
        + f"{gate}\n"
    )
    print(f"\nReport saved: {report_path}")


if __name__ == "__main__":
    main()
