from typing import List, Dict, Any
from loguru import logger

class CognitiveBlender:
    """
    Manages the 'Reasoning-Identity' mix during agent inference.
    Determines how much the twin should rely on its episodic past vs. base logical reasoning.
    """

    def __init__(self, identity_gravity: float = 0.7):
        # 1.0 = Pure Identity (Always sticks to past examples)
        # 0.0 = Pure Logic (Operates like a generic LLM)
        self.gravity = identity_gravity

    def blend_context(self, base_reasoning: str, retrieved_memories: List[str]) -> str:
        """Synthesizes context by weighting memory influence."""
        if not retrieved_memories:
            return base_reasoning
            
        logger.debug(f"Blending Cognitive Context (Identity Gravity: {self.gravity})")
        
        # Heuristic blending: concatenate memory context but inject gravity multiplier
        # In a production fine-tuning setup, this influences the LoRA adapter scale (Alpha).
        memory_str = "\n".join([f"- {m}" for m in retrieved_memories])
        
        blended_prompt = f"""
        [IDENTITY CONTEXT]
        The following patterns and memories define your core personality:
        {memory_str}
        
        [LOGICAL MISSION]
        {base_reasoning}
        
        [BLENDER CONFIG]
        Weight of Identity Influence: {self.gravity * 100}%
        """
        return blended_prompt.strip()

    def set_gravity(self, value: float):
        self.gravity = max(0.0, min(1.0, value))
        logger.info(f"Cognitive Blender gravity adjusted to: {self.gravity}")
