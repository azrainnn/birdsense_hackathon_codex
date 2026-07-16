# BirdSense web interface

The React/Vite interface provides:

- A Sarawak-inspired landing page and audio-identification workspace.
- A privacy-aware species encyclopedia with broad Sarawak habitat-region guides.
- Candidate comparison, an approximate per-window detection timeline, and human verification controls.
- A local field log with recent analyses and lightweight summary counts.
- A small progressive-web-app shell for returning to the field guide when connectivity is limited.

## Run locally

Start the Flask API from the repository root:

```bash
python -m pip install -r backend/requirements.txt
python backend/app.py
```

In a second terminal, run the web app:

```bash
cd frontend
npm ci
npm run dev
```

Open the local Vite URL shown in the terminal.

## Important data notes

The range map displays deliberately broad habitat regions, not sightings or exact distribution boundaries. Sensitive species never expose precise locations. The field-guide conservation labels are presentation context and should be refreshed against an authoritative conservation source before a public release.
