# MEMORY_SYSTEM - MNEMOS

Mnemos implements a multi-tiered storage architecture to provide depth, context, and long-term stability to the twin's identity.

## 1. Memory Hierarchy

### 1.1 Episodic Memory (Events)
- **Concept**: Specific conversation episodes, events, and timestamps.
- **Storage**: Vector Store (e.g., ChromaDB/FAISS) + Chronological Logs.
- **Function**: "What did we talk about last Tuesday regarding the project?"
- **Decay**: Old episodes are gradually summarized to free up high-fidelity space.

### 1.2 Semantic Memory (Facts & Knowledge)
- **Concept**: Structured knowledge about the user (e.g., "I love black tea", "I work as a lead dev").
- **Storage**: Knowledge Graph (Relational/Linked) or Structured Key-Value.
- **Function**: Providing factual grounding during interactions.
- **Reinforcement**: Facts are verified across multiple episodic mentions.

### 1.3 Procedural Memory (Habits & Styles)
- **Concept**: How the user speaks and acts.
- **Storage**: LoRA Adapters + Style Embedding Vectors.
- **Function**: Ensuring grammatical quirks, punctuation, and greeting habits remain consistent.

### 1.4 Working Memory (Executive Attention)
- **Concept**: Active conversation context.
- **Storage**: In-memory (Redis/State Manager).
- **Function**: Managing the current turns and immediate goals.

## 2. Memory Processes

### 2.1 Encoding
Raw sensory data (Perception Layer) is sanitized (Privacy Layer) and then vectorized for the Episodic memory.

### 2.2 Consolidation (Sleep Cycles)
During system "idle" periods:
1. Review recent Episodic records.
2. Extract new Semantic facts.
3. Update Persona embeddings.
4. Compress old high-resolution logs into summaries.

### 2.3 Retrieval (The Spotlight)
The Executive layer queries the memory system using:
- **Similarity Search**: "Find conversations about AI."
- **Temporal Search**: "What happened yesterday?"
- **Fact Lookup**: "What is my cat's name?"

## 3. Data Integrity & Privacy

> [!IMPORTANT]
> All memory tiers are **local-first**. Long-term storage is encrypted at rest. Retrieval is monitored by the Privacy Layer to prevent accidental exposure of redacted PII.
