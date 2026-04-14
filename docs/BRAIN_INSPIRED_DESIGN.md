# BRAIN_INSPIRED_DESIGN - MNEMOS

Mnemos is architected not as a monolithic LLM wrapper, but as a modular system inspired by the functional decomposition of the human brain.

## 1. Functional Mapping

| Brain Region | Mnemos Module | Function |
| :--- | :--- | :--- |
| **Prefrontal Cortex** | `core/cognition/agent.py` | Executive function, goal selection, planning, and safety filtering. |
| **Hippocampus** | `core/memory/episodic.py` | Encoding and retrieval of specific life events and conversation segments. |
| **Neocortex** | `core/memory/semantic.py` | Long-term storage of facts, preferences, and world knowledge. |
| **Basal Ganglia** | `core/memory/procedural.py` | Routine workflows, greeting habits, and interaction patterns. |
| **Thalamus** | `apps/cli/main.py` | Routing sensory (raw data) input to the correct processing layers. |
| **Amygdala** | `core/personality/signals.py` | Detection of emotional tone and affective priority scoring. |

## 2. Integrated Principles

### 2.1 Modularity & Connectivity
Just as brain regions are highly specialized yet deeply interconnected via white matter tracts, Mnemos modules communicate via structured Pydantic models. This ensures that the "Executive" layer can consult "Episodic" memory without knowing the underlying storage details.

### 2.2 Neuroplasticity (Continuous Learning)
Mnemos implements learning at multiple timescales:
- **Hebbian-like Reinforcement**: Frequent retrieval of a memory enhances its "importance score" in the vector store.
- **Consolidation**: During "Idle/Reflection" cycles, the system summarizes episodic events into semantic facts.

### 2.3 Attention Schema
The system maintains a "Working Memory" (context window) that acts as a spotlight, focusing the Reasoning layer on the most relevant recent events and retrieved long-term context.

## 3. Scope Boundary

> [!CAUTION]
> While Mnemos is brain-inspired, it is **not a biological simulation**. We use these metaphors as engineering frameworks to build more human-aligned agents, not to claim the emergence of biological processes.
