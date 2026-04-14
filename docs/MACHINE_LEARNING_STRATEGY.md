# MACHINE_LEARNING_STRATEGY - MNEMOS

Mnemos employs a data-centric ML strategy focused on stylistic fidelity, factual consistency, and privacy-preserving adaptation.

## 1. Data Ingestion & Transformation

### 1.1 Distribution Analysis
We analyze the distribution of:
- **Lexical Overlap**: N-gram similarity between user history and twin responses.
- **Message Length**: Mean, variance, and burstiness patterns.
- **Tone/Sentiment**: Affective distribution across different contexts (e.g., professional vs. casual).

### 1.2 Multi-Format Perception
Input sources are converted into a unified **Digital Artifact Object (DAO)**:
- Telegram/Discord -> Chat JSONL.
- PDFs/Documents -> Chunked Semantic blocks.
- Voice -> Transcribed Text segments.

## 2. Learning Strategies

### 2.1 Prompt-Based Reconstruction (Zero/Few-Shot)
- Use detailed style statistics to build specialized system prompts.
- **Metric**: Stylistic overlap with real user data.

### 2.2 SFT (Supervised Fine-Tuning)
- Building instruction-response pairs where the "Assistant" is the user.
- **Strict Data Cleaning**: Automatic removal of context-free or low-value turns.
- **Validation**: 10% holdout set to measure perplexity and style loss.

### 2.3 LoRA / QLoRA Adaptation
- Training lightweight adapters on local datasets.
- **Config**: r=16, alpha=32, target_modules=["q_proj", "v_proj"].

## 3. Evaluation Framework

### 3.1 Style Fidelity Metrics
- Jaccard Similarity on vocabulary.
- Punctuation Density parity.
- Emoji Distribution matching.

### 3.2 Factual Alignment
- Checking Semantic memory against generation results for "Hallucination" detection.

### 3.3 Privacy Tradeoff
- Measuring the balance between utility (style fidelity) and redaction depth (PII removal).

## 4. Leakage Prevention
- **Identity Isolation**: Ensuring the model doesn't learn "User A's" data when interacting as "User B."
- **Temporal Split**: Using chronological splits for train/val to prevent the model from learning "the future" of a conversation.
