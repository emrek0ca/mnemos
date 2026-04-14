import json
from pathlib import Path
from typing import List, Dict, Any
from loguru import logger
from core.memory.controller import MemoryController
from core.config.settings import settings

class SyntheticDatasetFactory:
    """
    Automated LoRA Training Dataset Curator.
    Transforms the twin's 'Living Memory' into a 'Neural Gradient'.
    """

    def __init__(self, memory: MemoryController):
        self.memory = memory
        self.output_dir = settings.ARTIFACTS_DIR / "training" / "datasets"
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def curate_evolution_dataset(self, filename: str = "evolution_latest.jsonl") -> Path:
        """
        Extracts the most important 'Verified' memories to form a training set.
        Implements Alpaca-style (Instruction, Input, Output) formatting stubs.
        """
        logger.info(f"Initiating Identity Curation: {filename}")
        
        target_path = self.output_dir / filename
        
        # 1. High-importance episodes (Style preservation)
        episodes = [
            m for m in self.memory.episodic.memories # Correct access via memories list
            if m.importance > 0.8
        ]
        
        # 2. Verified semantic facts (Knowledge alignment)
        facts = [
            f for f in self.memory.semantic.knowledge.values()
            if f.status == "verified"
        ]
        
        dataset = []
        for e in episodes:
            dataset.append({
                "instruction": "Continue the conversation in your unique style.",
                "input": "User: Preceding context...", # Real world would use window
                "output": f"Emre: {e.content}"
            })
            
        for f in facts:
            dataset.append({
                "instruction": f"Synthesize your knowledge about: {f.category}",
                "input": f"What do you know about {f.category}?",
                "output": f.fact
            })
            
        with open(target_path, "w", encoding="utf-8") as f:
            for item in dataset:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
                
        logger.success(f"Evolution Dataset Prepared: {len(dataset)} nodes | Path: {target_path}")
        return target_path
