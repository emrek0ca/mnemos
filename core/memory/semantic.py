import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from loguru import logger

from core.memory.models import SemanticMemory
from core.config.settings import settings


class SemanticMemoryController:
    """
    Manages long-term factual knowledge and preferences.
    """

    def __init__(self, storage_path: Optional[Path] = None):
        self.storage_path = storage_path or settings.ARTIFACTS_DIR / "memory" / "semantic.jsonl"
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        self.knowledge: Dict[str, SemanticMemory] = self._load()

    def _load(self) -> Dict[str, SemanticMemory]:
        if not self.storage_path.exists():
            return {}
        
        knowledge = {}
        with open(self.storage_path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    mem = SemanticMemory(**json.loads(line))
                    # Use fact as key for simple deduplication/lookup
                    knowledge[mem.fact.lower()] = mem
                except Exception as e:
                    logger.warning(f"Failed to parse semantic line: {e}")
        return knowledge

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
        self._save()
        logger.info(f"New semantic knowledge added [{category}]: {fact}")

    def _save(self):
        """Persists the complete knowledge base to disk."""
        with open(self.storage_path, "w", encoding="utf-8") as f:
            for mem in self.knowledge.values():
                f.write(json.dumps(mem.model_dump(mode="json"), ensure_ascii=False) + "\n")

    def lookup(self, query: str) -> Optional[SemanticMemory]:
        """Direct lookup of a fact."""
        return self.knowledge.get(query.lower())

    def get_by_category(self, category: str) -> List[SemanticMemory]:
        """Returns all facts in a category."""
        return [m for m in self.knowledge.values() if m.category == category]
