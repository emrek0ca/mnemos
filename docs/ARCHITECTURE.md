# ARCHITECTURE - MNEMOS

Mnemos is organized as a layered cognitive system, transforming raw sensory input into structured memory and reflective actions.

## 1. System Overview (The Layered Brain)

```mermaid
graph TD
    subgraph Perception_Layer ["1. Perception (Sensory)"]
        A1[Telegram/Discord] --> B1[Ingestor]
        A2[Notes/Documents] --> B1
        A3[Voice/Images] --> B1
    end

    subgraph Sanitization_Layer ["2. Sanitization (Privacy)"]
        B1 --> C1[PII Redactor]
        C1 --> C2[Audit Reporter]
    end

    subgraph Memory_Layer ["3. Memory Hierarchy"]
        C2 --> D1[Episodic Memory]
        C2 --> D2[Semantic Memory]
        D3[Procedural Memory]
        D4[Working Memory]
    end

    subgraph Control_Layer ["4. Cognitive Control"]
        E1[Attention Mechanism]
        E2[Executive Loop]
    end

    subgraph Reasoning_Layer ["5. Reasoning & Reflection"]
        F1[LLM Orchestrator]
        F2[Safety Filter]
    end

    subgraph Action_Layer ["6. Interaction"]
        G1[CLI Chat]
        G2[Telegram Bot]
        G3[Export Tools]
    end

    D1 & D2 & D3 & D4 <--> E1
    E1 <--> E2
    E2 <--> F1
    F1 --> F2
    F2 --> G1 & G2 & G3
```

## 2. Component breakdown

### 2.1 core/ingestion
Translates raw file formats into a unified `TelegramMessage` (or DAO) base class.

### 2.2 core/privacy
The "Blood-Brain Barrier." Ensures no private entities (phones, emails, secrets) enter the memory system.

### 2.3 core/memory
The persistent storage engine.
- **Episodic**: Time-stamped event vector store.
- **Semantic**: Fact-based personal knowledge graph.
- **Controller**: Manages retrieval priority and consolidation.

### 2.4 core/cognition
The "Prefrontal Cortex." Implements the **Agent Loop**: Observe -> Retrieve -> Plan -> Act.

### 2.5 apps/
The interaction surfaces (CLI, Bots, Web).

## 3. Data Flow

1. **Perception**: Data flows from sources into JSONL artifacts.
2. **Redaction**: PII is stripped and logged in audit reports.
3. **Encoding**: Text is vectorized and stored in Episodic memory.
4. **Reasoning**: User query triggers memory retrieval -> LLM reflection -> response generation.
5. **Consolidation**: The system reflects on the interaction to update long-term knowledge.
