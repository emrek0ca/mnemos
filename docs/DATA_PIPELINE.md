# DATA_PIPELINE - MNEMOS

## 1. Source Formats
### Telegram
- **Input**: `result.json` export from Telegram Desktop.
- **Extraction**: User identity, message text, media file links, reply-to references, timestamps.

## 2. Parsing Logic
- Parse the messages list.
- Filter for messages where `from_id` matches the user's primary identity.
- Join text segments (Telegram often breaks long text or links into arrays of objects).

## 3. Cleaning Stages
1. **Redaction**: Remove PII.
2. **Quality Filter**: Remove messages shorter than 1 word (e.g., empty or stickers only).
3. **Format Normalization**: Standardize timestamps to ISO 8601.

## 4. Dataset Construction
- **SFT (Supervised Fine-Tuning) Pairs**:
  - `prompt`: The message preceding the user's message.
  - `response`: The user's message.
- **Multi-turn Context**: Sliding windows of the last N messages to capture conversation flow.

## 5. Artifact Outputs
- `artifacts/raw/` - Symlinks or copies of original exports.
- `artifacts/processed/ingested.jsonl` - Redacted and parsed messages.
- `artifacts/datasets/train.jsonl` - Training ready format.
