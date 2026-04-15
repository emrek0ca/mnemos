import os
import re
from typing import Dict, Any
from loguru import logger

class MnemosRefactorAgent:
    """
    Autonomous Synthesis Engine.
    Transforms architectural evolution proposals into safe, high-fidelity code modifications.
    """

    def __init__(self, root_dir: str, inference_engine: Any):
        self.root_dir = root_dir
        self.inference = inference_engine

    def execute_evolution(self, proposal: Dict[str, Any]) -> Dict[str, Any]:
        """Orchestrates the synthesis and application of a code refactor."""
        logger.info(f"Refactor Agent: Commencing integration for '{proposal['title']}'...")
        
        try:
            # 1. Target Identification
            target_file = self._identify_target(proposal)
            if not target_file:
                 return {"success": False, "error": "Could not identify target file for this proposal."}
            
            # 2. Context Synthesis
            with open(target_file, "r") as f:
                current_code = f.read()
            
            # 3. Groq-Powered Synthesis
            synthesis_prompt = self._build_synthesis_prompt(proposal, current_code)
            # We use a system message for coding tasks
            new_code = self.inference.generate([synthesis_prompt], system_prompt="You are the MNEMOS Refactor Agent. Outout ONLY the new file content. No markdown, no explanations.")
            
            # 4. Safety Audit & Application
            if len(new_code) < 10:
                raise ValueError("Synthesis returned suspiciously short code block.")
            
            # Create a backup
            backup_path = f"{target_file}.bak"
            with open(backup_path, "w") as f:
                f.write(current_code)
            
            # Hard-write the update
            with open(target_file, "w") as f:
                f.write(new_code)
            
            logger.success(f"Evolution Applied: {target_file}")
            return {
                "success": True, 
                "target": os.path.basename(target_file),
                "backup": os.path.basename(backup_path)
            }
            
        except Exception as e:
            logger.error(f"Integrate Loop Failed: {e}")
            return {"success": False, "error": str(e)}

    def _identify_target(self, proposal: Dict[str, Any]) -> str:
        """Heuristically maps a proposal text to a physical source file."""
        desc = f"{proposal['description']} {proposal['title']}".lower()
        
        # Mapping logic based on expert domains
        if proposal['domain'] == 'frontend':
            return os.path.join(self.root_dir, "apps", "dashboard", "styles.v2.css")
        if "server.py" in desc:
            return os.path.join(self.root_dir, "core", "api", "server.py")
        if "controller.py" in desc:
            return os.path.join(self.root_dir, "core", "memory", "controller.py")
        if "meta.py" in desc:
            return os.path.join(self.root_dir, "core", "orchestration", "meta.py")
        
        # Fallback heuristic: Extract anything that looks like a path
        match = re.search(r'([a-zA-Z0-9_/]+\.(py|css|html|js))', desc)
        if match:
             potential_path = os.path.join(self.root_dir, match.group(0))
             if os.path.exists(potential_path):
                 return potential_path
                 
        return None

    def _build_synthesis_prompt(self, proposal: Dict[str, Any], current_code: str) -> str:
        return f"""
        EVOLUTION REQUEST: {proposal['title']}
        GOAL: {proposal['description']}
        SUGGESTION: {proposal['suggestion']}

        CURRENT CODE:
        ---
        {current_code}
        ---

        REFACTOR TASK:
        Apply the suggestion precisely to the current code. Maintain all architectural patterns and the 'Apple Minimalist' standard.
        Return ONLY the final, modified code. Do not include markdown fences or any conversational text.
        """
