"""
Export the trained BirdSense model to TFLite.

Loads models/checkpoints/best_model.keras (full EfficientNetB0 + head) and
converts to TFLite (float16 quantisation). Saves:
  models/export/model.tflite
  models/export/labels.txt

Only run after evaluate.py reports PASS (macro-F1 >= TARGET_F1).

Run from project root:
  python scripts/export.py
"""

import json
import sys
from pathlib import Path

import tensorflow as tf

sys.path.insert(0, str(Path(__file__).parent))
from constants import TARGET_F1

_ROOT: Path = Path(__file__).parent.parent
CHECKPOINT_DIR: Path = _ROOT / "models" / "checkpoints"
EXPORT_DIR: Path = _ROOT / "models" / "export"


def check_eval_gate(report_path: Path) -> None:
    """Abort if evaluate.py did not record a PASS result.

    Args:
        report_path: Path to eval_report.txt.
    """
    if not report_path.exists():
        sys.exit("[ERROR] eval_report.txt not found. Run evaluate.py first.")
    if "[PASS]" not in report_path.read_text(encoding="utf-8"):
        sys.exit(
            f"[BLOCKED] evaluate.py did not pass the F1 gate (>= {TARGET_F1}).\n"
            "Improve the model before exporting."
        )
    print("Export gate: PASS")


def load_class_names(label_map_path: Path) -> list[str]:
    """Load ordered class names from label_map.json.

    Args:
        label_map_path: Path to label_map.json saved by train.py.

    Returns:
        List of class name strings in class-index order.
    """
    if not label_map_path.exists():
        sys.exit(f"[ERROR] {label_map_path} not found. Run train.py first.")
    with label_map_path.open() as f:
        return json.load(f)["class_names"]


def main() -> None:
    """Entry point: convert best_model.keras to TFLite and save labels.txt."""
    print("BirdSense Exporter\n")

    check_eval_gate(CHECKPOINT_DIR / "eval_report.txt")

    model_path = CHECKPOINT_DIR / "best_model.keras"
    if not model_path.exists():
        sys.exit(f"[ERROR] {model_path} not found. Run train.py first.")

    print(f"Loading model: {model_path}")
    model = tf.keras.models.load_model(str(model_path))

    print("Converting to TFLite (float16 quantisation)...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.float16]
    tflite_bytes = converter.convert()

    EXPORT_DIR.mkdir(parents=True, exist_ok=True)

    tflite_path = EXPORT_DIR / "model.tflite"
    tflite_path.write_bytes(tflite_bytes)
    print(f"Model saved : {tflite_path}  ({len(tflite_bytes) / 1e6:.1f} MB)")

    class_names = load_class_names(CHECKPOINT_DIR / "label_map.json")
    labels_path = EXPORT_DIR / "labels.txt"
    labels_path.write_text("\n".join(class_names), encoding="utf-8")
    print(f"Labels saved: {labels_path}")

    print(f"\nDone. {len(class_names)}-class model ready for the Flask backend.")


if __name__ == "__main__":
    main()
