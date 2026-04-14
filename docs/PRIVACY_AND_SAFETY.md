# PRIVACY_AND_SAFETY - MNEMOS

## Privacy Philosophy
The user's private data is the core of this project. Privacy is not a feature; it is the prerequisite.

## Redaction Strategy
- **Layer 1: Pattern Matching**: Regex-based detection for emails, phone numbers, credit cards, and addresses.
- **Layer 2: Named Entity Recognition (NER)**: Future use of LLM/NLP models to catch contextual PII (names, specific locations).
- **Layer 3: Manual Review**: Exporting redaction artifacts for the user to verify.

## Sensitive Data Handling
- All ingestion happens **locally**.
- Processed data in `artifacts/` must never be committed to version control (.gitignore updated).
- Model fine-tuning should ideally happen in a secure, isolated environment (e.g., local machine or private cloud).

## Deployment Risks
- **Mimicry Leakage**: A fine-tuned model might accidentally regenerate PII it saw during training if not properly redacted.
- **Model Theft**: The model weights represent a digital fingerprint of the user's personality and must be protected.

## Abuse Boundaries
- MNEMOS is strictly for fine-tuning on **one's own data**.
- Impersonation of third parties without consent is a violation of the project's ethics.
