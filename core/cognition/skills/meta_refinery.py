import os
import json
from typing import List, Dict, Any
from core.cognition.skills.base_skill import BaseExpertSkill
from core.inference.engine import InferenceEngine
from loguru import logger

class MetaRefinerySkill(BaseExpertSkill):
    """
    Architectural Evolution Specialist.
    Uses LLM analysis of documentation and stats to 'dream' of the next evolutionary stage.
    """

    def __init__(self):
        super().__init__()
        self.engine = InferenceEngine()
        self._last_audit_time = 0
        self._audit_interval = 1800 # 30 minutes throttle
        self._cached_proposals = []

    @property
    def name(self) -> str:
        return "Meta-Architecture Refinery"

    @property
    def domain(self) -> str:
        return "evolution"

    def audit(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        import time
        now = time.time()
        
        # Throttling to prevent redundant LLM overhead
        if now - self._last_audit_time < self._audit_interval and self._cached_proposals:
            logger.debug("Meta-Refinery: Audit throttled. Using cached proposals.")
            return self._cached_proposals

        self._last_audit_time = now
        proposals = []
        root_dir = context.get("root_dir", ".")
        
        # 1. Context Loading (Aesthetics & Architecture)
        ozet_path = os.path.join(root_dir, "özet.txt")
        if not os.path.exists(ozet_path):
            return proposals
            
        try:
            with open(ozet_path, "r") as f:
                ozet_content = f.read()
            
            # 2. Deep Analysis (LLM Task)
            prompt = f"""
            Analyze the current state of the MNEMOS Sovereign Platform:
            {ozet_content}
            
            Based ONLY on the current architecture and your understanding of 'Digital Twin' hard-engineering,
            propose ONE specific, high-fidelity evolutionary upgrade.
            The proposal should be technically sound and align with the Arctic White v3.5 design language.
            
            Return a JSON object:
            {{
                "title": "Upgrade Name",
                "description": "Short explanation",
                "suggestion": "Technical implementation strategy",
                "priority": "LOW/MEDIUM/HIGH",
                "domain": "cognition/backend/frontend/security"
            }}
            """
            
            # We use the generic generate method for the audit
            raw_response = self.engine.generate([prompt], system_prompt="You are the Supreme Refactor Agent of MNEMOS.")
            
            # 3. Parse and Create Proposal
            import re
            match = re.search(r"\{.*\}", raw_response, re.DOTALL)
            if match:
                data = json.loads(match.group())
                proposals.append(self.create_proposal(
                    title=data["title"],
                    description=data["description"],
                    suggestion=data["suggestion"],
                    priority=data["priority"],
                    domain=data["domain"]
                ))
                
        except Exception as e:
            logger.error(f"Meta-Refinery Audit Failed: {e}")

        return proposals
