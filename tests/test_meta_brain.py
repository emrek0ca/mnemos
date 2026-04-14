import pytest
import os
from core.orchestration.meta import MnemosMetaBrain

def test_meta_brain_hotspot_detection(tmp_path):
    # Setup mock code structure
    code_dir = tmp_path / "core"
    code_dir.mkdir()
    
    # Create a 'stale/complex' file (Large file)
    large_file = code_dir / "complex_module.py"
    with open(large_file, "w") as f:
        f.write("# Small logic\n" * 1000) # Ensure size > 10KB
        
    meta = MnemosMetaBrain(root_dir=str(tmp_path))
    proposals = meta.scan_for_optimization()
    
    # Verify that the complex module was flagged
    assert len(proposals) >= 1
    assert proposals[0]["type"] == "REFACTOR"
    assert "complex_module.py" in proposals[0]["file"]
    assert "Complexity Threshold Exceeded" in proposals[0]["reason"]

def test_meta_brain_integrity_stats():
    meta = MnemosMetaBrain(root_dir=".")
    stats = meta.get_integrity_stats()
    
    assert stats["code_integrity"] > 0.9
    assert stats["module_health"] == "OPTIMAL"
    assert stats["autonomous_readiness"] == "READY"
