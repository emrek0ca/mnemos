import pytest
from datetime import datetime
from core.training.registry import WeightRegistry, CheckpointMetadata
from core.training.persona_loader import PersonaLoader

def test_weight_registry_persistence(tmp_path):
    registry_file = tmp_path / "registry.json"
    registry = WeightRegistry(registry_path=registry_file)
    
    cp = CheckpointMetadata(
        id="test_persona_v1",
        base_model="llama3",
        lora_r=16,
        lora_alpha=32,
        learning_rate=2e-4,
        epochs_completed=3,
        path="/models/test_v1",
        trained_at=datetime.now()
    )
    
    registry.register_checkpoint(cp)
    assert "test_persona_v1" in registry.checkpoints
    
    # Reload from disk
    new_registry = WeightRegistry(registry_path=registry_file)
    assert "test_persona_v1" in new_registry.checkpoints
    assert new_registry.checkpoints["test_persona_v1"].lora_r == 16

def test_latest_checkpoint_selection(tmp_path):
    registry = WeightRegistry(registry_path=tmp_path / "reg.json")
    cp1 = CheckpointMetadata(id="v1", base_model="b", lora_r=8, lora_alpha=16, learning_rate=1e-4, epochs_completed=1, path="p1", trained_at=datetime(2024, 1, 1))
    cp2 = CheckpointMetadata(id="v2", base_model="b", lora_r=8, lora_alpha=16, learning_rate=1e-4, epochs_completed=1, path="p2", trained_at=datetime(2024, 1, 2))
    
    registry.register_checkpoint(cp1)
    registry.register_checkpoint(cp2)
    
    assert registry.get_latest().id == "v2"

def test_persona_loader_active_logic(tmp_path):
    registry = WeightRegistry(registry_path=tmp_path / "reg.json")
    cp1 = CheckpointMetadata(id="v1", base_model="b", lora_r=8, lora_alpha=16, learning_rate=1e-4, epochs_completed=1, path="p1", is_active=True)
    registry.register_checkpoint(cp1)
    
    loader = PersonaLoader(registry=registry)
    assert loader.get_active_checkpoint().id == "v1"
