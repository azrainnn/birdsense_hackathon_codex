"""
Fine-tune a bird species classifier on top of frozen YAMNet embeddings.

Pipeline:
  1. Scan dataset/processed/ for WAV clips and assign integer class labels.
  2. Load YAMNet from TF Hub and extract 1024-d mean-pooled embeddings per clip.
  3. Cache embeddings to disk so re-runs skip the extraction step.
  4. Split 82 / 18 train / val, stratified by species.
  5. Train a two-layer Dense head with dropout and class weighting.
  6. Save the best checkpoint to models/checkpoints/best_head.keras.

Run from project root:
  python scripts/train.py

Colab usage:
  Mount Google Drive, then: !python scripts/train.py
"""

import csv
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
import tensorflow as tf
import tensorflow_hub as hub
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight

sys.path.insert(0, str(Path(__file__).parent))
from constants import DURATION, NUM_SPECIES, SAMPLE_RATE, TARGET_F1

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
YAMNET_URL: str = "https://tfhub.dev/google/yamnet/1"
_ROOT: Path = Path(__file__).parent.parent
PROCESSED_DIR: Path = _ROOT / "dataset" / "processed"
SPECIES_CSV: Path = _ROOT / "species_selected.csv"
CHECKPOINT_DIR: Path = _ROOT / "models" / "checkpoints"
CACHE_DIR: Path = _ROOT / "models" / "embeddings_cache"

# ---------------------------------------------------------------------------
# Hyper-parameters
# ---------------------------------------------------------------------------
BATCH_SIZE: int = 64
EPOCHS: int = 30
LEARNING_RATE: float = 1e-3
VAL_FRACTION: float = 0.18
RANDOM_STATE: int = 42
DROPOUT_RATE: float = 0.3
EMBEDDING_DIM: int = 1024
PATIENCE_STOP: int = 8
PATIENCE_LR: int = 4


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
) -> tuple[list[str], list[str], list[str]]:
    """Scan processed/ and return file paths, labels, and ordered class names.

    Args:
        species_list: Rows from species_selected.csv.

    Returns:
        Tuple of (file_paths, string_labels, ordered_class_names).
    """
    file_paths: list[str] = []
    labels: list[str] = []
    class_names: list[str] = []

    for row in species_list:
        name = row["species_name"]
        species_dir = PROCESSED_DIR / name
        wavs = sorted(species_dir.glob("*.wav")) if species_dir.exists() else []
        if not wavs:
            print(f"  [SKIP] {name} — no WAV files in processed/")
            continue
        class_names.append(name)
        for wav in wavs:
            file_paths.append(str(wav))
            labels.append(name)

    return file_paths, labels, class_names


def extract_embeddings(
    yamnet: hub.Module,
    file_paths: list[str],
    cache_dir: Path,
) -> np.ndarray:
    """Extract or load cached YAMNet mean-pooled embeddings.

    Runs YAMNet on each WAV clip and mean-pools the per-frame embeddings
    to produce one (1024,) vector per clip. Caches the result as a .npy file.

    Args:
        yamnet: Loaded YAMNet module from TF Hub.
        file_paths: List of WAV file paths.
        cache_dir: Directory for reading/writing the .npy cache.

    Returns:
        Float32 array of shape (N, 1024).
    """
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_file = cache_dir / f"yamnet_embeddings_{len(file_paths)}.npy"

    if cache_file.exists():
        print(f"  Loading cached embeddings: {cache_file}")
        return np.load(str(cache_file))

    print(f"  Extracting embeddings for {len(file_paths)} clips...")
    out = np.zeros((len(file_paths), EMBEDDING_DIM), dtype=np.float32)

    for i, path in enumerate(file_paths):
        if i % 200 == 0:
            print(f"    {i:5d} / {len(file_paths)}", end="\r", flush=True)
        try:
            waveform, _ = sf.read(path, dtype="float32")
            _, embeddings, _ = yamnet(waveform)
            out[i] = tf.reduce_mean(embeddings, axis=0).numpy()
        except Exception as exc:
            print(f"\n  [WARN] {path}: {exc}")

    print(f"    {len(file_paths)} / {len(file_paths)}")
    np.save(str(cache_file), out)
    print(f"  Embeddings cached: {cache_file}")
    return out


