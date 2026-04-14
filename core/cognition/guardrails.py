from typing import List, Dict, Any
from loguru import logger

class StyleGuard:
    """
    Cognitive safety layer that prevents stylistic outliers.
    Checks generated responses against the user's historical bounds.
    """

    def __init__(self, baseline_stats: Dict[str, Any]):
        self.stats = baseline_stats
        self.max_emoji_density = (baseline_stats.get("density_emoji", 0.0) * 1.5) + 0.1
        self.max_length_ratio = 2.5 # relative to mean
        
    def validate(self, text: str) -> List[str]:
        """
        Validates text against stylistic norms.
        Returns a list of violation descriptions.
        """
        violations = []
        
        # 1. Emoji Overflow
        import emoji
        count = emoji.emoji_count(text)
        density = count / len(text) if text else 0
        if density > self.max_emoji_density:
            violations.append(f"Emoji density ({density:.2f}) exceeds historical bounds.")
            
        # 2. Length Outlier
        avg_len = self.stats.get("length_mean", 50)
        if len(text) > (avg_len * self.max_length_ratio):
            violations.append(f"Response length ({len(text)}) is significantly longer than user average.")
            
        # 3. Profanity Check (Simple stub for SV Grade Safety)
        bad_words = ["badword1", "badword2"] # Placeholder
        for word in bad_words:
            if word in text.lower():
                violations.append("Potential forbidden pattern detected.")
                
        return violations

    def self_correct(self, text: str) -> str:
        """Attempts to adjust text to fit within bounds."""
        violations = self.validate(text)
        if not violations:
            return text
            
        logger.warning(f"StyleGuard violations detected: {violations}")
        
        # Simple correction heuristics
        import emoji
        # If emoji overflow, strip them
        if any("Emoji density" in v for v in violations):
             text = emoji.replace_emoji(text, replace="")
             
        return text
