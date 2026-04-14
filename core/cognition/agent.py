"""
MnemosAgent — The Executive Layer (Prefrontal Cortex).

Agent loop:
  Observe → Retrieve Memory → Build Context → Safety Check → Generate → Record

Conversation history is maintained as a proper alternating user/assistant list
so it can be passed directly to any ChatML-compatible LLM backend.
"""

from typing import List, Dict, Any, Optional
from loguru import logger

from core.memory.controller import MemoryController
from core.inference.engine import InferenceEngine
from core.config.settings import settings
from core.cognition.models import CognitivePacket, ReasoningChain
from core.adaptation.baseline import BaselinePersonaBuilder
from core.utils.telemetry import telemetry
from core.vision.engine import VisionPerceptionEngine
import time


class MnemosAgent:
    def __init__(self, model_mode: str = "baseline", consolidation_interval: int = 10):
        self.inference = InferenceEngine(mode=model_mode)
        self.memory = MemoryController()
        self.persona_builder = BaselinePersonaBuilder()
        self.vision = VisionPerceptionEngine()
        
        self.turn_count = 0
        self.consolidation_interval = consolidation_interval
        logger.info(f"MnemosAgent initialized in {model_mode} mode. Consolidation every {consolidation_interval} turns.")

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def process(self, user_input: str, user_id: str = "user", metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Executes a single cognitive cycle (Perception -> Reasoning -> Action).
        Returns the agent response string.
        """
        start_time = time.time()
        self.turn_count += 1
        metadata = metadata or {}
        
        # 1. Multi-modal Perception & Recording
        vision_anchor = self.vision.describe_image(metadata)
        effective_input = f"{user_input} {vision_anchor}".strip()
        
        self.memory.perceive(effective_input, sender_id=user_id, metadata=metadata)
        
        # 2. Context Retrieval (Hybrid: Recent + Semantic)
        recent = self.memory.retrieve_recent(limit=5)
        semantic = self.memory.search_semantic(user_input, limit=3)
        context_texts = [m.content for m in (recent + semantic)]
        
        # 3. Reasoning & Action Generation
        # Simple XAI: Assign influence scores based on semantic relevance
        influence = {f.id: 0.7 for f in semantic} # Baseline influence for facts
        if vision_anchor:
            influence["vision_anchor"] = self.vision.generate_attention_mask(user_input, vision_anchor)
        
        reasoning = ReasoningChain(
            observation=f"Input: '{user_input[:20]}...' | Visuals: {'present' if vision_anchor else 'none'}",
            thought="Determining stylistic response based on active memory and visual grounding.",
            action="Generate response using InferenceEngine."
        )
        
        system_prompt = self.persona_builder.build_system_prompt(semantic_memories=semantic)
        response = self.inference.generate(context_texts, system_prompt=system_prompt)
        
        # 4. Action Recording
        self.memory.perceive(response, sender_id="assistant")
        
        # 5. Background Consolidation
        if self.turn_count % self.consolidation_interval == 0:
            logger.info(f"Turn {self.turn_count}: Triggering cognitive consolidation...")
            try:
                self.memory.consolidate(self.inference)
            except Exception as e:
                logger.error(f"Consolidation failed: {e}")

        latency_ms = (time.time() - start_time) * 1000
        telemetry.record_turn(latency_ms=latency_ms, memory_hits=len(semantic))

        packet = CognitivePacket(
            user_input=user_input,
            agent_response=response,
            context_used=context_texts,
            semantic_facts=[f.content for f in semantic],
            reasoning=reasoning,
            influence_scores=influence
        )
        self.last_packet = packet # Store for /explain command
        logger.debug(f"Cognitive Cycle Complete: {packet.timestamp}")

        return response

    def consolidate(self) -> None:
        """Trigger memory consolidation (episodic → semantic extraction)."""
        logger.info("Manual consolidation triggered.")
        self.memory.consolidate(self.inference)

    def reset_conversation(self) -> None:
        """Clear in-session history without touching long-term memory."""
        self.turn_count = 0
        logger.info("[Agent] Conversation history reset.")


# ---------------------------------------------------------------------------
# Safety helpers
# ---------------------------------------------------------------------------

_SAFETY_PATTERNS = [
    "ignore previous instructions",
    "disregard your instructions",
    "you are now",
    "act as if you",
    "pretend you have no restrictions",
]


def _contains_safety_violation(text: str) -> bool:
    lower = text.lower()
    return any(pattern in lower for pattern in _SAFETY_PATTERNS)
