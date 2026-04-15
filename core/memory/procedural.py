import json
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from loguru import logger

from core.memory.models import ProceduralMemory, BehavioralDNA
from core.config.settings import settings
from core.memory.base import BaseMemoryController

class ProceduralMemoryController(BaseMemoryController[ProceduralMemory]):
    """
    Tracks and encodes stylistic habits and behavioral routines.
    Refactored to use BaseMemoryController.
    """

    def __init__(self, storage_path: Optional[Path] = None):
        path = storage_path or settings.ARTIFACTS_DIR / "memory" / "procedural.jsonl"
        super().__init__(path, ProceduralMemory)
        self.patterns: List[ProceduralMemory] = self._load_jsonl()
        self.dna_path = self.path.parent / "behavioral_dna.json"
        self.dna = self._load_dna()

    def _load_dna(self) -> BehavioralDNA:
        if self.dna_path.exists():
            try:
                with open(self.dna_path, "r") as f:
                    data = json.load(f)
                    return BehavioralDNA(**data)
            except Exception as e:
                logger.error(f"Failed to load DNA: {e}")
        return BehavioralDNA()

    def save_dna(self):
        """Persists the synthesized identity markers."""
        try:
            with open(self.dna_path, "w") as f:
                f.write(self.dna.model_dump_json(indent=2))
        except Exception as e:
            logger.error(f"Failed to save DNA: {e}")

    def capture_habit(self, pattern_name: str, description: str, parameters: Dict[str, Any]):
        """Records a detected stylistic habit."""
        pattern = ProceduralMemory(
            id=f"proc_{int(datetime.now().timestamp() * 1000)}",
            pattern_name=pattern_name,
            description=description,
            parameters=parameters,
            importance=0.8
        )
        self.patterns.append(pattern)
        self._append_to_jsonl(pattern)
        logger.info(f"Procedural habit recorded: {pattern_name}")

    def get_stylistic_profile(self) -> Dict[str, Any]:
        """Summarizes all known habits and the current Behavioral DNA."""
        profile = {
            "dna": self.dna.model_dump(),
            "habits": {}
        }
        for p in self.patterns:
            profile["habits"][p.pattern_name] = p.parameters
        return profile

    def analyze_recent_batch(self, texts: List[str]):
        """
        Forensic Stylistic Diagnostics (v5.2.0).
        Uses StyleFidelityMetrics to detect complex linguistic habits.
        """
        if not texts or len(texts) < 3:
            return
            
        from core.evaluation.metrics import StyleFidelityMetrics
        metrics = StyleFidelityMetrics().get_stats(texts)
        
        # 1. Lexical Sophistication (Diversity & Complexity)
        diversity = metrics.get("lexical_diversity", 0.0)
        word_count = metrics.get("avg_word_count", 0.0)
        
        if diversity > 0.8 and word_count > 6:
            self.capture_habit("Lexical Sophistication", "Uses a highly diverse and complex vocabulary.", {"diversity": diversity, "avg_word_len": word_count})
        elif diversity < 0.4:
            self.capture_habit("Lexical Simplicity", "Prefers direct, repetitive, and simple language.", {"diversity": diversity})

        # 2. Syntactic Habitualization (Punctuation)
        ellipsis = metrics.get("density_ellipsis", 0.0)
        exclamation = metrics.get("density_exclamation", 0.0)
        
        if ellipsis > 0.5:
            self.capture_habit("Elliptical Reasoning", "Frequently uses pauses (...) for reflective or trailing thoughts.", {"density": ellipsis})
        if exclamation > 0.5:
            self.capture_habit("Exclamatory Intensity", "Employs high-energy, emphatic punctuation.", {"density": exclamation})

        # 3. Verbosity Habit (Length)
        avg_len = metrics.get("length_mean", 0.0)
        if avg_len < 30:
            self.capture_habit("Verbosity", "Prefers concise, short responses.", {"mode": "laconic", "avg_chars": avg_len})
        elif avg_len > 180:
            self.capture_habit("Verbosity", "Prefers verbose, detailed responses.", {"mode": "elaborate", "avg_chars": avg_len})
            
        # 4. Expressive Habits (Emojis)
        emoji_count = metrics.get("density_emoji", 0.0)
        if emoji_count > 0.5:
            self.capture_habit("Expressiveness", "High emoji usage in communication.", {"emoji_level": "high", "avg_per_msg": emoji_count})
        elif emoji_count < 0.05:
            self.capture_habit("Expressiveness", "Zero to minimal emoji usage.", {"emoji_level": "null", "avg_per_msg": emoji_count})
            
        # 5. Bilingual Fluidity (v7.0.0)
        self._detect_bilingual_patterns(texts)
            
        logger.info(f"Procedural: Granular lexical analysis complete (v7.0.0).")

    def _detect_bilingual_patterns(self, texts: List[str]):
        """Detects Turkish/English code-switching behaviors."""
        # Simple anchor set for detection (v7.0.0)
        turkish_anchors = {"ve", "ama", "bir", "bu", "nasılsın", "teşekkür", "evet", "hayır", "için"}
        english_anchors = {"and", "but", "the", "a", "how", "thanks", "yes", "no", "for", "with"}
        
        switched_count = 0
        for text in texts:
            words = set(text.lower().split())
            has_tr = bool(words & turkish_anchors)
            has_en = bool(words & english_anchors)
            
            if has_tr and has_en:
                switched_count += 1
                
        if switched_count >= 1:
            ratio = switched_count / len(texts)
            self.capture_habit("Bilingual Fluidity", "Frequently mixes Turkish and English in a single turn.", 
                               {"code_switch_ratio": ratio, "style": "mixed-polyglot"})
