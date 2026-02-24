# ── TaskPulse Backend — Hugging Face Spaces Dockerfile ──────────────────────
# Port 7860 is mandatory for Hugging Face Spaces.
# Local dev uses docker-compose which overrides CMD to port 8000.
# ─────────────────────────────────────────────────────────────────────────────

FROM python:3.11-slim

# System deps: libpq for psycopg2-binary
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source (backend/ contents → /app)
# .dockerignore excludes .env, __pycache__, etc.
COPY . .

# Hugging Face Spaces mandatory port
EXPOSE 7860

# Health check using Python's built-in urllib against FastAPI's auto-generated
# /openapi.json endpoint — no curl required on slim image.
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:7860/openapi.json')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
