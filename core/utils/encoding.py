import numpy as np
import threading
from typing import List, Optional
from loguru import logger

class SemanticEncoder:
    """
    Centralized high-fidelity encoding substrate.
    Provides vector embeddings for memory indexing and swarm coherence forensics.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(SemanticEncoder, cls).__new__(cls)
                cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized: return
        self._encoder = None
        self._init_encoder()
        self._initialized = True

    def _init_encoder(self):
        try:
            from sentence_transformers import SentenceTransformer
            from core.config.settings import settings
            
            model_name = settings.EMBEDDING_MODEL
            # Weighted toward small footprint + high semantic density (v7.0.0 Multilingual)
            self._encoder = SentenceTransformer(model_name)
            logger.info(f"Semantic Encoder: Substrate online ({model_name}).")
        except ImportError:
            logger.warning("Semantic Encoder: sentence-transformers missing. Falling back to discrete heuristics.")
            self._encoder = None

    def encode(self, texts: List[str]) -> np.ndarray:
        """Generates high-fidelity vector embeddings."""
        if not self._encoder:
            # Fallback embedding (simple count vector or zero vector)
            return np.zeros((len(texts), 384), dtype=np.float32)
            
        try:
            return self._encoder.encode(texts, convert_to_numpy=True).astype(np.float32)
        except Exception as e:
            logger.error(f"Encoding Failure: {e}")
            return np.zeros((len(texts), 384), dtype=np.float32)

    def calculate_coherence(self, texts: List[str]) -> float:
        """
        Calculates semantic coherence (avg cosine similarity) between multiple texts.
        Used for swarm consensus forensics.
        """
        if not texts or len(texts) < 2:
            return 1.0

        embs = self.encode(texts)
        if embs.shape[0] < 2:
            return 1.0

        # Global average cosine similarity
        norm_embs = embs / np.linalg.norm(embs, axis=1, keepdims=True)
        # Calculate pair-wise similarity matrix
        sim_matrix = np.dot(norm_embs, norm_embs.T)
        
        # We only care about the upper triangle (excluding diagonal)
        indices = np.triu_indices(sim_matrix.shape[0], k=1)
        similarities = sim_matrix[indices]
        
        coherence = float(np.mean(similarities))
        return max(0.0, min(1.0, coherence))

# Global accessor
encoder = SemanticEncoder()
