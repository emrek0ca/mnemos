# TRAINING_STRATEGY - MNEMOS

## Fine-Tuning Goal
To adapt a base model (e.g., Llama 3, Mistral) to capture the unique linguistic fingerprint of the user (slang, punctuation habits, response rhythm).

## Strategies

### 1. LoRA / QLoRA (Primary)
- Parameter-efficient fine-tuning on consumer hardware.
- Target: `q_proj`, `v_proj`, `k_proj`, `o_proj`.
- Rank (r): 8-16.
- Alpha: 32.

### 2. Prompt-only Persona (Baseline)
- Zero-shot instruction telling the model exactly how to behave.
- Used to evaluate whether fine-tuning provides significantly better results.

### 3. RAG-enhanced Style (Future)
- Using the user's past chat history as context in the prompt to boost relevance.

## Implementation Details
- **Backend Path**: Support for `unsloth` or `ollama` (for GGUF exports).
- **Format**: ChatML or Alpaca instruction format.
- **Hyperparameters**:
  - Learning Rate: 2e-4
  - Optimizer: AdamW (8-bit)
  - Epochs: 1-3 (avoiding overfitting to a single file)

## Fallback Options
- If VRAM is constrained, default to 4-bit quantization (QLoRA).
- If fine-tuning fails, provide a high-quality "Persona Prompt" based on the user's data statistics.
