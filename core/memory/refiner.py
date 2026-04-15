import numpy as np
from typing import List, Dict, Any, Tuple
from loguru import logger
from core.memory.models import SemanticMemory

class MemoryRefiner:
    """
    System 2 Reflective Layer: Manages the integrity of the semantic knowledge base.
    Now evolved with Vector-Aware conflict resolution.
    """

    def __init__(self, semantic_knowledge: Dict[str, SemanticMemory], encoder: Any = None):
        self.knowledge = semantic_knowledge
        self.encoder = encoder
        self.similarity_threshold = 0.85

    def find_contradictions(self, new_fact: str) -> List[str]:
        """
        Deep Semantic conflict detection.
        Uses vector similarity first, then falls back to heuristic polarity check.
        """
        conflicts = []
        new_norm = new_fact.lower()

        # 1. Vector-Based Similarity Check
        if self.encoder:
            try:
                # Get existing facts that are semantically 'close'
                existing_facts = list(self.knowledge.values())
                if not existing_facts:
                    return []
                
                new_vec = self.encoder.encode([new_fact])
                ext_vecs = self.encoder.encode([f.fact for f in existing_facts])
                
                from sklearn.metrics.pairwise import cosine_similarity
                similarities = cosine_similarity(new_vec, ext_vecs)[0]
                
                for idx, score in enumerate(similarities):
                    if score > self.similarity_threshold:
                        # High similarity detected. Check for polarity flip.
                        fact = existing_facts[idx]
                        if self._is_polarity_flip(new_norm, fact.fact.lower()):
                            conflicts.append(fact.id)
                            logger.info(f"Vector-Aware Conflict: '{new_fact}' vs '{fact.fact}' [Score: {score:.2f}]")
                
                return conflicts
            except Exception as e:
                logger.error(f"Vector conflict detection failed: {e}. Falling back to heuristics.")

        # 2. Heuristic Fallback
        negations = ["hate", "dislike", "don't like", "not a fan", "stop", "never", "no longer"]
        positives = ["love", "like", "fan", "always", "start", "fond", "now", "enjoy"]

        for existing_fact in self.knowledge.values():
            if existing_fact.is_obsolete or existing_fact.is_locked:
                continue
            ext_norm = existing_fact.fact.lower()
            
            common_words = set(new_norm.split()) & set(ext_norm.split())
            if len(common_words) >= 2:
                if self._is_polarity_flip(new_norm, ext_norm):
                    conflicts.append(existing_fact.id)
                    logger.warning(f"Heuristic conflict detected: '{new_fact}' vs '{existing_fact.fact}'")

        return conflicts

    def _is_polarity_flip(self, fact1: str, fact2: str) -> bool:
        """Determines if two facts have opposing emotional or logical polarity."""
        negations = ["hate", "dislike", "don't like", "not a fan", "stop", "never", "no longer"]
        has_n1 = any(n in fact1 for n in negations)
        has_n2 = any(n in fact2 for n in negations)
        return has_n1 != has_n2

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
