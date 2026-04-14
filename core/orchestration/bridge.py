from typing import List, Dict, Any
from loguru import logger
from core.memory.controller import MemoryController
from core.memory.models import SemanticMemory

class MnemosBridge:
    """
    Federated Cognitive Exchange Protocol.
    Facilitates secure 'Neural Handshakes' between digital twins.
    """

    def __init__(self, memory: MemoryController):
        self.memory = memory

    def get_public_knowledge_graph(self) -> List[Dict[str, Any]]:
        """Returns all facts marked as 'public' for external retrieval."""
        public_facts = [
            f.model_dump(mode="json")
            for f in self.memory.semantic.knowledge.values()
            if f.visibility == "public" and f.status == "verified"
        ]
        logger.info(f"Bridge: Exporting {len(public_facts)} public facts.")
        return public_facts

    def sync_from_peer(self, peer_facts: List[Dict[str, Any]]) -> int:
        """
        Integrates peer knowledge into the local 'pending_review' queue.
        Implements safety filtering to prevent factual injection attacks.
        """
        imported_count = 0
        for data in peer_facts:
            try:
                # We Force status to 'pending_review' and visibility to 'private' on import
                # Use a temporary model instance to validate peer data
                temp_fact = SemanticMemory(**data)
                
                # Check for existing before adding
                if not self.memory.semantic.lookup(temp_fact.fact):
                    self.memory.semantic.add_fact(
                        fact=temp_fact.fact,
                        category=temp_fact.category,
                        confidence=temp_fact.confidence * 0.8, # Decay confidence of external rumors
                        status="pending_review",
                        visibility="private",
                        metadata={"imported_from_peer": True, "original_id": temp_fact.id}
                    )
                    imported_count += 1
            except Exception as e:
                logger.error(f"Bridge: Import failure for fact: {e}")
                
        logger.success(f"Bridge: Synchronized {imported_count} new perspectives from peer.")
        return imported_count
