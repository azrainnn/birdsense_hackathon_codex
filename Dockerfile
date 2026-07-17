# Builds the Vite frontend, then serves it from the Flask backend as one
# deployable service (see backend/app.py's serve_frontend catch-all route).

FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app/backend

# librosa/soundfile need libsndfile at runtime.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY species_selected.csv /app/species_selected.csv
COPY models/export /app/models/export
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "gunicorn -w 1 --timeout 300 -b 0.0.0.0:${PORT} app:app"]
