import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from loguru import logger

from core.config.settings import settings

class CheckpointMetadata(BaseModel):
    """Metadata for a specific fine-tuned persona model."""
    id: str
    base_model: str
    lora_r: int
    lora_alpha: int
    learning_rate: float
    epochs_completed: int
    trained_at: datetime = Field(default_factory=datetime.now)
    path: str
    is_active: bool = False

class WeightRegistry:
    """
    Manages the lifecycle and selection of fine-tuned LoRA weights.
    Ensures 'Weight Sovereignty' by tracking local personality adapters.
    """

    def __init__(self, registry_path: Optional[Path] = None):
        self.registry_path = registry_path or settings.ARTIFACTS_DIR / "training" / "model_registry.json"
        self.registry_path.parent.mkdir(parents=True, exist_ok=True)
        self.checkpoints: Dict[str, CheckpointMetadata] = self._load()

    def _load(self) -> Dict[str, CheckpointMetadata]:
        if not self.registry_path.exists():
            return {}
        try:
            with open(self.registry_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return {k: CheckpointMetadata(**v) for k, v in data.items()}
        except Exception as e:
            logger.error(f"Failed to load weight registry: {e}")
            return {}

    def _save(self):
        with open(self.registry_path, "w", encoding="utf-8") as f:
            json.dump({k: v.model_dump(mode="json") for k, v in self.checkpoints.items()}, f, indent=2, default=str)

    def register_checkpoint(self, metadata: CheckpointMetadata):
        """Adds a new fine-tuned adapter to the registry."""
        self.checkpoints[metadata.id] = metadata
        self._save()
        logger.info(f"New persona checkpoint registered: {metadata.id} [R={metadata.lora_r}]")

    def get_latest(self) -> Optional[CheckpointMetadata]:
        """Returns the most recent checkpoint."""
        if not self.checkpoints:
            return None
        sorted_cp = sorted(self.checkpoints.values(), key=lambda x: x.trained_at, reverse=True)
        return sorted_cp[0]

    def get_active(self) -> Optional[CheckpointMetadata]:
        """Returns the currently active personality adapter."""
        for cp in self.checkpoints.values():
            if cp.is_active:
                return cp
        return None

    def set_active(self, checkpoint_id: str):
        """Sets a specific checkpoint as the active personality driver."""
        if checkpoint_id not in self.checkpoints:
            raise ValueError(f"Checkpoint {checkpoint_id} not found.")
        
        for cp in self.checkpoints.values():
            cp.is_active = (cp.id == checkpoint_id)
        self._save()
        logger.success(f"Persona active weight set to: {checkpoint_id}")
