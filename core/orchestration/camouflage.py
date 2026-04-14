from typing import List, Dict, Any
from loguru import logger
from datetime import datetime
from core.memory.controller import MemoryController
from core.memory.models import SemanticMemory

class MnemosGhostLayer:
    """
    Cognitive Camouflage & Forensic Obfuscation.
    Protects the digital twin's true beliefs through 'Ghost Nodes' and decoys.
    """

    def __init__(self, memory: MemoryController):
        self.memory = memory

    def deploy_camouflage(self, target_category: str) -> int:
        """
        Generates plausible but false 'Decoy Facts' for a specific category.
        Used to dilute sensitive clusters with noise.
        """
        logger.warning(f"Obfuscation: Deploying cognitive camouflage for '{target_category}'")
        
        # In a real system, we'd use the LLM to generate '反 (Antithesis)' facts
        decoys = [
            f"Mock Decoy for {target_category} #{i}"
            for i in range(3)
        ]
        
        for d in decoys:
            self.memory.semantic.add_fact(
                fact=d,
                category=target_category,
                confidence=0.5,
                status="verified",
                visibility="public",
                # We need to ensure we can pass is_decoy if our controller supports it
                # For Session 25, we'll use metadata as a carrier
                metadata={"is_decoy": True} 
            )
            
        return len(decoys)

    def identify_expired_nodes(self) -> List[str]:
        """Identifies any episodic or semantic node that has exceeded its TTL."""
        expired_ids = []
        now = datetime.now()
        
        # Check episodic
        for m in self.memory.episodic.memories:
            if m.ttl_seconds and (now - m.created_at).total_seconds() > m.ttl_seconds:
                expired_ids.append(m.id)
                
        # Check semantic
        for f in self.memory.semantic.knowledge.values():
            if f.ttl_seconds and (now - f.created_at).total_seconds() > f.ttl_seconds:
                expired_ids.append(f.id)
                
        return expired_ids
