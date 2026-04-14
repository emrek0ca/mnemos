import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from loguru import logger
from functools import lru_cache

from core.memory.models import SemanticMemory
from core.config.settings import settings
from core.memory.base import BaseMemoryController

class SemanticMemoryController(BaseMemoryController[SemanticMemory]):
    """
    Manages long-term factual knowledge and preferences.
    Refactored to use BaseMemoryController for unified storage logic.
    """

    def __init__(self, storage_path: Optional[Path] = None):
        path = storage_path or settings.ARTIFACTS_DIR / "memory" / "semantic.jsonl"
        super().__init__(path, SemanticMemory)
        self.knowledge: Dict[str, SemanticMemory] = self._load_map()

    def _load_map(self) -> Dict[str, SemanticMemory]:
        """Loads items and indexes them by fact content."""
        items = self._load_jsonl()
        return {m.fact.lower(): m for m in items}

    def add_fact(self, fact: str, category: str, confidence: float = 1.0, source_ids: List[str] = None, status: str = "pending_review", visibility: str = "private", metadata: Dict[str, Any] = None):
        """Records a new semantic fact."""
        memory = SemanticMemory(
            id=f"sem_{hash(fact.lower()) & 0xffffffff}",
            fact=fact,
            category=category,
            confidence=confidence,
            source_episodic_ids=source_ids or [],
            status=status,
            visibility=visibility,
            metadata=metadata or {}
        )
        self.knowledge[fact.lower()] = memory
        self._append_to_jsonl(memory)
        logger.info(f"New semantic knowledge added [{category}]: {fact}")

    def _save(self):
        """Persists the complete knowledge base to disk."""
        self._save_jsonl(list(self.knowledge.values()))

    @lru_cache(maxsize=1024)
    def lookup(self, query: str) -> Optional[SemanticMemory]:
        """Direct lookup of a fact with LRU caching."""
        return self.knowledge.get(query.lower())

    def get_by_category(self, category: str) -> List[SemanticMemory]:
        """Returns all facts in a category."""
        return [m for m in self.knowledge.values() if m.category == category]
