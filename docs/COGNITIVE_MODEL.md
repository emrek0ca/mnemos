# COGNITIVE_MODEL - MNEMOS

Mnemos operates on a Dual Process model, distinguishing between fast, pattern-matching responses (System 1) and slow, reflective reasoning (System 2).

## 1. Dual Process Integration

### 1.1 System 1 (Intuitive/Associative)
- **Role**: Style mimicry, greeting habits, and immediate retrieval.
- **Engine**: Fine-tuned LoRA model or prompt-based style matching.
- **Latency**: Low.
- **Mechanism**: Predicting the next token based on recent context and stylistic fingerprint.

### 1.2 System 2 (Reflective/Executive)
- **Role**: Intent analysis, safety filtering, and multi-step planning.
- **Engine**: Large Reasoner (e.g., Llama 3 70B, Claude) via the Agent Loop.
- **Latency**: High.
- **Mechanism**: Explicit reasoning steps (Chain-of-Thought) before generating the final response.

## 2. The Executive Loop (Agentic Flow)

Mnemos follows a recursive cycle for every interaction:

1. **Observe**: Intake the sensory data (e.g., user's chat message).
2. **Retrieve**: Query the Episodic/Semantic memory systems for "Self" context.
3. **Reflect**: Analyze the user's intent vs. the Twin's personality profile.
4. **Plan**: Select a strategy (e.g., "Answer factually but with a humorous tone").
5. **Sanitize**: Check against Privacy/Safety boundaries.
6. **Act**: Emit the final response.
7. **Consolidate**: Log the interaction as a new experience in episodic memory.

## 3. Cognitive State (Working Memory)

The "Current State" of the system is maintained in a **Cognitive Workspace**:
- **Active Task**: What is the user currently asking?
- **Recency Buffer**: The last 5-10 turns of the conversation.
- **Affective State**: Detected sentiment of the current session.

## 4. Modeling, NOT Mimicking

> [!IMPORTANT]
> The cognitive model is a **functional architecture**. Mnemos does not "feel" or "experience" the model, it simply executes logic gates inspired by these theories to produce high-fidelity interactions.
