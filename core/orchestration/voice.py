from typing import Dict, Any
from loguru import logger
from core.cognition.affect import MnemosAffect

class MnemosVoiceSynthesizer:
    """
    Prosody & Affective Speech Mapper.
    Translates 'Affective Pulse' into synthesis parameters for emotionally congruent voice.
    """

    def __init__(self, affect: MnemosAffect):
        self.affect = affect

    def generate_prosody_params(self, text: str) -> Dict[str, Any]:
        """
        Maps current valence/arousal to SSML-like prosody parameters.
        - High Arousal -> Higher Pitch, Faster Rate.
        - Low Valence (Sadness) -> Lower Pitch, Slower Rate.
        """
        pulse = self.affect.get_pulse()
        valence = pulse["valence"]
        arousal = pulse["arousal"]
        
        # Heuristic mapping for emotional speech
        # Pitch: Base 1.0, adjusted by valence/arousal
        pitch = 1.0 + (arousal * 0.2) + (valence * 0.1)
        # Rate: Base 1.0, adjusted by arousal
        rate = 1.0 + (arousal * 0.3)
        # Intensity: Base 1.0, adjusted by arousal
        energy = 1.0 + (arousal * 0.2)
        
        params = {
            "text": text,
            "prosody": {
                "pitch": round(pitch, 2),
                "rate": round(rate, 2),
                "energy": round(energy, 2)
            },
            "emotion_label": self._get_emotional_label(valence, arousal)
        }
        
        logger.info(f"Voice Synthesis: Prosody generated [Emotion: {params['emotion_label']}]")
        return params

    def _get_emotional_label(self, v: float, a: float) -> str:
        if a > 0.5:
            return "EXCITED" if v > 0 else "ANGRY"
        if a < -0.5:
            return "CALM" if v > 0 else "DEPRESSED"
        return "NEUTRAL"
