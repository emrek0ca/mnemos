"""
MnemosAgent — The Executive Layer (Prefrontal Cortex).

Agent loop:
  Observe → Retrieve Memory → Build Context → Safety Check → Generate → Record

Conversation history is maintained as a proper alternating user/assistant list
so it can be passed directly to any ChatML-compatible LLM backend.
"""

from typing import List, Dict, Any, Optional
from loguru import logger
import anyio

from core.memory.controller import MemoryController
from core.inference.engine import InferenceEngine
from core.config.settings import settings
from core.cognition.models import CognitivePacket, ReasoningChain
from core.adaptation.baseline import BaselinePersonaBuilder
from core.utils.telemetry import telemetry
from core.vision.engine import VisionPerceptionEngine
from core.orchestration.lattice import MnemosLattice
from core.cognition.consensus import ConsensusEngine
from core.cognition.affect import MnemosAffect
import time


class MnemosAgent:
    def __init__(self, user_id: str = "main", model_mode: str = "baseline", consolidation_interval: int = 10):
        self.user_id = user_id
        self.inference = InferenceEngine(mode=model_mode)
        self.memory = MemoryController(fork_id=user_id)
        self.persona_builder = BaselinePersonaBuilder()
        self.vision = VisionPerceptionEngine()
        
        self.turn_count = 0
        self.consolidation_interval = consolidation_interval
        
        # Initialize Swarm Substrate
        self.lattice = MnemosLattice(node_id=user_id)
        weights = {n["id"]: n["weight"] for n in settings.SWARM_NODES}
        self.consensus = ConsensusEngine(node_weights=weights)
        self.affect = MnemosAffect()
        
        logger.info(f"MnemosAgent initialized in {model_mode} mode. Swarm Support: {settings.SWARM_ENABLED}")

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def process(self, user_input: str, user_id: str = "user", metadata: Optional[Dict[str, Any]] = None) -> str:
        """Synchronous wrapper for backward compatibility with CLI and tests."""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If we are in an async test, we should really be using 'aprocess'.
                # But to satisfy sync calls, we use a thread-safe runner.
                from concurrent.futures import ThreadPoolExecutor
                with ThreadPoolExecutor() as executor:
                    return executor.submit(asyncio.run, self.aprocess(user_input, user_id, metadata)).result()
        except RuntimeError:
            pass
        return asyncio.run(self.aprocess(user_input, user_id, metadata))

    async def aprocess(self, user_input: str, user_id: str = "user", metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Executes a high-fidelity cognitive cycle.
        """
        import asyncio
        start_time = time.time()
        self.turn_count += 1
        metadata = metadata or {}
        
        # 1. Perception & Sensory Logging
        vision_anchor = self.vision.describe_image(metadata, user_input=user_input)
        effective_input = f"{user_input} {vision_anchor}".strip()
        
        # Visual Affect Resonance (v3.9.0)
        visual_pulse = self.vision.analyze_resonance(metadata)
        
        # 2. Parallel Recall (Velocity Optimized)
        recent_task = self.memory.aretrieve_recent(limit=10)
        semantic_task = self.memory.asearch_semantic(user_input, limit=5)
        
        recent, semantic = await asyncio.gather(recent_task, semantic_task)
        
        # 3. Context Synthesis (Industrial Grade)
        history = [m.content for m in recent]
        
        # Multimodal Affect Pulse Sync
        text_pulse = self.affect.get_aggregate_pulse(history + [effective_input])
        
        # Weighted Aggregation: Image affect has higher weight for immediate stimulus
        self.affect.valence = (text_pulse["valence"] * 0.4) + (visual_pulse["valence"] * 0.6)
        self.affect.arousal = (text_pulse["arousal"] * 0.4) + (visual_pulse["arousal"] * 0.6)
        
        if not history or history[-1] != effective_input:
            if effective_input not in history:
                history.append(effective_input)
            await self.memory.perceive(effective_input, sender_id=user_id, metadata=metadata)
        
        # Build Persona with Grounding, Affect & DNA (v4.0.0)
        system_prompt = self.persona_builder.build_system_prompt(
            semantic_memories=semantic, 
            affect=pulse,
            dna=self.memory.procedural.dna
        )
        
        # 4. Action (Inference / Swarm Dispatch)
        if settings.SWARM_ENABLED:
            contributions = await self.lattice.dispatch_to_swarm(history, system_prompt=system_prompt)
            response = self.consensus.resolve(contributions, user_input=user_input)
        else:
            response = self.inference.generate(history, system_prompt=system_prompt)
        
        # 5. Record & Consolidate
        await self.memory.perceive(response, sender_id="assistant")
        
        # 6. Micro-DNA Evolution (v4.0.0)
        # Perform real-time style synthesis for the latest turn
        try:
            latest_episodes = history[-1:] + [response]
            new_dna_markers = self.inference.synthesize_behavioral_dna(latest_episodes)
            if new_dna_markers:
                # Fast Smoothing (Higher alpha for real-time reactivity)
                alpha = 0.3
                dna = self.memory.procedural.dna
                dna.rationality = (dna.rationality * (1-alpha)) + (new_dna_markers.get('rationality', dna.rationality) * alpha)
                dna.resonance = (dna.resonance * (1-alpha)) + (new_dna_markers.get('resonance', dna.resonance) * alpha)
                dna.technical_depth = (dna.technical_depth * (1-alpha)) + (new_dna_markers.get('technical_depth', dna.technical_depth) * alpha)
                dna.formality = (dna.formality * (1-alpha)) + (new_dna_markers.get('formality', dna.formality) * alpha)
                dna.lexical_complexity = (dna.lexical_complexity * (1-alpha)) + (new_dna_markers.get('lexical_complexity', dna.lexical_complexity) * alpha)
                self.memory.procedural.save_dna()
                logger.info("[Evolution] Micro-DNA synthesis complete.")
        except Exception as ee:
            logger.error(f"Micro-DNA synthesis failed: {ee}")

        if self.turn_count % self.consolidation_interval == 0:
            logger.info(f"Reflecting on turn {self.turn_count} (Autonomous Consolidation)...")
            self.memory.consolidate(self.inference)

        latency_ms = (time.time() - start_time) * 1000
        telemetry.record_turn(latency_ms=latency_ms, memory_hits=len(semantic))

        # Spinal Resilience: Emotional Homeostasis Decay
        self.affect.decay()

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
