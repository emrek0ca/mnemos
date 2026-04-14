import pytest
from unittest.mock import MagicMock
from core.orchestration.dna import MnemosDNA
from core.orchestration.continuity import MnemosContinuity
from core.memory.models import SemanticMemory, ProceduralMemory

def test_soul_dna_extraction_isolated():
    # Setup Mocks
    mock_mem = MagicMock()
    
    # Mock Semantic knowledge
    mock_fact = SemanticMemory(
        id="sem_1",
        fact="Emre is a Silicon Valley engineer",
        category="identity",
        status="verified"
    )
    mock_mem.semantic.knowledge = {"emre is a silicon valley engineer": mock_fact}
    
    # Mock Procedural patterns
    mock_pattern = ProceduralMemory(
        id="proc_1",
        pattern_name="verbosity",
        description="test",
        parameters={"mode": "laconic"}
    )
    mock_mem.procedural.patterns = [mock_pattern]
    
    dna_engine = MnemosDNA(mock_mem)
    dna = dna_engine.extract_dna()
    
    assert dna["version"] == "3.0.0"
    assert "Emre is a Silicon Valley engineer" in dna["semantic_anchors"]
    assert "verbosity" in dna["stylistic_markers"]
    assert "dna_fingerprint" in dna

def test_continuity_alignment_verification():
    foundation_dna = {
        "semantic_anchors": ["Emre is an engineer", "Mnemos is intelligent"],
        "dna_fingerprint": "abc12345"
    }
    
    continuity = MnemosContinuity(foundation_dna)
    
    # 1. Aligned case (Full Overlap)
    current_dna = {
        "semantic_anchors": ["Emre is an engineer", "Mnemos is intelligent"],
        "dna_fingerprint": "def67890"
    }
    assert continuity.verify_alignment(current_dna) is True
    
    # 2. Drifted case (No overlap)
    drifted_dna = {
        "semantic_anchors": ["Something completely different"],
        "dna_fingerprint": "xyz98765"
    }
    assert continuity.verify_alignment(drifted_dna) is False
