import pytest
import shutil
from pathlib import Path
from core.memory.controller import MemoryController
from core.orchestration.fork import MnemosForkManager

def test_mnemonic_fork_isolation(tmp_path):
    # Setup base artifacts
    base_dir = tmp_path / "main_brain"
    base_dir.mkdir()
    (base_dir / "memory").mkdir()
    
    # Add a fact to 'True Self'
    mem_main = MemoryController(fork_id=None, base_artifacts_dir=base_dir)
    mem_main.semantic.add_fact("I am the original", category="identity", status="verified")
    
    # Create a fork 'sim1'
    manager = MnemosForkManager(base_artifacts_dir=base_dir)
    manager.create_fork("sim1", inherit=True)
    
    # Initialize controller for fork
    mem_fork = MemoryController(fork_id="sim1", base_artifacts_dir=base_dir)
    
    # Add a fact in fork
    mem_fork.semantic.add_fact("I am a divergent path", category="identity", status="verified")
    
    # Verify fork has BOTH
    assert mem_fork.semantic.lookup("I am the original") is not None
    assert mem_fork.semantic.lookup("I am a divergent path") is not None
    
    # Verify main ONLY has original
    mem_main_check = MemoryController(fork_id=None, base_artifacts_dir=base_dir)
    assert mem_main_check.semantic.lookup("I am the original") is not None
    assert mem_main_check.semantic.lookup("I am a divergent path") is None

def test_fork_listing(tmp_path):
    manager = MnemosForkManager(base_artifacts_dir=tmp_path)
    manager.create_fork("fork1")
    manager.create_fork("fork2")
    
    forks = manager.list_forks()
    assert "fork1" in forks
    assert "fork2" in forks
    assert len(forks) == 2
