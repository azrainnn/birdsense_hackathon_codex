"""Shared constants for the BirdSense training pipeline."""

SAMPLE_RATE: int = 16000       # Hz — all audio resampled to this
DURATION: int = 5              # seconds — fixed clip length for model input
N_MELS: int = 128              # mel filterbank bins
HOP_LENGTH: int = 512          # STFT hop size
N_FFT: int = 1024              # STFT window size
NUM_SPECIES: int = 15          # number of output classes
TARGET_F1: float = 0.80        # minimum macro-F1 required before exporting
