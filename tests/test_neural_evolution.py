import pytest
import json
from pathlib import Path
from core.memory.controller import MemoryController
from core.training.registry import WeightRegistry
from core.orchestration.evolution import MnemosEvolver
from core.training.factory import SyntheticDatasetFactory

def test_evolution_alignment_calculation(tmp_path):
    # Setup test workspace
    artifacts_dir = tmp_path / "artifacts"
    artifacts_dir.mkdir()
    (artifacts_dir / "memory").mkdir()
    (artifacts_dir / "training").mkdir()
    
    mem = MemoryController(base_artifacts_dir=artifacts_dir)
    registry = WeightRegistry(registry_path=artifacts_dir / "training" / "model_registry.json")
    
    # 1. No active checkpoint -> low or 0 score
    evolver = MnemosEvolver(mem, registry)
    assert evolver.calculate_alignment_score() == 0.0
    
    # 2. Add an active checkpoint
    from core.training.registry import CheckpointMetadata
    cp = CheckpointMetadata(
        id="cp_test", base_model="llama-7b", lora_r=8, lora_alpha=16, 
        learning_rate=1e-4, epochs_completed=1, path="weights/cp_test", is_active=True,
        trained_at=datetime(2020, 1, 1) # Old training date
    )
    registry.register_checkpoint(cp)
    
    # 3. Add 50 new verified facts (Should drop alignment by 2%)
    for i in range(50):
        mem.semantic.add_fact(f"Test fact {i}", category="meta", status="verified")
    
    score = evolver.calculate_alignment_score()
    # Base 95 - (50/50 * 2) = 93.0
    assert score == 93.0

def test_dataset_factory_curation(tmp_path):
    artifacts_dir = tmp_path / "artifacts"
    artifacts_dir.mkdir()
    (artifacts_dir / "memory").mkdir()
    (artifacts_dir / "training").mkdir()
    
    mem = MemoryController(base_artifacts_dir=artifacts_dir)
    
    # Add an episode and a fact
    mem.episodic.add("Test episode content", sender_id="user", importance=0.9)
    mem.semantic.add_fact("Test fact content", category="identity", status="verified")
    
    factory = SyntheticDatasetFactory(mem)
    factory.output_dir = artifacts_dir / "training" # Redirect for test
    
    dataset_path = factory.curate_evolution_dataset("test_evolution.jsonl")
    
    assert dataset_path.exists()
    with open(dataset_path, "r") as f:
        lines = f.readlines()
        assert len(lines) >= 2
        
        first = json.loads(lines[0])
        assert "Test episode content" in first["output"]
        
        second = json.loads(lines[1])
        assert "Test fact content" in second["output"]
