# ---------------------------------------------------------------------------
# Multi-stage Dockerfile for the FastAPI Expense Tracker backend
# ---------------------------------------------------------------------------

# ---- Build stage ----
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies into a dedicated prefix
COPY requirements.txt .
RUN pip install --prefix=/install --no-cache-dir -r requirements.txt


# ---- Runtime stage ----
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install only runtime system libraries (libpq for psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from the builder stage
COPY --from=builder /install /usr/local

# Copy application source
COPY app/ ./app/

# Create a non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

# Expose the port defined in the environment (defaults to 8000)
EXPOSE 8000

# Health-check: lightweight HTTP call to the /health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD python -c "import urllib.request, sys; \
        req = urllib.request.urlopen('http://localhost:${API_PORT:-8000}/health', timeout=4); \
        sys.exit(0 if req.status == 200 else 1)"

# Start the ASGI server.  PORT can be overridden via environment variable.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${API_PORT:-8000} --workers 2"]
