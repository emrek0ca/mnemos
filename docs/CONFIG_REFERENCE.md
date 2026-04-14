# CONFIG_REFERENCE — MNEMOS

All settings live in `core/config/settings.py` and are loaded from environment variables or `.env`.
Copy `.env.example` to `.env` and fill in your values.

## Identity

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `USER_NAME` | str | `""` | Your name as it appears in chat exports |
| `USER_ID` | str | `""` | Your Telegram user_id (e.g. `user123`) |

## Inference / LLM Backend

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `INFERENCE_BACKEND` | enum | `stub` | `anthropic` \| `openai` \| `ollama` \| `stub` |
| `ANTHROPIC_API_KEY` | str | `None` | Anthropic API key |
| `ANTHROPIC_MODEL` | str | `claude-sonnet-4-6` | Claude model ID |
| `OPENAI_API_KEY` | str | `None` | OpenAI API key |
| `OPENAI_MODEL` | str | `gpt-4o-mini` | OpenAI model ID |
| `OLLAMA_MODEL` | str | `llama3` | Model name in local Ollama |
| `OLLAMA_BASE_URL` | str | `http://localhost:11434` | Ollama server URL |
| `MAX_TOKENS` | int | `512` | Maximum tokens per response |
| `TEMPERATURE` | float | `0.7` | Sampling temperature |
| `MAX_CONTEXT_WINDOW` | int | `10` | Conversation turns retained per session |

## Privacy

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `PII_MASK_CHAR` | str | `*` | Character used in mask (8 chars always used) |
| `ENABLE_PHONE_REDACTION` | bool | `true` | Redact phone numbers |
| `ENABLE_EMAIL_REDACTION` | bool | `true` | Redact email addresses |
| `ENABLE_URL_REDACTION` | bool | `false` | Redact URLs (opt-in; URLs often provide context) |

## Paths (auto-derived, rarely need changing)

| Key | Default | Description |
|-----|---------|-------------|
| `BASE_DIR` | repo root | Project root directory |
| `ARTIFACTS_DIR` | `artifacts/` | Parent of all generated data |
| `RAW_DIR` | `artifacts/raw/` | Original unprocessed exports |
| `PROCESSED_DIR` | `artifacts/processed/` | Ingested + redacted JSONL files |
| `DATASETS_DIR` | `artifacts/datasets/` | Train/val split JSONL files |
| `LOGS_DIR` | `artifacts/logs/` | Structured log files |

## Training (for LoRA fine-tuning — Phase 5)

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `TRAINING_MODEL_ID` | str | `meta-llama/Llama-2-7b-chat-hf` | HuggingFace base model |
| `TRAINING_LORA_R` | int | `16` | LoRA rank |
| `TRAINING_LORA_ALPHA` | int | `32` | LoRA alpha scaling |
| `TRAINING_BATCH_SIZE` | int | `4` | Training batch size |
| `TRAINING_EPOCHS` | int | `3` | Training epochs |
| `TRAINING_LEARNING_RATE` | float | `2e-4` | Learning rate |

## Ingestion

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `MIN_MESSAGE_LENGTH` | int | `2` | Minimum characters for a message to be kept |

## Bot

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | str | `None` | Telegram Bot API token |
