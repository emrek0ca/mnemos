import pytest
import zipfile
from pathlib import Path
from core.orchestration.packer import SoulPacker
from core.cognition.blender import CognitiveBlender

def test_soul_packer_export_import(tmp_path):
    # Setup test workspace
    artifacts_dir = tmp_path / "artifacts"
    artifacts_dir.mkdir()
    (artifacts_dir / "memory").mkdir()
    (artifacts_dir / "training").mkdir()
    
    # Create mock memory files
    epi_path = artifacts_dir / "memory" / "episodic.jsonl"
    epi_path.write_text('{"id": "epi1", "content": "hello"}')
    
    packer = SoulPacker(artifacts_dir=artifacts_dir)
    
    # Export
    archive_path = packer.pack("test_soul")
    assert archive_path.exists()
    assert archive_path.suffix == ".brain"
    
    # Verify content in zip
    with zipfile.ZipFile(archive_path, 'r') as zipf:
        assert "episodic.jsonl" in zipf.namelist()
    
    # Import into a DIFFERENT workspace
    restore_dir = tmp_path / "restored"
    restore_dir.mkdir()
    packer_restore = SoulPacker(artifacts_dir=restore_dir)
    packer_restore.unpack(archive_path)
    
    assert (restore_dir / "memory" / "episodic.jsonl").exists()
    assert (restore_dir / "memory" / "episodic.jsonl").read_text() == '{"id": "epi1", "content": "hello"}'

def test_cognitive_blender_synthesis():
    blender = CognitiveBlender(identity_gravity=0.8)
    
    base = "What is my name?"
    mems = ["Your name is Emre", "You are an engineer"]
    
    prompt = blender.blend_context(base, mems)
    
    assert "Your name is Emre" in prompt
    assert "Weight of Identity Influence: 80.0%" in prompt
    assert "LOGICAL MISSION" in prompt
