import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from loguru import logger
from datetime import datetime
from pydantic import BaseModel, Field

class VisualAnchor(BaseModel):
    """Metadata for a visual memory (image/video)."""
    id: str
    path: str
    episode_id: Optional[str] = None
    description: str = ""
    created_at: datetime = Field(default_factory=datetime.now)

class VisualMemoryController:
    """
    Manages the digital twin's visual cortex.
    Links images to episodic turns for 'Visual Flashbacks'.
    """

    def __init__(self, storage_path: Optional[Path] = None):
        from core.config.settings import settings
        self.storage_path = storage_path or settings.ARTIFACTS_DIR / "memory" / "visual.json"
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        self.anchors: Dict[str, VisualAnchor] = self._load()

    def _load(self) -> Dict[str, VisualAnchor]:
        if not self.storage_path.exists():
            return {}
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return {k: VisualAnchor(**v) for k, v in data.items()}
        except Exception as e:
            logger.error(f"Visual Cortex: Failed to load anchors: {e}")
            return {}

    def _save(self):
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump({k: v.model_dump(mode="json") for k, v in self.anchors.items()}, f, indent=2, default=str)

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
