from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional
from datetime import datetime

class ChatRequest(BaseModel):
    userId: str = Field(..., description="Unique identifier for the sovereign vault")
    message: str = Field(..., min_length=1, max_length=5000)
    conversationId: Optional[str] = "system-default"
    media_uri: Optional[str] = None

class AffectPulse(BaseModel):
    valence: float = Field(0.0, ge=-1.0, le=1.0)
    arousal: float = Field(0.0, ge=-1.0, le=1.0)
    emotional_density: float = Field(0.0, ge=0.0)
    dominant_mood: str = "neutral"

class ChatResponse(BaseModel):
    content: str
    conversationId: str
    messageId: str
    pulse: AffectPulse
    processingTrace: Dict[str, float]

class MemoryStats(BaseModel):
    userId: str
    episodic: int
    semantic: int
    procedural: int
    total_active: int
    warm_count: Optional[int] = 0
    cold_count: Optional[int] = 0
    health: str = "optimal"

class Perception(BaseModel):
    id: str
    fact: str
    category: str
    media_uri: Optional[str]
    timestamp: datetime

class EvolutionProposal(BaseModel):
    id: str
    skill: str
    domain: str
    title: str
    description: str
    suggestion: str
    priority: str
    status: str = "pending"

class EvolutionStats(BaseModel):
    alignment_score: float = Field(..., ge=0, le=100)
    drift_status: str
    autonomous_governance_enabled: bool
    last_auto_refactor: Optional[str] = None

class SystemHealth(BaseModel):
    status: str
    engine: str
    version: str
    telemetry: Dict[str, Any]

class LatticeNode(BaseModel):
    id: str
    role: str
    weight: float
    status: str = "online"
    latency_ms: Optional[float] = 0.0

class LatticeStatus(BaseModel):
    status: str
    nodes: List[LatticeNode]
