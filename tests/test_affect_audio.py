import pytest
from core.cognition.affect import MnemosAffect
from core.plugins.audio import AudioPerceptionPlugin

def test_affect_valence():
    analyzer = MnemosAffect()
    
    pos = analyzer.analyze_message("This is a wonderful and amazing success!")
    neg = analyzer.analyze_message("This is a terrible and awful failure.")
    neu = analyzer.analyze_message("The chair is near the desk.")
    
    assert pos["valence"] > 0
    assert neg["valence"] < 0
    assert neu["valence"] == 0

def test_affect_arousal():
    analyzer = MnemosAffect()
    
    high = analyzer.analyze_message("WOW!!! DANGER!!! URGENT!!!")
    low = analyzer.analyze_message("Please calm down and relax slowly.")
    
    assert high["arousal"] > low["arousal"]

def test_audio_metadata_extraction(tmp_path):
    # Mock audio file
    audio_file = tmp_path / "voice_note.wav"
    audio_file.write_bytes(os.urandom(1024 * 100)) # 100kb
    
    plugin = AudioPerceptionPlugin()
    raw = plugin.ingest(audio_file)
    
    assert len(raw) == 1
    assert raw[0]["extension"] == ".wav"
    assert raw[0]["size_kb"] > 0
    
    memories = plugin.transform(raw)
    assert len(memories) == 1
    assert "AUDIO SENSORY" in memories[0].content
    assert memories[0].metadata["type"] == "audio"

import os
