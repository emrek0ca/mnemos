import hashlib
import json
from typing import Dict, Any, List
from loguru import logger
from core.memory.controller import MemoryController

class MnemosDNA:
    """
    High-Density Identity Distiller.
    Extracts the 'Soul DNA'—the most stable stylistic and semantic anchors—for Hive propagation.
    """

    def __init__(self, memory: MemoryController):
        self.memory = memory

    def extract_dna(self) -> Dict[str, Any]:
        """
        Distills the twin's identity into a compact, verifiable descriptor.
        Includes:
        - Top 5 semantic beliefs (anchored).
        - Stylistic variance (parameters).
        - Identity SHA-256 fingerprint.
        """
        logger.info(f"Hive: Extracting Soul DNA from {len(self.memory.semantic.knowledge)} facts...")
        for k, f in self.memory.semantic.knowledge.items():
            logger.info(f" - Fact: '{k}' | Status: '{f.status}'")
        
        # 1. Semantic Anchors (Verified facts)
        verified_facts = [f.fact for f in self.memory.semantic.knowledge.values() 
                         if str(f.status).lower() == "verified"][:5]
        
        # 2. Stylistic Markers (Procedural)
        styles = [p.pattern_name for p in self.memory.procedural.patterns][:3]
        
        dna_content = {
            "version": "3.0.0",
            "semantic_anchors": verified_facts,
            "stylistic_markers": styles,
            "foundation_id": hashlib.sha256(str(verified_facts).encode()).hexdigest()[:16]
        }
        
        # 3. Final DNA Signature
        dna_str = json.dumps(dna_content, sort_keys=True)
        dna_content["dna_fingerprint"] = hashlib.sha256(dna_str.encode()).hexdigest()
        
        logger.success(f"Soul DNA Extracted: Fingerprint {dna_content['dna_fingerprint'][:8]}")
        return dna_content

    def verify_dna_match(self, remote_dna: Dict[str, Any]) -> float:
        """Calculates the alignment between local identity and a remote DNA prop."""
        local_dna = self.extract_dna()
        
        # Simple overlap calculation
        local_anchors = set(local_dna["semantic_anchors"])
        remote_anchors = set(remote_dna.get("semantic_anchors", []))
        
        if not local_anchors: return 1.0
        
        overlap = len(local_anchors & remote_anchors) / len(local_anchors)
        return round(overlap, 2)
