from typing import Dict, List, Any
from loguru import logger
import collections

class ConsensusEngine:
    """
    The 'Supreme Court' of the MNEMOS Swarm.
    Resolves conflicting reasoning branches into a single high-fidelity consensus.
    """

    def __init__(self, node_weights: Dict[str, float]):
        self.weights = node_weights

    def resolve(self, contributions: Dict[str, str], user_input: str) -> str:
        """
        Consensus Engine 2.0: Collaborative Semantic Synthesis.
        """
        if not contributions:
            return "Swarm hibernation detected. Cognitive signal lost."

        if len(contributions) == 1:
            return list(contributions.values())[0]

        # 1. Deterministic Majority Check (Optimized Path)
        counts = collections.Counter(contributions.values())
        most_common, frequency = counts.most_common(1)[0]
        if frequency > len(contributions) / 2:
            logger.info("Swarm Consensus: Deterministic majority achieved.")
            return most_common

        # 2. Collaborative Synthesis (Mediation Path)
        logger.info(f"Swarm Consensus: Initiating Semantic Cross-Mediation ({len(contributions)} nodes)...")
        return self._synthesize_swarm_truth(contributions)

    def _synthesize_swarm_truth(self, contributions: Dict[str, str]) -> str:
        """Invokes the Supreme Arbiter to synthesize a unified response."""
        from core.inference.engine import InferenceEngine
        inference = InferenceEngine()
        
        # We perform mediation if nodes disagree.
        # This ensures the final output is a high-fidelity synthesis.
        return inference.mediate_swarm(contributions)
