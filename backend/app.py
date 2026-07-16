"""Flask API for BirdSense's audio-identification and field-guide experience.

The API deliberately stores no precise geographic coordinates. Observation
metadata uses broad Sarawak regions so sensitive birds cannot be located from
the public interface.
"""

from __future__ import annotations

import csv
import sqlite3
import uuid
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request, send_from_directory
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.utils import secure_filename

from species_profiles import get_profile

_ROOT: Path = Path(__file__).parent
UPLOAD_DIR: Path = _ROOT / "uploads"
SPECTROGRAM_DIR: Path = _ROOT / "spectrograms"
DB_PATH: Path = _ROOT / "birdsense.db"
SPECIES_CSV_PATH: Path = _ROOT.parent / "species_selected.csv"

ALLOWED_AUDIO_SUFFIXES = {".wav", ".mp3", ".ogg", ".flac", ".m4a"}
MAX_UPLOAD_BYTES = 50 * 1024 * 1024
MAX_NOTES_LENGTH = 1_000

UPLOAD_DIR.mkdir(exist_ok=True)
SPECTROGRAM_DIR.mkdir(exist_ok=True)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES


def _ensure_column(conn: sqlite3.Connection, table: str, column: str, definition: str) -> None:
    """Perform the small, safe migrations needed for existing local demo DBs."""
    columns = {row[1] for row in conn.execute(f"PRAGMA table_info({table})")}
    if column not in columns:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def init_db() -> None:
    """Create local, privacy-preserving storage for predictions and field feedback."""
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
                quality TEXT NOT NULL DEFAULT 'Review recommended',
                needs_review INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        _ensure_column(conn, "predictions", "quality", "TEXT NOT NULL DEFAULT 'Review recommended'")
        _ensure_column(conn, "predictions", "needs_review", "INTEGER NOT NULL DEFAULT 1")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS feedback (
                id TEXT PRIMARY KEY,
                prediction_id TEXT,
                species TEXT NOT NULL,
                verdict TEXT NOT NULL CHECK(verdict IN ('confirmed', 'incorrect', 'unsure')),
                correct_species TEXT,
                notes TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS observations (
                id TEXT PRIMARY KEY,
                species TEXT NOT NULL,
                region TEXT,
                observed_at TEXT,
                notes TEXT,
                confidence REAL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )


init_db()


def _species_index() -> dict[str, dict[str, Any]]:
    with open(SPECIES_CSV_PATH, newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        return {
            row["species_name"]: {
                "species_name": row["species_name"],
                "scientific_name": row["scientific_name"],
                "recording_count": int(row["recording_count"]),
            }
            for row in reader
            if row["species_name"]
        }


def _allowed_file(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_AUDIO_SUFFIXES


def _remove_file(path: Path) -> None:
    try:
        path.unlink(missing_ok=True)
    except OSError:
        # A failed clean-up should never mask the safe API error sent to a user.
        pass


def _quality_summary(result: dict[str, object]) -> tuple[dict[str, str], bool]:
    """Return an explicitly heuristic confidence/temporal-agreement signal.

    This is deliberately framed as a review cue, not as an ecological certainty
    or a replacement for calibrated field validation.
    """
    confidence = float(result["confidence"])
    species = str(result["species"])
    timeline = result.get("timeline", [])
    agreeing = sum(1 for event in timeline if event["species"] == species)
    agreement = agreeing / len(timeline) if timeline else 1.0

    if confidence < 0.55:
        return (
            {
                "label": "Low confidence",
                "message": "The model could not separate the leading candidates reliably. Please review the audio and alternatives.",
            },
            True,
        )
    if confidence < 0.75 or agreement < 0.6:
        return (
            {
                "label": "Review recommended",
                "message": "The leading candidate is plausible, but the result varies across the recording or has close alternatives.",
            },
            True,
        )
    return (
        {
            "label": "Suitable",
            "message": "The leading candidate is consistent across this recording. Confirm it with habitat and call context before using it as a record.",
        },
        False,
    )


@app.errorhandler(RequestEntityTooLarge)
def upload_too_large(_: RequestEntityTooLarge):
    return jsonify({"error": "Audio files must be 50 MB or smaller."}), 413


@app.route("/predict", methods=["POST"])
def predict_route():
    """Accept validated audio and return a prediction, review cue and timeline."""
    if "audio" not in request.files:
        return jsonify({"error": "No 'audio' file in request"}), 400

    audio_file = request.files["audio"]
    display_filename = secure_filename(audio_file.filename or "")
    if not display_filename:
        return jsonify({"error": "Choose an audio file with a valid filename."}), 400
    if not _allowed_file(display_filename):
        allowed = ", ".join(sorted(ALLOWED_AUDIO_SUFFIXES))
        return jsonify({"error": f"Unsupported audio type. Use one of: {allowed}."}), 415

    upload_id = str(uuid.uuid4())
    suffix = Path(display_filename).suffix.lower()
    audio_filename = f"{upload_id}{suffix}"
    audio_path = UPLOAD_DIR / audio_filename
    spectrogram_filename = f"{upload_id}.png"
    spectrogram_path = SPECTROGRAM_DIR / spectrogram_filename

    try:
        # Import the model stack only for an analysis. This keeps the field
        # guide, history and feedback routes available while a local machine
        # is being prepared for TensorFlow/BirdNET inference.
        import inference
        import preprocessing

        audio_file.save(audio_path)
        if audio_path.stat().st_size == 0:
            _remove_file(audio_path)
            return jsonify({"error": "The uploaded audio file is empty."}), 422

        embeddings = preprocessing.extract_embeddings(str(audio_path))
        if not embeddings:
            _remove_file(audio_path)
            return jsonify({"error": "Could not extract bird-call features from this file."}), 422

        result = inference.predict(embeddings)
        species = str(result["species"])
        confidence = float(result["confidence"])
        quality, needs_review = _quality_summary(result)
        preprocessing.generate_spectrogram(str(audio_path), str(spectrogram_path))
    except Exception:
        _remove_file(audio_path)
        _remove_file(spectrogram_path)
        return jsonify({"error": "BirdSense could not analyse this file. Try a supported recording with a clearer bird call."}), 422

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO predictions "
            "(id, filename, species, confidence, spectrogram_path, audio_path, quality, needs_review) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                upload_id,
                display_filename,
                species,
                confidence,
                spectrogram_filename,
                audio_filename,
                quality["label"],
                int(needs_review),
            ),
        )

    timeline = [
        {
            "start_seconds": round(float(event["start_seconds"]), 1),
            "end_seconds": round(float(event["end_seconds"]), 1),
            "species": event["species"],
            "confidence": round(float(event["confidence"]), 4),
        }
        for event in result.get("timeline", [])
    ]

    return jsonify(
        {
            "id": upload_id,
            "species": species,
            "confidence": round(confidence, 4),
            "quality": quality,
            "needs_review": needs_review,
            "spectrogram_url": f"/spectrograms/{spectrogram_filename}",
            "audio_url": f"/uploads/{audio_filename}",
            "top_predictions": [
                {"species": p["species"], "confidence": round(float(p["confidence"]), 4)}
                for p in result["top_predictions"]
            ],
            "timeline": timeline,
        }
    )


@app.route("/spectrograms/<path:filename>")
def serve_spectrogram(filename: str):
    """Serve a generated spectrogram image for the matching UUID file only."""
    return send_from_directory(SPECTROGRAM_DIR, filename)


@app.route("/uploads/<path:filename>")
def serve_upload(filename: str):
    """Serve a previously uploaded audio file for local playback."""
    return send_from_directory(UPLOAD_DIR, filename)


@app.route("/history", methods=["GET"])
def history_route():
    """Return recent predictions, most recent first."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT id, filename, species, confidence, spectrogram_path, audio_path, quality, needs_review, created_at "
            "FROM predictions ORDER BY created_at DESC LIMIT 100"
        ).fetchall()

    history = []
    for row in rows:
        entry = dict(row)
        entry["needs_review"] = bool(entry["needs_review"])
        entry["spectrogram_url"] = f"/spectrograms/{entry.pop('spectrogram_path')}"
        entry["audio_url"] = f"/uploads/{entry.pop('audio_path')}"
        history.append(entry)

    return jsonify(history)


@app.route("/species", methods=["GET"])
def species_route():
    """Return the species the current local model can classify."""
    return jsonify(list(_species_index().values()))


@app.route("/species/<species_name>", methods=["GET"])
def species_profile_route(species_name: str):
    """Return field-guide context and a broad, privacy-safe Sarawak range guide."""
    metadata = _species_index().get(species_name)
    profile = get_profile(species_name)
    if metadata is None or profile is None:
        return jsonify({"error": "Unknown BirdSense species."}), 404
    return jsonify({**metadata, **profile})


@app.route("/feedback", methods=["POST"])
def feedback_route():
    """Store a lightweight, optional human verification signal for future review."""
    payload = request.get_json(silent=True) or {}
    species = payload.get("species")
    verdict = payload.get("verdict")
    if species not in _species_index():
        return jsonify({"error": "Choose a species recognised by the local model."}), 400
    if verdict not in {"confirmed", "incorrect", "unsure"}:
        return jsonify({"error": "Feedback verdict must be confirmed, incorrect or unsure."}), 400

    correct_species = payload.get("correct_species") or None
    if correct_species is not None and correct_species not in _species_index():
        return jsonify({"error": "The corrected species is not in this model's current list."}), 400
    notes = str(payload.get("notes") or "").strip()
    if len(notes) > MAX_NOTES_LENGTH:
        return jsonify({"error": f"Notes must be {MAX_NOTES_LENGTH} characters or fewer."}), 400

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO feedback (id, prediction_id, species, verdict, correct_species, notes) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), payload.get("prediction_id") or None, species, verdict, correct_species, notes or None),
        )
    return jsonify({"status": "saved"}), 201


@app.route("/observations", methods=["POST"])
def observation_route():
    """Save an optional broad-region note; exact coordinates are intentionally unsupported."""
    payload = request.get_json(silent=True) or {}
    species = payload.get("species")
    metadata = _species_index().get(species)
    profile = get_profile(species) if metadata else None
    if metadata is None or profile is None:
        return jsonify({"error": "Choose a species recognised by the local model."}), 400

    region = str(payload.get("region") or "").strip()
    permitted_regions = set(profile["range_regions"])
    if region and region not in permitted_regions:
        return jsonify({"error": "Choose one of the general regions shown for this species."}), 400
    notes = str(payload.get("notes") or "").strip()
    if len(notes) > MAX_NOTES_LENGTH:
        return jsonify({"error": f"Notes must be {MAX_NOTES_LENGTH} characters or fewer."}), 400
    observed_at = str(payload.get("observed_at") or "").strip() or None
    try:
        confidence = float(payload["confidence"]) if payload.get("confidence") is not None else None
    except (TypeError, ValueError):
        return jsonify({"error": "Confidence must be a number between 0 and 1."}), 400
    if confidence is not None and not 0 <= confidence <= 1:
        return jsonify({"error": "Confidence must be a number between 0 and 1."}), 400

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO observations (id, species, region, observed_at, notes, confidence) VALUES (?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), species, region or None, observed_at, notes or None, confidence),
        )
    return jsonify({"status": "saved", "privacy": "Only a broad region was stored."}), 201


@app.route("/analytics", methods=["GET"])
def analytics_route():
    """Return small local-demo aggregates for the field-log overview."""
    with sqlite3.connect(DB_PATH) as conn:
        prediction_count = conn.execute("SELECT COUNT(*) FROM predictions").fetchone()[0]
        needs_review_count = conn.execute("SELECT COUNT(*) FROM predictions WHERE needs_review = 1").fetchone()[0]
        verified_count = conn.execute("SELECT COUNT(*) FROM feedback WHERE verdict = 'confirmed'").fetchone()[0]
        observation_count = conn.execute("SELECT COUNT(*) FROM observations").fetchone()[0]
        rows = conn.execute(
            "SELECT species, COUNT(*) AS count FROM predictions GROUP BY species ORDER BY count DESC, species ASC LIMIT 5"
        ).fetchall()

    return jsonify(
        {
            "prediction_count": prediction_count,
            "verified_count": verified_count,
            "needs_review_count": needs_review_count,
            "observation_count": observation_count,
            "top_species": [{"species": row[0], "count": row[1]} for row in rows],
        }
    )


if __name__ == "__main__":
    app.run(debug=True, port=5000)
