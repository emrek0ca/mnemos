import pytest
from core.memory.visual import VisualMemoryController
from core.orchestration.voice import MnemosVoiceSynthesizer
from core.cognition.affect import MnemosAffect

def test_visual_anchor_registration(tmp_path):
    storage = tmp_path / "visual.json"
    cortex = VisualMemoryController(storage_path=storage)
    
    # Register a photographic memory
    anchor = cortex.register_anchor(
        path="/path/to/memory.jpg",
        episode_id="epi_123",
        description="A sunset in San Francisco"
    )
    
    assert anchor.id.startswith("vis_")
    assert anchor.episode_id == "epi_123"
    
    # Verify retrieval (flashback)
    flashbacks = cortex.get_flashback("epi_123")
    assert len(flashbacks) == 1
    assert flashbacks[0].path == "/path/to/memory.jpg"

def test_voice_prosody_mapping():
    affect = MnemosAffect()
    voice = MnemosVoiceSynthesizer(affect)
    
    # Case 1: NEUTRAL
    affect.valence = 0.0
    affect.arousal = 0.0
    params = voice.generate_prosody_params("Hello")
    assert params["emotion_label"] == "NEUTRAL"
    assert params["prosody"]["pitch"] == 1.0
    
    # Case 2: EXCITED (High Valence, High Arousal)
    affect.valence = 0.8
    affect.arousal = 0.8
    params = voice.generate_prosody_params("Wow!")
    assert params["emotion_label"] == "EXCITED"
    assert params["prosody"]["pitch"] > 1.0
    assert params["prosody"]["rate"] > 1.0
    
    # Case 3: DEPRESSED (Low Valence, Low Arousal)
    affect.valence = -0.8
    affect.arousal = -0.8
    params = voice.generate_prosody_params("I am sad.")
    assert params["emotion_label"] == "DEPRESSED"
    assert params["prosody"]["pitch"] < 1.0
    assert params["prosody"]["rate"] < 1.0
