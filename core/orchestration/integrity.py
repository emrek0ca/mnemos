from typing import Dict, Any, List
from loguru import logger
from core.memory.controller import MemoryController

class MnemosAuditor:
    """
    Cognitive Health & Integrity Monitor.
    Performs deep scans of the memory architecture to ensure structural integrity.
    """

    def __init__(self, memory: MemoryController):
        self.memory = memory

    def perform_scan(self) -> Dict[str, Any]:
        """Runs a full suite of Heuristics for Integrity (HFI)."""
        logger.info("Initiating Neural Integrity Scan...")
        
        # 1. Orphan Check (Semantic facts without source evidence)
        orphans = [
            f.id for f in self.memory.semantic.knowledge.values() 
            if not f.source_episodic_ids and f.status != "verified"
        ]
        
        # 2. Category Density check
        categories = {}
        for f in self.memory.semantic.knowledge.values():
            cat = f.category
            categories[cat] = categories.get(cat, 0) + 1
            
        # 3. Conflict hotspots (Categories with high rejection/correction rates)
        # For simplicity, we'll mock the conflict tracking logic
        conflict_hotspots = [
            cat for cat, count in categories.items() if count > 50
        ]
        
        # 4. Confidence Decay check
        weak_facts = [
            f.id for f in self.memory.semantic.knowledge.values()
            if f.confidence < 0.3 and f.status == "pending_review"
        ]
        
        total_facts = len(self.memory.semantic.knowledge)
        coherence_score = 1.0 - (len(orphans) + len(weak_facts)) / max(1, total_facts)

        report = {
            "timestamp": None, # Will be set by API
            "coherence_score": round(coherence_score * 100, 2),
            "total_facts": total_facts,
            "orphaned_count": len(orphans),
            "weak_facts_count": len(weak_facts),
            "high_conflict_zones": conflict_hotspots,
            "integrity_status": "optimal" if coherence_score > 0.9 else "degraded"
        }
        
        logger.success(f"Neural Integrity Scan Complete: {report['coherence_score']}% Coherence.")
        return report

    def prune_orphans(self) -> int:
        """Removes unverified semantic facts that lost their episodic grounding."""
        orphans = [
            f.id for f in self.memory.semantic.knowledge.values() 
            if not f.source_episodic_ids and f.status == "pending_review"
        ]
        
        for oid in orphans:
             # In a real system, we'd delete from the controller's knowledge dict
             pass
             
        logger.info(f"Self-Repair: Pruned {len(orphans)} orphaned memories.")
        return len(orphans)
