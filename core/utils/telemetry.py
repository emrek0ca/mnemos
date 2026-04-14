import time
from typing import Dict, Any, List
from collections import deque
from loguru import logger

class CognitiveTelemetry:
    """
    Monitors the 'health' and 'efficiency' of the cognitive architecture.
    Tracks memory hits, inference latencies, and consolidation ratios.
    """

    def __init__(self, window_size: int = 50):
        # Rolling windows for metrics
        self.latency_window = deque(maxlen=window_size)
        self.memory_hit_window = deque(maxlen=window_size)
        
        self.total_turns = 0
        self.total_memories = 0
        self.consolidations = 0

    def record_turn(self, latency_ms: float, memory_hits: int):
        """Records telemetry for a single cognitive cycle."""
        self.total_turns += 1
        self.latency_window.append(latency_ms)
        self.memory_hit_window.append(memory_hits > 0)
        logger.debug(f"Telemetry recorded: latency={latency_ms:.2f}ms, hits={memory_hits}")

    def record_consolidation(self, fact_count: int):
        """Records a System 2 consolidation event."""
        self.consolidations += 1
        self.total_memories += fact_count
        logger.info(f"Telemetry: Consolidation event recorded ({fact_count} facts).")

    def get_health_report(self) -> Dict[str, Any]:
        """Returns a snapshot of system cognitive health."""
        if not self.latency_window:
            return {"status": "initializing"}
            
        avg_latency = sum(self.latency_window) / len(self.latency_window)
        hit_rate = sum(self.memory_hit_window) / len(self.memory_hit_window)
        
        return {
            "status": "healthy" if avg_latency < 2000 else "degraded",
            "avg_latency_ms": round(avg_latency, 2),
            "memory_hit_rate": round(hit_rate, 2),
            "total_turns": self.total_turns,
            "facts_extracted": self.total_memories,
            "consolidation_count": self.consolidations
        }

# Global Singleton for ease of access across layers
telemetry = CognitiveTelemetry()