def build_head(num_classes: int) -> tf.keras.Model:
    """Build and compile the Dense classification head.

    Args:
        num_classes: Number of output bird species classes.

    Returns:
        Compiled Keras model.
    """
    model = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(EMBEDDING_DIM,), name="embedding"),
            tf.keras.layers.Dense(256, activation="relu"),
            tf.keras.layers.Dropout(DROPOUT_RATE),
            tf.keras.layers.Dense(128, activation="relu"),
            tf.keras.layers.Dropout(DROPOUT_RATE),
            tf.keras.layers.Dense(num_classes, activation="softmax", name="class_probs"),
        ],
        name="bird_classifier_head",
    )
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main() -> None:
    """Entry point: extract embeddings, train and save best classifier head."""
    print("BirdSense Trainer — YAMNet + Dense head")
    print(f"TensorFlow {tf.__version__}  |  GPU: {tf.config.list_physical_devices('GPU')}")
    print()

    species_list = load_species_list(SPECIES_CSV)
    file_paths, labels, class_names = collect_files(species_list)
    num_classes = len(class_names)
    print(f"Species: {num_classes}  |  Total clips: {len(file_paths)}")

    if num_classes != NUM_SPECIES:
        print(
            f"[WARN] NUM_SPECIES in constants.py is {NUM_SPECIES} but "
            f"{num_classes} classes found in processed/. "
            f"Update constants.py before running export.py."
        )

    # Encode labels to integers (order determines class index in labels.txt)
    label_to_idx = {name: i for i, name in enumerate(class_names)}
    y = np.array([label_to_idx[lbl] for lbl in labels], dtype=np.int32)

    # Stratified train / val split
    X_train_p, X_val_p, y_train, y_val = train_test_split(
        file_paths, y,
        test_size=VAL_FRACTION,
        stratify=y,
        random_state=RANDOM_STATE,
    )
    print(f"Train: {len(y_train)}  |  Val: {len(y_val)}")

    # Load YAMNet (downloads on first run, then cached by TF Hub)
    print("\nLoading YAMNet from TF Hub...")
    yamnet = hub.load(YAMNET_URL)
    print("YAMNet ready.\n")

    # Extract embeddings
    all_embeddings = extract_embeddings(yamnet, file_paths, CACHE_DIR)
    path_to_i = {p: i for i, p in enumerate(file_paths)}
    X_train = all_embeddings[[path_to_i[p] for p in X_train_p]]
    X_val = all_embeddings[[path_to_i[p] for p in X_val_p]]

    # Class weights to counter imbalance
    weights = compute_class_weight("balanced", classes=np.unique(y_train), y=y_train)
    class_weight = dict(enumerate(weights))
    print(f"Class weight range: {weights.min():.3f} — {weights.max():.3f}")

    # Build model
    print(f"\nBuilding classifier head ({num_classes} classes)...")
    model = build_head(num_classes)
    model.summary()

    # Callbacks
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    ckpt_path = CHECKPOINT_DIR / "best_head.keras"
    callbacks = [
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
            min_lr=1e-6,
            verbose=1,
        ),
    ]

    print("\nTraining...\n")
    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        batch_size=BATCH_SIZE,
        epochs=EPOCHS,
        class_weight=class_weight,
        callbacks=callbacks,
        verbose=1,
    )

    # Persist label map for evaluate.py and export.py
    label_map_path = CHECKPOINT_DIR / "label_map.json"
    with label_map_path.open("w") as f:
        json.dump({"class_names": class_names, "label_to_idx": label_to_idx}, f, indent=2)
    print(f"\nLabel map saved: {label_map_path}")
    print(f"Best head saved: {ckpt_path}")
    print("Done. Run evaluate.py to check macro-F1 before exporting.")


if __name__ == "__main__":
    main()
