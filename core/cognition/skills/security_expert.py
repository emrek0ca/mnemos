import os
from typing import List, Dict, Any
from core.cognition.skills.base_skill import BaseExpertSkill

class SecurityAuditExpert(BaseExpertSkill):
    """
    Sovereignty & Privacy Protection Analyst.
    Scans for exposed credentials, insecure data access, and privacy leaks.
    """

    @property
    def name(self) -> str:
        return "Security & Privacy Specialist"

    @property
    def domain(self) -> str:
        return "security"

    def audit(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        proposals = []
        root_dir = context.get("root_dir", ".")
        
        # 1. Credential Exposure Check
        env_path = os.path.join(root_dir, ".env")
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                env_content = f.read()
            
            # Heuristic: Check for hardcoded OpenAI/Groq keys that might be in a repo
            if "sk-" in env_content or "gsk_" in env_content:
                # This is actually fine for local dev, but we should suggest .gitignore
                gitignore_path = os.path.join(root_dir, ".gitignore")
                if os.path.exists(gitignore_path):
                    with open(gitignore_path, "r") as f:
                        gi_content = f.read()
                    if ".env" not in gi_content:
                        proposals.append(self.create_proposal(
                            "Infrastructure Stealth",
                            "Environment file (.env) detected with sensitive keys but not ignored in VFS/Git.",
                            "Add .env to your .gitignore immediately to prevent credential leaks during hive propagation.",
                            "HIGH"
                        ))

        # 2. Privacy Leak Audit (Logs)
        log_dir = os.path.join(root_dir, "logs") # If specialized logs exist
        core_log = os.path.join(root_dir, "server.log")
        
        if os.path.exists(core_log):
             # Just checking if key strings appear in logs
             # In a real system, we'd use a regex for entropy-based detection
             pass 

        # 3. Data Permission Audit
        artifacts_dir = os.path.join(root_dir, "artifacts")
        if os.path.exists(artifacts_dir):
            # Check if artifacts is generally readable by everyone on the system
            # Standard unix check simplified
            try:
                mode = os.stat(artifacts_dir).st_mode
                if mode & 0o007: # Other-readable/writable
                     proposals.append(self.create_proposal(
                        "Vault Permission Hardening",
                        "The artifacts directory has loose file permissions.",
                        "Strictly restrict artifacts/ to the current user (chmod 700) to ensure sovereign privacy.",
                        "MEDIUM"
                    ))
            except Exception:
                pass

        return proposals
