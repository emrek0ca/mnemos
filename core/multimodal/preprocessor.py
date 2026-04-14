import shutil
from pathlib import Path
from typing import List, Dict, Any
from loguru import logger

from core.config.settings import settings


class MultimodalPreprocessor:
    """
    Handles linkage of media assets (images, files) to chat context.
    Copies assets to the processed artifacts directory.
    """

    def __init__(self, raw_media_dir: Path):
        self.raw_media_dir = raw_media_dir
        self.processed_media_dir = settings.PROCESSED_DIR / "media"

    def link_assets(self, ingested_logs: List[Dict[str, Any]]):
        """
        Discovers and copies media files referenced in the ingested logs.
        """
        logger.info(f"Linking multimodal assets from {self.raw_media_dir}")
        self.processed_media_dir.mkdir(parents=True, exist_ok=True)
        
        linked_count = 0
        for entry in ingested_logs:
            # Check for photo or file fields
            for field in ["photo", "file"]:
                media_rel_path = entry.get(field)
                if media_rel_path:
                    source = self.raw_media_dir / media_rel_path
                    if source.exists():
                        dest = self.processed_media_dir / Path(media_rel_path).name
                        # Create unique name if collision
                        if dest.exists():
                            dest = self.processed_media_dir / f"{entry['id']}_{dest.name}"
                            
                        shutil.copy2(source, dest)
                        # Update the log entry with the new processed location
                        entry[f"{field}_local"] = str(dest.relative_to(settings.BASE_DIR))
                        linked_count += 1
                    else:
                        logger.warning(f"Media asset not found: {source}")
                        
        logger.success(f"Linked {linked_count} multimodal assets.")
        return ingested_logs
