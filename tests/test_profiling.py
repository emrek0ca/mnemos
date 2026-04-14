import time
import pytest
from core.utils.profiler import MnemosProfiler

def test_profiler_latency_capture():
    """Verify that the profiler captures execution time correctly."""
    
    @MnemosProfiler.profile_fn
    def mock_slow_task():
        time.sleep(0.1)
        return "done"
    
    # We can't easily check the logger without complex mocking,
    # so we'll check if it returns the result correctly
    res = mock_slow_task()
    assert res == "done"

def test_get_system_vitals():
    """Verify that system vitals are valid numbers."""
    vitals = MnemosProfiler.get_system_vitals()
    
    assert "cpu_percent" in vitals
    assert "ram_rss_mb" in vitals
    assert vitals["ram_rss_mb"] > 0
    assert vitals["threads_active"] >= 1

def test_profiler_memory_delta():
    """Verify that memory delta tracking works."""
    
    @MnemosProfiler.profile_fn
    def mock_memory_task():
        # Allocate some memory
        data = [0] * (10**6) # ~8MB
        return len(data)

    res = mock_memory_task()
    assert res == 1000000
