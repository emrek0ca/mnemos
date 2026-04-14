"""
Episodic memory controller.

Search strategy (auto-detected at init):
  - sentence-transformers available → cosine similarity on 384-dim embeddings
  - fallback                        → keyword overlap (no extra dependencies)

Embeddings are stored in a companion .npy file next to the JSONL store so
they survive restarts without re-encoding everything on each load.
"""

import json
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from loguru import logger

from core.memory.models import EpisodicMemory
from core.config.settings import settings

# ---------------------------------------------------------------------------
# Embedding backend — imported lazily so the package is optional
# ---------------------------------------------------------------------------

_encoder = None  # SentenceTransformer instance, if available


def _get_encoder():
    global _encoder
    if _encoder is not None:
        return _encoder
    try:
        from sentence_transformers import SentenceTransformer
        _encoder = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Embedding backend: sentence-transformers (all-MiniLM-L6-v2)")
    except ImportError:
        logger.warning(
            "sentence-transformers not installed. Memory search falls back to keyword matching. "
            "Run `uv add sentence-transformers` to enable semantic search."
        )
    return _encoder


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Normalised dot product; both vectors expected to be 1-D."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


# ---------------------------------------------------------------------------
# Controller
# ---------------------------------------------------------------------------

class EpisodicMemoryController:
    """
    Manages chronological conversation episodes.

    Storage layout:
      <storage_path>          — JSONL of EpisodicMemory records
      <storage_path>.emb.npy  — float32 matrix, one row per record (optional)
    """

    def __init__(self, storage_path: Optional[Path] = None):
        self.storage_path = storage_path or settings.ARTIFACTS_DIR / "memory" / "episodic.jsonl"
        self.emb_path = self.storage_path.with_suffix(".jsonl.emb.npy")
        self.index_path = self.storage_path.with_suffix(".jsonl.faiss")
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)

        self.memories: List[EpisodicMemory] = []
        self._embeddings: Optional[np.ndarray] = None  # shape (N, D) or None
        self._index = None # FAISS index

        self._load()
        self._encoder = _get_encoder()
        
        # Build FAISS index if we have embeddings
        if self._embeddings is not None:
             self._rebuild_index()

    def _rebuild_index(self) -> None:
        """Populates the FAISS index with existing embeddings."""
        try:
            import faiss
            d = self._embeddings.shape[1]
            self._index = faiss.IndexFlatL2(d)
            self._index.add(self._embeddings)
            logger.debug(f"FAISS index built with {self._index.ntotal} entries.")
        except Exception as e:
            logger.warning(f"Failed to build FAISS index: {e}")

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def _load(self) -> None:
        if not self.storage_path.exists():
            return

        with open(self.storage_path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    self.memories.append(EpisodicMemory(**json.loads(line)))
                except Exception as e:
                    logger.warning(f"Skipping corrupt memory line: {e}")

        if self.emb_path.exists() and len(self.memories) > 0:
            try:
                loaded = np.load(str(self.emb_path))
                if loaded.shape[0] == len(self.memories):
                    self._embeddings = loaded
                    logger.debug(f"Loaded {len(self.memories)} episodic embeddings.")
                else:
                    logger.warning("Embedding matrix size mismatch.")
                    self._embeddings = None
            except Exception as e:
                logger.warning(f"Could not load embeddings: {e}")

    def _append_to_disk(self, memory: EpisodicMemory) -> None:
        with open(self.storage_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(memory.model_dump(), default=str, ensure_ascii=False) + "\n")

    def _save_embeddings(self) -> None:
        if self._embeddings is not None:
            np.save(str(self.emb_path), self._embeddings)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def add(
        self,
        content: str,
        sender_id: str,
        importance: float = 1.0,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> EpisodicMemory:
        memory = EpisodicMemory(
            id=f"epi_{int(datetime.now().timestamp() * 1000)}",
            content=content,
            sender_id=sender_id,
            importance=importance,
            metadata=metadata or {},
        )
        self.memories.append(memory)
        self._append_to_disk(memory)

        # Encode and append to embedding matrix & FAISS
        if self._encoder is not None:
            vec = self._encoder.encode(content, show_progress_bar=False).astype(np.float32)
            if self._embeddings is None:
                self._embeddings = vec.reshape(1, -1)
            else:
                self._embeddings = np.vstack([self._embeddings, vec])
            
            # Incremental FAISS update
            if self._index is not None:
                self._index.add(vec.reshape(1, -1))
            else:
                self._rebuild_index()
                
            self._save_embeddings()

        logger.info(f"Episodic memory recorded: {memory.id}")
        return memory

    def retrieve_recent(self, limit: int = 10) -> List[EpisodicMemory]:
        return self.memories[-limit:]

    def search(self, query: str, limit: int = 5) -> List[EpisodicMemory]:
        """
        Semantic search if embeddings are available, keyword fallback otherwise.
        Returns up to `limit` memories sorted by relevance descending.
        """
        if not self.memories:
            return []

        if self._encoder is not None and self._embeddings is not None:
            return self._semantic_search(query, limit)

        return self._keyword_search(query, limit)

    # ------------------------------------------------------------------
    # Internal search implementations
    # ------------------------------------------------------------------

    def _semantic_search(self, query: str, limit: int) -> List[EpisodicMemory]:
        query_vec = self._encoder.encode(query, show_progress_bar=False).reshape(1, -1).astype(np.float32)
        
        # Priority 1: FAISS Search (O(log N))
        if self._index is not None:
            distances, indices = self._index.search(query_vec, limit)
            results = []
            for idx in indices[0]:
                if idx != -1 and idx < len(self.memories):
                    results.append(self.memories[idx])
            return results

        # Priority 2: Manual Lineal Scan Fallback (O(N))
        scores: List[Tuple[float, int]] = []
        for i, mem_vec in enumerate(self._embeddings):
            sim = _cosine_similarity(query_vec.flatten(), mem_vec)
            scores.append((sim * self.memories[i].importance, i))

        scores.sort(reverse=True)
        return [self.memories[idx] for _, idx in scores[:limit]]

    def _keyword_search(self, query: str, limit: int) -> List[EpisodicMemory]:
        query_words = set(query.lower().split())
        results: List[Tuple[float, EpisodicMemory]] = []

        for mem in self.memories:
            content_words = set(mem.content.lower().split())
            overlap = len(query_words & content_words)
            if overlap:
                score = overlap * mem.importance
                results.append((score, mem))

        results.sort(key=lambda x: x[0], reverse=True)
        return [mem for _, mem in results[:limit]]
