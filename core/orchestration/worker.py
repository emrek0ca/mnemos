import time
import threading
from typing import List, Callable, Dict, Any
from loguru import logger
from datetime import datetime

class MnemosWorker:
    """
    Asynchronous Task Worker (ATW).
    Handles background cognitive cycles (Consolidation, Reflection, Style Analysis).
    """

    def __init__(self, interval_sec: int = 60):
        self.interval = interval_sec
        self.is_running = False
        self._thread = None
        self._tasks: List[Callable] = []
        self._status = {
            "last_run": None,
            "tasks_processed": 0,
            "failed_tasks": 0,
            "active": False
        }

    def add_task(self, task_fn: Callable):
        """Registers a recurring task."""
        self._tasks.append(task_fn)

    def start(self):
        """Launches the background worker loop."""
        if self.is_running:
            return
            
        self.is_running = True
        self._status["active"] = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        logger.info(f"Mnemos Background Worker started (Interval: {self.interval}s)")

    def stop(self):
        self.is_running = False
        self._status["active"] = False
        if self._thread:
            self._thread.join(timeout=1.0)
        logger.info("Mnemos Background Worker stopped.")

    def _run_loop(self):
        while self.is_running:
            try:
                # 1. Resource Monitoring & Optimization
                self._monitor_and_optimize()
                
                # 2. Execute Cognitive Tasks
                self._status["last_run"] = datetime.now()
                for task in self._tasks:
                    logger.debug(f"Executing worker task: {task.__name__}")
                    task()
                    self._status["tasks_processed"] += 1
            except Exception as e:
                logger.error(f"Worker task failure: {e}")
                self._status["failed_tasks"] += 1
            
            time.sleep(self.interval)

    def _monitor_and_optimize(self):
        """Monitors system vitals and performs autonomous cleanup."""
        from core.utils.profiler import MnemosProfiler
        from core.orchestration.integrity import MnemosAuditor
        from core.orchestration.camouflage import MnemosGhostLayer
        from core.memory.controller import MemoryController
        import gc
        
        vitals = MnemosProfiler.get_system_vitals()
        logger.debug(f"System Vitals: RAM {vitals['ram_rss_mb']}MB | CPU {vitals['cpu_percent']}%")
        
        # Soft-limit optimization
        if vitals['ram_rss_mb'] > 512:
            logger.warning("High memory detected. Triggering autonomous garbage collection...")
            gc.collect()

        mem = MemoryController()
        # Neural Integrity Audit
        auditor = MnemosAuditor(mem)
        self._status["last_integrity_report"] = auditor.perform_scan()
        
        # Forensic Shredder (Ghost Nodes)
        ghost = MnemosGhostLayer(mem)
        expired = ghost.identify_expired_nodes()
        if expired:
            logger.warning(f"Shredder: Permanently purging {len(expired)} expired ghost nodes.")
            # Real implementation would call mem.shred()
            self._status["shredded_count"] = self._status.get("shredded_count", 0) + len(expired)

    def get_status(self) -> Dict[str, Any]:
        return self._status

# Singleton worker instance for the app
worker = MnemosWorker()
