"""Flask API for BirdSense: upload audio, get species + confidence + spectrogram.

Routes only wire preprocessing.py and inference.py together — no ML logic
belongs here (see CLAUDE.md Flask Backend Rules).
"""

import sqlite3
import uuid
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

import inference
import preprocessing

_ROOT: Path = Path(__file__).parent
UPLOAD_DIR: Path = _ROOT / "uploads"
SPECTROGRAM_DIR: Path = _ROOT / "spectrograms"
DB_PATH: Path = _ROOT / "birdsense.db"

UPLOAD_DIR.mkdir(exist_ok=True)
SPECTROGRAM_DIR.mkdir(exist_ok=True)

app = Flask(__name__)


def init_db() -> None:
    """Create the predictions table if it doesn't already exist."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS predictions (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                species TEXT NOT NULL,
                confidence REAL NOT NULL,
                spectrogram_path TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )


init_db()


@app.route("/predict", methods=["POST"])
def predict_route():
    """Accept an uploaded audio file; return species, confidence, spectrogram URL."""
    if "audio" not in request.files:
        return jsonify({"error": "No 'audio' file in request"}), 400

    audio_file = request.files["audio"]
    upload_id = str(uuid.uuid4())
    suffix = Path(audio_file.filename).suffix or ".wav"
    audio_path = UPLOAD_DIR / f"{upload_id}{suffix}"
    audio_file.save(audio_path)

    embeddings = preprocessing.extract_embeddings(str(audio_path))
    if not embeddings:
        return jsonify({"error": "Could not extract any audio features from this file"}), 422

    species, confidence = inference.predict(embeddings)

    spectrogram_path = SPECTROGRAM_DIR / f"{upload_id}.png"
    preprocessing.generate_spectrogram(str(audio_path), str(spectrogram_path))

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO predictions (id, filename, species, confidence, spectrogram_path) "
            "VALUES (?, ?, ?, ?, ?)",
            (upload_id, audio_file.filename, species, confidence, f"{upload_id}.png"),
        )

    return jsonify({
        "species": species,
        "confidence": round(confidence, 4),
        "spectrogram_url": f"/spectrograms/{upload_id}.png",
    })


@app.route("/spectrograms/<path:filename>")
def serve_spectrogram(filename: str):
    """Serve a generated spectrogram image."""
    return send_from_directory(SPECTROGRAM_DIR, filename)


@app.route("/history", methods=["GET"])
def history_route():
    """Return past predictions, most recent first."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT id, filename, species, confidence, spectrogram_path, created_at "
            "FROM predictions ORDER BY created_at DESC LIMIT 50"
        ).fetchall()

    return jsonify([dict(row) for row in rows])


if __name__ == "__main__":
    app.run(debug=True, port=5000)
