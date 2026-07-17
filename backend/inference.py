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
TOP_K: int = 3

_interpreter = tflite.Interpreter(model_path=str(_MODEL_PATH))
_input_index: int = _interpreter.get_input_details()[0]["index"]
_output_index: int = _interpreter.get_output_details()[0]["index"]

_class_names: list[str] = _LABELS_PATH.read_text(encoding="utf-8").splitlines()


def predict(windows: list[dict[str, object]]) -> dict[str, object]:
    """Predict a species from one or more BirdNET window embeddings.

    Runs the classifier head on all window embeddings in one batch and
    soft-votes by averaging softmax probabilities across windows, then
    ranks candidate species by that mean probability.

    Args:
        windows: List of dicts, one per BirdNET window, each with
            "start_time", "end_time" (seconds) and "embedding" (a 1024-d
            BirdNET embedding vector) — see preprocessing.extract_embeddings.

    Returns:
        Dict with "species" (top predicted species name), "confidence"
        (its mean probability across windows, in [0, 1]),
        "top_predictions" (the top TOP_K species ranked by mean probability),
        per-window confidence for the leading candidate, and an approximate
        timeline based on BirdNET's internal fixed windows.
    """
    batch = np.stack([w["embedding"] for w in windows]).astype(np.float32)
    _interpreter.resize_tensor_input(_input_index, list(batch.shape))
    _interpreter.allocate_tensors()
    _interpreter.set_tensor(_input_index, batch)
    _interpreter.invoke()
    probs = _interpreter.get_tensor(_output_index)

    mean_probs = probs.mean(axis=0)
    ranked_indices = np.argsort(mean_probs)[::-1][:TOP_K]
    top_predictions = [
        {"species": _class_names[i], "confidence": float(mean_probs[i])}
        for i in ranked_indices
    ]
    timeline = []
    for index, window_probs in enumerate(probs):
        top_index = int(np.argmax(window_probs))
        timeline.append(
            {
                "start_seconds": float(windows[index]["start_time"]),
                "end_seconds": float(windows[index]["end_time"]),
                "species": _class_names[top_index],
                "confidence": float(window_probs[top_index]),
            }
        )

    top_species_index = ranked_indices[0]
    window_predictions = [
        {
            "start_time": w["start_time"],
            "end_time": w["end_time"],
            "confidence": float(probs[i, top_species_index]),
        }
        for i, w in enumerate(windows)
    ]

    return {
        "species": top_predictions[0]["species"],
        "confidence": top_predictions[0]["confidence"],
        "top_predictions": top_predictions,
        "window_predictions": window_predictions,
        "timeline": timeline,
    }
