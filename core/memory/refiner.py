import numpy as np
from typing import List, Dict, Any, Tuple
from loguru import logger
from core.memory.models import SemanticMemory

class MemoryRefiner:
    """
    System 2 Reflective Layer: Manages the integrity of the semantic knowledge base.
    Analyzes facts for overlaps, contradictions, and stylistic maturity.
    """

    def __init__(self, semantic_knowledge: Dict[str, SemanticMemory]):
        self.knowledge = semantic_knowledge

    def find_contradictions(self, new_fact: str) -> List[str]:
        """
        Heuristic check for potential contradictions with existing knowledge.
        Silicon Valley Grade: Uses polarity and keyword overlap detection.
        """
        conflicts = []
        new_norm = new_fact.lower()
        
        # Simple Logic: Check for 'negations' of existing facts
        # (e.g., 'like' vs 'hate', 'don't like')
        negations = ["hate", "dislike", "don't like", "not a fan", "stop", "never"]
        positives = ["love", "like", "fan", "always", "start", "fond"]

        for existing_fact in self.knowledge.values():
            ext_norm = existing_fact.fact.lower()
            
            # If they share significant nouns but have opposing verbs/polarities
            common_words = set(new_norm.split()) & set(ext_norm.split())
            if len(common_words) >= 2:
                # Check for polarity shift
                has_new_neg = any(n in new_norm for n in negations)
                has_ext_pos = any(p in ext_norm for p in positives)
                
                if (has_new_neg and has_ext_pos) or (not has_new_neg and not has_ext_pos and any(n in ext_norm for n in negations) and any(p in new_norm for p in positives)):
                    conflicts.append(existing_fact.id)
                    logger.warning(f"Semantic conflict detected: '{new_fact}' vs '{existing_fact.fact}'")

        return conflicts

    def refine_batch(self, facts: List[SemanticMemory]) -> List[SemanticMemory]:
        """
        Deduplicates and merges near-identical facts within a batch.
        """
        refined = []
        seen_facts = {}
        
        for f in facts:
            key = f.fact.lower().strip()
            if key in seen_facts:
                # Merge: Update confidence or source IDs
                seen_facts[key].confidence = min(1.0, seen_facts[key].confidence + 0.1)
                seen_facts[key].source_episodic_ids.extend(f.source_episodic_ids)
            else:
                seen_facts[key] = f
                refined.append(f)
                
        return refined
