"""Load the trained BirdSense TFLite classifier head and run predictions.

Loads models/export/model.tflite and models/export/labels.txt once at
import time. Exposes a single predict() function — the /predict route in
app.py must not contain any ML logic itself (see CLAUDE.md).
"""

from pathlib import Path

import numpy as np

try:
    import tflite_runtime.interpreter as tflite
except ImportError:
    from tensorflow import lite as tflite

_ROOT: Path = Path(__file__).parent.parent
_MODEL_PATH: Path = _ROOT / "models" / "export" / "model.tflite"
_LABELS_PATH: Path = _ROOT / "models" / "export" / "labels.txt"

_interpreter = tflite.Interpreter(model_path=str(_MODEL_PATH))
_input_index: int = _interpreter.get_input_details()[0]["index"]
_output_index: int = _interpreter.get_output_details()[0]["index"]

_class_names: list[str] = _LABELS_PATH.read_text(encoding="utf-8").splitlines()


def predict(embeddings: list[np.ndarray]) -> tuple[str, float]:
    """Predict a species from one or more BirdNET window embeddings.

    Runs the classifier head on all window embeddings in one batch and
    majority-votes across windows, mirroring scripts/evaluate.py.

    Args:
        embeddings: List of 1024-d BirdNET embedding vectors, one per
            window (see preprocessing.extract_embeddings).

    Returns:
        Tuple of (predicted species name, confidence in [0, 1]), where
        confidence is the mean softmax probability of the winning class
        across all windows that voted for it.
    """
    batch = np.stack(embeddings).astype(np.float32)
    _interpreter.resize_tensor_input(_input_index, list(batch.shape))
    _interpreter.allocate_tensors()
    _interpreter.set_tensor(_input_index, batch)
    _interpreter.invoke()
    probs = _interpreter.get_tensor(_output_index)

    votes = np.argmax(probs, axis=1)
    species_idx = int(max(set(votes.tolist()), key=votes.tolist().count))
    confidence = float(probs[votes == species_idx, species_idx].mean())
    return _class_names[species_idx], confidence
