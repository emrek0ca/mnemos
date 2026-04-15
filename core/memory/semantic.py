import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from loguru import logger
from functools import lru_cache
import anyio

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
        """Loads items and indexes them by fact content. Filters for WARM items only."""
        items = self._load_jsonl()
        return {m.fact.lower(): m for m in items if m.metabolic_tier == "warm"}

    def add_fact(self, fact: str, category: str, confidence: float = 1.0, source_ids: List[str] = None, status: str = "pending_review", visibility: str = "private", metadata: Dict[str, Any] = None, supersedes_id: Optional[str] = None, is_locked: bool = False):
        """Records a new semantic fact, always initialized in the WARM tier."""
        memory = SemanticMemory(
            id=f"sem_{hash(fact.lower()) & 0xffffffff}",
            fact=fact,
            category=category,
            confidence=confidence,
            source_episodic_ids=source_ids or [],
            status=status,
            visibility=visibility,
            supersedes_id=supersedes_id,
            is_locked=is_locked,
            metabolic_tier="warm",
            metadata=metadata or {}
        )
        self.knowledge[fact.lower()] = memory
        self._append_to_jsonl(memory)
        self.lookup.cache_clear()
        logger.info(f"New semantic knowledge added [{category}]: {fact}")

    def archive_stale_facts(self, threshold_days: int = 7, min_access: int = 5):
        """Moves stale, unlocked facts to the COLD tier to reduce RAM footprint."""
        from datetime import datetime, timedelta
        cutoff = datetime.now() - timedelta(days=threshold_days)
        archived_count = 0
        
        # We need to iterate over all items in the JSONL store (since self.knowledge only has warm)
        all_items = self._load_jsonl()
        for item in all_items:
            if item.metabolic_tier == "cold" or item.is_locked:
                continue
            
            last_access = datetime.fromisoformat(item.access_metrics["last_access"])
            if last_access < cutoff and item.access_metrics["count"] < min_access:
                item.metabolic_tier = "cold"
                archived_count += 1
                if item.fact.lower() in self.knowledge:
                    del self.knowledge[item.fact.lower()]
                    
        if archived_count > 0:
            self._save_jsonl(all_items)
            self.lookup.cache_clear()
            logger.warning(f"Metabolic Archival: {archived_count} facts moved to COLD tier.")
        return archived_count

    def lookup(self, query: str, include_obsolete: bool = False) -> Optional[SemanticMemory]:
        """High-performance lookup with metabolic thawing."""
        fact = self.knowledge.get(query.lower())
        
        if not fact:
            # Check the full JSONL store for COLD facts (thawing)
            all_items = self._load_jsonl()
            fact = next((m for m in all_items if m.fact.lower() == query.lower()), None)
            if fact:
                # Metabolic Thaw
                fact.metabolic_tier = "warm"
                self.knowledge[fact.fact.lower()] = fact
                self._save_jsonl(all_items)
                logger.info(f"Metabolic Thaw: Fact '{fact.id}' returned to WARM tier.")
        
        if fact:
            if not include_obsolete and fact.is_obsolete:
                return None
            # Update Access Metrics
            fact.access_metrics["count"] += 1
            fact.access_metrics["last_access"] = datetime.now().isoformat()
            # Note: We don't save on every lookup for performance, but the count in RAM is updated.
            # Archival task will persist these metrics.

        return fact

    def get_by_category(self, category: str) -> List[SemanticMemory]:
        """Returns all facts in a category (warm only)."""
        return [m for m in self.knowledge.values() if m.category == category]
