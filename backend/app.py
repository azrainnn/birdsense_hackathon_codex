"""Flask API for BirdSense: upload audio, get species + confidence + spectrogram.

Routes only wire preprocessing.py and inference.py together — no ML logic
belongs here (see CLAUDE.md Flask Backend Rules).
"""

import csv
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
SPECIES_CSV_PATH: Path = _ROOT.parent / "species_selected.csv"

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
                audio_path TEXT NOT NULL,
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
    audio_filename = f"{upload_id}{suffix}"
    audio_path = UPLOAD_DIR / audio_filename
    audio_file.save(audio_path)

    embeddings = preprocessing.extract_embeddings(str(audio_path))
    if not embeddings:
        return jsonify({"error": "Could not extract any audio features from this file"}), 422

    result = inference.predict(embeddings)
    species = result["species"]
    confidence = result["confidence"]

    spectrogram_filename = f"{upload_id}.png"
    spectrogram_path = SPECTROGRAM_DIR / spectrogram_filename
    spectrogram_info = preprocessing.generate_spectrogram(str(audio_path), str(spectrogram_path))

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO predictions "
            "(id, filename, species, confidence, spectrogram_path, audio_path) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (upload_id, audio_file.filename, species, confidence, spectrogram_filename, audio_filename),
        )

    return jsonify({
        "species": species,
        "confidence": round(confidence, 4),
        "spectrogram_url": f"/spectrograms/{spectrogram_filename}",
        "spectrogram_duration_seconds": round(spectrogram_info["duration_seconds"], 2),
        "spectrogram_plot_bounds": {
            key: round(value, 3) for key, value in spectrogram_info["plot_bounds"].items()
        },
        "audio_url": f"/uploads/{audio_filename}",
        "top_predictions": [
            {"species": p["species"], "confidence": round(p["confidence"], 4)}
            for p in result["top_predictions"]
        ],
        "window_predictions": [
            {
                "start_time": round(w["start_time"], 2),
                "end_time": round(w["end_time"], 2),
                "confidence": round(w["confidence"], 4),
            }
            for w in result["window_predictions"]
        ],
    })


@app.route("/spectrograms/<path:filename>")
def serve_spectrogram(filename: str):
    """Serve a generated spectrogram image."""
    return send_from_directory(SPECTROGRAM_DIR, filename)


@app.route("/uploads/<path:filename>")
def serve_upload(filename: str):
    """Serve a previously uploaded audio file for playback."""
    return send_from_directory(UPLOAD_DIR, filename)


@app.route("/history", methods=["GET"])
def history_route():
    """Return past predictions, most recent first."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT id, filename, species, confidence, spectrogram_path, audio_path, created_at "
            "FROM predictions ORDER BY created_at DESC LIMIT 50"
        ).fetchall()

    history = []
    for row in rows:
        entry = dict(row)
        entry["spectrogram_url"] = f"/spectrograms/{entry.pop('spectrogram_path')}"
        entry["audio_url"] = f"/uploads/{entry.pop('audio_path')}"
        history.append(entry)

    return jsonify(history)


@app.route("/species", methods=["GET"])
def species_route():
    """Return metadata for every species the model can recognize."""
    with open(SPECIES_CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        species = [
            {
                "species_name": row["species_name"],
                "scientific_name": row["scientific_name"],
                "recording_count": int(row["recording_count"]),
            }
            for row in reader
            if row["species_name"]
        ]

    return jsonify(species)


if __name__ == "__main__":
    # use_reloader=False: the reloader watches the whole backend/ folder,
    # and /predict writes new files into uploads/ and spectrograms/ on
    # every request — which triggers a mid-request restart and a 502.
    app.run(debug=True, port=5000, use_reloader=False)
