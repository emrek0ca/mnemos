import json
import os
from typing import List, Dict, Any
from core.cognition.skills.base_skill import BaseExpertSkill

class CognitiveAuditExpert(BaseExpertSkill):
    """
    Mental State & Memory Identity Auditor.
    Analyzes the semantic record for identity drift, logical contradictions, and knowledge decay.
    """

    @property
    def name(self) -> str:
        return "Cognitive Continuity Specialist"

    @property
    def domain(self) -> str:
        return "cognition"

    def audit(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        proposals = []
        root_dir = context.get("root_dir", ".")
        # We audit the artifacts dir where memories reside
        artifacts_dir = os.path.join(root_dir, "artifacts")
        
        # In a multi-user setup, we'd loop through users/ dir.
        # For the global audit, we check the base semantic file.
        semantic_path = os.path.join(artifacts_dir, "memory", "semantic.jsonl")
        
        if not os.path.exists(semantic_path):
            return proposals

        memories = []
        try:
            with open(semantic_path, "r") as f:
                for line in f:
                    if line.strip():
                        memories.append(json.loads(line))
        except Exception:
            return proposals

        # 1. Knowledge Decay Audit
        if len(memories) > 0:
            # Check for very low confidence facts
            low_confidence = [m for m in memories if m.get("metadata", {}).get("confidence", 1.0) < 0.4]
            if low_confidence:
                proposals.append(self.create_proposal(
                    "Semantic Pruning Needed",
                    f"Detected {len(low_confidence)} facts with critically low confidence scores.",
                    "Initiate a 'System 2' reflection cycle to purge or re-verify uncertain knowledge nodes.",
                    "MEDIUM"
                ))

        # 2. Logic Fragmentation
        # Heuristic: Check for redundant facts (very simple string matching for now)
        facts_text = [m.get("fact", "").lower() for m in memories if m.get("fact")]
        duplicates = len(facts_text) - len(set(facts_text))
        if duplicates > 5:
            proposals.append(self.create_proposal(
                "Knowledge Deduplication",
                "Significant overlap detected in semantic memory records.",
                "Execute a merge-sort on the knowledge base to consolidate redundant nodes into singular high-confidence facts.",
                "LOW"
            ))

        # 3. Identity Drift (Structural)
        if len(memories) > 100:
            proposals.append(self.create_proposal(
                "Identity Alignment Audit",
                "The semantic database has reached a size where cognitive drift is probable.",
                "Deploy a multi-layer reasoning agent to verify that long-term facts still align with the core persona DNA.",
                "HIGH"
            ))

        return proposals
