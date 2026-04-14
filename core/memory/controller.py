from typing import List, Dict, Any, Optional
from loguru import logger
from pathlib import Path

from core.memory.episodic import EpisodicMemoryController
from core.memory.semantic import SemanticMemoryController
from core.memory.procedural import ProceduralMemoryController
from core.memory.models import EpisodicMemory, SemanticMemory
from core.cognition.models import SemanticFact, ConsolidatedMemory
from core.memory.refiner import MemoryRefiner
from core.utils.telemetry import telemetry


class MemoryController:
    """
    High-Level Memory Orchestrator (Tripartite Model).
    Now supports Mnemonic Forking for scenario simulation.
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

    def perceive(self, content: str, sender_id: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Entry point for all new sensory/conversational data."""
        self.episodic.add(content, sender_id, metadata=metadata)

    def retrieve_recent(self, limit: int = 10) -> List[EpisodicMemory]:
        """Short-term recall from episodic memory."""
        return self.episodic.retrieve_recent(limit=limit)

    def search_semantic(self, query: str, limit: int = 3) -> List[EpisodicMemory]:
        """
        Long-term factual recall.
        Currently uses semantic search on episodic data as a hybrid proxy.
        """
        return self.episodic.search(query, limit=limit)

    def automatic_background_consolidate(self) -> None:
        """Entry point for the background worker to trigger periodic reflection."""
        from core.cognition.agent import MnemosAgent
        # In background mode, we use the principal agent's engine settings
        agent = MnemosAgent() 
        self.consolidate(agent.engine)

    def consolidate(self, inference: Any) -> None:
        """
        Reflective Consolidation (System 2):
        Converts episodic memories into long-term semantic knowledge and behavioral patterns.
        """
        # 1. Select unconsolidated episodes
        recent = self.retrieve_recent(limit=20)
        unconsolidated = [m for m in recent if not m.metadata.get("consolidated")]
        
        if len(unconsolidated) < 5:
            logger.debug("Insufficient new episodic data for meaningful consolidation.")
            return

        # 2. Extract Facts & Patterns via Inference
        logger.info(f"Consolidating {len(unconsolidated)} episodes...")
        try:
            result: ConsolidatedMemory = inference.consolidate(unconsolidated)
        except Exception as e:
            logger.error(f"Inference consolidation failed: {e}")
            return
        
        # 3. System 2 Reflection: Conflict Detection & Refinement
        refiner = MemoryRefiner(self.semantic.knowledge)
        
        for fact in result.new_facts:
            conflicts = refiner.find_contradictions(fact.fact)
            if conflicts:
                # Flag as potentially contradictory/opinion shift
                logger.warning(f"Semantic Opinion Shift Detected!")
                telemetry.record_refinement()
                # In a real system, we'd mark old IDs from 'conflicts' as obsolete
                
            self.semantic.add_fact(
                fact=fact.fact,
                category=fact.category,
                confidence=fact.confidence,
                source_ids=fact.source_ids
            )
            
        # 4. Behavioral Profiling
        self.procedural.analyze_recent_batch([m.content for m in unconsolidated])
        
        # 5. Mark consolidated
        for m in unconsolidated:
            m.metadata["consolidated"] = True
            
        logger.success("Consolidation & Reflection cycle complete.")
