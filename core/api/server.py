import os
import time
import traceback
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

from core.config.settings import settings
from core.api import auth
from core.api.schemas import (
    ChatRequest, ChatResponse, AffectPulse, MemoryStats, 
    Perception, EvolutionStats, LatticeStatus, LatticeNode,
    EvolutionProposal, SystemHealth
)
from core.utils.telemetry import telemetry
from core.orchestration.worker import worker
from core.cognition.affect import MnemosAffect
from core.cognition.agent import MnemosAgent
from core.orchestration.lattice import MnemosLattice
from core.orchestration.meta import MnemosMetaBrain

# -------------------------------------------------------------------------
# 1. CORE SUBSTRATE INITIALIZATION
# -------------------------------------------------------------------------

affect_engine = MnemosAffect()
lattice = MnemosLattice(node_id="sovereign_prime")
meta_brain = MnemosMetaBrain(root_dir=".")
_agent_registry: Dict[str, MnemosAgent] = {}

def get_agent(user_id: str) -> MnemosAgent:
    """Retrieves or initializes a user-isolated cognitive agent."""
    if user_id not in _agent_registry:
        logger.info(f"Provisioning isolated vault for UserID: {user_id}")
        _agent_registry[user_id] = MnemosAgent(user_id=user_id)
    return _agent_registry[user_id]

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Sovereign Gold Lifecycle: Manage the industrial background worker."""
    logger.info(f"MNEMOS v{settings.VERSION} | Sovereign Gateway Initializing...")
    try:
        # Start worker with Affective Awareness
        worker.start(memory=_agent_registry, affect_engine=affect_engine)
        telemetry.record_event("LIFECYCLE", "Autonomous Lifecycle Activated.", "SUCCESS")
        yield
    finally:
        logger.warning("MNEMOS Hive Hibernation Engaged.")
        worker.stop()

app = FastAPI(
    title="MNEMOS Cognitive API", 
    version=settings.VERSION, 
    lifespan=lifespan,
    docs_url="/api/docs"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

# -------------------------------------------------------------------------
# 2. CHAT & COGNITIVE INGESTION
# -------------------------------------------------------------------------

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Primary episodic ingestion channel for the digital twin."""
    try:
        agent = get_agent(request.userId)
        metadata = {"media_uri": request.media_uri} if request.media_uri else {}
        
        # Async cognitive processing
        raw_response = await agent.aprocess(request.message, user_id=request.userId, metadata=metadata)
        
        # Affective Pulse Synthesis
        # Pulse Synchronization (v3.9.5)
        pulse = AffectPulse(**agent.affect.get_pulse())
        
        # Sync Global Affect (For Metabolic Throttling)
        affect_engine.valence = pulse.valence
        affect_engine.arousal = pulse.arousal
        
        return ChatResponse(
            content=raw_response,
            conversationId=request.conversationId or "main-stream",
            messageId=f"msg_{int(time.time() * 1000)}",
            pulse=pulse,
            processingTrace={"totalTime": telemetry.latency_window[-1] if telemetry.latency_window else 0.0}
        )
    except Exception as e:
        logger.error(f"Ingestion Failure: {e}\n{traceback.format_exc()}")
        telemetry.record_event("COGNITIVE_ERROR", str(e), "ERROR")
        raise HTTPException(status_code=500, detail="Cognitive destabilization detected.")

# -------------------------------------------------------------------------
# 3. MEMORY & CORTICAL MAPPING
# -------------------------------------------------------------------------

@app.get("/api/memory/stats", response_model=MemoryStats)
async def get_memory_stats(userId: str):
    """Aggregates memory volume across all storage tiers with metabolic breakdown."""
    mem = get_agent(userId).memory
    
    # Calculate metabolic distribution
    all_semantic = mem.semantic._load_jsonl()
    warm_count = len([m for m in all_semantic if m.metabolic_tier == "warm"])
    cold_count = len(all_semantic) - warm_count
    
    return MemoryStats(
        userId=userId,
        episodic=len(mem.episodic.memories),
        semantic=len(mem.semantic.knowledge),
        procedural=len(mem.procedural.patterns),
        total_active=len(mem.episodic.memories) + len(mem.semantic.knowledge),
        warm_count=warm_count,
        cold_count=cold_count
    )

@app.get("/api/memory/graph")
async def get_memory_graph(userId: str):
    """Constructs a semantic map of conceptual relationships."""
    knowledge = get_agent(userId).memory.semantic.knowledge
    nodes = []
    edges = []
    
    for fid, fact in knowledge.items():
        nodes.append({
            "id": fid,
            "fact": fact.fact,
            "category": fact.category,
            "is_locked": fact.is_locked
        })
        if fact.supersedes_id:
            edges.append({"source": fid, "target": fact.supersedes_id, "type": "evolves"})
            
    return {"nodes": nodes, "edges": edges}

