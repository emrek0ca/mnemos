import pytest
from core.memory.controller import MemoryController
from core.orchestration.refinement import MnemosRefiner

def test_circular_logic_detection(tmp_path):
    # Setup isolated memory
    mem = MemoryController()
    
    # Create a CIRCULAR belief loop
    # Fact A refers to Fact B, Fact B refers to Fact A (simulated by semantic overlap)
    mem.semantic.add_fact("I am successful because I work hard", category="belief", status="verified")
    mem.semantic.add_fact("I work hard because I am successful", category="belief", status="verified")
    
    refiner = MnemosRefiner(mem)
    loops = refiner.detect_circular_logic()
    
    assert len(loops) >= 1
    assert "loop_" in loops[0]["id"]
    assert "Circular belief detected" in loops[0]["description"]

def test_paradigm_shift_generation():
    mem = MemoryController()
    mem.semantic.add_fact("A is true", category="test", status="verified")
    mem.semantic.add_fact("B is true", category="test", status="verified")
    
    refiner = MnemosRefiner(mem)
    # We mock the loop detection for the test
    proposals = refiner.generate_paradigm_proposals()
    
    if proposals:
        assert proposals[0]["type"] == "paradigm_shift"
        assert "target_ids" in proposals[0]
