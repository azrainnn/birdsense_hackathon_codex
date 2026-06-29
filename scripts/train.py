"""
Fine-tune EfficientNetB0 on mel-spectrograms for Bornean bird classification.

Two-phase training:
  Phase 1 (15 epochs) — EfficientNetB0 backbone frozen, Dense head only.
  Phase 2 (20 epochs) — Top 50 backbone layers unfrozen, full model fine-tuned
                        at 100x lower learning rate.

Saves the best full model to models/checkpoints/best_model.keras.
Saves label_map.json alongside for evaluate.py and export.py.

Run from project root:
  python scripts/train.py
"""

import csv
import json
import sys
from pathlib import Path
from typing import Any

import librosa
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight

sys.path.insert(0, str(Path(__file__).parent))
from constants import DURATION, HOP_LENGTH, N_FFT, N_MELS, NUM_SPECIES, SAMPLE_RATE, TARGET_F1

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_ROOT: Path = Path(__file__).parent.parent
PROCESSED_DIR: Path = _ROOT / "dataset" / "processed"
SPECIES_CSV: Path = _ROOT / "species_selected.csv"
CHECKPOINT_DIR: Path = _ROOT / "models" / "checkpoints"

# ---------------------------------------------------------------------------
# Hyper-parameters
# ---------------------------------------------------------------------------
IMG_H: int = 128
IMG_W: int = 128
BATCH_SIZE: int = 32
EPOCHS_PHASE1: int = 15
EPOCHS_PHASE2: int = 20
LR_PHASE1: float = 1e-3
LR_PHASE2: float = 1e-5
VAL_FRACTION: float = 0.18
RANDOM_STATE: int = 42
DROPOUT_RATE: float = 0.4
UNFREEZE_LAYERS: int = 50
PATIENCE_STOP: int = 7
PATIENCE_LR: int = 3


def load_species_list(path: Path) -> list[dict[str, str]]:
    """Load species_selected.csv.

    Args:
        path: Path to species_selected.csv.

    Returns:
        List of row dicts.
    """
    if not path.exists():
        sys.exit(f"[ERROR] {path} not found. Run species_selector.py first.")
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def collect_files(
    species_list: list[dict[str, str]],
) -> tuple[list[str], list[int], list[str]]:
    """Scan processed/ and return file paths, integer labels, and class names.

    Args:
        species_list: Rows from species_selected.csv.

    Returns:
        Tuple of (file_paths, int_labels, class_names).
    """
    file_paths: list[str] = []
    int_labels: list[int] = []
    class_names: list[str] = []

    for row in species_list:
        name = row["species_name"]
        species_dir = PROCESSED_DIR / name
        wavs = sorted(species_dir.glob("*.wav")) if species_dir.exists() else []
        if not wavs:
            print(f"  [SKIP] {name} — no WAV files in processed/")
            continue
        idx = len(class_names)
        class_names.append(name)
        for wav in wavs:
            file_paths.append(str(wav))
            int_labels.append(idx)

    return file_paths, int_labels, class_names


def wav_to_spectrogram(path: str) -> np.ndarray:
    """Load a WAV clip and return a normalized (IMG_H, IMG_W, 3) mel-spectrogram.

    Args:
        path: Path to a preprocessed .wav clip.

    Returns:
        Float32 array of shape (IMG_H, IMG_W, 3).
    """
    waveform, _ = librosa.load(path, sr=SAMPLE_RATE, mono=True)
    mel = librosa.feature.melspectrogram(
        y=waveform, sr=SAMPLE_RATE,
        n_mels=N_MELS, n_fft=N_FFT, hop_length=HOP_LENGTH,
    )
    mel_db = librosa.power_to_db(mel, ref=np.max)
    mel_norm = (mel_db - mel_db.min()) / (mel_db.max() - mel_db.min() + 1e-6)
    mel_resized = tf.image.resize(mel_norm[..., np.newaxis], [IMG_H, IMG_W]).numpy()
    return np.concatenate([mel_resized] * 3, axis=-1).astype(np.float32)


def _load_sample(path_bytes: bytes, label: int) -> tuple[np.ndarray, int]:
    """Wrapper called by tf.py_function — decodes bytes path, returns spectrogram.

    Args:
        path_bytes: UTF-8 encoded file path.
        label: Integer class label.

    Returns:
        Tuple of (spectrogram array, label).
    """
    return wav_to_spectrogram(path_bytes.decode()), int(label)


def make_dataset(
    file_paths: list[str],
    labels: list[int],
    shuffle: bool = False,
) -> tf.data.Dataset:
    """Build a batched tf.data.Dataset from file paths and integer labels.

    Args:
        file_paths: List of WAV file paths.
        labels: Corresponding integer class labels.
        shuffle: Whether to shuffle before batching.

    Returns:
        Batched, prefetched tf.data.Dataset.
    """
    ds = tf.data.Dataset.from_tensor_slices((file_paths, labels))
    if shuffle:
        ds = ds.shuffle(len(file_paths), seed=RANDOM_STATE)

    def _py_load(path: tf.Tensor, label: tf.Tensor) -> tuple[tf.Tensor, tf.Tensor]:
        spec, lbl = tf.py_function(_load_sample, [path, label], [tf.float32, tf.int32])
        spec.set_shape([IMG_H, IMG_W, 3])
        lbl.set_shape([])
        return spec, lbl

    return (
        ds.map(_py_load, num_parallel_calls=tf.data.AUTOTUNE)
        .batch(BATCH_SIZE)
        .prefetch(tf.data.AUTOTUNE)
    )


