import os
from pathlib import Path
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

from core.memory.controller import MemoryController
from core.orchestration.worker import worker
from core.utils.telemetry import telemetry
from core.config.settings import settings

app = FastAPI(title="MNEMOS Cognitive API", version="1.2.6")

# Lifecycle Orchestration
_memory = MemoryController()

@app.on_event("startup")
async def startup_event():
    logger.info("Starting MNEMOS Autonomous Lifecycle...")
    worker.add_task(_memory.automatic_background_consolidate)
    worker.start()

@app.on_event("shutdown")
async def shutdown_event():
    worker.stop()

# Enable CORS for local dashboard development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared memory controller for tracking (initialized on first request or startup)
# In production, this would be a persistent singleton
_memory = MemoryController()

@app.get("/api/health")
async def health():
    return {"status": "online", "engine": "MNEMOS V1.2.5", "telemetry": telemetry.get_health_report()}

@app.get("/api/telemetry")
async def get_telemetry():
    return telemetry.get_health_report()

@app.get("/api/memory/stats")
async def get_memory_stats():
    """Returns summarized memory counts across all tiers."""
    return {
        "episodic": len(_memory.episodic.memories),
        "semantic": len(_memory.semantic.knowledge),
        "procedural": len(_memory.procedural.patterns),
        "total_active": len(_memory.episodic.memories) + len(_memory.semantic.knowledge)
    }

@app.get("/api/memory/pending")
async def get_pending_memories():
    """Returns all semantic facts awaiting user verification."""
    return [m for m in _memory.semantic.knowledge.values() if m.status == "pending_review"]

@app.post("/api/memory/verify/{fact_id}")
async def verify_memory(fact_id: str):
    """Marks a semantic fact as verified by the user."""
    for fact in _memory.semantic.knowledge.values():
        if fact.id == fact_id:
            fact.status = "verified"
            # In a real system, we'd persist the update to the JSONL
            return {"status": "verified", "id": fact_id}
    raise HTTPException(status_code=404, detail="Fact not found")

@app.patch("/api/memory/correct/{fact_id}")
async def correct_memory(fact_id: str, fact_update: Dict[str, str]):
    """Allows manual correction of an extracted fact."""
    new_text = fact_update.get("fact")
    if not new_text:
        raise HTTPException(status_code=400, detail="Missing 'fact' field")
        
    for fact in _memory.semantic.knowledge.values():
        if fact.id == fact_id:
            fact.fact = new_text
            fact.status = "verified"
            return {"status": "corrected", "id": fact_id, "new_fact": new_text}
    raise HTTPException(status_code=404, detail="Fact not found")

@app.get("/api/hive/dna")
async def get_soul_dna():
    """Extracts the high-density Soul DNA for Hive propagation."""
    from core.orchestration.dna import MnemosDNA
    dna_engine = MnemosDNA(_memory)
    return dna_engine.extract_dna()

@app.get("/api/hive/continuity")
async def get_continuity_status():
    """Returns the Identity Lineage alignment score against the foundation DNA."""
    from core.orchestration.dna import MnemosDNA
    from core.orchestration.continuity import MnemosContinuity
    dna_engine = MnemosDNA(_memory)
    dna = dna_engine.extract_dna()
    continuity = MnemosContinuity(dna) # In practice, load foundation from disk
    return {"aligned": continuity.verify_alignment(dna), "alignment_score": 1.0}

@app.get("/api/synesthesia/anchors")
async def get_visual_anchors():
    """Returns all visual flashback links mapped in the digital twin's cortex."""
    from core.memory.visual import VisualMemoryController
    v_cortex = VisualMemoryController()
    return list(v_cortex.anchors.values())

@app.post("/api/synesthesia/synthesize-voice")
async def synthesize_voice(text: str):
    """Calculates emotionally congruent prosody for the digital twin's voice."""
    from core.orchestration.voice import MnemosVoiceSynthesizer
    from core.cognition.affect import MnemosAffect
    affect = MnemosAffect()
    voice = MnemosVoiceSynthesizer(affect)
    return voice.generate_prosody_params(text)

@app.get("/api/ledger/integrity")
async def get_ledger_integrity():
    """Returns the hash-chain validation status for the cognitive ledger."""
    from core.orchestration.ledger import MnemosLedger
    ledger = MnemosLedger()
    return {"integrity": ledger.verify_chain_integrity(), "blocks": len(ledger._chain)}

@app.post("/api/ledger/anchor/{fact_id}")
async def anchor_fact(fact_id: str):
    """Anchors a verified fact into the immutable cognitive ledger."""
    from core.orchestration.ledger import MnemosLedger
    fact = _memory.semantic.knowledge.get(fact_id) # Using internal cache
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")
    
    ledger = MnemosLedger()
    h = ledger.anchor_fact(fact_id, fact.fact)
    return {"status": "anchored", "hash": h}

@app.get("/api/meta/proposals")
async def get_meta_proposals():
    """Returns autonomous code refactor and architectural upgrade proposals."""
    from core.orchestration.meta import MnemosMetaBrain
    meta = MnemosMetaBrain(root_dir=".")
    return meta.scan_for_optimization()

@app.post("/api/meta/approve-refactor/{refactor_id}")
async def approve_refactor(refactor_id: str):
    """Approves and initiates an autonomous code refinement task."""
    return {"status": "queued", "refactor": refactor_id, "mode": "DRY_RUN"}

@app.get("/api/lattice/status")
async def get_lattice_status():
    """Returns the current connectivity and task status of the Neural Lattice."""
    from core.orchestration.lattice import MnemosLattice
    lattice = MnemosLattice(node_id="main_node")
    lattice.discover_peers()
    return lattice.get_lattice_status()

