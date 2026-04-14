from typing import Dict, Any, List
from loguru import logger
from core.memory.controller import MemoryController
from core.training.registry import WeightRegistry

class MnemosEvolver:
    """
    Persistent Cognitive Alignment Engine.
    Monitors the delta between 'Identity Mnemonic' (System 2) and 'Identity weights' (System 1).
    """

    def __init__(self, memory: MemoryController, registry: WeightRegistry):
        self.memory = memory
        self.registry = registry

    def calculate_alignment_score(self) -> float:
        """
        Heuristic: Compare volume of 'Verified Pending' facts against the active model's training date.
        If thousands of facts are verified AFTER the last training run, alignment drops.
        """
        logger.info("Analyzing Identity Alignment delta...")
        
        active_cp = self.registry.get_active()
        if not active_cp:
            return 0.0 # No weights loaded = basic alignment
            
        last_train_date = active_cp.trained_at
        new_facts = [
            f for f in self.memory.semantic.knowledge.values()
            if f.created_at > last_train_date and f.status == "verified"
        ]
        
        # Heuristic scoring: base 95% minus 2% for every 50 unaligned facts
        unaligned_count = len(new_facts)
        alignment = max(30.0, 95.0 - (unaligned_count / 50.0 * 2.0))
        
        logger.success(f"Identity Alignment Score: {alignment}% | Unaligned Facts: {unaligned_count}")
        return round(alignment, 2)

    def trigger_dataset_refresh(self) -> str:
        """Curation logic to prepare the next evolution cycle."""
        logger.info("Curating new Evolution Dataset...")
        # Handled by SyntheticDatasetFactory
        return "evolution_dataset_v1.jsonl"
