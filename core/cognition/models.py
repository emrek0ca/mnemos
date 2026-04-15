from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class ReasoningChain(BaseModel):
    """Internal reasoning process for the agent."""
    observation: str
    thought: str
    action: str
    expected_outcome: Optional[str] = None

class CognitivePacket(BaseModel):
    """Unified container for an agent's interaction turn."""
    user_input: str
    agent_response: Optional[str] = None
    context_used: List[str] = Field(default_factory=list)
    semantic_facts: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.now)
    reasoning: Optional[ReasoningChain] = None
    influence_scores: Dict[str, float] = Field(default_factory=dict)

class SemanticFact(BaseModel):
    """A structured fact extracted from memory."""
    fact: str
    confidence: float
    source_ids: List[str]
    category: str = "general"
    original_media_uri: Optional[str] = None # Provenance: The exact visual anchor for this fact
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ConsolidatedMemory(BaseModel):
    """Output of the System 2 consolidation process."""
    new_facts: List[SemanticFact]
    obsolete_fact_ids: List[str] = Field(default_factory=list)
