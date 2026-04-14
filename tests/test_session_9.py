import pytest
from core.cognition.agent import MnemosAgent
from core.vision.engine import VisionPerceptionEngine

def test_vision_anchor_description():
    engine = VisionPerceptionEngine()
    desc = engine.describe_image({"has_photo": True, "media_type": "scenery"})
    assert "[Visual Perception: scenery]" in desc
    assert "Anchored" in desc

def test_agent_process_with_vision():
    agent = MnemosAgent(model_mode="baseline")
    metadata = {"has_photo": True, "media_type": "cat"}
    # Should not crash and should record influence
    response = agent.process("What do you see?", metadata=metadata)
    assert isinstance(response, str)
    assert "vision_anchor" in agent.last_packet.influence_scores
    assert agent.last_packet.influence_scores["vision_anchor"] > 0

def test_xai_influence_baseline():
    agent = MnemosAgent(model_mode="baseline")
    # Verify that vision anchor gets an influence score
    metadata = {"has_photo": True, "media_type": "scene"}
    agent.process("Show me this", metadata=metadata)
    
    assert "vision_anchor" in agent.last_packet.influence_scores
    # Influence should be high for short input
    assert agent.last_packet.influence_scores["vision_anchor"] == 0.8
