import pytest
import time
from datetime import datetime
from core.memory.controller import MemoryController
from core.orchestration.camouflage import MnemosGhostLayer

def test_ephemeral_memory_expiration():
    mem = MemoryController()
    
    # Add a fact with a very short TTL (1 second)
    mem.semantic.add_fact(
        "This message will self-destruct", 
        category="temporary", 
        status="verified"
    )
    # Manually inject TTL for the test (since add_fact doesn't have it yet)
    fact = mem.semantic.lookup("This message will self-destruct")
    fact.ttl_seconds = 1
    fact.created_at = datetime.now()
    
    ghost = MnemosGhostLayer(mem)
    
    # Immediately check: should NOT be expired
    assert "This message will self-destruct" not in ghost.identify_expired_nodes()
    
    # Wait for TTL to pass
    time.sleep(1.5)
    
    # Check again: should BE expired
    expired = ghost.identify_expired_nodes()
    assert fact.id in expired

def test_cognitive_camouflage_deployment():
    mem = MemoryController()
    ghost = MnemosGhostLayer(mem)
    
    # Deploy camouflage
    count = ghost.deploy_camouflage("finance")
    assert count == 3
    
    # Verify decoy nodes have the 'is_decoy' metadata
    decoys = [f for f in mem.semantic.knowledge.values() if f.metadata.get("is_decoy")]
    assert len(decoys) >= 3
    assert all(f.category == "finance" for f in decoys)
