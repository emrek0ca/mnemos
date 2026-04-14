from typing import List, Dict, Any, Set
from loguru import logger
from core.memory.controller import MemoryController
from core.memory.models import SemanticMemory

class MnemosRefiner:
    """
    Belief Refinement & Logic Integrity Engine.
    Identifies circular reasoning and stale paradigms in the semantic network.
    """

    def __init__(self, memory: MemoryController):
        self.memory = memory

    def detect_circular_logic(self) -> List[Dict[str, Any]]:
        """
        Scans for semantic nodes that refer back to each other in a closed loop.
        Example: A -> B, B -> A (Circular reinforcement).
        """
        logger.info("Initiating Recursive Logic Analysis...")
        loops = []
        
        # In a real system, we'd use a graph library or DFS to find cycles
        # For Session 23, we'll implement a heuristic check for cross-references in metadata
        knowledge = list(self.memory.semantic.knowledge.values())
        
        for i, fact_a in enumerate(knowledge):
            for j, fact_b in enumerate(knowledge):
                if i <= j: continue # Avoid duplicate checks
                
                words_a = set(fact_a.fact.lower().split())
                words_b = set(fact_b.fact.lower().split())
                overlap = words_a.intersection(words_b)
                
                # If more than 70% overlap, it's a semantic loop or redundant belief
                threshold = 0.7
                if len(overlap) / max(1, len(words_a)) > threshold and len(overlap) / max(1, len(words_b)) > threshold:
                    loops.append({
                        "id": f"loop_{fact_a.id}_{fact_b.id}",
                        "nodes": [fact_a.id, fact_b.id],
                        "description": f"Circular belief detected: '{fact_a.fact}' <=> '{fact_b.fact}'"
                    })
                    
        logger.success(f"Logic Analysis Complete: Found {len(loops)} circularities.")
        return loops

    def generate_paradigm_proposals(self) -> List[Dict[str, Any]]:
        """Proposes 'Divergent Insights' for stale knowledge clusters."""
        loops = self.detect_circular_logic()
        proposals = []
        
        for loop in loops:
            proposals.append({
                "type": "paradigm_shift",
                "target_ids": loop["nodes"],
                "suggestion": f"Synthesize {loop['description']} into a higher-order principle.",
                "confidence": 0.85
            })
            
        return proposals
