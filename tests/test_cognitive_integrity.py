import pytest
from core.memory.controller import MemoryController
from core.memory.refiner import MemoryRefiner
from core.memory.models import SemanticMemory

def test_vector_aware_contradiction(tmp_path):
    # Setup
    knowledge = {}
    # 1. Add foundation belief
    f1 = SemanticMemory(id="sem_1", fact="I love drinking black coffee every morning", category="preference")
    knowledge[f1.fact.lower()] = f1
    
    # Use a dummy encoder that returns high similarity for contradictory statements (mocking behavior)
    class MockEncoder:
        def encode(self, texts, **kwargs):
            import numpy as np
            # Mock high similarity for 'love/hate coffee'
            return np.ones((len(texts), 384))

    refiner = MemoryRefiner(knowledge, encoder=MockEncoder())
    
    # 2. Add contradictory belief
    conflicts = refiner.find_contradictions("I hate drinking black coffee")
    
    assert "sem_1" in conflicts
    print(f"\n[INTEGRITY] Conflict detected correctly: {conflicts}")

def test_cognitive_retirement_lineage(tmp_path):
    artifacts_dir = tmp_path / "artifacts"
    artifacts_dir.mkdir()
    (artifacts_dir / "memory").mkdir()
    
    mem = MemoryController(base_artifacts_dir=artifacts_dir)
    
    # 1. Add original fact
    mem.semantic.add_fact("I live in Berlin", category="location")
    old_fact = mem.semantic.lookup("I live in Berlin")
    old_id = old_fact.id
    
    # 2. Retire and Supersede
    new_id = "sem_new_123"
    mem.semantic.retire_fact(old_id, new_id)
    
    # 3. Verify
    retired_fact = mem.semantic.lookup("I live in Berlin", include_obsolete=True)
    assert retired_fact.is_obsolete is True
    assert retired_fact.metadata["superseded_by"] == new_id
    
    # Verify lookup excludes it by default
    assert mem.semantic.lookup("I live in Berlin") is None
    print("[INTEGRITY] Cognitive retirement and lineage verified.")
