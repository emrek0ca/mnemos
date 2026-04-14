import time
import functools
import os
import psutil
from typing import Dict, Any, Callable
from loguru import logger

class MnemosProfiler:
    """
    High-fidelity performance and resource profiler.
    Tracks execution time and memory delta for cognitive cycles.
    """
    
    _process = psutil.Process(os.getpid())

    @staticmethod
    def profile_fn(func: Callable):
        """Decorator to profile a function's latency and memory cost."""
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Baseline Vitals
            start_time = time.perf_counter()
            start_mem = MnemosProfiler._process.memory_info().rss / (1024 * 1024) # MB
            
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                # Post-exec Vitals
                end_time = time.perf_counter()
                end_mem = MnemosProfiler._process.memory_info().rss / (1024 * 1024) # MB
                
                latency_ms = (end_time - start_time) * 1000
                mem_delta = end_mem - start_mem
                
                logger.debug(f"PROFILED [{func.__name__}]: {latency_ms:.2f}ms | Mem Delta: {mem_delta:+.2f}MB")
                
                # Report to telemetry if available
                try:
                    from core.utils.telemetry import telemetry
                    telemetry.record_latency(latency_ms)
                except:
                    pass
        
        return wrapper

    @staticmethod
    def trace_reasoning_latency(layer_name: str, duration_ms: float):
        """Records the latency of a specific cognitive layer for meta-analysis."""
        logger.debug(f"Reasoning Trace [{layer_name}]: {duration_ms}ms")
        # In production, this would append to a circular buffer for trend analysis
        pass

    @classmethod
    def get_system_vitals(cls) -> Dict[str, Any]:
        """Returns the current hardware footprint of the engine."""
        mem = cls._process.memory_info()
        return {
            "pid": os.getpid(),
            "cpu_percent": cls._process.cpu_percent(interval=None),
            "ram_rss_mb": round(mem.rss / (1024 * 1024), 2),
            "ram_vms_mb": round(mem.vms / (1024 * 1024), 2),
            "threads_active": cls._process.num_threads()
        }
