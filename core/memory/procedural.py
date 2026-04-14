import json
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from loguru import logger

from core.memory.models import ProceduralMemory
from core.config.settings import settings

class ProceduralMemoryController:
    """
    Tracks and encodes stylistic habits and behavioral routines.
    (e.g., preference for short answers, emoji frequency, specific jargon).
    """

    def __init__(self, storage_path: Optional[Path] = None):
        self.storage_path = storage_path or settings.ARTIFACTS_DIR / "memory" / "procedural.jsonl"
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        self.patterns: List[ProceduralMemory] = []
        self._load()

    def _load(self):
        if not self.storage_path.exists():
            return
        with open(self.storage_path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    self.patterns.append(ProceduralMemory(**json.loads(line)))
                except Exception as e:
                    logger.warning(f"Corrupt procedural memory line: {e}")

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
        with open(self.storage_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(pattern.model_dump(), default=str, ensure_ascii=False) + "\n")
        logger.info(f"Procedural habit recorded: {pattern_name}")

    def get_stylistic_profile(self) -> Dict[str, Any]:
        """Summarizes all known habits into a single profile for the LLM."""
        profile = {}
        for p in self.patterns:
            # We take the most recent parameters for each pattern type
            profile[p.pattern_name] = p.parameters
        return profile

    def analyze_recent_batch(self, texts: List[str]):
        """Automated heuristic analysis to detect habits without an LLM."""
        if not texts:
            return
            
        import emoji
        avg_len = np.mean([len(t) for t in texts])
        emoji_count = np.mean([emoji.emoji_count(t) for t in texts])
        
        # Simple thresholding to detect 'Preference' habits
        if avg_len < 30:
            self.capture_habit("verbosity", "Prefers concise, short responses.", {"mode": "laconic", "avg_chars": avg_len})
        elif avg_len > 150:
            self.capture_habit("verbosity", "Prefers verbose, detailed responses.", {"mode": "elaborate", "avg_chars": avg_len})
            
        if emoji_count > 0.5:
            self.capture_habit("expressiveness", "High emoji usage in communication.", {"emoji_level": "high", "avg_per_msg": emoji_count})
        elif emoji_count < 0.05:
            self.capture_habit("expressiveness", "Very low to zero emoji usage.", {"emoji_level": "null", "avg_per_msg": emoji_count})
