"""
Export the trained BirdSense model to TFLite.

Combines the frozen YAMNet feature extractor with the trained Dense head
into a single tf.Module, converts to TFLite (float16 quantisation), and saves:
  models/export/model.tflite
  models/export/labels.txt

Only run after evaluate.py reports PASS (macro-F1 >= TARGET_F1).

Run from project root:
  python scripts/export.py
"""

import json
import sys
import tempfile
from pathlib import Path

import numpy as np
import tensorflow as tf
import tensorflow_hub as hub

sys.path.insert(0, str(Path(__file__).parent))
from constants import DURATION, SAMPLE_RATE

YAMNET_URL: str = "https://tfhub.dev/google/yamnet/1"
_ROOT: Path = Path(__file__).parent.parent
CHECKPOINT_DIR: Path = _ROOT / "models" / "checkpoints"
EXPORT_DIR: Path = _ROOT / "models" / "export"

EMBEDDING_DIM: int = 1024
WAVEFORM_LENGTH: int = SAMPLE_RATE * DURATION


def load_label_map(checkpoint_dir: Path) -> tuple[list[str], dict[str, int]]:
    """Load label map saved by train.py.

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


class BirdClassifier(tf.Module):
    """Inference module: raw 5-second waveform → species class probabilities.

    Combines YAMNet feature extraction with the trained Dense head into a
    single exportable tf.Module suitable for TFLite conversion.
    """

    def __init__(self, yamnet: hub.Module, head: tf.keras.Model) -> None:
        """Initialise with loaded YAMNet and classifier head.

        Args:
            yamnet: Loaded YAMNet TF Hub module.
            head: Trained Keras classifier head.
        """
        super().__init__()
        self._yamnet = yamnet
        self._head = head

    @tf.function(
        input_signature=[
            tf.TensorSpec(shape=[WAVEFORM_LENGTH], dtype=tf.float32, name="waveform")
        ]
    )
    def predict(self, waveform: tf.Tensor) -> dict[str, tf.Tensor]:
        """Run inference on a single 5-second waveform.

        Args:
            waveform: Float32 tensor of shape (SAMPLE_RATE * DURATION,).
                      Values should be in [-1.0, 1.0].

        Returns:
            Dict with key 'class_probs': float32 tensor of shape (num_classes,).
        """
        _, embeddings, _ = self._yamnet(waveform)
        pooled = tf.reduce_mean(embeddings, axis=0, keepdims=True)  # (1, 1024)
        probs = self._head(pooled, training=False)                   # (1, num_classes)
        return {"class_probs": tf.squeeze(probs, axis=0)}           # (num_classes,)


def main() -> None:
    """Entry point: export trained model to TFLite and save labels.txt."""
    print("BirdSense Exporter")
    print()

    # Gate check — only export if evaluate.py reported PASS
    report_path = CHECKPOINT_DIR / "eval_report.txt"
    if report_path.exists():
        content = report_path.read_text()
        if "PASS" not in content:
            sys.exit(
                "[ERROR] evaluate.py reported FAIL. "
                "Achieve macro-F1 >= TARGET_F1 before exporting."
            )
        print("Export gate: PASS")
    else:
        print("[WARN] No eval_report.txt found — skipping gate check.")
        print("       Run evaluate.py first to confirm F1 >= TARGET_F1.\n")

    # Load label map
    class_names, _ = load_label_map(CHECKPOINT_DIR)
    print(f"Classes: {len(class_names)}")

    # Load trained head
    ckpt_path = CHECKPOINT_DIR / "best_head.keras"
    if not ckpt_path.exists():
        sys.exit(f"[ERROR] {ckpt_path} not found. Run train.py first.")
    print(f"Loading head: {ckpt_path}")
    head = tf.keras.models.load_model(str(ckpt_path))

    # Load YAMNet
    print("Loading YAMNet...")
    yamnet = hub.load(YAMNET_URL)

    # Build combined module and trace the predict function
    print("Building BirdClassifier module...")
    classifier = BirdClassifier(yamnet, head)

    # Dry-run trace to validate the graph before conversion
    dummy = tf.zeros([WAVEFORM_LENGTH], dtype=tf.float32)
    result = classifier.predict(dummy)
    print(f"Graph traced — output shape: {result['class_probs'].shape}")

    # Save as SavedModel then convert to TFLite
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp_dir:
        print("Saving SavedModel...")
        tf.saved_model.save(classifier, tmp_dir)

        print("Converting to TFLite (float16 quantisation)...")
        converter = tf.lite.TFLiteConverter.from_saved_model(tmp_dir)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.target_spec.supported_types = [tf.float16]
        tflite_bytes = converter.convert()

    # Write TFLite model
    tflite_path = EXPORT_DIR / "model.tflite"
    tflite_path.write_bytes(tflite_bytes)
    print(f"Saved: {tflite_path}  ({len(tflite_bytes) / 1024:.0f} KB)")

    # Write labels (one species name per line, index = class index)
    labels_path = EXPORT_DIR / "labels.txt"
    labels_path.write_text("\n".join(class_names))
    print(f"Saved: {labels_path}")

    print(f"\nDone. {len(class_names)}-class model ready for Flask backend.")


if __name__ == "__main__":
    main()
