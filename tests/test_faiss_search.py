import pytest
import numpy as np
from core.memory.episodic import EpisodicMemoryController

def test_faiss_initialization(tmp_path):
    storage = tmp_path / "epi.jsonl"
    controller = EpisodicMemoryController(storage_path=storage)
    controller.add("A beautiful day in the valley", sender_id="user")
    assert controller._index is not None
    assert controller._index.ntotal > 0

def test_faiss_search_accuracy(tmp_path):
    storage = tmp_path / "epi.jsonl"
    controller = EpisodicMemoryController(storage_path=storage)
    controller.add("The quick brown fox jumps over the lazy dog", sender_id="user")
    controller.add("Silicon Valley engineering standards", sender_id="user")
    
    results = controller.search("brown fox jumps", limit=1)
    assert len(results) == 1
    assert "brown fox" in results[0].content

def test_faiss_incremental_update(tmp_path):
    storage = tmp_path / "epi.jsonl"
    controller = EpisodicMemoryController(storage_path=storage)
    controller.add("Initial message", sender_id="user")
    initial_count = controller._index.ntotal
    controller.add("Incremental update testing", sender_id="user")
    assert controller._index.ntotal == initial_count + 1
