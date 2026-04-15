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

## 1. Mnemonic API Server (v3.4.0)

Operationalize the digital twin's cognitive cortex.

```bash
# Launch server on default port (8000)
uv run python -m core.api.server

# Launch on custom port (e.g. for avoiding local conflicts)
uv run python -m core.api.server --port 8001
```

### Health & Pulse Check

```bash
# Verify API pulse
curl -s http://127.0.0.1:8000/api/health

# Run Forensic Identity Drift Audit
curl -s http://127.0.0.1:8000/api/integrity/drift

# Get Cognitive Memory Statistics
curl -s http://127.0.0.1:8000/api/memory/stats
```

## 2. Ingest Telegram Export

Place your `result.json` (Telegram Desktop → Settings → Export Chat History) in `artifacts/raw/`.

```bash
uv run python -m apps.cli.main ingest \
  --source artifacts/raw/result.json \
  --user-id YOUR_TELEGRAM_USER_ID
# Output: artifacts/processed/ingested.jsonl
```

## 3. PII Redaction & Privacy

```bash
uv run python -m apps.cli.main redact \
  --input-file artifacts/processed/ingested.jsonl
# Output:  artifacts/processed/redacted.jsonl
```

## 4. Reflective Interactive Mode

Run the digital twin with hierarchical memory (System 1/System 2) and full reasoning loops.

```bash
# Full agent mode with hierarchical memory
uv run python -m apps.cli.main reflective-chat --mode baseline
```

## 5. Cognitive Verification

```bash
# Run 100% Industrial Integrity Suite (83+ tests)
uv run pytest tests/test_cognitive_integrity.py -v

# Run Full Regression Suite
uv run pytest tests/ -v
```

## 6. Configure LLM Backend

Edit `.env`:

```
# A: Anthropic Claude (cloud, high quality)
INFERENCE_BACKEND=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# B: Ollama (local, fully private)
INFERENCE_BACKEND=ollama
OLLAMA_MODEL=llama3

# C: Stub (offline, for testing the pipeline without LLM costs)
INFERENCE_BACKEND=stub
```

## 7. Development & Quality

```bash
# Type check across all layers
uv run pyright core/ apps/

# Style check
uv run ruff check core/ apps/
```

## 8. Smoke test (Neural Integrity)

```bash
uv run python -c "
from core.inference.engine import InferenceEngine
from core.memory.controller import MemoryController
from core.cognition.agent import MnemosAgent
from core.orchestration.drift import MnemosDriftAuditor
print('MNEMOS v3.4.0 Core Components: OK')
"
```
