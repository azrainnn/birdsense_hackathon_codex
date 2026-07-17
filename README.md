# BirdSense

BirdSense identifies Bornean bird species from audio recordings. Upload a clip (or record one live from your device), and the app extracts BirdNET embeddings, runs them through a small trained classifier head, and returns the leading species with a confidence-based review cue, a mel-spectrogram, and a per-window detection timeline.

Built for Sarawak field use: the app deliberately avoids storing exact GPS coordinates, using broad habitat regions instead so sensitive species can't be located from the interface.

## Architecture

| Path | What it is |
|---|---|
| `backend/` | Flask API — inference, species field guide, history, feedback, local SQLite storage |
| `frontend/` | React + Vite single-page app — identification workspace, field guide, history, landing page |
| `landing-page/` | Standalone Next.js landing-page prototype (not wired into deployment — see its own README) |
| `models/export/` | Committed trained model: `model.tflite` + `labels.txt` (15 Bornean species) |
| `models/checkpoints/` | Training eval report and label map |
| `sample_audio/` | Curated test clips — see [Try it out](#try-it-out-sample-audio) below |
| `scripts/`, `notebooks/` | Training pipeline (data download, preprocessing, training, export) — Colab/GPU only |
| `Dockerfile`, `render.yaml` | Single-service deployment: Flask serves the built frontend + API from one container |

In production, the Flask backend serves the built frontend directly (see `serve_frontend` in `backend/app.py`), so it's one deployable service. In development, you run the two independently and Vite proxies API calls to Flask.

## Prerequisites

- **Python 3.11** (matches the Docker image; other 3.x may work but is untested)
- **Node.js 20+** and npm
- No system-level audio libraries needed for local dev — `soundfile`/`librosa` bundle what they need on Windows/macOS. Docker installs `libsndfile1` explicitly for Linux.

## Setup

```bash
git clone https://github.com/azrainnn/birdsense_hackathon_codex.git
cd birdsense_hackathon_codex

# Backend
python -m pip install -r backend/requirements.txt

# Frontend
cd frontend
npm ci
cd ..
```

## Running the project (development)

Two terminals from the repo root:

**Terminal 1 — backend (port 5000):**
```bash
python backend/app.py
```

**Terminal 2 — frontend (Vite dev server):**
```bash
cd frontend
npm run dev
```

Open the local URL Vite prints (typically `http://localhost:5173`). It proxies `/predict`, `/history`, `/species`, `/feedback`, `/observations`, `/analytics`, `/spectrograms`, `/uploads` to the Flask backend on port 5000 — no extra config needed.

> Note: the backend runs with `use_reloader=False` intentionally — `/predict` writes new files into `backend/uploads/` and `backend/spectrograms/` on every request, which would otherwise trigger a mid-request restart.

## Try it out: sample audio

**Use `sample_audio/` to test identification right away — don't go looking for your own recordings first.** It ships in this repo with two real hold-out clips per species (30 files total, ~6 MB), organized by species:

```
sample_audio/
  rhinoceros_hornbill/
    XC1010150-Rhinoceros-Hornbill.mp3
    XC177534-rhino-hornbill-flight-noise.mp3
  bornean_bristlehead/
    ...
  ...
```

With both servers running:

1. Open the app and go to the **Identify** page.
2. Upload any file from `sample_audio/<species>/` — pick a species folder, since the folder name tells you the expected answer, so you can immediately check whether the prediction matches.
3. Repeat across a few species to get a feel for confidence levels and the review-cue behavior described below.

These clips were never used to train the model (they're the training pipeline's hold-out split), so they're a fair, realistic test of accuracy — not cherry-picked easy cases. Attribution for each clip is in [`sample_audio/CREDITS.md`](sample_audio/CREDITS.md); most trace back to a Xeno-canto catalog ID, a few are from other field-recording sources bundled into the original dataset.

If you want the full hold-out set (211 clips, 214 MB, uneven per-species counts) instead of this trimmed subset, you'll need to regenerate it yourself via `scripts/downloader.py` + `scripts/split_holdout.py` — it isn't committed to the repo.

You can also identify a bird from the in-app microphone recorder instead of uploading a file.

## Running the project (production / single-service)

Build and run the same container used in deployment:

```bash
docker build -t birdsense .
docker run -p 8000:8000 birdsense
```

This builds the Vite frontend, then serves it plus the API from one Gunicorn-backed Flask process on port `8000` (`gunicorn -w 1 --worker-class gthread --threads 4 --timeout 300`). Open `http://localhost:8000`.

**Deploying to Render**: `render.yaml` defines a free-tier Docker web service with a health check at `/species`. Push to GitHub and use Render's Blueprint deploy (New → Blueprint, point at this repo) — no manual service configuration needed.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8000` (Docker) / `5000` (dev) | Port Flask/Gunicorn binds to |
| `BIRDSENSE_DATA_DIR` | backend folder | Overrides where `uploads/`, `spectrograms/`, and `birdsense.db` live — point this at a mounted persistent disk in production so uploads/history survive redeploys |

## API reference

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/predict` | Upload audio, get species prediction + spectrogram + timeline |
| `GET` | `/history` | Last 100 predictions |
| `GET` | `/species` | List of recognizable species |
| `GET` | `/species/<name>` | Field-guide profile for one species |
| `POST` | `/feedback` | Submit confirm/incorrect/unsure verdict on a prediction |
| `POST` | `/observations` | Log a sighting (broad region only, no exact coordinates) |
| `GET` | `/analytics` | Local aggregate counts for the field-log overview |

## Privacy note

The API never stores precise coordinates. Observation metadata is limited to broad Sarawak regions defined per-species, so the public interface can't be used to pinpoint sensitive species.
