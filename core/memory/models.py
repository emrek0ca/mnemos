from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class EpisodicMemory(BaseModel):
    """A specific event or conversation turn in the digital twin's life."""
    id: str
    content: str
    sender_id: str
    created_at: datetime = Field(default_factory=datetime.now)
    importance: float = 1.0
    ttl_seconds: Optional[int] = None # Ephemeral Life (Ghost node)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    vision_anchors: List[str] = Field(default_factory=list)

class SemanticMemory(BaseModel):
    """Factual knowledge or personality trait metadata."""
    id: str
    fact: str
    category: str
    confidence: float = 1.0
    source_episodic_ids: List[str] = Field(default_factory=list)
    status: str = "pending_review"  # verified, rejected, pending_review
    visibility: str = "private"  # private, peer_only, public
    ttl_seconds: Optional[int] = None # Ephemeral Life
    is_decoy: bool = False # Cognitive Camouflage
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)

class ProceduralMemory(BaseModel):
    """Behavioral patterns and stylistic traits."""
    id: str
    pattern_name: str
    description: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    importance: float = 1.0
    created_at: datetime = Field(default_factory=datetime.now)
