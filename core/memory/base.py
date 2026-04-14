import json
import anyio
from pathlib import Path
from typing import List, Dict, Any, Optional, Type, TypeVar, Generic
from loguru import logger
from pydantic import BaseModel

T = TypeVar('T', bound=BaseModel)

class BaseMemoryController(Generic[T]):
    """
    Unified Base for all Digital Twin memory tiers.
    Provides standardized persistence, logging, and error recovery.
    Now optimized for async high-throughput operations.
    """

    def __init__(self, storage_path: Path, model_class: Type[T]):
        self.storage_path = storage_path
        self.model_class = model_class
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        logger.debug(f"Memory System: Initialized {self.__class__.__name__} -> {self.storage_path.name}")

    # --- Sync Variants (Backward Compatibility) ---

    def _load_jsonl(self) -> List[T]:
        """Generic JSONL loader with corrupt line resilience."""
        if not self.storage_path.exists():
            return []
        
        items = []
        with open(self.storage_path, "r", encoding="utf-8") as f:
            for i, line in enumerate(f, 1):
                try:
                    items.append(self.model_class(**json.loads(line)))
                except Exception as e:
                    logger.warning(f"{self.storage_path.name}: Corrupt line {i} skipped: {e}")
        return items

    def _load_json_dict(self) -> Dict[str, Any]:
        """Generic JSON dict loader."""
        if not self.storage_path.exists():
            return {}
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"{self.storage_path.name}: Failed to load JSON: {e}")
            return {}

    def _append_to_jsonl(self, item: T):
        """Standardized append operation."""
        with open(self.storage_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(item.model_dump(mode="json"), ensure_ascii=False) + "\n")

    def _save_jsonl(self, items: List[T]):
        """Overwrites the JSONL storage with the provided item list."""
        with open(self.storage_path, "w", encoding="utf-8") as f:
            for item in items:
                f.write(json.dumps(item.model_dump(mode="json"), ensure_ascii=False) + "\n")

    def _save_full_json(self, data: Any):
        """Overwrites the full JSON storage."""
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str, ensure_ascii=False)

    # --- Async Variants for Velocity ---

    async def aload_jsonl(self) -> List[T]:
        return await anyio.to_thread.run_sync(self._load_jsonl)

    async def aload_json_dict(self) -> Dict[str, Any]:
        return await anyio.to_thread.run_sync(self._load_json_dict)

    async def aappend_to_jsonl(self, item: T):
        await anyio.to_thread.run_sync(self._append_to_jsonl, item)

    async def asave_jsonl(self, items: List[T]):
        await anyio.to_thread.run_sync(self._save_jsonl, items)

    async def asave_full_json(self, data: Any):
        await anyio.to_thread.run_sync(self._save_full_json, data)
