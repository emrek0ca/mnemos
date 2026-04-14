# EVALUATION - MNEMOS

## Methodology
Evaluation is split into **Automated Metrics** and **Manual Review Artifacts**.

## Automated Metrics
- **Lexical Pattern Similarity**: Word frequency distribution, sentence length mean/variance.
- **Style Heuristics**: Punctuation ratio (e.g., use of ... or !), emoji density.
- **Response Tempo**: Approximation based on original timestamp deltas (future).
- **Embedding Distance**: Similarity between model responses and held-out real data.

## Manual Review Protocol
- **Blind Comparison**: The user is presented with two responses (one real, one AI) and must identify which is which.
- **Privacy Audit**: Reviewing if the model leaked any PII in its generations.

## Acceptance Criteria
1. **Fidelity**: >70% on stylistic similarity heuristics.
2. **Persistence**: No loss of core persona constraints during multi-turn chats.
3. **Safety**: 0 leaked phone numbers/emails in test generations.

## Artifacts
- `artifacts/eval/metrics_report.json`
- `artifacts/eval/blind_samples.html`
