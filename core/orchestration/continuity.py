from typing import Dict, Any, List
from loguru import logger
from datetime import datetime

class MnemosContinuity:
    """
    Identity Lineage Tracker.
    Ensures 'True Self' consistency as the twin propagates across the Hive.
    """

    def __init__(self, foundation_dna: Dict[str, Any]):
        self.foundation_dna = foundation_dna
        self._lineage_cache: List[Dict[str, Any]] = []

    def record_evolution_step(self, step_type: str, delta_summary: str):
        """Records a cognitive evolution event in the local lineage log."""
        step = {
            "timestamp": datetime.now().isoformat(),
            "type": step_type,
            "delta": delta_summary,
            "foundation_hash": self.foundation_dna.get("dna_fingerprint", "NONE")[:8]
        }
        self._lineage_cache.append(step)
        logger.info(f"Continuity: Evolution step recorded [{step_type}]")

    def verify_alignment(self, current_dna: Dict[str, Any]) -> bool:
        """
        Verifies if the current state is still aligned with the Foundation.
        If the semantic anchors have drifted too far, the continuity is broken.
        """
        local_anchors = set(self.foundation_dna.get("semantic_anchors", []))
        remote_anchors = set(current_dna.get("semantic_anchors", []))
        
        if not local_anchors: return True
        
        overlap_ratio = len(local_anchors & remote_anchors) / len(local_anchors)
        is_aligned = overlap_ratio >= 0.6 # High threshold for continuity
        
        if not is_aligned:
            logger.warning(f"Continuity Warning: Identity drift detected! Alignment {overlap_ratio * 100}%")
        else:
            logger.success(f"Continuity Verified: Alignment {overlap_ratio * 100}%")
            
        return is_aligned
