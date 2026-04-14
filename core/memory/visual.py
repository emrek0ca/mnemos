import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from loguru import logger
from datetime import datetime
from pydantic import BaseModel, Field

from core.memory.base import BaseMemoryController
from core.config.settings import settings

class VisualAnchor(BaseModel):
    """Metadata for a visual memory (image/video)."""
    id: str
    path: str
    episode_id: Optional[str] = None
    description: str = ""
    created_at: datetime = Field(default_factory=datetime.now)

class VisualMemoryController(BaseMemoryController[VisualAnchor]):
    """
    Manages the digital twin's visual cortex.
    Refactored to use BaseMemoryController for unified storage logic.
    """

    def __init__(self, storage_path: Optional[Path] = None):
        path = storage_path or settings.ARTIFACTS_DIR / "memory" / "visual.json"
        super().__init__(path, VisualAnchor)
        self.anchors: Dict[str, VisualAnchor] = self._load_anchors()

    def _load_anchors(self) -> Dict[str, VisualAnchor]:
        """Loads and converts raw JSON dict into VisualAnchor models."""
        data = self._load_json_dict()
        return {k: VisualAnchor(**v) for k, v in data.items()}

    def _save(self):
        """Unified save to JSON format."""
        data = {k: v.model_dump(mode="json") for k, v in self.anchors.items()}
        self._save_full_json(data)

    def register_anchor(self, path: str, episode_id: str, description: str = "") -> VisualAnchor:
        """Anchors an image to a specific life episode."""
        anchor_id = f"vis_{int(datetime.now().timestamp() * 1000)}"
        anchor = VisualAnchor(
            id=anchor_id,
            path=path,
            episode_id=episode_id,
            description=description
        )
        self.anchors[anchor_id] = anchor
        self._save()
        logger.info(f"Visual Cortex: Anchor created for episode {episode_id} -> {path}")
        return anchor

    def get_flashback(self, episode_id: str) -> List[VisualAnchor]:
        """Retrieves all visual anchors associated with an episode."""
        return [a for a in self.anchors.values() if a.episode_id == episode_id]
