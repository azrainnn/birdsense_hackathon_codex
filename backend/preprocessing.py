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


def extract_embeddings(audio_path: str) -> list[np.ndarray]:
    """Extract one 1024-d BirdNET embedding per internal 3-second window.

    Args:
        audio_path: Path to an audio file (any format librosa can read).

    Returns:
        List of float32 arrays of shape (1024,), one per BirdNET window.
        Empty list if extraction yielded no windows.
    """
    recording = Recording(_analyzer, audio_path)
    recording.extract_embeddings()
    if not recording.embeddings:
        return []
    return [np.array(w["embeddings"], dtype=np.float32) for w in recording.embeddings]


def generate_spectrogram(audio_path: str, output_path: str) -> None:
    """Render a mel-spectrogram PNG for the results dashboard.

    Args:
        audio_path: Path to the source audio file.
        output_path: Where to save the rendered PNG image.
    """
    waveform, sr = librosa.load(audio_path, sr=None, mono=True)
    mel = librosa.feature.melspectrogram(y=waveform, sr=sr)
    mel_db = librosa.power_to_db(mel, ref=np.max)

    fig, ax = plt.subplots(figsize=(8, 4))
    librosa.display.specshow(mel_db, sr=sr, x_axis="time", y_axis="mel", ax=ax)
    ax.set_title("Mel-spectrogram")
    fig.tight_layout()
    fig.savefig(output_path, dpi=100)
    plt.close(fig)
