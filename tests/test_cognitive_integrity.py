import pytest
from core.memory.controller import MemoryController
from core.orchestration.integrity import MnemosAuditor

def test_integrity_orphan_detection(tmp_path):
    # Setup isolated memory
    mem = MemoryController()
    
    # Add a normal fact
    mem.semantic.add_fact("User is emre", category="identity", source_ids=["epi1"], status="verified")
    
    # Add an ORPHANED fact (no source, not verified)
    mem.semantic.add_fact("User loves cake", category="preference", source_ids=[], status="pending_review")
    
    auditor = MnemosAuditor(mem)
    report = auditor.perform_scan()
    
    assert report["orphaned_count"] >= 1
    assert report["coherence_score"] < 100.0

def test_integrity_coherence_calculation():
    # Mock memory state
    mem = MemoryController()
    auditor = MnemosAuditor(mem)
    
    # Clean state
    report = auditor.perform_scan()
    assert report["coherence_score"] >= 0.0 # Should be valid number

def test_self_repair_pruning():
    mem = MemoryController()
    # Add an orphan
    mem.semantic.add_fact("Orphaned fact", category="misc", source_ids=[], status="pending_review")
    
    auditor = MnemosAuditor(mem)
    pruned = auditor.prune_orphans()
    
    assert pruned >= 1
