# RUNBOOK — MNEMOS

Exact commands to operate the system. Only commands that actually work are documented here.

## Prerequisites

```bash
# Install uv if needed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install / sync all dependencies
uv sync

# Create your environment config
cp .env.example .env
# Edit .env: set USER_NAME, USER_ID, INFERENCE_BACKEND, API keys
```

## 1. Ingest Telegram Export

Place your `result.json` (Telegram Desktop → Settings → Export Chat History) in `artifacts/raw/`.

```bash
uv run python -m apps.cli.main ingest \
  --source artifacts/raw/result.json \
  --user-id YOUR_TELEGRAM_USER_ID
# Output: artifacts/processed/ingested.jsonl

# With media asset linkage
uv run python -m apps.cli.main ingest \
  --source artifacts/raw/result.json \
  --user-id YOUR_TELEGRAM_USER_ID \
  --media
```

## 2. PII Redaction

```bash
uv run python -m apps.cli.main redact \
  --input-file artifacts/processed/ingested.jsonl
# Output:  artifacts/processed/redacted.jsonl
# Audit:   artifacts/eval/privacy_audit.json
```

## 3. Build Training Dataset

```bash
uv run python -m apps.cli.main build-dataset \
  --input-file artifacts/processed/redacted.jsonl \
  --window 5
# Output: artifacts/datasets/train.jsonl
#         artifacts/datasets/val.jsonl
```

## 4. Style Evaluation

```bash
# Print statistics to terminal
uv run python -m apps.cli.main evaluate \
  --input-file artifacts/processed/redacted.jsonl

# Generate HTML report
uv run python -m apps.cli.main generate-report \
  --input-file artifacts/processed/redacted.jsonl \
  --output-path artifacts/eval/report.html
```

## 5. Run Full Pipeline (ingest → redact → dataset in one command)

```bash
uv run python -m apps.cli.main run-pipeline \
  --source artifacts/raw/result.json \
  --user-id YOUR_TELEGRAM_USER_ID
```

## 6. Chat with Digital Twin (CLI)

```bash
# Stub mode — works offline, no API key needed
uv run python -m apps.cli.main chat \
  --mode baseline \
  --input-file artifacts/processed/redacted.jsonl

# With real LLM (set INFERENCE_BACKEND in .env first)
uv run python -m apps.cli.main chat --mode baseline

# Full agent mode with hierarchical memory and reasoning loop
uv run python -m apps.cli.main reflective-chat --mode baseline
```

## 7. Configure LLM Backend

Edit `.env`:

```
# A: Anthropic Claude (cloud, high quality)
INFERENCE_BACKEND=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6

# B: Ollama (local, fully private)
INFERENCE_BACKEND=ollama
OLLAMA_MODEL=llama3        # first run: ollama pull llama3
OLLAMA_BASE_URL=http://localhost:11434

# C: Stub (offline, for testing the pipeline without LLM costs)
INFERENCE_BACKEND=stub
```

## 8. Telegram Bot

```bash
# Set TELEGRAM_BOT_TOKEN in .env, then:
uv run python -m apps.cli.main bot --mode baseline
```

## 9. Development

```bash
# Type check
uv run pyright core/ apps/

# Lint
uv run ruff check core/ apps/

# Tests
uv run pytest tests/ -v
```

## 10. Smoke test (no data files needed)

```bash
uv run python -c "
from core.ingestion.telegram import TelegramIngestor
from core.privacy.redactor import Redactor
from core.datasets.builder import DatasetBuilder
from core.inference.engine import InferenceEngine
from core.memory.controller import MemoryController
from core.cognition.agent import MnemosAgent
print('All imports OK')
"
```
