import pytest
from core.memory.models import SemanticMemory
from core.memory.semantic import SemanticMemoryController

def test_semantic_feedback_lifecycle(tmp_path):
    storage = tmp_path / "semantic.jsonl"
    controller = SemanticMemoryController(storage_path=storage)
    
    # Add a pending fact
    controller.add_fact("User loves coffee", category="preference", confidence=0.9, source_ids=["epi1"])
    fact = controller.lookup("User loves coffee")
    assert fact.status == "pending_review"
    
    # Verify fact
    fact.status = "verified"
    controller._save() 
    
    # Reload and check
    new_controller = SemanticMemoryController(storage_path=storage)
    assert new_controller.lookup("User loves coffee").status == "verified"

def test_semantic_correction(tmp_path):
    storage = tmp_path / "semantic.jsonl"
    controller = SemanticMemoryController(storage_path=storage)
    
    controller.add_fact("User lives in Paris", category="location", confidence=1.0, source_ids=["epi2"])
    fact = controller.lookup("User lives in Paris")
    
    # Correct fact
    fact.fact = "User lives in London"
    fact.status = "verified"
    controller._save()
    
    # Reload and check
    new_controller = SemanticMemoryController(storage_path=storage)
    # Note: lookup uses the text as key, so we need to find the correct id or check all values
    corrected = list(new_controller.knowledge.values())[0]
    assert corrected.fact == "User lives in London"
    assert corrected.status == "verified"
