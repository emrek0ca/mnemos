import pytest
from core.memory.refiner import MemoryRefiner
from core.memory.models import SemanticMemory
from datetime import datetime

def test_contradiction_detection():
    # Initial knowledge: "I love coffee"
    init_mem = SemanticMemory(
        id="sem_1", 
        fact="I love coffee", 
        category="preference", 
        created_at=datetime.now()
    )
    knowledge = {"i love coffee": init_mem}
    
    refiner = MemoryRefiner(knowledge)
    
    # New fact: "I hate coffee"
    conflicts = refiner.find_contradictions("I hate coffee")
    assert "sem_1" in conflicts

def test_no_contradiction_on_different_topic():
    init_mem = SemanticMemory(
        id="sem_1", 
        fact="I love coffee", 
        category="preference", 
        created_at=datetime.now()
    )
    knowledge = {"i love coffee": init_mem}
    refiner = MemoryRefiner(knowledge)
    
    # New fact: "I love tea" (No conflict)
    conflicts = refiner.find_contradictions("I love tea")
    assert len(conflicts) == 0

def test_refine_batch_merging():
    m1 = SemanticMemory(id="s1", fact="Testing", category="test", confidence=0.5)
    m2 = SemanticMemory(id="s2", fact="Testing", category="test", confidence=0.5)
    refiner = MemoryRefiner({})
    
    refined = refiner.refine_batch([m1, m2])
    assert len(refined) == 1
    assert refined[0].confidence > 0.5