@app.get("/api/nexus/perceptions", response_model=List[Perception])
async def get_nexus_perceptions(userId: str):
    """Retrieves recent multi-modal perceptions for the Omni-Nexus feed."""
    memories = list(get_agent(userId).memory.semantic.knowledge.values())
    perceptions = [
        Perception(
            id=m.id, fact=m.fact, category=m.category,
            media_uri=m.metadata.get("original_media_uri"),
            timestamp=m.created_at
        )
        for m in memories if m.metadata.get("original_media_uri")
    ]
    perceptions.sort(key=lambda x: x.timestamp, reverse=True)
    return perceptions[:5]

# -------------------------------------------------------------------------
# 4. EVOLUTION & RSI GOVERNANCE
# -------------------------------------------------------------------------

@app.get("/api/evolution/stats", response_model=EvolutionStats)
async def get_evolution_stats(userId: str):
    """Calculates real-time alignment and RSI metrics for the identity loop."""
    from core.orchestration.evolution import MnemosEvolver
    agent = get_agent(userId)
    evolver = MnemosEvolver(agent.memory)
    stats = evolver.calculate_drift()
    
    return EvolutionStats(
        alignment_score=stats.get("alignment_score", 0.0),
        drift_status=stats.get("drift_status", "coherent"),
        autonomous_governance_enabled=settings.AUTONOMOUS_GOVERNANCE,
        last_auto_refactor=worker.get_status().get("last_auto_refactor")
    )

@app.get("/api/meta/proposals", response_model=List[EvolutionProposal])
async def get_meta_proposals():
    """Returns the current pending RSI architectural proposals."""
    proposals = meta_brain.scan_for_optimization()
    return [EvolutionProposal(**p) for p in proposals]

@app.post("/api/meta/integrate/{proposal_id}")
async def integrate_proposal(proposal_id: str):
    """Triggers autonomous integration of a system-level refactor."""
    try:
        from core.inference.engine import InferenceEngine
        result = meta_brain.integrate_proposal(proposal_id, InferenceEngine())
        if result["success"]:
            telemetry.record_event("RSI_SUCCESS", f"Integrated proposal {proposal_id}", "SUCCESS")
            return result
        raise HTTPException(status_code=500, detail=result.get("error"))
    except Exception as e:
        telemetry.record_event("RSI_FAILURE", str(e), "ERROR")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/evolution/shred")
async def trigger_shredder(userId: str):
    """Fires the Forensic Shredder for all consolidated visual stimulants."""
    count = get_agent(userId).memory.trigger_forensic_shredder()
    if count > 0:
        telemetry.record_event("SHRED_COMPLETE", f"User {userId}: {count} assets purged.", "SUCCESS")
    return {"shredded_count": count, "status": "sovereign_purged"}

# -------------------------------------------------------------------------
# 5. LATTICE & IDENTITY DNA
# -------------------------------------------------------------------------

@app.get("/api/lattice/status", response_model=LatticeStatus)
async def get_lattice_status(userId: str):
    """Returns the current state of the user-isolated reasoning swarm."""
    st = get_agent(userId).lattice.get_lattice_status()
    
    # Map node health and reputation (v4.2.5+)
    nodes = []
    for node_id, stats in st["node_health"].items():
        nodes.append(LatticeNode(
            id=node_id,
            role="CONSENSUS",
            weight=stats["reputation"],
            latency_ms=stats.get("avg_latency", 0.0)
        ))
        
    return LatticeStatus(
        status=st["connectivity"],
        nodes=nodes
    )

@app.get("/api/identity/dna")
async def get_identity_dna(userId: str):
    """Exposes the Behavioral DNA markers of the twin instance."""
    return get_agent(userId).memory.procedural.dna.model_dump()

@app.get("/api/reflect/pulse")
async def get_global_pulse():
    """Retrieves the aggregated affective pulse from the global engine."""
    return affect_engine.get_pulse()

# -------------------------------------------------------------------------
# 6. SYSTEM UTILS & TELEMETRY
# -------------------------------------------------------------------------

@app.get("/api/health", response_model=SystemHealth)
async def health():
    """High-fidelity system integrity report."""
    return SystemHealth(
        status="online",
        engine="MNEMOS_PRIME",
        version=settings.VERSION,
        telemetry=telemetry.get_health_report()
    )

# Static Asset Serving
media_dir = settings.ARTIFACTS_DIR
media_dir.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(media_dir)), name="media")

# Sovereign Gold Frontend
dashboard_dir = Path(__file__).parent.parent.parent / "apps" / "dashboard"
if dashboard_dir.exists():
    app.mount("/", StaticFiles(directory=str(dashboard_dir), html=True), name="dashboard")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
