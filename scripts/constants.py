##Shared constants for the BirdSense training pipeline.

SAMPLE_RATE: int = 16000          # Hz — all audio resampled to this
DURATION: int = 5                 # seconds — fixed clip length for model input
N_MELS: int = 128                 # mel filterbank bins
HOP_LENGTH: int = 512             # STFT hop size
N_FFT: int = 1024                 # STFT window size
NUM_SPECIES: int = 15             # output classes — update once species list is finalised (target: 25–30)
TARGET_F1: float = 0.80           # minimum macro-F1 required before exporting
SILENCE_THRESHOLD: float = 0.01   # RMS threshold for noise gate; windows below this are dropped
