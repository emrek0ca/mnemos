import json
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from loguru import logger

from core.memory.models import EpisodicMemory
from core.config.settings import settings
from core.memory.base import BaseMemoryController

# Lazy encoder loader
_encoder = None

def _get_encoder():
    global _encoder
    if _encoder is not None:
        return _encoder
    try:
        from sentence_transformers import SentenceTransformer
        _encoder = SentenceTransformer("all-MiniLM-L6-v2")
    except ImportError:
        logger.warning("sentence-transformers missing. Falling back to keyword search.")
    return _encoder

class EpisodicMemoryController(BaseMemoryController[EpisodicMemory]):
    """
    Manages chronological conversation episodes with FAISS optimization.
    Refactored to inherit from BaseMemoryController and include automatic reindexing.
    """

    def __init__(self, storage_path: Optional[Path] = None):
        path = storage_path or settings.ARTIFACTS_DIR / "memory" / "episodic.jsonl"
        super().__init__(path, EpisodicMemory)
        self.emb_path = self.storage_path.with_suffix(".jsonl.emb.npy")
        
        self.memories: List[EpisodicMemory] = self._load_jsonl()
        self._embeddings: Optional[np.ndarray] = self._load_embeddings()
        self._index = None # FAISS index
        self._encoder = _get_encoder()

        # Build/Restore Vector State
        if self._embeddings is not None:
            self._rebuild_index()
        elif self.memories and self._encoder:
            # Automatic Reindex Fallback for size mismatch or missing embeddings
            self.reindex()

    def _load_embeddings(self) -> Optional[np.ndarray]:
        if not self.emb_path.exists() or not self.memories:
            return None
        try:
            loaded = np.load(str(self.emb_path))
            if loaded.shape[0] == len(self.memories):
                return loaded
            logger.warning("Embedding matrix size mismatch. Triggering re-index.")
        except Exception as e:
            logger.warning(f"Failed to load embeddings: {e}")
        return None

    def _rebuild_index(self):
        try:
            import faiss
            d = self._embeddings.shape[1]
            self._index = faiss.IndexFlatL2(d)
            self._index.add(self._embeddings)
        except Exception as e:
            logger.error(f"FAISS failed: {e}")

    def reindex(self):
        """Re-encodes all existing memories to restore vector state."""
        if not self.memories or not self._encoder:
            return
        logger.info(f"Re-indexing {len(self.memories)} episodic memories...")
        contents = [m.content for m in self.memories]
        self._embeddings = self._encoder.encode(contents, show_progress_bar=True).astype(np.float32)
        self._save_embeddings()
        self._rebuild_index()
        logger.success("Re-indexing complete.")

    def _save_embeddings(self):
        if self._embeddings is not None:
            np.save(str(self.emb_path), self._embeddings)

    def add(self, content: str, sender_id: str, importance: float = 1.0, metadata: Optional[Dict[str, Any]] = None) -> EpisodicMemory:
        memory = EpisodicMemory(
            id=f"epi_{int(datetime.now().timestamp() * 1000)}",
            content=content,
            sender_id=sender_id,
            importance=importance,
            metadata=metadata or {},
        )
        self.memories.append(memory)
        self._append_to_jsonl(memory)

        if self._encoder:
            vec = self._encoder.encode(content, show_progress_bar=False).astype(np.float32).reshape(1, -1)
            self._embeddings = vec if self._embeddings is None else np.vstack([self._embeddings, vec])
            if self._index:
                self._index.add(vec)
            else:
                self._rebuild_index()
            self._save_embeddings()

        logger.info(f"Episodic memory recorded: {memory.id}")
        return memory

    def retrieve_recent(self, limit: int = 10) -> List[EpisodicMemory]:
        return self.memories[-limit:]

    def search(self, query: str, limit: int = 5) -> List[EpisodicMemory]:
        if not self.memories: return []
        if self._encoder and self._embeddings is not None:
            return self._semantic_search(query, limit)
        return self._keyword_search(query, limit)

    def _semantic_search(self, query: str, limit: int) -> List[EpisodicMemory]:
        query_vec = self._encoder.encode(query, show_progress_bar=False).reshape(1, -1).astype(np.float32)
        if self._index:
            _, indices = self._index.search(query_vec, limit)
            return [self.memories[idx] for idx in indices[0] if idx != -1 and idx < len(self.memories)]
        return [] # Or fallback to keyword

    def _keyword_search(self, query: str, limit: int) -> List[EpisodicMemory]:
        query_words = set(query.lower().split())
        results = []
        for mem in self.memories:
            overlap = len(query_words & set(mem.content.lower().split()))
            if overlap:
                results.append((overlap * mem.importance, m))
        results.sort(key=lambda x: x[0], reverse=True)
        return [mem for _, mem in results[:limit]]
