# BirdSense

BirdSense is an AI-assisted, privacy-aware web application for identifying a
selected set of Bornean bird species from audio recordings. It combines
BirdNET audio embeddings with a lightweight TensorFlow Lite classifier and a
human-in-the-loop review workflow.

> **Prototype notice:** BirdSense provides candidate identifications, not
> confirmed sightings. Users should review the confidence, alternatives, audio
> evidence, habitat context, and—when needed—consult a qualified expert.

## Features

- Audio upload and identification for 15 selected Bornean species.
- Top candidate comparison, confidence, mel-spectrogram, and approximate
  per-window detection timeline.
- Human confirmation, correction, and uncertainty feedback.
- Privacy-aware field notes that accept only a broad Sarawak region—never
  exact coordinates.
- A Sarawak field guide with broad habitat context for sensitive species.

## Run locally

Prerequisites: Python and Node.js/npm.

Start the Flask API from the repository root:

```bash
python -m pip install -r backend/requirements.txt
python backend/app.py
```

In another terminal, start the React/Vite interface:

```bash
cd frontend
npm ci
npm run dev
```

Open the local Vite URL printed in the terminal. The development server proxies
API calls to the Flask backend at `http://127.0.0.1:5000`.

## Training data and Xeno-canto licensing

The training pipeline can retrieve Grade A/B bird recordings from
[Xeno-canto](https://xeno-canto.org) using `scripts/downloader.py`. Xeno-canto
recordings are owned by their individual recordists and are licensed on a
**per-recording** basis; the applicable Creative Commons licence is shown on
each recording's Xeno-canto page. Do not assume that all Xeno-canto recordings
have the same reuse permissions.

When using any Xeno-canto recording, including for dataset creation, demos,
redistribution, or a production system:

1. Check the recording page and comply with that recording's current licence.
2. Preserve the required attribution, including the recordist, Xeno-canto
   recording ID/URL, licence, and any required indication of changes.
3. Do not use recordings with commercial, derivative-work, or share-alike
   restrictions outside the permissions of their specific licence.
4. Maintain a dataset manifest with the recording ID, recordist, source URL,
   licence, download date, and processing history.
5. Obtain permission or exclude a recording whenever its licence or provenance
   cannot be verified.

The repository does not include the full training dataset. Its small demo set
is in [`sample_audio/`](sample_audio/), with available source references in
[`sample_audio/CREDITS.md`](sample_audio/CREDITS.md). Some legacy sample clips
are explicitly marked as having unverified provenance; they must be removed or
replaced before any public, commercial, or redistributed release.

This repository does not grant rights to third-party recordings or resolve the
licensing status of model outputs. Before deployment, especially a commercial
deployment, obtain an appropriate legal and data-governance review for the
complete dataset and its intended use.

## Responsible use

- The app deliberately stores only broad regions, not exact wildlife
  coordinates, to reduce risk to sensitive species.
- Uploaded recordings and optional feedback are stored locally by the current
  prototype. A production system should add retention controls, deletion,
  authentication, and secure storage.
- Conservation labels are contextual information and should be refreshed from
  authoritative sources before use in field or management decisions.
- The current model is limited to 15 species and can be affected by noise,
  overlapping calls, unseen species, recording equipment, and uneven training
  data. Low-confidence results must not be treated as identifications.

## Project structure

- `frontend/` — React/Vite user interface.
- `backend/` — Flask API, audio processing, inference, and local storage.
- `scripts/` — dataset, training, evaluation, and model-export pipeline.
- `sample_audio/` — small demo clips and their source credits.
- `SCRIPTS.md` — detailed training-pipeline reference.
