# --- Build Stage ---
FROM python:3.9-slim as builder

WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir build && \
    pip install --no-cache-dir .

# --- Final Stage ---
FROM python:3.9-slim

WORKDIR /app
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY . .

# Environment Defaults
ENV ARTIFACTS_DIR=/app/artifacts
ENV LOG_LEVEL=INFO

# Expose API and Dashboard
EXPOSE 8000

# Start Engine
CMD ["python", "-m", "core.api.server"]
