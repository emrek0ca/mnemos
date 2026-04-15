import re
from typing import Dict, Any, List
from loguru import logger

class MnemosAffect:
    """
    Cognitive layer for detecting emotional markers and affective signals.
    Analyzes Valence (Sentiment Polarity) and Arousal (Emotional Intensity).
    """

    def __init__(self):
        self.valence = 0.0
        self.arousal = 0.0
        self.density = 0.0

    def get_pulse(self) -> Dict[str, float]:
        """Returns the current real-time aggregate pulse of the twin."""
        return {
            "valence": self.valence,
            "arousal": self.arousal,
            "density": self.density
        }

    # Heuristic Signal Lexicon
    SIG_VALENCE_POS = {"happy", "love", "great", "excellent", "good", "amazing", "wonderful", "success", "joy"}
    SIG_VALENCE_NEG = {"sad", "hate", "terrible", "bad", "awful", "failure", "angry", "upset", "unhappy"}
    
    SIG_AROUSAL_HIGH = {"wow", "urgent", "extreme", "fire", "danger", "immediately", "quick", "very", "!!!"}
    SIG_AROUSAL_LOW = {"calm", "relax", "maybe", "perhaps", "slow", "quiet", "easy"}

    def decay(self, factor: float = 0.15):
        """Slowly moves the affective state towards neutral homeostatis (0,0)."""
        eps = 0.01
        
        if abs(self.valence) > eps:
            self.valence -= (self.valence * factor)
        else:
            self.valence = 0.0
            
        if abs(self.arousal) > eps:
            self.arousal -= (self.arousal * factor)
        else:
            self.arousal = 0.0
            
        logger.debug(f"Affective Decay complete: [V: {self.valence:.2f}, A: {self.arousal:.2f}]")

    def analyze_message(self, text: str) -> Dict[str, float]:
        """
        Analyzes a single message and returns DVA scores.
        DVA: Dominance, Valence, Arousal
        Scale: -1.0 to 1.0 (with 0.0 being neutral)
        """
        norm = text.lower()
        words = set(re.findall(r'\w+', norm))
        
        # Calculate Valence
        v_pos = len(words & self.SIG_VALENCE_POS)
        v_neg = len(words & self.SIG_VALENCE_NEG)
        valence = (v_pos - v_neg) / (max(1, len(words & (self.SIG_VALENCE_POS | self.SIG_VALENCE_NEG)))) if (v_pos or v_neg) else 0.0
        
        # Calculate Arousal
        a_high = len(words & self.SIG_AROUSAL_HIGH)
        a_low = len(words & self.SIG_AROUSAL_LOW)
        # Factor in punctuation (Exclamation Marks increase arousal)
        punc_boost = 0.2 if "!" in text else 0.0
        arousal = ((a_high - a_low) / (max(1, len(words & (self.SIG_AROUSAL_HIGH | self.SIG_AROUSAL_LOW)))) if (a_high or a_low) else 0.0) + punc_boost
        
        # Factor in Emojis (Expressiveness)
        import emoji
        emoji_count = emoji.emoji_count(text)
        arousal = min(1.0, arousal + (emoji_count * 0.1))
        
        scores = {
            "valence": round(max(-1.0, min(1.0, valence)), 2),
            "arousal": round(max(-1.0, min(1.0, arousal)), 2),
            "emotional_density": round(min(1.0, (v_pos + v_neg + a_high + a_low + emoji_count) / max(1, len(words))), 2)
        }
        
        logger.debug(f"Affective Pulse Analysed: {scores}")
        return scores

    def analyze_image_pulse(self, visual_description: str) -> Dict[str, float]:
        """
        Analyzes the emotional resonance of a visual description.
        DVA: Dominance, Valence, Arousal
        """
        norm = visual_description.lower()
        words = set(re.findall(r'\w+', norm))
        
        # Extended Visual Sentiment Lexicon
        V_POS = self.SIG_VALENCE_POS | {"bright", "sunny", "vibrant", "orderly", "clean", "beautiful"}
        V_NEG = self.SIG_VALENCE_NEG | {"dark", "gloomy", "chaotic", "messy", "broken", "ugly", "scary"}
        A_HIGH = self.SIG_AROUSAL_HIGH | {"sharp", "intense", "active", "dynamic", "noisy", "fast"}
        A_LOW = self.SIG_AROUSAL_LOW | {"soft", "blurry", "static", "peaceful", "empty"}

        v_pos = len(words & V_POS)
        v_neg = len(words & V_NEG)
        valence = (v_pos - v_neg) / (max(1, len(words & (V_POS | V_NEG)))) if (v_pos or v_neg) else 0.0
        
        a_high = len(words & A_HIGH)
        a_low = len(words & A_LOW)
        arousal = (a_high - a_low) / (max(1, len(words & (A_HIGH | A_LOW)))) if (a_high or a_low) else 0.0

        scores = {
            "valence": round(max(-1.0, min(1.0, valence)), 2),
            "arousal": round(max(-1.0, min(1.0, arousal)), 2),
            "emotional_density": round((v_pos + v_neg + a_high + a_low) / max(1, len(words)), 2)
        }
        
        logger.debug(f"Visual Affect Analysed: {scores}")
        return scores

    def get_aggregate_pulse(self, texts: List[str]) -> Dict[str, float]:
        """Calculates the average pulse across a batch of messages."""
        if not texts:
            return {"valence": 0.0, "arousal": 0.0, "density": 0.0}
            
        pulses = [self.analyze_message(t) for t in texts]
        return {
            "valence": round(sum(p["valence"] for p in pulses) / len(pulses), 2),
            "arousal": round(sum(p["arousal"] for p in pulses) / len(pulses), 2),
            "density": round(sum(p["emotional_density"] for p in pulses) / len(pulses), 2)
        }
