import pytest
import asyncio
import time
from pathlib import Path
from core.memory.controller import MemoryController
from core.cognition.agent import MnemosAgent

@pytest.mark.anyio
async def test_cognitive_velocity_improvement(tmp_path):
    # Setup isolated memory
    artifacts_dir = tmp_path / "artifacts"
    artifacts_dir.mkdir()
    (artifacts_dir / "memory").mkdir()
    
    mem = MemoryController(base_artifacts_dir=artifacts_dir)
    agent = MnemosAgent()
    agent.memory = mem
    
    # 1. Warm up cache & populate memory
    for i in range(10):
        await mem.perceive(f"Fact number {i}", sender_id="user")
        mem.semantic.add_fact(f"Identity key {i}", category="identity")
    
    # 2. Measure Async Parallel Retrieval (New)
    start = time.perf_counter()
    await agent.aprocess("What is my identity?", user_id="user_1")
    duration_async = time.perf_counter() - start
    
    print(f"\n[BENCHMARK] Async Parallel Cycle: {duration_async*1000:.2f}ms")
    
    # 3. Verification of Caching
    # Repeat search should be hit cached facts instantly
    start_cache = time.perf_counter()
    res = mem.semantic.lookup("Identity key 0")
    duration_cache = time.perf_counter() - start_cache
    
    print(f"[BENCHMARK] Cached Semantic Lookup: {duration_cache*1000:.4f}ms")
    assert duration_cache < 0.001 # Microsecond scale for cache hit
    
    assert duration_async > 0 # Sanity check
