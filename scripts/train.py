"""
Train a Dense classifier head on cached BirdNET embeddings for Bornean
bird species classification.

BirdNET (via birdnetlib) is used purely as a frozen feature extractor —
run scripts/extract_embeddings.py first to cache a 1024-d embedding per
processed clip. This script only trains the small classification head on
top, so no GPU fine-tuning of a vision backbone is required.

Saves the best model to models/checkpoints/best_model.keras.
Saves label_map.json alongside for evaluate.py and export.py.

Run after extract_embeddings.py:
  python scripts/train.py
"""

import json
import sys
from pathlib import Path
from typing import Any

import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight

sys.path.insert(0, str(Path(__file__).parent))
from constants import NUM_SPECIES

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_ROOT: Path = Path(__file__).parent.parent
CHECKPOINT_DIR: Path = _ROOT / "models" / "checkpoints"
EMBEDDINGS_PATH: Path = CHECKPOINT_DIR / "embeddings_train.npz"

# ---------------------------------------------------------------------------
# Hyper-parameters
# ---------------------------------------------------------------------------
EMBEDDING_DIM: int = 1024
BATCH_SIZE: int = 32
EPOCHS: int = 60
LEARNING_RATE: float = 1e-3
VAL_FRACTION: float = 0.18
RANDOM_STATE: int = 42
DROPOUT_RATE: float = 0.4
PATIENCE_STOP: int = 10
PATIENCE_LR: int = 4


def load_embeddings(path: Path) -> tuple[np.ndarray, np.ndarray, list[str]]:
    """Load cached BirdNET embeddings produced by extract_embeddings.py.

    Args:
        path: Path to embeddings_train.npz.

    Returns:
        Tuple of (X, y, class_names).
    """
    if not path.exists():
        sys.exit(f"[ERROR] {path} not found. Run extract_embeddings.py first.")
    data = np.load(path, allow_pickle=True)
    return data["X"], data["y"], data["class_names"].tolist()


def build_model(num_classes: int) -> tf.keras.Model:
    """Build a small Dense classification head on top of BirdNET embeddings.

    Args:
        num_classes: Number of output bird species classes.

    Returns:
        Uncompiled Keras model.
    """
    inputs = tf.keras.Input(shape=(EMBEDDING_DIM,), name="embedding")
    x = tf.keras.layers.Dropout(DROPOUT_RATE)(inputs)
    x = tf.keras.layers.Dense(256, activation="relu")(x)
    x = tf.keras.layers.Dropout(DROPOUT_RATE)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax", name="class_probs")(x)
    return tf.keras.Model(inputs, outputs, name="birdsense")


def make_callbacks(ckpt_path: Path) -> list[Any]:
    """Build standard training callbacks.

    Args:
        ckpt_path: Where to save the best model checkpoint.

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
        tf.keras.callbacks.TensorBoard(log_dir=str(CHECKPOINT_DIR / "logs")),
    ]


def main() -> None:
    """Entry point: train the Dense head on cached BirdNET embeddings."""
    print("BirdSense Trainer — Dense head on BirdNET embeddings")
    print(f"TensorFlow {tf.__version__}  |  GPU: {tf.config.list_physical_devices('GPU')}")
    print()

    X, y, class_names = load_embeddings(EMBEDDINGS_PATH)
    num_classes = len(class_names)
    print(f"Species: {num_classes}  |  Total clips: {len(X)}")

    if num_classes != NUM_SPECIES:
        print(
            f"[WARN] NUM_SPECIES in constants.py is {NUM_SPECIES} but "
            f"{num_classes} classes found. Update constants.py before export."
        )

    X_train, X_val, y_train, y_val = train_test_split(
        X, y,
        test_size=VAL_FRACTION,
        stratify=y,
        random_state=RANDOM_STATE,
    )
    print(f"Train: {len(y_train)}  |  Val: {len(y_val)}")

    weights = compute_class_weight("balanced", classes=np.unique(y_train), y=y_train)
    class_weight = dict(enumerate(weights))
    print(f"Class weight range: {weights.min():.3f} — {weights.max():.3f}\n")

    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    ckpt_path = CHECKPOINT_DIR / "best_model.keras"

    model = build_model(num_classes)
    model.summary()

    model.compile(
        optimizer=tf.keras.optimizers.Adam(LEARNING_RATE),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        batch_size=BATCH_SIZE,
        epochs=EPOCHS,
        class_weight=class_weight,
        callbacks=make_callbacks(ckpt_path),
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
