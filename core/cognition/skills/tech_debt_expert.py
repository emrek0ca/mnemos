import os
import re
from typing import List, Dict, Any
from core.cognition.skills.base_skill import BaseExpertSkill
from core.utils.telemetry import telemetry

class TechnicalDebtExpert(BaseExpertSkill):
    """
    Expert specialized in detecting architectural decay, mocks, and error patterns.
    """

    @property
    def name(self) -> str:
        return "Technical Debt Expert"

    @property
    def domain(self) -> str:
        return "backend"

    def audit(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        proposals = []
        root_dir = context.get("root_dir", ".")
        
        # 1. Forensic Error Audit (Dynamic Debt)
        report = telemetry.get_health_report()
        events = report.get("forensic_events", [])
        
        error_counts = {}
        for ev in events:
            if ev.get("intensity") == "ERROR":
                etype = ev.get("type", "UNKNOWN")
                error_counts[etype] = error_counts.get(etype, 0) + 1
        
        for etype, count in error_counts.items():
            if count > 2: # Threshold for "Chronic Instability"
                proposals.append(self.create_proposal(
                    title=f"Chronic {etype} Instability",
                    description=f"Detected {count} recurring errors of type {etype} in recent telemetry.",
                    suggestion=f"Implement specialized error handlers or circuit breakers for the {etype} subsystem.",
                    priority="HIGH"
                ))

        # 2. Code Smells & Mocks (Structural Debt)
        debt_patterns = {
            "mock": r"mock|placeholder|stub",
            "todo": r"TODO|FIXME|HACK",
            "untyped": r"Any\]? =" # Basic check for weak typing
        }
        
        for root, _, files in os.walk(os.path.join(root_dir, "core")):
            for file in files:
                if not file.endswith(".py"): continue
                path = os.path.join(root, file)
                
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()
                        
                        for key, pattern in debt_patterns.items():
                            matches = re.findall(pattern, content, re.IGNORECASE)
                            if matches and len(matches) > 3:
                                proposals.append(self.create_proposal(
                                    title=f"Refactor {file} ({key.upper()})",
                                    description=f"Detected significant {key} patterns in {file}.",
                                    suggestion=f"Replace non-production snippets with hardened implementation in {file}.",
                                    priority="MEDIUM"
                                ))
                except Exception:
                    continue
                    
        return proposals