def build_model(num_classes: int) -> tf.keras.Model:
    """Build EfficientNetB0 + Dense classification head.

    Args:
        num_classes: Number of output bird species classes.

    Returns:
        Keras model with frozen backbone ready for Phase 1 training.
    """
    base = tf.keras.applications.EfficientNetB0(
        include_top=False,
        weights="imagenet",
        input_shape=(IMG_H, IMG_W, 3),
        pooling="avg",
    )
    base.trainable = False

    inputs = tf.keras.Input(shape=(IMG_H, IMG_W, 3), name="spectrogram")
    x = base(inputs, training=False)
    x = tf.keras.layers.Dropout(DROPOUT_RATE)(x)
    x = tf.keras.layers.Dense(256, activation="relu")(x)
    x = tf.keras.layers.Dropout(DROPOUT_RATE)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax", name="class_probs")(x)

    return tf.keras.Model(inputs, outputs, name="birdsense")


def make_callbacks(ckpt_path: Path, log_tag: str) -> list[Any]:
    """Build standard training callbacks.

    Args:
        ckpt_path: Where to save the best model checkpoint.
        log_tag: Suffix for TensorBoard log subdirectory.

    Returns:
        List of Keras callbacks.
    """
    return [
        tf.keras.callbacks.ModelCheckpoint(
            filepath=str(ckpt_path),
            monitor="val_accuracy",
            save_best_only=True,
            verbose=1,
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=PATIENCE_STOP,
            restore_best_weights=True,
            verbose=1,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=PATIENCE_LR,
            min_lr=1e-7,
            verbose=1,
        ),
        tf.keras.callbacks.TensorBoard(
            log_dir=str(CHECKPOINT_DIR / f"logs_{log_tag}"),
        ),
    ]


def main() -> None:
    """Entry point: two-phase EfficientNetB0 fine-tuning."""
    print("BirdSense Trainer — EfficientNetB0 end-to-end fine-tuning")
    print(f"TensorFlow {tf.__version__}  |  GPU: {tf.config.list_physical_devices('GPU')}")
    print()

    species_list = load_species_list(SPECIES_CSV)
    file_paths, int_labels, class_names = collect_files(species_list)
    num_classes = len(class_names)
    print(f"Species: {num_classes}  |  Total clips: {len(file_paths)}")

    if num_classes != NUM_SPECIES:
        print(
            f"[WARN] NUM_SPECIES in constants.py is {NUM_SPECIES} but "
            f"{num_classes} classes found. Update constants.py before export."
        )

    y = np.array(int_labels, dtype=np.int32)
    X_train_p, X_val_p, y_train, y_val = train_test_split(
        file_paths, y,
        test_size=VAL_FRACTION,
        stratify=y,
        random_state=RANDOM_STATE,
    )
    print(f"Train: {len(y_train)}  |  Val: {len(y_val)}")

    weights = compute_class_weight("balanced", classes=np.unique(y_train), y=y_train)
    class_weight = dict(enumerate(weights))
    print(f"Class weight range: {weights.min():.3f} — {weights.max():.3f}\n")

    train_ds = make_dataset(X_train_p, y_train.tolist(), shuffle=True)
    val_ds = make_dataset(X_val_p, y_val.tolist(), shuffle=False)

    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    ckpt_path = CHECKPOINT_DIR / "best_model.keras"

    model = build_model(num_classes)
    model.summary()

    # ── Phase 1: train head only, backbone frozen ─────────────────────────────
    print(f"\n── Phase 1: head only ({EPOCHS_PHASE1} epochs, LR={LR_PHASE1}) ──\n")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(LR_PHASE1),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS_PHASE1,
        class_weight=class_weight,
        callbacks=make_callbacks(ckpt_path, "phase1"),
        verbose=1,
    )

    # ── Phase 2: unfreeze top backbone layers, fine-tune end-to-end ──────────
    print(
        f"\n── Phase 2: fine-tune top {UNFREEZE_LAYERS} layers "
        f"({EPOCHS_PHASE2} epochs, LR={LR_PHASE2}) ──\n"
    )
    base_model = model.get_layer("efficientnetb0")
    base_model.trainable = True
    for layer in base_model.layers[:-UNFREEZE_LAYERS]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(LR_PHASE2),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS_PHASE2,
        class_weight=class_weight,
        callbacks=make_callbacks(ckpt_path, "phase2"),
        verbose=1,
    )

    # Save label map for evaluate.py and export.py
    label_to_idx = {name: i for i, name in enumerate(class_names)}
    label_map_path = CHECKPOINT_DIR / "label_map.json"
    with label_map_path.open("w") as f:
        json.dump({"class_names": class_names, "label_to_idx": label_to_idx}, f, indent=2)

    print(f"\nLabel map saved : {label_map_path}")
    print(f"Best model saved: {ckpt_path}")
    print("Done. Run evaluate.py to check macro-F1 before exporting.")


if __name__ == "__main__":
    main()
