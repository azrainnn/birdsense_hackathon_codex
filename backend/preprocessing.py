"""Audio -> BirdNET embedding extraction and spectrogram rendering.

No Flask imports here — this module must remain callable from the
Raspberry Pi in Phase 2 without modification (see CLAUDE.md).
"""

import matplotlib
matplotlib.use("Agg")

import librosa
import librosa.display
import matplotlib.pyplot as plt
import numpy as np
from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer
import birdnetlib.analyzer as _birdnetlib_analyzer

# TensorFlow/TFLite >= 2.17 prunes the intermediate embedding tensor unless
# all tensors are explicitly preserved, which breaks birdnetlib's embedding
# extraction with "Tensor data is null" on every call.
# See: https://github.com/joeweiss/birdnetlib/issues/125
_original_tflite_interpreter = _birdnetlib_analyzer.tflite.Interpreter


def _patched_tflite_interpreter(*args, **kwargs):
    """Force experimental_preserve_all_tensors=True on every TFLite Interpreter."""
    kwargs.setdefault("experimental_preserve_all_tensors", True)
    return _original_tflite_interpreter(*args, **kwargs)


_birdnetlib_analyzer.tflite.Interpreter = _patched_tflite_interpreter

_analyzer = Analyzer()


def extract_embeddings(audio_path: str) -> list[dict[str, object]]:
    """Extract one 1024-d BirdNET embedding per internal 3-second window.

    Args:
        audio_path: Path to an audio file (any format librosa can read).

    Returns:
        List of dicts, one per BirdNET window, each with "start_time" and
        "end_time" (seconds, floats) and "embedding" (float32 array of
        shape (1024,)). Empty list if extraction yielded no windows.
    """
    recording = Recording(_analyzer, audio_path)
    recording.extract_embeddings()
    if not recording.embeddings:
        return []
    return [
        {
            "start_time": float(w["start_time"]),
            "end_time": float(w["end_time"]),
            "embedding": np.array(w["embeddings"], dtype=np.float32),
        }
        for w in recording.embeddings
    ]


def generate_spectrogram(audio_path: str, output_path: str) -> dict[str, object]:
    """Render a mel-spectrogram PNG for the results dashboard.

    Args:
        audio_path: Path to the source audio file.
        output_path: Where to save the rendered PNG image.

    Returns:
        Dict with "duration_seconds" (float, the clip's real length) and
        "plot_bounds" (dict with "left", "right", "top", "bottom", each a
        percentage in [0, 100]) giving the plotted axes' position within
        the saved image in CSS-inset terms. Read from matplotlib's own
        layout (via Axes.get_position(), after tight_layout()) rather than
        assumed, since margins shift slightly with sample rate and clip
        duration — lets the frontend overlay boxes on the image precisely
        for any clip without hardcoding matplotlib's margins.
    """
    waveform, sr = librosa.load(audio_path, sr=None, mono=True)
    duration_seconds = librosa.get_duration(y=waveform, sr=sr)
    mel = librosa.feature.melspectrogram(y=waveform, sr=sr)
    mel_db = librosa.power_to_db(mel, ref=np.max)

    fig, ax = plt.subplots(figsize=(8, 4))
    librosa.display.specshow(mel_db, sr=sr, x_axis="time", y_axis="mel", ax=ax)
    ax.set_title("Mel-spectrogram")
    fig.tight_layout()
    fig.savefig(output_path, dpi=100)
    bbox = ax.get_position()
    plt.close(fig)

    return {
        "duration_seconds": float(duration_seconds),
        "plot_bounds": {
            "left": bbox.x0 * 100,
            "right": (1 - bbox.x1) * 100,
            "top": (1 - bbox.y1) * 100,
            "bottom": bbox.y0 * 100,
        },
    }