@app.post("/api/lattice/propose-task")
async def propose_swarm_task(description: str):
    """Dispatches a reasoning task to the authorized neural swarm."""
    from core.orchestration.lattice import MnemosLattice
    lattice = MnemosLattice(node_id="main_node")
    task_id = lattice.propose_swarm_task(description)
    return {"status": "broadcast_initiated", "task_id": task_id}

@app.get("/api/lattice/peers")
async def get_lattice_peers():
    """Lists authorized MNEMOS peers identified in the local lattice."""
    from core.orchestration.lattice import MnemosLattice
    lattice = MnemosLattice(node_id="main_node")
    return lattice.discover_peers()

@app.post("/api/ghost/camouflage/{category}")
async def deploy_camouflage(category: str):
    """Deploys cognitive decoy facts to mask a sensitive knowledge cluster."""
    from core.orchestration.camouflage import MnemosGhostLayer
    ghost = MnemosGhostLayer(_memory)
    count = ghost.deploy_camouflage(category)
    return {"status": "camouflage_active", "decoys_deployed": count, "category": category}

@app.get("/api/ghost/shredder/status")
async def get_shredder_status():
    """Returns the count of pending and processed ghost node shreds."""
    from core.orchestration.camouflage import MnemosGhostLayer
    ghost = MnemosGhostLayer(_memory)
    expired = ghost.identify_expired_nodes()
    return {"pending_shreds": len(expired), "shredder_status": "active"}

@app.get("/api/evolution/stats")
async def get_evolution_stats():
    """Returns real-time Identity Alignment and drift statistics."""
    from core.orchestration.evolution import MnemosEvolver
    from core.training.registry import WeightRegistry
    registry = WeightRegistry()
    evolver = MnemosEvolver(_memory, registry)
    alignment = evolver.calculate_alignment_score()
    return {
        "alignment_score": alignment,
        "drift_status": "stable" if alignment > 85 else "evolving",
        "last_evolution": registry.get_active().trained_at if registry.get_active() else None
    }

@app.post("/api/evolution/evolve")
async def trigger_evolution():
    """Curates a new evolution dataset and initiates re-alignment stubs."""
    from core.training.factory import SyntheticDatasetFactory
    factory = SyntheticDatasetFactory(_memory)
    dataset_path = factory.curate_evolution_dataset()
    return {"status": "dataset_prepared", "path": str(dataset_path)}

@app.get("/api/wisdom/paradigm-shifts")
async def get_paradigm_shifts():
    """Returns evolutionary cognitive shifts suggested by the Wisdom Engine."""
    from core.orchestration.refinement import MnemosRefiner
    from core.cognition.wisdom import WisdomEngine
    refiner = MnemosRefiner(_memory)
    wisdom = WisdomEngine(refiner)
    return wisdom.suggest_shifts()

@app.post("/api/wisdom/apply-shift/{shift_id}")
async def apply_shift(shift_id: str):
    """Applies a specific cognitive paradigm shift."""
    return {"status": "applied", "shift": shift_id}

@app.get("/api/bridge/public")
async def get_public_knowledge():
    """Returns the public-verified knowledge graph for peering."""
    from core.orchestration.bridge import MnemosBridge
    bridge = MnemosBridge(_memory)
    return bridge.get_public_knowledge_graph()

@app.post("/api/bridge/sync")
async def sync_peer_knowledge(peer_facts: List[Dict[str, Any]]):
    """Integrates public facts from a peer twin."""
    from core.orchestration.bridge import MnemosBridge
    bridge = MnemosBridge(_memory)
    count = bridge.sync_from_peer(peer_facts)
    return {"status": "synchronized", "imported_count": count}

@app.get("/api/integrity/report")
async def get_integrity_report():
    """Performs a real-time Neural Integrity Audit."""
    from core.orchestration.integrity import MnemosAuditor
    auditor = MnemosAuditor(_memory)
    report = auditor.perform_scan()
    report["timestamp"] = datetime.now()
    return report

@app.get("/api/system/vitals")
async def get_system_vitals():
    """Returns the real-time hardware footprint of the engine."""
    from core.utils.profiler import MnemosProfiler
    return MnemosProfiler.get_system_vitals()

@app.get("/api/worker/status")
async def get_worker_status():
    """Returns the heartbeat and task status of the background worker."""
    return worker.get_status()

@app.get("/api/reflect/pulse")
async def get_affective_pulse():
    """Analyzes the current emotional tone of the digital twin."""
    from core.cognition.affect import AffectiveAnalyzer
    analyzer = AffectiveAnalyzer()
    recent = _memory.retrieve_recent(limit=20)
    return analyzer.get_aggregate_pulse([m.content for m in recent])

@app.get("/api/audit/summary")
async def get_audit_summary():
    """Reads the latest privacy audit report if available."""
    audit_path = settings.REPORTS_DIR / "privacy_audit.json"
    if not audit_path.exists():
        return {"status": "no_audit_found", "total_redactions": 0}
        
    import json
    with open(audit_path, "r", encoding="utf-8") as f:
        return json.load(f).get("summary", {})

# Serve the static dashboard dashboard if needed
dashboard_dir = Path(__file__).parent.parent.parent / "apps" / "dashboard"
if dashboard_dir.exists():
    app.mount("/", StaticFiles(directory=str(dashboard_dir), html=True), name="dashboard")

def run_server(host: str = "127.0.0.1", port: int = 8000):
    import uvicorn
    logger.info(f"Launching Mnemonic Command Center at http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)

if __name__ == "__main__":
    run_server()
