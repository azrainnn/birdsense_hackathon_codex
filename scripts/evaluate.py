"""
Evaluate the trained classifier on the held-out test set.

For each MP3 in dataset/test_holdout/<species>/, extracts a BirdNET
embedding per internal 3-second window (via birdnetlib), classifies each
window with the trained Dense head, and aggregates predictions per file
via majority vote.

Reports per-species precision, recall, and F1. Checks whether macro-F1
meets TARGET_F1 (the export gate). Saves the report to
models/checkpoints/eval_report.txt — export.py reads this file.

Run from project root:
  python scripts/evaluate.py
"""

import json
import sys
from pathlib import Path

import numpy as np
import tensorflow as tf
from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer
import birdnetlib.analyzer as _birdnetlib_analyzer
from sklearn.metrics import classification_report, f1_score

sys.path.insert(0, str(Path(__file__).parent))
from constants import TARGET_F1

# TensorFlow >= 2.17 prunes the intermediate embedding tensor unless all
# tensors are explicitly preserved, which breaks birdnetlib's embedding
# extraction with "Tensor data is null" on every call.
# See: https://github.com/joeweiss/birdnetlib/issues/125
_original_tflite_interpreter = _birdnetlib_analyzer.tflite.Interpreter


def _patched_tflite_interpreter(*args, **kwargs):
    """Force experimental_preserve_all_tensors=True on every TFLite Interpreter."""
    kwargs.setdefault("experimental_preserve_all_tensors", True)
    return _original_tflite_interpreter(*args, **kwargs)


_birdnetlib_analyzer.tflite.Interpreter = _patched_tflite_interpreter

_ROOT: Path = Path(__file__).parent.parent
HOLDOUT_DIR: Path = _ROOT / "dataset" / "test_holdout"
CHECKPOINT_DIR: Path = _ROOT / "models" / "checkpoints"


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


def predict_file(model: tf.keras.Model, analyzer: Analyzer, mp3_path: Path) -> int | None:
    """Predict species for one MP3 via majority vote over BirdNET windows.

    Args:
        model: Trained Dense classifier head.
        analyzer: Shared BirdNET Analyzer instance.
        mp3_path: Path to holdout .mp3 file.

    Returns:
        Predicted integer class index, 0 if extraction yielded no windows,
        or None if BirdNET extraction raised (signals a possibly corrupted
        shared interpreter — caller should retry with a fresh Analyzer).
    """
    try:
        recording = Recording(analyzer, str(mp3_path))
        recording.extract_embeddings()
    except Exception as exc:
        print(f"  [FAIL] {mp3_path.name}: {exc}")
        return None

    if not recording.embeddings:
        return 0

    vectors = np.array([w["embeddings"] for w in recording.embeddings], dtype=np.float32)
    probs = model(vectors, training=False).numpy()
    votes = np.argmax(probs, axis=1).tolist()
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

    analyzer = Analyzer()

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
    consecutive_failures = 0
    for i, mp3 in enumerate(holdout_files):
        if i % 20 == 0:
            print(f"  {i}/{total}", end="\r", flush=True)
        pred = predict_file(model, analyzer, mp3)
        if pred is None:
            consecutive_failures += 1
            # 3+ failures in a row means the shared TFLite interpreter has
            # likely landed in a corrupted state (not 3 genuinely bad clips) —
            # reinitialize the analyzer and retry this file once.
            if consecutive_failures >= 3:
                print("\n  [RECOVER] Reinitializing BirdNET analyzer after repeated failures...")
                analyzer = Analyzer()
                pred = predict_file(model, analyzer, mp3)
                consecutive_failures = 0
            if pred is None:
                pred = 0
        else:
            consecutive_failures = 0
        y_pred.append(pred)
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
            "Consider: more training data, data augmentation, or a larger classifier head."
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
