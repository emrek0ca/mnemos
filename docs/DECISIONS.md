# DECISIONS - MNEMOS

## ADR 001: Pivot to Python-First Architecture
- **Date**: 2026-04-14
- **Context**: The existing project was a Next.js web application. The goal was intensified toward building a production-grade digital twin pipeline requiring deep ML/NLP integrations.
- **Decision**: Transition to a modular Python-centric repository structure. Move Next.js to `apps/web`.
- **Consequences**: Better support for HuggingFace/PyTorch ecosystems. Clearer separation between the "engine" (Python) and the "interface" (Web).

## ADR 002: Use of `uv` and Python 3.9+
- **Date**: 2026-04-14
- **Context**: Rapid environment management and performance are needed for local ML pipelines.
- **Decision**: Adopt `uv` as the package manager. Target `>=3.9` in pyproject.toml (existing .venv is 3.9); upgrade to 3.12 when creating a fresh environment.
- **Consequences**: Faster dependency resolution. Note: `.python-version` says 3.9; update to 3.12 when rebuilding venv.

## ADR 003: Pluggable LLM Backend Architecture
- **Date**: 2026-04-14
- **Context**: The inference engine was a pure stub returning placeholder strings. The system had no actual intelligence.
- **Decision**: Implement a backend-routing pattern in `core/inference/engine.py` with four backends: `anthropic`, `openai`, `ollama`, `stub`. Backend is selected via `INFERENCE_BACKEND` env var. No backend package is a hard dependency — each is imported lazily with a clear error if missing.
- **Consequences**: 
  - Users can run offline (stub), locally-private (ollama), or cloud (anthropic/openai) without code changes.
  - Adding a new backend (e.g. Groq, Bedrock) requires only a new `_groq()` method.
  - The stub backend enables CI/CD and testing without API keys.

## ADR 004: Keyword-Only Memory Search (Temporary)
- **Date**: 2026-04-14
- **Context**: `core/memory/episodic.py::search()` uses keyword matching. Vector search requires sentence-transformers (~500MB) which is not a core dependency yet.
- **Decision**: Ship keyword search now; replace with embedding-based cosine similarity in the next session.
- **Consequences**: Memory retrieval quality is low for semantic queries. Acceptable for Phase 1 milestones.
