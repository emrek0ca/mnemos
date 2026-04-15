import os
import re
from typing import List, Dict, Any
from core.cognition.skills.base_skill import BaseExpertSkill

class BackendArchitectureExpert(BaseExpertSkill):
    """
    Industrial Backend & Logic Auditor.
    Scans the cognitive core for structural integrity, performance bottlenecks, and design patterns.
    """

    @property
    def name(self) -> str:
        return "Backend Architecture Specialist"

    @property
    def domain(self) -> str:
        return "backend"

    def audit(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        proposals = []
        root_dir = context.get("root_dir", ".")
        core_dir = os.path.join(root_dir, "core")
        
        if not os.path.exists(core_dir):
            return proposals

        # 1. API Integrity Scan
        server_path = os.path.join(core_dir, "api", "server.py")
        if os.path.exists(server_path):
            with open(server_path, "r") as f:
                content = f.read()
            
            # Heuristic: Global state detection (Simplified)
            if re.search(r"^[a-zA-Z_][a-zA-Z0-0_]*\s*=\s*(?!None|API|FastAPI|settings|Path)", content, re.MULTILINE):
                proposals.append(self.create_proposal(
                    "Service Statelessness Verification",
                    "Detected potential global state variables in the API layer.",
                    "Migrate all session data to the MemoryController or a dedicated state registry for better horizontal scaling.",
                    "MEDIUM"
                ))

        # 2. Performance & Concurrency Scan
        # Check if any sync 'def' methods are used in the controller where 'async def' is preferred
        controller_path = os.path.join(core_dir, "memory", "controller.py")
        if os.path.exists(controller_path):
            with open(controller_path, "r") as f:
                content = f.read()
            
            if "def consolidate" in content and "async def consolidate" not in content:
                proposals.append(self.create_proposal(
                    "Async Cognitive Consolidation",
                    "The consolidation loop is currently synchronous, potentially blocking the event loop during heavy memory indexing.",
                    "Refactor the consolidate() method to be asynchronous using anyio or asyncio.",
                    "HIGH"
                ))

        # 3. Code Fidelity Audit (Docstrings)
        python_files = []
        for root, _, files in os.walk(core_dir):
            for file in files:
                if file.endswith(".py"):
                    python_files.append(os.path.join(root, file))
        
        undocumented_count = 0
        for pf in python_files[:20]: # Sample scan
            with open(pf, "r") as f:
                first_lines = f.read(512)
                if '"""' not in first_lines:
                    undocumented_count += 1
        
        if undocumented_count > 5:
            proposals.append(self.create_proposal(
                "Engineering Documentation Core",
                "Several core modules are missing high-level docstrings.",
                "Enforce Apple-standard docstrings for all cognitive modules to improve self-scan accuracy.",
                "LOW"
            ))

        return proposals
