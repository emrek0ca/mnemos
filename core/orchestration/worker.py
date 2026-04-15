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

    def start(self, memory: Any = None, affect_engine: Any = None):
        """Launches the background worker loop."""
        if self.is_running:
            return
            
        self.memory = memory
        self.affect_engine = affect_engine
        self.is_running = True
        self._status["active"] = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        logger.info(f"Mnemos Background Worker started (Initial Interval: {self.interval}s)")

    def stop(self):
        self.is_running = False
        self._status["active"] = False
        if self._thread:
            self._thread.join(timeout=1.0)
        logger.info("Mnemos Background Worker stopped.")

    def _run_loop(self):
        while self.is_running:
            try:
                # Dynamic Throttling based on Affective Pulse
                if self.affect_engine:
                    pulse = self.affect_engine.get_pulse()
                    arousal = pulse.get("arousal", 0.0)
                    
                    if arousal > 0.6:
                        # High user intensity: Slow down background tasks to preserve CPU
                        current_interval = 300 
                        logger.debug("Spine: High arousal detected. Throttling orchestration to 300s.")
                    elif arousal < -0.3:
                        # Deep calm: Accelerate consolidation
                        current_interval = 30
                        logger.debug("Spine: Deep calm detected. Accelerating orchestration to 30s.")
                    else:
                        current_interval = self.interval
                else:
                    current_interval = self.interval

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
                if self._status.get("auto_sync_active"):
                    self._status["auto_sync_active"] = False 
            
            time.sleep(current_interval)

    def _monitor_and_optimize(self):
        """Monitors system vitals and performs autonomous cleanup across all user instances."""
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

        # Handle both single MemoryController (legacy/testing) and Agent Registry (multi-user)
        mems = []
        if isinstance(self.memory, dict):
            # registry is a dict of MnemosAgent
            mems = [agent.memory for agent in self.memory.values()]
        elif isinstance(self.memory, MemoryController):
            mems = [self.memory]
        else:
             # Fallback to main memory controller if nothing else
             mems = [MemoryController()]

        for mem in mems:
            # 1. Neural Integrity Audit
            auditor = MnemosAuditor(mem)
            self._status["last_integrity_report"] = auditor.perform_scan()
            
            # 2. Metabolic Archival (v3.8.0)
            # Only run if we have a semantic tier
            if hasattr(mem, "semantic"):
                archived = mem.semantic.archive_stale_facts(threshold_days=7, min_access=5)
                if archived > 0:
                    self._status["metabolic_archivals"] = self._status.get("metabolic_archivals", 0) + archived

            # 3. Forensic Shredder (Consolidated Media)
            try:
                shred_count = mem.trigger_forensic_shredder()
                if shred_count > 0:
                    self._status["shredded_count"] = self._status.get("shredded_count", 0) + shred_count
            except Exception as s_err:
                logger.error(f"Worker Shredder Failure: {s_err}")
                
            # Legacy Ghost Shredding (Expired Nodes)
            ghost = MnemosGhostLayer(mem)
            expired = ghost.identify_expired_nodes()
            if expired:
                logger.warning(f"Shredder: Permanently purging {len(expired)} expired ghost nodes.")
                self._status["shredded_count"] = self._status.get("shredded_count", 0) + len(expired)

            # 4. Cognitive Vault Snapshots (v6.0.0)
            self._perform_vault_snapshots(mem)

        # Autonomous Governance Hub (RSI Loop)
        if settings.AUTONOMOUS_GOVERNANCE:
            from core.orchestration.meta import MnemosMetaBrain
            from core.orchestration.evolution import MnemosEvolver
            from core.cognition.agent import MnemosAgent
            
            # Use principal agent context for autonomous auth
            agent = MnemosAgent()
            evolver = MnemosEvolver(mem)
            stats = evolver.calculate_drift()
            
            # Policy Gate: Only auto-refactor if system health is high
            if stats.get("alignment_score", 0) > 90:
                meta = MnemosMetaBrain(root_dir=".")
                proposals = meta.find_unintegrated_proposals() # We need to add this method or filter scan
                
                auto_targets = [p for p in proposals if p['priority'] in ["LOW", "MEDIUM"]]
                
                if auto_targets:
                    logger.info(f"Governance: Authenticating {len(auto_targets)} auto-refactors...")
                    self._status["auto_sync_active"] = True
                    for p in auto_targets:
                        try:
                            meta.integrate_proposal(p['id'], agent.inference)
                            logger.success(f"Governance: Auto-Integrated [ID: {p['id']}] {p['title']}")
                            self._status["last_auto_refactor"] = datetime.now().isoformat()
                        except Exception as p_err:
                            logger.error(f"Governance Fallback: {p_err}")
                    self._status["auto_sync_active"] = False

    def _perform_vault_snapshots(self, mem: Any):
        """
        Manages high-fidelity cognitive snapshots and rolling window pruning.
        (v6.0.0) - Ensures identity durability across all tiers.
        """
        from pathlib import Path
        import time
        
        backup_dir = mem.root_path / "backups"
        backup_dir.mkdir(parents=True, exist_ok=True)
        
        # 1. Trigger Snapshots for all controllers
        controllers = [mem.episodic, mem.semantic, mem.procedural]
        for ctrl in controllers:
            try:
                # We check the last snapshot time to avoid redundant backups
                # Only snapshot once every 24 hours in high-stability mode
                ctrl.create_snapshot(backup_dir)
            except Exception as e:
                logger.error(f"Worker Snapshot Task Failure [{ctrl.__class__.__name__}]: {e}")

        # 2. Rolling Window Pruning (7-day threshold)
        try:
            now = time.time()
            threshold = 7 * 24 * 60 * 60 # 7 Days
            for file in backup_dir.glob("*.*"):
                if file.is_file():
                    age = now - file.stat().st_mtime
                    if age > threshold:
                        logger.warning(f"Vault Pruning: Purging stale snapshot {file.name}")
                        file.unlink()
        except Exception as p_err:
            logger.error(f"Worker Pruning Task Failure: {p_err}")

    def get_status(self) -> Dict[str, Any]:
        return self._status

# Singleton worker instance for the app
worker = MnemosWorker()
