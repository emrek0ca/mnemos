from typing import List, Dict, Any, Optional
from loguru import logger
import numpy as np
from datetime import datetime, timedelta

from core.memory.models import SemanticMemory
from core.memory.controller import MemoryController

class MnemosDriftAuditor:
    """
    Forensic Identity Layer: Analyzes the divergence of the digital twin from its baseline persona.
    Calculates quantitative metrics for 'Cognitive Drift'.
    """

    def __init__(self, memory: MemoryController):
        self.memory = memory

    def calculate_drift_report(self) -> Dict[str, Any]:
        """
        Executes a full audit of factual shifts and preference evolution.
        """
        knowledge = list(self.memory.semantic.knowledge.values())
        if not knowledge:
            return {"status": "baseline"}

        # 1. Stability Index: Percentage of non-obsolete facts
        total = len(knowledge)
        obsolete = len([k for k in knowledge if k.is_obsolete])
        stability = (total - obsolete) / total if total > 0 else 1.0

        # 2. Volatility Analysis: Rate of retirement in the last 7 days
        recent_cutoff = datetime.now() - timedelta(days=7)
        recent_retirements = 0
        for k in knowledge:
            retired_at = k.metadata.get("retired_at")
            if retired_at:
                try:
                    dt = datetime.fromisoformat(retired_at)
                    if dt > recent_cutoff:
                        recent_retirements += 1
                except: pass
        
        volatility = recent_retirements / total if total > 0 else 0.0

        # 3. Factual Drift: Lineage chain depth
        depths = []
        for k in knowledge:
            if k.supersedes_id:
                depths.append(1) # Simple depth for now, can be recursive chain check
        
        drift_score = sum(depths) / total if total > 0 else 0.0

        report = {
            "timestamp": datetime.now().isoformat(),
            "metrics": {
                "stability": round(stability, 4),
                "volatility": round(volatility, 4),
                "factual_drift": round(drift_score, 4),
            },
            "interpretation": self._get_interpretation(stability, volatility, drift_score),
            "summary": f"Audit of {total} semantic nodes complete. {obsolete} facts retired across lineage."
        }
        
        logger.info(f"Identity Drift Audit Complete: Stability={stability:.2f}")
        return report

    def _get_interpretation(self, s: float, v: float, d: float) -> str:
        if s > 0.9 and v < 0.05:
            return "STEADFAST: Digital twin is highly aligned with foundation identity."
        if s < 0.7 or v > 0.2:
            return "VOLATILE: High rate of belief revision detected. Behavioral drift imminent."
        return "EVOLVING: Normal cognitive refinement in progress."
