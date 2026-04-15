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
    is_obsolete: bool = False # Cognitive Retirement
    is_locked: bool = False # Paradigm Protection (Locked for RSI)
    supersedes_id: Optional[str] = None # Fact Lineage
    
    # Metabolic Tiering (v3.8.0)
    metabolic_tier: str = "warm" # warm, cold
    access_metrics: Dict[str, Any] = Field(default_factory=lambda: {"count": 0, "last_access": datetime.now().isoformat()})
    
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

class BehavioralDNA(BaseModel):
    """Dynamic identity markers for style-congruent synthesis."""
    rationality: float = 0.5
    resonance: float = 0.5
    technical_depth: float = 0.5
    formality: float = 0.5
    lexical_complexity: float = 0.5
    last_update: datetime = Field(default_factory=datetime.now)
