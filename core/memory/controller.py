from typing import List, Dict, Any, Optional
from loguru import logger
from pathlib import Path
import anyio

from core.memory.episodic import EpisodicMemoryController
from core.memory.semantic import SemanticMemoryController
from core.memory.procedural import ProceduralMemoryController
from core.memory.models import EpisodicMemory, SemanticMemory
from core.cognition.models import SemanticFact, ConsolidatedMemory
from core.memory.refiner import MemoryRefiner
from core.utils.telemetry import telemetry
from core.utils.shredder import ForensicShredder


class MemoryController:
    """
    High-Level Memory Orchestrator (Tripartite Model).
    Supports isolated cognitive states per user/fork.
    """

    def __init__(self, fork_id: Optional[str] = None, base_artifacts_dir: Optional[Path] = None):
        from core.orchestration.fork import MnemosForkManager
        self.fork_manager = MnemosForkManager(base_artifacts_dir=base_artifacts_dir)
        self.root_path = self.fork_manager.get_fork_path(fork_id)
        
        # Initialize sub-controllers with isolated paths
        self.episodic = EpisodicMemoryController(
            storage_path=self.root_path / "memory" / "episodic.jsonl"
        )
        self.semantic = SemanticMemoryController(
            storage_path=self.root_path / "memory" / "semantic.jsonl"
        )
        self.procedural = ProceduralMemoryController(
            storage_path=self.root_path / "memory" / "procedural.jsonl"
        )
        logger.info(f"Memory Controller Online [Context: {fork_id or 'main'}]")

    async def perceive(self, content: str, sender_id: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Async entry point for sensory data ingestion."""
        from datetime import datetime
        await self.episodic.aappend_to_jsonl(
             EpisodicMemory(
                id=f"epi_{int(datetime.now().timestamp() * 1000)}",
                content=content,
                sender_id=sender_id,
                metadata=metadata or {}
            )
        )
        # Note: We still need to update the in-memory lists and FAISS index
        # For now, we'll maintain the sync add() but plan for a full async Indexer.
        self.episodic.add(content, sender_id, metadata=metadata)

    async def aretrieve_recent(self, limit: int = 10) -> List[EpisodicMemory]:
        """Async short-term recall."""
        return self.episodic.retrieve_recent(limit=limit)

    async def asearch_semantic(self, query: str, limit: int = 3) -> List[EpisodicMemory]:
        """Async semantic fact recall."""
        return self.episodic.search(query, limit=limit)

    def automatic_background_consolidate(self) -> None:
        """Entry point for the background worker to trigger periodic reflection."""
        from core.cognition.agent import MnemosAgent
        # In background mode, we use the principal agent's engine settings
        agent = MnemosAgent() 
        self.consolidate(agent.inference)

    def consolidate(self, inference: Any, user_id: Optional[str] = None) -> None:
        """
        Reflective Consolidation (System 2):
        Converts episodic memories into long-term semantic knowledge and behavioral patterns.
        Now supports Multi-Modal Perceptual Extraction.
        """
        # 1. Select unconsolidated episodes
        recent = self.episodic.retrieve_recent(limit=20)
        unconsolidated = [m for m in recent if not m.metadata.get("consolidated")]
        
        if len(unconsolidated) < 5:
            logger.debug("Insufficient new episodic data for meaningful consolidation.")
            return

        # 2. Extract Facts & Patterns via Inference
        logger.info(f"Consolidating {len(unconsolidated)} episodes...")
        try:
            result: ConsolidatedMemory = inference.consolidate(unconsolidated, user_id=user_id)
        except Exception as e:
            logger.error(f"Inference consolidation failed: {e}")
            return
        
        # 3. System 2 Reflection: Conflict Detection & Refinement
        # Use the episodic encoder for vector-aware conflict detection
        refiner = MemoryRefiner(self.semantic.knowledge, encoder=self.episodic._encoder)
        
        for fact in result.new_facts:
            conflicts = refiner.find_contradictions(fact.fact)
            
            # Lineage Tracking
            new_fact_id = f"sem_{hash(fact.fact.lower()) & 0xffffffff}"
            primary_supersedes = conflicts[0] if conflicts else None
            
            if conflicts:
                logger.warning(f"Cognitive Conflict Detected! Fact {new_fact_id} supersedes {len(conflicts)} nodes.")
                telemetry.record_refinement()
                for old_id in conflicts:
                    self.semantic.retire_fact(old_id, new_fact_id)
                
            self.semantic.add_fact(
                fact=fact.fact,
                category=fact.category,
                confidence=fact.confidence,
                source_ids=fact.source_ids,
                supersedes_id=primary_supersedes,
                metadata={"original_media_uri": fact.original_media_uri} if fact.original_media_uri else {}
            )
            
        # 4. Behavioral Profiling & DNA Synthesis
        new_dna = inference.synthesize_behavioral_dna(unconsolidated)
        if new_dna:
            alpha = 0.2 # Smoothing Factor
            dna = self.procedural.dna
            dna.rationality = (dna.rationality * (1-alpha)) + (new_dna['rationality'] * alpha)
            dna.resonance = (dna.resonance * (1-alpha)) + (new_dna['resonance'] * alpha)
            dna.technical_depth = (dna.technical_depth * (1-alpha)) + (new_dna['technical_depth'] * alpha)
            dna.formality = (dna.formality * (1-alpha)) + (new_dna['formality'] * alpha)
            dna.lexical_complexity = (dna.lexical_complexity * (1-alpha)) + (new_dna['lexical_complexity'] * alpha)
            self.procedural.save_dna()
            logger.info("Governance: Behavioral DNA matured.")

        self.procedural.analyze_recent_batch([m.content for m in unconsolidated])
        
        # 5. Mark consolidated
        for m in unconsolidated:
            m.metadata["consolidated"] = True
            
        logger.success("Consolidation & Reflection cycle complete.")

    def trigger_forensic_shredder(self) -> int:
        """Sovereign Privacy Action: Purges media files for consolidated episodes."""
        logger.info("Forensic Shredder: Initiating consolidation cleanup...")
        # Get all consolidated memories with media
        count = ForensicShredder.cleanup_consolidated_media(self.episodic.memories)
        if count > 0:
            logger.success(f"Forensic Shredder: Purged {count} consolidated media assets.")
            # Persist the metadata changes to disk
            self.episodic._save_jsonl(self.episodic.memories)
        return count
